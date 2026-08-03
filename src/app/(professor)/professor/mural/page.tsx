import type { Metadata } from "next";
import { MuralTurmasScreen } from "@/features/professor/MuralTurmasScreen";

export const metadata: Metadata = { title: "Mural de fotos" };

export default function MuralTurmasPage() {
  return <MuralTurmasScreen />;
}
