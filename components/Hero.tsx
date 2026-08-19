export function Hero() {
  return (
    <header className="text-center px-2">
      <div className="chip mx-auto mb-4">🍹 Santo Trago</div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
        Santo <span style={{ color: "var(--gold)" }}>Match</span>
      </h1>
      <p className="mt-3 text-lg" style={{ color: "var(--text)" }}>
        Encuentra el mojito perfecto para tu momento.
      </p>
      <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>
        Cuéntanos qué buscas y Santo Match encontrará una combinación para ti.
      </p>
      <div className="divider mt-5">
        <span className="text-xs">◆</span>
      </div>
    </header>
  );
}
