const STEPS = [
  "Te entendemos",
  "Buscamos en el catálogo",
  "Encontramos tu combinación",
  "Pides por WhatsApp",
];

/** Microexplicación del flujo. Muy compacta, mobile-first. */
export function HowItWorks() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center px-2"
      aria-label="Cómo funciona Santo Match"
    >
      {STEPS.map((step, i) => (
        <span key={step} className="inline-flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {step}
          </span>
          {i < STEPS.length - 1 && (
            <span className="text-xs" style={{ color: "var(--brand-primary)" }}>
              ›
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
