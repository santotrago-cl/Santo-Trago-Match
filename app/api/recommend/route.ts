import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalog, getLastCatalogSource } from "@/lib/catalog";
import { recommend } from "@/lib/engine";
import {
  extractIntentPlaceholder,
  mergeIntent,
  missingQuestion,
  normalizeIntent,
} from "@/lib/intent";
import { extractIntentLLM, LlmError } from "@/lib/llm";
import type {
  CatalogSource,
  Intent,
  IntentSource,
  RecommendApiResponse,
} from "@/types";

export const runtime = "nodejs";

const MAX_TEXT = 500;

/** Solo en desarrollo exponemos el origen de intención/catálogo (nunca en producción). */
const IS_DEV = process.env.NODE_ENV !== "production";

function withSource(
  res: RecommendApiResponse,
  sources: { intentSource?: IntentSource; catalogSource?: CatalogSource },
): RecommendApiResponse {
  return IS_DEV ? { ...res, ...sources } : res;
}

const BodySchema = z.object({
  text: z.string().min(1).max(MAX_TEXT),
  priorIntent: z
    .object({
      people: z.number().int().positive().max(100).nullable().optional(),
      budget: z.number().int().positive().max(10_000_000).nullable().optional(),
      preferences: z.array(z.string()).max(10).optional(),
      avoid: z.array(z.string()).max(10).optional(),
      occasion: z.string().max(120).nullable().optional(),
      wantsVariety: z.boolean().optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Cuéntanos qué necesitas en el mensaje 🙂" },
      { status: 400 },
    );
  }

  const { text, priorIntent } = parsed.data;

  // IA (OpenAI Structured Outputs) para interpretar; si falla por cualquier causa
  // (sin key, timeout, error del proveedor, JSON inválido) usamos el extractor
  // determinista como red de seguridad para que la demo nunca se caiga.
  let intent: Intent;
  let intentSource: IntentSource = "llm";
  try {
    let raw;
    try {
      raw = await extractIntentLLM(text);
      console.info("[santo-match] intent via LLM");
    } catch (err) {
      if (!(err instanceof LlmError)) throw err;
      intentSource = "fallback";
      console.error(
        `[santo-match] LLM falló (code=${err.code}): ${err.message} → usando fallback determinista`,
      );
      raw = extractIntentPlaceholder(text); // fallback resiliente
    }
    const fresh = normalizeIntent(raw);
    const prior: Intent | null = priorIntent
      ? {
          people: priorIntent.people ?? null,
          budget: priorIntent.budget ?? null,
          preferences: priorIntent.preferences ?? [],
          avoid: priorIntent.avoid ?? [],
          occasion: priorIntent.occasion ?? null,
          wantsVariety: priorIntent.wantsVariety ?? false,
          missing: [],
        }
      : null;
    intent = mergeIntent(prior, fresh);
  } catch {
    return NextResponse.json(
      { error: "No pudimos interpretar tu mensaje. ¿Puedes reformularlo?" },
      { status: 502 },
    );
  }

  if (intent.missing.length > 0) {
    const res: RecommendApiResponse = {
      status: "need_more_info",
      intent,
      question: missingQuestion(intent.missing),
    };
    return NextResponse.json(withSource(res, { intentSource }));
  }

  try {
    const catalog = await getCatalog();
    const catalogSource = getLastCatalogSource();
    const rec = recommend(intent, catalog);
    if (!rec) {
      const res: RecommendApiResponse = {
        status: "no_match",
        intent,
        message:
          "No encontramos una combinación con esas condiciones. Prueba subir un poco el presupuesto o ajustar tus preferencias.",
      };
      return NextResponse.json(withSource(res, { intentSource, catalogSource }));
    }
    const res: RecommendApiResponse = { status: "ok", intent, recommendation: rec };
    return NextResponse.json(withSource(res, { intentSource, catalogSource }));
  } catch {
    return NextResponse.json(
      { error: "Tuvimos un problema al armar tu recomendación. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
