"use client";

import type { Recommendation } from "@/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppButton({ rec }: { rec: Recommendation }) {
  const numberConfigured = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  const url = buildWhatsAppUrl(rec);

  return (
    <div className="mt-5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-wa w-full py-3.5 text-base flex items-center justify-center gap-2"
      >
        Pedir por WhatsApp
      </a>
      {!numberConfigured && (
        <p className="text-xs mt-2 text-center" style={{ color: "var(--muted)" }}>
          (Número de destino pendiente de configurar — se abrirá WhatsApp con el
          mensaje listo).
        </p>
      )}
    </div>
  );
}
