import type { Metadata } from "next";
import { ProfessoresScreen } from "@/features/admin/professores/ProfessoresScreen";

export const metadata: Metadata = { title: "Professores" };

/** T-16 · Cadastro de professores (admin) — CAD-05. */
export default function ProfessoresPage() {
  return <ProfessoresScreen />;
}
