import type { Metadata } from "next";
import { PlanosAulaTurmasScreen } from "@/features/professor/PlanosAulaTurmasScreen";

export const metadata: Metadata = { title: "Planos de aula" };

export default function PlanosAulaTurmasPage() {
  return <PlanosAulaTurmasScreen />;
}
