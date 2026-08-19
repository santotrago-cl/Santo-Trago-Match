/**
 * SKUs REALES de Santo Trago (fuente de verdad de nombres/formatos/precios).
 * Fuente: catalogo_productos_santo_match.csv. Precios en CLP.
 * Una fila por sabor × formato. Sin placeholders.
 *
 * DÍA siguiente: estos mismos datos se migran a Supabase detrás de getCatalog()
 * sin cambios en el resto del código.
 */
export type ProductRow = {
  flavor: string;
  name: string;
  size_ml: number;
  price: number;
  available: boolean;
  description: string | null;
};

export const PRODUCT_ROWS: ProductRow[] = [
  { flavor: "Tradicional", name: "Mojito Tradicional", size_ml: 300, price: 2990, available: true, description: null },
  { flavor: "Tradicional", name: "Mojito Tradicional", size_ml: 500, price: 3990, available: true, description: null },
  { flavor: "Tradicional", name: "Mojito Tradicional", size_ml: 1000, price: 6990, available: true, description: null },
  { flavor: "Maracuyá", name: "Mojito Maracuyá", size_ml: 300, price: 3490, available: true, description: null },
  { flavor: "Maracuyá", name: "Mojito Maracuyá", size_ml: 500, price: 4990, available: true, description: null },
  { flavor: "Maracuyá", name: "Mojito Maracuyá", size_ml: 1000, price: 7990, available: true, description: null },
  { flavor: "Mango", name: "Mojito Mango", size_ml: 300, price: 3490, available: true, description: null },
  { flavor: "Mango", name: "Mojito Mango", size_ml: 500, price: 4990, available: true, description: null },
  { flavor: "Mango", name: "Mojito Mango", size_ml: 1000, price: 7990, available: true, description: null },
  { flavor: "Frutilla", name: "Mojito Frutilla", size_ml: 300, price: 3490, available: true, description: null },
  { flavor: "Frutilla", name: "Mojito Frutilla", size_ml: 500, price: 4990, available: true, description: null },
  { flavor: "Frutilla", name: "Mojito Frutilla", size_ml: 1000, price: 7990, available: true, description: null },
  { flavor: "Mango Maracuyá", name: "Mojito Mango Maracuyá", size_ml: 300, price: 3490, available: true, description: null },
  { flavor: "Mango Maracuyá", name: "Mojito Mango Maracuyá", size_ml: 500, price: 4990, available: true, description: null },
  { flavor: "Mango Maracuyá", name: "Mojito Mango Maracuyá", size_ml: 1000, price: 7990, available: true, description: null },
  { flavor: "Frambuesa", name: "Mojito Frambuesa", size_ml: 300, price: 3990, available: true, description: null },
  { flavor: "Frambuesa", name: "Mojito Frambuesa", size_ml: 500, price: 5490, available: true, description: null },
  { flavor: "Frambuesa", name: "Mojito Frambuesa", size_ml: 1000, price: 8990, available: true, description: null },
  { flavor: "Mojito Blue", name: "Mojito Blue", size_ml: 300, price: 3490, available: true, description: null },
  { flavor: "Mojito Blue", name: "Mojito Blue", size_ml: 500, price: 4990, available: true, description: null },
  { flavor: "Mojito Blue", name: "Mojito Blue", size_ml: 1000, price: 7990, available: true, description: null },
];
