"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Adjustment,
  Intent,
  Product,
  Recommendation as Rec,
} from "@/types";
import { formatCLP } from "@/lib/format";
import { AdjustButtons } from "@/components/AdjustButtons";
import { WhatsAppButton } from "@/components/WhatsAppButton";

type CartItem = { product: Product; quantity: number };

const sizeLabel = (ml: number) => (ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`);

function profileTags(p: Product): string[] {
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

type Props = {
  rec: Rec;
  intent: Intent;
  catalog: Product[];
  onAdjust: (a: Adjustment) => void;
  loading: boolean;
};

export function OrderResult({ rec, intent, catalog, onAdjust, loading }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [adding, setAdding] = useState(false);

  // El carrito se reinicia con cada nueva recomendación o ajuste del motor.
  useEffect(() => {
    setCart(rec.items.map((i) => ({ product: i.product, quantity: i.quantity })));
    setAdding(false);
  }, [rec.signature, rec.items]);

  const total = useMemo(
    () => cart.reduce((a, i) => a + i.product.price * i.quantity, 0),
    [cart],
  );
  const serves = useMemo(
    () => cart.reduce((a, i) => a + i.product.serves * i.quantity, 0),
    [cart],
  );
  const withinBudget = intent.budget == null ? true : total <= intent.budget;

  const edited = useMemo(() => {
    const key = (id: string, q: number) => `${id}:${q}`;
    const a = cart.map((i) => key(i.product.id, i.quantity)).sort().join("|");
    const b = rec.items
      .map((i) => key(i.product.id, i.quantity))
      .sort()
      .join("|");
    return a !== b;
  }, [cart, rec.items]);

  const setQty = (id: string, q: number) =>
    setCart((c) =>
      c.map((i) =>
        i.product.id === id
          ? { ...i, quantity: Math.max(1, Math.min(99, q)) }
          : i,
      ),
    );
  const remove = (id: string) =>
    setCart((c) => c.filter((i) => i.product.id !== id));
  const addProduct = (p: Product) => {
    setCart((c) => {
      const ex = c.find((i) => i.product.id === p.id);
      if (ex)
        return c.map((i) =>
          i.product.id === p.id
            ? { ...i, quantity: Math.min(99, i.quantity + 1) }
            : i,
        );
      return [...c, { product: p, quantity: 1 }];
    });
    setAdding(false);
  };

  // Recomendación derivada (con lo editado) para WhatsApp.
  const derivedRec: Rec = {
    items: cart.map((i) => ({
      product: i.product,
      quantity: i.quantity,
      subtotal: i.product.price * i.quantity,
    })),
    total,
    withinBudget,
    estimatedServes: serves,
    explanation: rec.explanation,
    signature: rec.signature,
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h2 className="text-2xl font-bold">Tu Santo Match 🍹</h2>
        {edited && (
          <span
            className="chip"
            style={{ color: "var(--brand-primary)", borderColor: "var(--border)" }}
          >
            Pedido ajustado por ti
          </span>
        )}
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
        Estimado para ~{serves} {serves === 1 ? "persona" : "personas"}.
      </p>

      {/* Productos editables */}
      <div className="flex flex-col gap-3">
        {cart.map((item) => (
          <div key={item.product.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold">{item.product.name}</div>
                <div className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                  {item.product.flavor} · {sizeLabel(item.product.size_ml)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold">
                  {formatCLP(item.product.price * item.quantity)}
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatCLP(item.product.price)} c/u
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {profileTags(item.product).map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>

            {/* Controles de cantidad */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Quitar uno"
                  className="stepper-btn"
                  onClick={() => setQty(item.product.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className="text-base font-semibold w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Agregar uno"
                  className="stepper-btn"
                  onClick={() => setQty(item.product.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(item.product.id)}
                className="btn-secondary-link text-xs"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agregar otro sabor */}
      <div className="mt-3">
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-ghost w-full py-2.5 text-sm font-medium"
            disabled={catalog.length === 0}
          >
            + Agregar otro sabor
          </button>
        ) : (
          <AddFlavor
            catalog={catalog}
            onAdd={addProduct}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {/* Total */}
      <div className="card p-4 mt-4 flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Total
        </span>
        <span className="text-2xl font-bold">{formatCLP(total)}</span>
      </div>

      <div className="mt-3">
        {withinBudget ? (
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

      {/* ¿Por qué este Match? — razón real del motor (no cambia al editar) */}
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

      <AdjustButtons onAdjust={onAdjust} loading={loading} />
      <WhatsAppButton rec={derivedRec} />
    </div>
  );
}

/** Selector compacto sabor + formato desde el catálogo real. */
function AddFlavor({
  catalog,
  onAdd,
  onCancel,
}: {
  catalog: Product[];
  onAdd: (p: Product) => void;
  onCancel: () => void;
}) {
  const flavors = useMemo(
    () => Array.from(new Set(catalog.map((p) => p.flavor))),
    [catalog],
  );
  const [flavor, setFlavor] = useState(flavors[0] ?? "");
  const sizes = useMemo(
    () =>
      catalog
        .filter((p) => p.flavor === flavor)
        .sort((a, b) => a.size_ml - b.size_ml),
    [catalog, flavor],
  );
  const [sku, setSku] = useState(sizes[0]?.id ?? "");

  useEffect(() => {
    setSku(sizes[0]?.id ?? "");
  }, [sizes]);

  const selected = catalog.find((p) => p.id === sku);

  return (
    <div className="card p-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="select-mini flex-1"
          value={flavor}
          onChange={(e) => setFlavor(e.target.value)}
          aria-label="Sabor"
        >
          {flavors.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          className="select-mini flex-1"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          aria-label="Formato"
        >
          {sizes.map((p) => (
            <option key={p.id} value={p.id}>
              {sizeLabel(p.size_ml)} · {formatCLP(p.price)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 mt-2.5">
        <button
          type="button"
          className="btn-primary flex-1 py-2.5 text-sm"
          onClick={() => selected && onAdd(selected)}
          disabled={!selected}
        >
          Agregar
        </button>
        <button
          type="button"
          className="btn-ghost px-4 py-2.5 text-sm"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
