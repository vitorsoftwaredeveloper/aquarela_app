import type { Metadata } from "next";
import { MuralScreen } from "@/features/responsavel/MuralScreen";

export const metadata: Metadata = { title: "Mural de fotos" };

export default function MuralPage() {
  return <MuralScreen />;
}
