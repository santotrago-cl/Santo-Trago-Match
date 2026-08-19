import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://santo-trago-match.vercel.app"),
  title: "Santo Match · Santo Trago",
  description:
    "Encuentra el mojito perfecto para tu momento. Cuéntanos qué buscas y Santo Match arma tu pedido.",
  openGraph: {
    title: "Santo Match · Santo Trago",
    description: "Encuentra el mojito perfecto para tu momento.",
    type: "website",
    locale: "es_CL",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
