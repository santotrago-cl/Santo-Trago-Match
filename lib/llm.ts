import { z } from "zod";
import { IntentSchema } from "@/lib/intent";

/**
 * Integración con OpenAI para transformar lenguaje natural → intención estructurada.
 * La IA SOLO interpreta. No crea productos, no decide precios, no calcula totales,
 * no inventa promociones ni disponibilidad: eso vive en el catálogo y el motor.
 *
 * La API key se lee SOLO server-side (process.env.OPENAI_API_KEY) y nunca se expone.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const TIMEOUT_MS = 10_000;

export type LlmErrorCode =
  | "no_key"
  | "timeout"
  | "network"
  | "provider"
  | "empty"
  | "invalid_json"
  | "invalid_schema";

export class LlmError extends Error {
  code: LlmErrorCode;
  constructor(code: LlmErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "LlmError";
  }
}

/** Esquema Structured Output (json_schema strict) enviado a OpenAI. */
const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "santo_intent",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        people: {
          type: ["integer", "null"],
          description: "Número de personas. null si no se menciona.",
        },
        budget: {
          type: ["integer", "null"],
          description:
            "Presupuesto TOTAL en pesos chilenos (CLP), entero. '20 lucas'/'20 mil' = 20000. null si no se menciona.",
        },
        preferences: {
          type: "array",
          items: {
            type: "string",
            enum: ["sweet", "acidic", "tropical", "refreshing", "intense"],
          },
          description: "Sabores/perfiles que el cliente QUIERE.",
        },
        avoid: {
          type: "array",
          items: {
            type: "string",
            enum: ["sweet", "acidic", "tropical", "refreshing", "intense"],
          },
          description: "Perfiles que el cliente NO quiere (ej. 'no muy dulce' → sweet).",
        },
        occasion: {
          type: ["string", "null"],
          description: "Ocasión si se menciona (ej. 'para esta noche'), si no null.",
        },
        wantsVariety: {
          type: "boolean",
          description:
            "true SOLO si pide variedad explícita ('varios sabores', 'algo variado', 'para probar distintos').",
        },
      },
      required: ["people", "budget", "preferences", "avoid", "occasion", "wantsVariety"],
    },
  },
};

const SYSTEM_PROMPT = `Eres el intérprete de "Santo Match", el recomendador de la coctelería chilena Santo Trago.
Tu ÚNICA tarea es convertir el mensaje del cliente (español de Chile) en una intención estructurada.

Reglas:
- Devuelve SOLO los campos del esquema. No inventes datos: si algo no está en el mensaje, usa null (o listas vacías).
- budget en CLP entero. Modismos: "lucas" = miles ("20 lucas" = 20000), "X mil" = X*1000, "$20.000" = 20000, "20 mil pesos" = 20000.
- people: número de personas ("somos cinco" = 5, "para 4" = 4, "somos dos" = 2).
  Un número suelto pequeño (1–30), aunque venga solo o antes de una coma, casi siempre son PERSONAS:
  "2, $20.000" → people:2, budget:20000; "4" → people:4; "somos 3" → people:3.
  (El monto grande o con "mil"/"lucas"/"$" es el presupuesto, NO las personas.)
- preferences/avoid: usa SOLO estos tokens → sweet (dulce), acidic (ácido), tropical, refreshing (refrescante), intense (intenso/fuerte).
  Ejemplos: "algo tropical" → preferences:["tropical"]; "no muy dulce" / "sin nada dulce" → avoid:["sweet"];
  "no me gusta lo ácido" → avoid:["acidic"]; "algo refrescante" → preferences:["refreshing"].
- wantsVariety = true solo si pide variedad explícita ("varios sabores", "algo variado", "para probar distintos", "surtido").
  "para compartir" por sí solo NO implica variedad.
- occasion: texto corto si lo menciona ("para esta noche"), si no null.
- NO recomiendes productos, NO menciones precios, NO calcules nada. Solo interpretas.`;

export async function extractIntentLLM(
  text: string,
): Promise<z.infer<typeof IntentSchema>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new LlmError("no_key", "OPENAI_API_KEY no configurada");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: RESPONSE_FORMAT,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new LlmError(aborted ? "timeout" : "network", String(err));
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new LlmError("provider", `OpenAI respondió ${res.status}`);
  }

  const data = await res.json().catch(() => null);
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new LlmError("empty", "Respuesta vacía del modelo");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new LlmError("invalid_json", "El modelo devolvió JSON inválido");
  }

  const valid = IntentSchema.safeParse(parsed);
  if (!valid.success) {
    throw new LlmError("invalid_schema", "El JSON no cumple el esquema esperado");
  }
  return valid.data;
}
