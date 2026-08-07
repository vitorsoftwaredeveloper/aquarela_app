import type { Metadata, Viewport } from "next";
import { caveat, inter, poppins } from "@/lib/fonts";
import { ThemeScript } from "@/contexts/ThemeContext";
import { Providers } from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aquarela Kids — a rotina do seu filho, com carinho",
    template: "%s · Aquarela Kids",
  },
  description:
    "Agenda diária, fotos, avisos e financeiro do berçário à pré-escola, reunidos em um só lugar. A Aquarela Kids aproxima famílias e escola com transparência.",
};

export const viewport: Viewport = {
  themeColor: "#7C5AE6",
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${inter.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Aquarela Kids" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
