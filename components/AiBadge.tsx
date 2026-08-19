/** Indicador discreto y premium de IA. Sin logos externos ni estética tech. */
export function AiBadge() {
  return (
    <div
      className="inline-flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 6,
          height: 6,
          background: "var(--brand-primary)",
          boxShadow: "0 0 8px rgba(203,161,74,0.6)",
        }}
      />
      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
        Potenciado por IA · Recomendaciones basadas en el catálogo real de Santo Trago
      </span>
    </div>
  );
}
