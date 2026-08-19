"use client";

import type { Adjustment } from "@/types";

const BUTTONS: Array<{ id: Adjustment; label: string; icon: string }> = [
  { id: "sweeter", label: "Más dulce", icon: "🍬" },
  { id: "more_refreshing", label: "Más refrescante", icon: "❄️" },
  { id: "cheaper", label: "Más económico", icon: "💸" },
  { id: "another", label: "Otra opción", icon: "🔀" },
];

type Props = {
  onAdjust: (adjustment: Adjustment) => void;
  loading: boolean;
};

export function AdjustButtons({ onAdjust, loading }: Props) {
  return (
    <div className="mt-5">
      <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
        Ajusta tu recomendación
      </p>
      <div className="grid grid-cols-2 gap-2">
        {BUTTONS.map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={loading}
            onClick={() => onAdjust(b.id)}
            className="btn-ghost py-2.5 text-sm font-medium"
          >
            {b.icon} {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
