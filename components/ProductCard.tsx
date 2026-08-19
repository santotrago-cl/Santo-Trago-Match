import type { LineItem } from "@/types";
import { formatCLP } from "@/lib/format";

/** Deriva el perfil de sabor legible desde los atributos 1-5. */
function profileTags(p: LineItem["product"]): string[] {
  const t: string[] = [];
  if (p.tropical >= 4) t.push("Tropical");
  if (p.refreshing >= 4) t.push("Refrescante");
  if (p.sweetness >= 4) t.push("Dulce");
  else if (p.sweetness <= 2) t.push("Poco dulce");
  if (p.acidity >= 4) t.push("Ácido");
  if (p.intensity >= 4) t.push("Intenso");
  else if (p.intensity <= 2) t.push("Suave");
  return t.slice(0, 3);
}

function formatLabel(size_ml: number): string {
  return size_ml >= 1000 ? "1 L" : `${size_ml} ml`;
}

export function ProductCard({ item }: { item: LineItem }) {
  const { product, quantity, subtotal } = item;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold">{product.name}</div>
          <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary,#a99fb4)" }}>
            {product.flavor} · {formatLabel(product.size_ml)} · ×{quantity}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold">{formatCLP(subtotal)}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {formatCLP(product.price)} c/u
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
          Perfil de sabor
        </div>
        <div className="flex flex-wrap gap-1.5">
          {profileTags(product).map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
