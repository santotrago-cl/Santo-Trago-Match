import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types";
import { PRODUCT_ROWS } from "@/lib/data/products";
import { FLAVOR_PROFILES } from "@/lib/data/flavorProfiles";
import { coverageFor } from "@/lib/config/servings";

/**
 * CATÁLOGO — fuente de verdad: Supabase (tabla `products`), con respaldo local.
 *
 * getCatalog() consulta Supabase; si falla (sin credenciales, error de red/RLS),
 * usa el catálogo local (lib/data/*) como fallback para que la demo no se rompa.
 * El resto de la app NO sabe de dónde vienen los datos.
 *
 * `serves` (porciones) NO se guarda en BD: es una regla configurable (config/servings)
 * derivada del formato. Así el catálogo en BD solo contiene datos comerciales reales.
 */

export type CatalogSource = "supabase" | "fallback";

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Catálogo local (respaldo) construido desde lib/data/*. */
function buildLocalCatalog(): Product[] {
  return PRODUCT_ROWS.map((r) => {
    const profile = FLAVOR_PROFILES[r.flavor];
    if (!profile) throw new Error(`Falta perfil de sabor para "${r.flavor}"`);
    return {
      id: `${slug(r.flavor)}-${r.size_ml}`,
      name: r.name,
      flavor: r.flavor,
      size_ml: r.size_ml,
      price: r.price,
      description: r.description,
      ...profile,
      serves: coverageFor(r.size_ml),
      available: r.available,
    };
  });
}

const LOCAL_CATALOG: Product[] = buildLocalCatalog();

/** Mapea una fila de Supabase → Product (agrega `serves` desde la regla de porciones). */
function rowToProduct(row: Record<string, unknown>): Product {
  const size_ml = Number(row.size_ml);
  return {
    id: String(row.id),
    name: String(row.name),
    flavor: String(row.flavor),
    size_ml,
    price: Number(row.price),
    description: (row.description as string | null) ?? null,
    sweetness: Number(row.sweetness),
    acidity: Number(row.acidity),
    tropical: Number(row.tropical),
    refreshing: Number(row.refreshing),
    intensity: Number(row.intensity),
    serves: coverageFor(size_ml),
    available: Boolean(row.available),
  };
}

let lastCatalogSource: CatalogSource = "fallback";
export function getLastCatalogSource(): CatalogSource {
  return lastCatalogSource;
}

async function fetchFromSupabase(): Promise<Product[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      console.error(`[santo-match] Supabase error: ${error.message}`);
      return null;
    }
    if (!data || data.length === 0) return null;
    return data.map(rowToProduct);
  } catch (err) {
    console.error(`[santo-match] Supabase excepción: ${String(err)}`);
    return null;
  }
}

/** Carga el catálogo completo (todas las filas) + de dónde vino. */
export async function loadCatalog(): Promise<{
  products: Product[];
  source: CatalogSource;
}> {
  const remote = await fetchFromSupabase();
  if (remote) {
    lastCatalogSource = "supabase";
    return { products: remote, source: "supabase" };
  }
  lastCatalogSource = "fallback";
  console.warn("[santo-match] catálogo servido desde fallback LOCAL");
  return { products: LOCAL_CATALOG, source: "fallback" };
}

/**
 * Devuelve el catálogo disponible. Firma estable: el resto de la app la usa igual,
 * sin importar si vino de Supabase o del fallback.
 */
export async function getCatalog(): Promise<Product[]> {
  const { products } = await loadCatalog();
  return products.filter((p) => p.available);
}

/** Catálogo local de respaldo (para QA y para volcar el seed SQL). */
export function getLocalCatalog(): Product[] {
  return LOCAL_CATALOG;
}

/** Validación de integridad. Por defecto valida el local; se le puede pasar el de Supabase. */
export function validateCatalog(products: Product[] = LOCAL_CATALOG): {
  skuCount: number;
  profileCount: number;
  everySkuHasProfile: boolean;
  nullPrices: number;
  invalidSizes: number;
  issues: string[];
} {
  const issues: string[] = [];
  const flavors = new Set<string>();
  const dims: Array<keyof Product> = [
    "sweetness",
    "acidity",
    "tropical",
    "refreshing",
    "intensity",
  ];
  let nullPrices = 0;
  let invalidSizes = 0;
  let everySkuHasProfile = true;

  for (const p of products) {
    flavors.add(p.flavor);
    if (p.price == null || !Number.isInteger(p.price) || p.price <= 0) {
      nullPrices++;
      issues.push(`SKU ${p.id}: precio inválido (${p.price})`);
    }
    if (![300, 500, 1000].includes(p.size_ml)) {
      invalidSizes++;
      issues.push(`SKU ${p.id}: formato inesperado (${p.size_ml})`);
    }
    const validAttrs = dims.every((d) => {
      const v = p[d] as number;
      return Number.isFinite(v) && v >= 1 && v <= 5;
    });
    if (!validAttrs) {
      everySkuHasProfile = false;
      issues.push(`SKU ${p.id}: atributos fuera de rango 1-5`);
    }
  }

  return {
    skuCount: products.length,
    profileCount: flavors.size,
    everySkuHasProfile,
    nullPrices,
    invalidSizes,
    issues,
  };
}
