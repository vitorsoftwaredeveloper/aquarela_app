import type { Metadata } from "next";
import { HistoricoScreen } from "@/features/professor/HistoricoScreen";

export const metadata: Metadata = { title: "Histórico" };

/** AGD-09 · Histórico navegável por data (professor). */
export default async function HistoricoPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <HistoricoScreen criancaId={criancaId} />;
}
