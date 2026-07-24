import type { Metadata } from "next";
import { CriancaStepper } from "@/features/admin/criancas/CriancaStepper";

export const metadata: Metadata = { title: "Nova criança" };

/** T-14 · Cadastro de criança em stepper — CAD-10. */
export default function NovaCriancaPage() {
  return <CriancaStepper />;
}
