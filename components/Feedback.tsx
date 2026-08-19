export function LoadingState() {
  return (
    <div className="card p-6 fade-in">
      <div className="flex items-center gap-3">
        <div className="spinner" />
        <span className="text-base font-medium">Buscando tu Santo Match…</span>
      </div>
      <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
        Estamos cruzando tus preferencias con nuestro catálogo.
      </p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="card p-4 fade-in"
      style={{ borderColor: "rgba(224,115,107,0.4)" }}
    >
      <p className="text-sm" style={{ color: "var(--error)" }}>
        {message}
      </p>
    </div>
  );
}

export function InfoBubble({ text }: { text: string }) {
  return (
    <div className="card p-4 fade-in">
      <p className="text-sm" style={{ color: "var(--text)" }}>
        {text}
      </p>
    </div>
  );
}
