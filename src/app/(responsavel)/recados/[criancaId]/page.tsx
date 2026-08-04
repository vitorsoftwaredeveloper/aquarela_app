import { RecadosScreen } from "@/features/mensagens/RecadosScreen";

export default async function RecadosPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  // `key` remonta a tela ao trocar de filho: sem isso o React reaproveita a
  // instância da mesma rota e o rascunho/otimistas do filho anterior ficam.
  return <RecadosScreen key={criancaId} criancaId={criancaId} />;
}
