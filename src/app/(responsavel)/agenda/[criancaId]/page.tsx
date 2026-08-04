import { AgendaScreen } from "@/features/responsavel/AgendaScreen";

/** T-05 · Agenda do dia (responsável) — PAI-02. */
export default async function AgendaPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <AgendaScreen key={criancaId} criancaId={criancaId} />;
}
