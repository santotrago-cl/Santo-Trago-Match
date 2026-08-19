import { z } from "zod";
import type { Intent, MissingField } from "@/types";

/**
 * Vocabulario normalizado de preferencias. La IA (Día 2) y el extractor
 * placeholder (Día 1) deben producir ÚNICAMENTE estos tokens. Cada token
 * mapea a una dimensión sensorial. Tokens desconocidos se ignoran (robustez).
 */
export const PREF_TOKENS = [
  "sweet",
  "acidic",
  "tropical",
  "refreshing",
  "intense",
] as const;
export type PrefToken = (typeof PREF_TOKENS)[number];

export const TOKEN_TO_DIM: Record<PrefToken, keyof import("@/types").Product> = {
  sweet: "sweetness",
  acidic: "acidity",
  tropical: "tropical",
  refreshing: "refreshing",
  intense: "intensity",
};

/** Esquema Zod: validamos SIEMPRE la salida del LLM antes de usarla. */
export const IntentSchema = z.object({
  people: z.number().int().positive().max(100).nullable(),
  budget: z.number().int().positive().max(10_000_000).nullable(),
  preferences: z.array(z.string()).max(10).default([]),
  avoid: z.array(z.string()).max(10).default([]),
  occasion: z.string().max(120).nullable().default(null),
  wantsVariety: z.boolean().default(false),
});

/** Limpia y normaliza una intención cruda (venga del LLM o del placeholder). */
export function normalizeIntent(raw: z.infer<typeof IntentSchema>): Intent {
  const keep = (arr: string[]) =>
    Array.from(
      new Set(
        arr
          .map((t) => t.toLowerCase().trim())
          .filter((t): t is PrefToken =>
            (PREF_TOKENS as readonly string[]).includes(t),
          ),
      ),
    );

  const preferences = keep(raw.preferences ?? []);
  // Un token no puede estar en preferences y avoid a la vez: gana preference.
  const avoid = keep(raw.avoid ?? []).filter((t) => !preferences.includes(t));

  return {
    people: raw.people ?? null,
    budget: raw.budget ?? null,
    preferences,
    avoid,
    occasion: raw.occasion ?? null,
    wantsVariety: raw.wantsVariety ?? false,
    missing: computeMissing(raw.people ?? null, raw.budget ?? null),
  };
}

export function computeMissing(
  people: number | null,
  budget: number | null,
): MissingField[] {
  const missing: MissingField[] = [];
  if (!people) missing.push("people");
  if (!budget) missing.push("budget");
  return missing;
}

/**
 * Fusiona la intención previa (estado local del frontend) con la nueva.
 * Los valores nuevos rellenan/actualizan; las listas se unen. Así el usuario
 * puede dar la info por partes sin sesiones ni memoria persistente.
 */
export function mergeIntent(prev: Intent | null, next: Intent): Intent {
  if (!prev) return next;
  const preferences = Array.from(
    new Set([...(prev.preferences ?? []), ...next.preferences]),
  );
  const avoid = Array.from(
    new Set([...(prev.avoid ?? []), ...next.avoid]),
  ).filter((t) => !preferences.includes(t));
  const people = next.people ?? prev.people;
  const budget = next.budget ?? prev.budget;
  return {
    people,
    budget,
    preferences,
    avoid,
    occasion: next.occasion ?? prev.occasion,
    wantsVariety: prev.wantsVariety || next.wantsVariety,
    missing: computeMissing(people, budget),
  };
}

/** Pregunta amable según qué falta. */
export function missingQuestion(missing: MissingField[]): string {
  const hasP = missing.includes("people");
  const hasB = missing.includes("budget");
  if (hasP && hasB)
    return "¡Perfecto! 🍹 ¿Para cuántas personas sería y cuánto quieres gastar aproximadamente?";
  if (hasP) return "¡Buenísimo! 🍹 ¿Para cuántas personas sería?";
  return "¡Genial! 🍹 ¿Cuánto te gustaría gastar aproximadamente?";
}

/* ------------------------------------------------------------------ *
 * EXTRACTOR PLACEHOLDER (solo Día 1).
 * Día 2 se reemplaza por el LLM + Structured Outputs. Mantiene la misma
 * salida (z.infer<typeof IntentSchema>) para no tocar el resto del flujo.
 * ------------------------------------------------------------------ */
export function extractIntentPlaceholder(
  text: string,
): z.infer<typeof IntentSchema> {
  const t = ` ${text.toLowerCase()} `;

  // Personas
  let people: number | null = null;
  const peopleMatch =
    t.match(/somos\s+(\d{1,3})/) ||
    t.match(/(\d{1,3})\s*(personas|amigos|amigas|invitados)/);
  if (peopleMatch) people = parseInt(peopleMatch[1], 10);
  else {
    const words: Record<string, number> = {
      dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
      siete: 7, ocho: 8, nueve: 9, diez: 10,
    };
    for (const [w, n] of Object.entries(words)) {
      if (t.includes(` ${w} `)) { people = n; break; }
    }
  }

  // Presupuesto: "$20.000", "20000", "20 lucas", "veinte lucas"
  let budget: number | null = null;
  const lucasNum = t.match(/(\d{1,3})\s*lucas/);
  const pesos = t.match(/\$?\s*(\d{1,3}(?:[.\s]\d{3})+|\d{4,7})/);
  const lucasWord = t.match(
    /\b(diez|quince|veinte|treinta|cuarenta|cincuenta)\s*lucas/,
  );
  const milNum = t.match(/(\d{1,3})\s*mil/);
  const milWord = t.match(
    /\b(diez|quince|veinte|treinta|cuarenta|cincuenta)\s*mil/,
  );
  const wordK: Record<string, number> = {
    diez: 10, quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50,
  };
  if (lucasNum) budget = parseInt(lucasNum[1], 10) * 1000;
  else if (lucasWord) budget = wordK[lucasWord[1]] * 1000;
  else if (milNum) budget = parseInt(milNum[1], 10) * 1000;
  else if (milWord) budget = wordK[milWord[1]] * 1000;
  else if (pesos) budget = parseInt(pesos[1].replace(/[.\s]/g, ""), 10);

  // Preferencias / evitar
  const preferences = new Set<string>();
  const avoid = new Set<string>();
  const add = (
    set: Set<string>,
    token: string,
  ) => set.add(token);

  const map: Array<[RegExp, string]> = [
    [/tropical/, "tropical"],
    [/refrescante|refresc|fresco/, "refreshing"],
    [/dulce/, "sweet"],
    [/[aá]cid/, "acidic"],
    [/intenso|fuerte|potente/, "intense"],
  ];
  for (const [re, token] of map) {
    if (re.test(t)) {
      // Negaciones simples: "no muy dulce", "sin ácido", "nada dulce"
      const neg = new RegExp(
        `(?:no|sin|nada|poco|menos)\\s+(?:muy\\s+)?[^.,;]*(?:${re.source})`,
      );
      if (neg.test(t)) add(avoid, token);
      else add(preferences, token);
    }
  }

  const wantsVariety =
    /variad|varios sabores|distintos sabores|surtido|mezcla de sabores|para probar|probar (?:distintos|varios|sabores)/.test(
      t,
    );

  return IntentSchema.parse({
    people,
    budget,
    preferences: [...preferences],
    avoid: [...avoid],
    occasion: null,
    wantsVariety,
  });
}
