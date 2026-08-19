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

  // Emojis por code point para que nunca se corrompan en la codificación.
  const cocktail = String.fromCodePoint(0x1f379); // 🍹
  const receipt = String.fromCodePoint(0x1f9fe); // 🧾
  const check = String.fromCodePoint(0x2705); // ✅

  const lines = rec.items
    .map(
      (i) =>
        `• ${i.quantity}× ${i.product.name} ${sizeLabel(i.product.size_ml)} — ${formatCLP(i.subtotal)}`,
    )
    .join("\n");

  // Formato WhatsApp: *negrita*, _cursiva_.
  const message =
    `Hola Santo Trago ${cocktail}\n\n` +
    `Encontré mi *Santo Match* y quiero pedir:\n\n` +
    `${receipt} *Mi pedido*\n` +
    `${lines}\n\n` +
    `${check} *Total: ${formatCLP(rec.total)}*\n\n` +
    `_Pedido generado desde Santo Match_`;

  const base = number ? `https://wa.me/${number}` : `https://wa.me/`;
  return `${base}?text=${encodeURIComponent(message)}`;
}
