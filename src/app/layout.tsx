import type { Metadata, Viewport } from "next";
import { inter, poppins } from "@/lib/fonts";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
