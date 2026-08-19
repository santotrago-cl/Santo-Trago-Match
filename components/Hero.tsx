export function Hero() {
  return (
    <header className="text-center px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-santo-trago.png"
        alt="Santo Trago"
        width={80}
        height={80}
        className="mx-auto mb-4 rounded-full"
        style={{
          border: "1px solid var(--border)",
          boxShadow: "0 8px 24px -10px rgba(0,0,0,0.7)",
        }}
      />
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
        Santo <span style={{ color: "var(--gold)" }}>Match</span>
      </h1>
      <p className="mt-3 text-lg" style={{ color: "var(--text)" }}>
        Encuentra el mojito perfecto para tu momento.
      </p>
      <p className="mt-2 text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--muted)" }}>
        Cuéntanos en tus palabras qué buscas. Santo Match interpreta tus
        preferencias y las cruza con el catálogo real de Santo Trago.
      </p>
      <div className="divider mt-5">
        <span className="text-xs">◆</span>
      </div>
    </header>
  );
}
