import type { Metadata } from "next";
import { TurmasScreen } from "@/features/admin/turmas/TurmasScreen";

export const metadata: Metadata = { title: "Turmas" };

/** T-15 · Cadastro de turmas (admin) — CAD-07. */
export default function TurmasAdminPage() {
  return <TurmasScreen />;
}
