export function LoadingState() {
  return (
    <div className="card p-6 flex items-center gap-3 fade-in">
      <div className="spinner" />
      <span className="text-sm" style={{ color: "var(--muted)" }}>
        Preparando tu Santo Match…
      </span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="card p-4 fade-in"
      style={{ borderColor: "rgba(255,138,138,0.4)" }}
    >
      <p className="text-sm" style={{ color: "var(--danger)" }}>
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
