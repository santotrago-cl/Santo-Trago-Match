import { NextResponse } from "next/server";
import { z } from "zod";
import { getCatalog } from "@/lib/catalog";
import { recommend, type EngineOptions } from "@/lib/engine";
import { computeMissing } from "@/lib/intent";
import type { Adjustment, Intent, RecommendApiResponse } from "@/types";

export const runtime = "nodejs";

const BodySchema = z.object({
  intent: z.object({
    people: z.number().int().positive().max(100).nullable(),
    budget: z.number().int().positive().max(10_000_000).nullable(),
    preferences: z.array(z.string()).max(10),
    avoid: z.array(z.string()).max(10),
    occasion: z.string().max(120).nullable().default(null),
    wantsVariety: z.boolean().default(false),
  }),
  adjustment: z.enum(["sweeter", "more_refreshing", "cheaper", "another"]),
  exclude: z.array(z.string()).max(50).default([]),
  diversifyFrom: z.array(z.string()).max(10).default([]),
});

/** Traduce el ajuste rápido a opciones del motor. SIN LLM. */
function optionsFor(
  adjustment: Adjustment,
  exclude: string[],
  diversifyFrom: string[],
): EngineOptions {
  switch (adjustment) {
    case "sweeter":
      return { boost: "sweetness" };
    case "more_refreshing":
      return { boost: "refreshing" };
    case "cheaper":
      return { optimize: "cost" };
    case "another":
      return { exclude, diversifyFrom };
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "No pudimos aplicar el ajuste." }, { status: 400 });
  }

  const { adjustment, exclude, diversifyFrom } = parsed.data;
  const intent: Intent = {
    ...parsed.data.intent,
    occasion: parsed.data.intent.occasion ?? null,
    wantsVariety: parsed.data.intent.wantsVariety ?? false,
    missing: computeMissing(parsed.data.intent.people, parsed.data.intent.budget),
  };

  if (intent.missing.length > 0) {
    return NextResponse.json({ error: "Faltan datos para recomendar." }, { status: 400 });
  }

  try {
    const catalog = await getCatalog();
    const rec = recommend(intent, catalog, optionsFor(adjustment, exclude, diversifyFrom));
    if (!rec) {
      const res: RecommendApiResponse = {
        status: "no_match",
        intent,
        message:
          "No encontramos otra combinación con esas condiciones. Prueba subir el presupuesto o cambiar preferencias.",
      };
      return NextResponse.json(res);
    }
    const res: RecommendApiResponse = { status: "ok", intent, recommendation: rec };
    return NextResponse.json(res);
  } catch {
    return NextResponse.json(
      { error: "Tuvimos un problema al ajustar tu recomendación." },
      { status: 500 },
    );
  }
}
