import type {
  AttrDim,
  Intent,
  LineItem,
  Product,
  Recommendation,
} from "@/types";
import { TOKEN_TO_DIM, type PrefToken } from "@/lib/intent";
import { formatCredit } from "@/lib/config/servings";
import { RECOMMENDED_FLAVOR } from "@/lib/data/flavorProfiles";

export type EngineOptions = {
  /** Ajuste "Más dulce" / "Más refrescante": refuerza una dimensión. */
  boost?: AttrDim;
  /** "match" = mejor combinación; "cost" = minimizar total ("Más económico"). */
  optimize?: "match" | "cost";
  /** Firmas de combinaciones a excluir ("Otra opción"). */
  exclude?: string[];
  /** Conjunto de sabores de la combinación anterior, para diversificar en "Otra opción". */
  diversifyFrom?: string[];
};

/* ---- Pesos del scoring (orden de prioridad aprobado) ----
   1 preferencias > 2 restricciones > 3 cobertura > 4 formato >
   5 presupuesto(filtro) > 6 variedad > 7 fragmentación > 8 sabor recomendado. */
const W_PREF = 5;
const W_AVOID = 3;
const W_FORMAT = 2;
const W_VARIETY = 1.5; // SOLO se aplica si el cliente pidió variedad explícitamente
const W_FRAG = 0.9;
const W_OVERSHOOT = 0.3;
const W_DIVERSIFY = 1.5; // penaliza repetir el mismo set de sabores en "Otra opción"
const HARD_AVOID_THRESHOLD = 4;

type Basket = {
  items: LineItem[];
  total: number;
  serves: number;
  units: number;
  flavors: string[];
  hasStar: boolean;
  score: number;
  signature: string;
};

const attr = (p: Product, dim: AttrDim) => p[dim] as number;

function dimsFor(tokens: string[]): AttrDim[] {
  return tokens
    .map((t) => TOKEN_TO_DIM[t as PrefToken] as AttrDim | undefined)
    .filter((d): d is AttrDim => Boolean(d));
}

function passesHardAvoid(p: Product, avoidDims: AttrDim[]): boolean {
  return !avoidDims.some((d) => attr(p, d) >= HARD_AVOID_THRESHOLD);
}

/** Afinidad de preferencias del basket en [0,1] (0 si no hay preferencias). */
function preferenceMatch(
  items: LineItem[],
  prefDims: AttrDim[],
  boost?: AttrDim,
): number {
  const terms: Array<{ dim: AttrDim; w: number }> = prefDims.map((d) => ({ dim: d, w: 1 }));
  if (boost) terms.push({ dim: boost, w: 1.5 });
  if (terms.length === 0) return 0;
  const units = items.reduce((a, i) => a + i.quantity, 0) || 1;
  let acc = 0;
  let wsum = 0;
  for (const { dim, w } of terms) {
    const weighted =
      items.reduce((a, i) => a + attr(i.product, dim) * i.quantity, 0) / units;
    acc += (weighted / 5) * w;
    wsum += w;
  }
  return acc / wsum;
}

/** Penalización por características rechazadas en [0,1]. */
function avoidPenalty(items: LineItem[], avoidDims: AttrDim[]): number {
  if (avoidDims.length === 0) return 0;
  const units = items.reduce((a, i) => a + i.quantity, 0) || 1;
  let acc = 0;
  for (const dim of avoidDims) {
    const weighted =
      items.reduce((a, i) => a + attr(i.product, dim) * i.quantity, 0) / units;
    acc += weighted / 5;
  }
  return acc / avoidDims.length;
}

/** Idoneidad de formato del basket en [0,1] según nº de personas. */
function formatFit(items: LineItem[], people: number): number {
  const units = items.reduce((a, i) => a + i.quantity, 0) || 1;
  const credit = items.reduce(
    (a, i) => a + formatCredit(people, i.product.size_ml) * i.quantity,
    0,
  );
  return credit / units;
}

function signatureOf(items: LineItem[]): string {
  return items
    .map((i) => `${i.product.id}x${i.quantity}`)
    .sort()
    .join("+");
}

function buildBasket(
  entries: Array<{ product: Product; quantity: number }>,
  intent: Intent,
  prefDims: AttrDim[],
  avoidDims: AttrDim[],
  opts: EngineOptions,
): Basket {
  const items: LineItem[] = entries
    .filter((e) => e.quantity > 0)
    .map((e) => ({
      product: e.product,
      quantity: e.quantity,
      subtotal: e.product.price * e.quantity,
    }));

  const total = items.reduce((a, i) => a + i.subtotal, 0);
  const serves = items.reduce((a, i) => a + i.product.serves * i.quantity, 0);
  const units = items.reduce((a, i) => a + i.quantity, 0);
  const flavors = Array.from(new Set(items.map((i) => i.product.flavor)));
  const people = intent.people ?? serves;

  const pref = preferenceMatch(items, prefDims, opts.boost);
  const avoid = avoidPenalty(items, avoidDims);
  const format = formatFit(items, people);
  const variety = flavors.length >= 2 ? 1 : 0;
  const overshoot = Math.max(0, serves - people);
  const hasStar = flavors.includes(RECOMMENDED_FLAVOR);

  let diversifyPenalty = 0;
  if (opts.diversifyFrom && opts.diversifyFrom.length > 0) {
    const prev = new Set(opts.diversifyFrom);
    const same = flavors.length === prev.size && flavors.every((f) => prev.has(f));
    if (same) diversifyPenalty = W_DIVERSIFY;
  }

  // La variedad SOLO suma al puntaje si el cliente la pidió explícitamente.
  // En caso contrario actúa únicamente como desempate (ver pickBest), sin encarecer.
  const varietyScore = intent.wantsVariety ? W_VARIETY * variety : 0;

  const score =
    W_PREF * pref -
    W_AVOID * avoid +
    W_FORMAT * format +
    varietyScore -
    W_FRAG * (units - 1) -
    W_OVERSHOOT * overshoot -
    diversifyPenalty;

  return {
    items,
    total,
    serves,
    units,
    flavors,
    hasStar,
    score,
    signature: signatureOf(items),
  };
}

/** Genera combinaciones candidatas (1 o 2 sabores distintos). */
function generateBaskets(
  catalog: Product[],
  intent: Intent,
  prefDims: AttrDim[],
  avoidDims: AttrDim[],
  opts: EngineOptions,
): Basket[] {
  const people = intent.people ?? 1;
  const baskets: Basket[] = [];
  const make = (entries: Array<{ product: Product; quantity: number }>) =>
    baskets.push(buildBasket(entries, intent, prefDims, avoidDims, opts));

  // Un solo SKU: cantidad mínima para cubrir la necesidad.
  for (const p of catalog) {
    const qty = Math.max(1, Math.ceil(people / p.serves));
    make([{ product: p, quantity: qty }]);
  }

  // Dos sabores distintos: un SKU de cada uno.
  for (let i = 0; i < catalog.length; i++) {
    for (let j = i + 1; j < catalog.length; j++) {
      const a = catalog[i];
      const b = catalog[j];
      if (a.flavor === b.flavor) continue;
      const maxA = Math.ceil(people / a.serves);
      for (let qa = 1; qa <= maxA; qa++) {
        const remaining = people - qa * a.serves;
        if (remaining <= 0) continue; // ya cubierto por single-SKU
        const qb = Math.ceil(remaining / b.serves);
        make([
          { product: a, quantity: qa },
          { product: b, quantity: qb },
        ]);
      }
    }
  }
  return baskets;
}

// Empates: consideramos "igual score" a diferencias imperceptibles.
const EPS = 1e-6;

function pickBest(baskets: Basket[], optimize: "match" | "cost"): Basket {
  return [...baskets].sort((x, y) => {
    if (optimize === "cost" && x.total !== y.total) return x.total - y.total;
    if (Math.abs(y.score - x.score) > EPS) return y.score - x.score;
    if (x.units !== y.units) return x.units - y.units; // menos envases
    if (x.total !== y.total) return x.total - y.total; // mejor valor
    if (x.flavors.length !== y.flavors.length)
      return y.flavors.length - x.flavors.length; // variedad como desempate (no encarece)
    if (x.hasStar !== y.hasStar) return x.hasStar ? -1 : 1; // desempate final: sabor recomendado
    return x.signature.localeCompare(y.signature); // determinista
  })[0];
}

/** Razones REALES usadas por el motor → explicación veraz (sin LLM). */
function buildExplanation(
  basket: Basket,
  intent: Intent,
  withinBudget: boolean,
): string {
  const labels: Record<string, string> = {
    tropical: "tropicales",
    refreshing: "refrescantes",
    sweet: "dulces",
    acidic: "ácidos",
    intense: "intensos",
  };
  const parts: string[] = [];

  const prefs = intent.preferences.map((t) => labels[t] ?? t);
  if (prefs.length > 0) {
    const txt =
      prefs.length === 1
        ? `sabores ${prefs[0]}`
        : `sabores ${prefs.slice(0, -1).join(", ")} y ${prefs.at(-1)}`;
    parts.push(`Elegimos esta combinación porque buscabas ${txt}`);
  } else {
    parts.push("Armamos una combinación equilibrada para tu pedido");
  }

  const avoids = intent.avoid.map((t) => labels[t] ?? t);
  if (avoids.length > 0) parts.push(`evitando perfiles ${avoids.join(" y ")}`);

  const people = intent.people ?? basket.serves;
  const formatTxt =
    people >= 6
      ? "los formatos son adecuados para un grupo grande"
      : people >= 3
        ? "los formatos elegidos son adecuados para compartir"
        : "el formato es adecuado para consumo individual o de a dos";
  parts.push(formatTxt);

  const budgetTxt = withinBudget
    ? "y el pedido se mantiene dentro de tu presupuesto"
    : "aunque el pedido supera un poco tu presupuesto (prueba “Más económico”)";

  return `${parts.join(", ")} ${budgetTxt}.`;
}

/**
 * Motor de recomendación comercial determinista.
 * Requiere intent.people != null. El presupuesto es un LÍMITE máximo, no una meta.
 * Nunca inventa productos ni precios: todo proviene del catálogo recibido.
 */
export function recommend(
  intent: Intent,
  catalog: Product[],
  opts: EngineOptions = {},
): Recommendation | null {
  const prefDims = dimsFor(intent.preferences);
  const avoidDims = dimsFor(intent.avoid);

  const available = catalog.filter(
    (p) => p.available && passesHardAvoid(p, avoidDims),
  );
  if (available.length === 0) return null;

  const exclude = new Set(opts.exclude ?? []);
  const optimize = opts.optimize ?? "match";
  const people = intent.people ?? 1;

  const feasible = generateBaskets(available, intent, prefDims, avoidDims, opts).filter(
    (b) => b.serves >= people && !exclude.has(b.signature),
  );
  if (feasible.length === 0) return null;

  const budget = intent.budget;
  const within = budget != null ? feasible.filter((b) => b.total <= budget) : feasible;

  const withinBudget = within.length > 0;
  const pool = withinBudget ? within : feasible;
  const best = pickBest(pool, withinBudget ? optimize : "cost");

  return {
    items: best.items,
    total: best.total,
    withinBudget: budget == null ? true : withinBudget,
    estimatedServes: best.serves,
    explanation: buildExplanation(best, intent, best.total <= (budget ?? Infinity)),
    signature: best.signature,
  };
}
