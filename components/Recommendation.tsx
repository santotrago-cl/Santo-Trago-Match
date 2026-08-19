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
            style={{ color: "var(--mint)", borderColor: "rgba(111,227,176,0.4)" }}
          >
            ✓ Dentro de tu presupuesto
            {intent.budget ? ` (${formatCLP(intent.budget)})` : ""}
          </span>
        ) : (
          <span
            className="chip"
            style={{ color: "var(--gold)", borderColor: "rgba(232,176,75,0.4)" }}
          >
            ⚠ Supera tu presupuesto
            {intent.budget ? ` (${formatCLP(intent.budget)})` : ""}
          </span>
        )}
      </div>

      <p className="text-sm mt-4 leading-relaxed" style={{ color: "var(--text)" }}>
        {rec.explanation}
      </p>
    </div>
  );
}
