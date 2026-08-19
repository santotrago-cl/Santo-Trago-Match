// Tipos de dominio de Santo Match.

/** Dimensiones sensoriales del producto, escala 1-5. */
export type AttrDim =
  | "sweetness"
  | "acidity"
  | "tropical"
  | "refreshing"
  | "intensity";

/** Un SKU real: un sabor en un formato concreto. Fuente de verdad = Supabase. */
export type Product = {
  id: string;
  name: string; // Nombre comercial, ej. "Mojito Mango"
  flavor: string; // Sabor, ej. "Mango"
  size_ml: number; // 300 | 500 | 1000
  price: number; // CLP, entero
  description: string | null;
  sweetness: number; // 1-5
  acidity: number; // 1-5
  tropical: number; // 1-5
  refreshing: number; // 1-5
  intensity: number; // 1-5
  serves: number; // personas estimadas por unidad (regla comercial, ver docs)
  available: boolean;
};

/** Intención estructurada extraída del lenguaje natural. Nunca contiene precios. */
export type Intent = {
  people: number | null;
  budget: number | null; // CLP
  preferences: string[]; // tokens normalizados, ej. ["tropical", "refreshing"]
  avoid: string[]; // tokens normalizados, ej. ["sweet"]
  occasion: string | null;
  /** El cliente pidió explícitamente variedad de sabores ("varios", "para probar"). */
  wantsVariety: boolean;
  /** Datos imprescindibles que faltan para recomendar. */
  missing: MissingField[];
};

export type MissingField = "people" | "budget";

/** Una línea del carrito recomendado. */
export type LineItem = {
  product: Product;
  quantity: number;
  subtotal: number; // price * quantity
};

/** Ajustes rápidos que re-ejecutan el motor SIN llamar al LLM. */
export type Adjustment =
  | "sweeter"
  | "more_refreshing"
  | "cheaper"
  | "another";

/** Resultado del motor de recomendación. */
export type Recommendation = {
  items: LineItem[];
  total: number;
  withinBudget: boolean;
  estimatedServes: number; // personas que cubre la combinación (estimación)
  explanation: string;
  /** Firma estable de la combinación, para excluirla en "Otra opción". */
  signature: string;
};

/** De dónde salió la intención / catálogo. Solo en desarrollo (nunca al usuario final). */
export type IntentSource = "llm" | "fallback";
export type CatalogSource = "supabase" | "fallback";

/** Respuesta de la API cuando faltan datos para recomendar. */
export type NeedMoreInfo = {
  status: "need_more_info";
  intent: Intent;
  question: string;
  intentSource?: IntentSource;
  catalogSource?: CatalogSource;
};

/** Respuesta de la API cuando sí hay recomendación. */
export type RecommendationResult = {
  status: "ok";
  intent: Intent;
  recommendation: Recommendation;
  intentSource?: IntentSource;
  catalogSource?: CatalogSource;
};

/** Respuesta de la API cuando no existe ninguna combinación viable. */
export type NoMatchResult = {
  status: "no_match";
  intent: Intent;
  message: string;
  intentSource?: IntentSource;
  catalogSource?: CatalogSource;
};

export type RecommendApiResponse =
  | RecommendationResult
  | NeedMoreInfo
  | NoMatchResult;
