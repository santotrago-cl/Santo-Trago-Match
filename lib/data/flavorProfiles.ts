/**
 * PERFILES DE SABOR — calibración inicial del motor (escala 1–5).
 * Centralizados aquí para poder ajustarlos fácilmente tras pruebas.
 * Fuente: catalogo_atributos_santo_match.csv entregado por Santo Trago.
 */
export type FlavorProfile = {
  sweetness: number;
  acidity: number;
  tropical: number;
  refreshing: number;
  intensity: number;
};

export const FLAVOR_PROFILES: Record<string, FlavorProfile> = {
  Tradicional: { sweetness: 2, acidity: 3, tropical: 1, refreshing: 5, intensity: 3 },
  Maracuyá: { sweetness: 2, acidity: 5, tropical: 5, refreshing: 5, intensity: 5 },
  Mango: { sweetness: 5, acidity: 1, tropical: 5, refreshing: 3, intensity: 3 },
  Frutilla: { sweetness: 4, acidity: 2, tropical: 3, refreshing: 4, intensity: 3 },
  "Mango Maracuyá": { sweetness: 3, acidity: 4, tropical: 5, refreshing: 4, intensity: 4 },
  Frambuesa: { sweetness: 4, acidity: 3, tropical: 3, refreshing: 4, intensity: 4 },
  "Mojito Blue": { sweetness: 4, acidity: 2, tropical: 3, refreshing: 4, intensity: 4 },
};

/** Sabor favorecido MUY suavemente solo como criterio final de desempate. */
export const RECOMMENDED_FLAVOR = "Maracuyá";
