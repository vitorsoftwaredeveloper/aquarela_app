import { Inter, Poppins } from "next/font/google";

/** Corpo de texto — legível e amigável. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Títulos — família arredondada, tom lúdico "aquarela". */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});
