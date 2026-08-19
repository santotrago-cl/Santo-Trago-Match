// Formateo de moneda chilena (CLP): entero, separador de miles con punto.

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/** 20000 -> "$20.000" */
export function formatCLP(amount: number): string {
  return clp.format(Math.round(amount));
}
