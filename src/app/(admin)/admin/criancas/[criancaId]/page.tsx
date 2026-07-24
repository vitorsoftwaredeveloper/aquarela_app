import type { Metadata } from "next";
import { CriancaStepper } from "@/features/admin/criancas/CriancaStepper";

export const metadata: Metadata = { title: "Editar criança" };

/** T-14 · Edição de criança (mesmo stepper) — CAD-09/CAD-10. */
export default async function EditarCriancaPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <CriancaStepper criancaId={criancaId} />;
}
