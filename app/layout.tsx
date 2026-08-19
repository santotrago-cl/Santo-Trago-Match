import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santo Match 🍹 · Santo Trago",
  description:
    "Cuéntanos qué necesitas y encuentra el mojito perfecto para tu momento.",
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
