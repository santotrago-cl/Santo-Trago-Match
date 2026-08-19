import type { Intent, Recommendation as Rec } from "@/types";
import { formatCLP } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";

type Props = { rec: Rec; intent: Intent };

export function Recommendation({ rec, intent }: Props) {
  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold mb-1">Tu Santo Match 🍹</h2>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Recomendado para ~{rec.estimatedServes}{" "}
        {rec.estimatedServes === 1 ? "persona" : "personas"} (estimado).
      </p>

      <div className="flex flex-col gap-3">
        {rec.items.map((item) => (
          <ProductCard key={item.product.id} item={item} />
        ))}
      </div>

      <div className="card p-4 mt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Total
        </span>
        <span className="text-2xl font-bold">{formatCLP(rec.total)}</span>
      </div>

      <div className="mt-3">
        {rec.withinBudget ? (
          <span
            className="chip"
            style={{ color: "var(--success)", borderColor: "rgba(111,191,115,0.4)" }}
          >
            ✓ Dentro de tu presupuesto
            {intent.budget ? ` (${formatCLP(intent.budget)})` : ""}
          </span>
        ) : (
          <span
            className="chip"
            style={{ color: "var(--gold)", borderColor: "rgba(203,161,74,0.4)" }}
          >
            ⚠ Supera tu presupuesto
            {intent.budget ? ` (${formatCLP(intent.budget)})` : ""}
          </span>
        )}
      </div>

      <div className="mt-5">
        <div
          className="text-[11px] uppercase tracking-wide mb-1.5"
          style={{ color: "var(--muted)" }}
        >
          ¿Por qué este Match?
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
          {rec.explanation}
        </p>
      </div>
    </div>
  );
}
