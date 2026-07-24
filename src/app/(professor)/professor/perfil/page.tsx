import type { Metadata } from "next";
import { PerfilProfessorScreen } from "@/features/professor/PerfilProfessorScreen";

export const metadata: Metadata = { title: "Perfil" };

/** Perfil do professor — preferências e sair. */
export default function PerfilProfessorPage() {
  return <PerfilProfessorScreen />;
}
