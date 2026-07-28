import type { Metadata } from "next";
import { EditarDadosProfessorScreen } from "@/features/professor/EditarDadosProfessorScreen";

export const metadata: Metadata = { title: "Editar dados pessoais" };

export default function EditarDadosProfessorPage() {
  return <EditarDadosProfessorScreen />;
}
