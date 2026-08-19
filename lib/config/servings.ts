/**
 * REGLA DE PORCIONES — configurable y centralizada.
 *
 * `coverage` = personas que el motor estima que cubre 1 unidad (variable interna
 * para el cálculo de cobertura). `label` = texto orientativo para el usuario.
 * Producto LISTO PARA SERVIR. Todo esto es una ESTIMACIÓN, nunca una garantía:
 * el frontend siempre habla de "estimado/recomendado".
 *
 * Ajustable tras pruebas sin tocar el motor.
 */
export const SERVINGS: Record<number, { coverage: number; label: string }> = {
  300: { coverage: 1, label: "~1 persona" },
  500: { coverage: 2, label: "~1–2 personas" },
  1000: { coverage: 3, label: "~3–4 personas" },
};

export function coverageFor(size_ml: number): number {
  return SERVINGS[size_ml]?.coverage ?? 1;
}

export function servingLabelFor(size_ml: number): string {
  return SERVINGS[size_ml]?.label ?? "estimado";
}

/**
 * Idoneidad comercial de un formato según la necesidad estimada (personas).
 * Devuelve un crédito 0..1: 1 = formato ideal para ese escenario.
 *  - 1–2 personas: 300 y 500 ml.
 *  - 3–5 personas: 500 ml y 1 L.
 *  - 6+ personas:  1 L (complementar con 500 ml).
 * Regla configurable centralizada aquí.
 */
export function formatCredit(people: number, size_ml: number): number {
  if (people <= 2) {
    if (size_ml === 300 || size_ml === 500) return 1;
    if (size_ml === 1000) return 0.3;
    return 0.5;
  }
  if (people <= 5) {
    if (size_ml === 500 || size_ml === 1000) return 1;
    if (size_ml === 300) return 0.4;
    return 0.5;
  }
  if (size_ml === 1000) return 1;
  if (size_ml === 500) return 0.6;
  return 0.2;
}
