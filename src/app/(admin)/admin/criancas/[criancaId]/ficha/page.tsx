import type { Metadata } from "next";
import { FichaCriancaScreen } from "@/features/admin/criancas/FichaCriancaScreen";

export const metadata: Metadata = { title: "Ficha de cadastro" };

/** OPS-04 · Ficha de cadastro da criança para impressão (A4, window.print()). */
export default async function FichaCriancaPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <FichaCriancaScreen criancaId={criancaId} />;
}
