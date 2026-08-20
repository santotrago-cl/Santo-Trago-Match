import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const runtime = "nodejs";

/**
 * Catálogo disponible (solo lectura) para que el cliente pueda AGREGAR sabores
 * al pedido. Misma fuente de verdad que el motor (Supabase con fallback local).
 * No expone nada sensible; no permite escritura.
 */
export async function GET() {
  try {
    const products = await getCatalog();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
