import { HistoricoScreen } from "@/features/responsavel/HistoricoScreen";

/** T-06 · Histórico da criança (responsável) — PAI-03. */
export default async function HistoricoPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <HistoricoScreen criancaId={criancaId} />;
}
