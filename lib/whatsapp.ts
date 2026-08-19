import type { Recommendation } from "@/types";
import { formatCLP } from "@/lib/format";

/**
 * Construye el enlace wa.me con el pedido estructurado.
 * El número sale de la variable de entorno pública WHATSAPP_NUMBER
 * (formato internacional sin "+", ej. 56912345678). Nunca se hardcodea.
 */
export function buildWhatsAppUrl(
  rec: Recommendation,
  numberOverride?: string,
): string {
  const number = (
    numberOverride ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    ""
  ).replace(/[^\d]/g, "");

  const sizeLabel = (ml: number) => (ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`);

  const lines = rec.items
    .map(
      (i) =>
        `${i.quantity}× ${i.product.name} ${sizeLabel(i.product.size_ml)} — ${formatCLP(i.subtotal)}`,
    )
    .join("\n");

  const message =
    `Hola Santo Trago 🍹\n\n` +
    `Encontré mi Santo Match y quiero pedir:\n\n` +
    `${lines}\n\n` +
    `Total: ${formatCLP(rec.total)}\n\n` +
    `Pedido generado desde Santo Match.`;

  const base = number ? `https://wa.me/${number}` : `https://wa.me/`;
  return `${base}?text=${encodeURIComponent(message)}`;
}
