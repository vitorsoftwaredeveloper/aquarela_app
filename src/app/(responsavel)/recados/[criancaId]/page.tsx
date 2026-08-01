import { RecadosScreen } from "@/features/mensagens/RecadosScreen";

export default async function RecadosPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <RecadosScreen criancaId={criancaId} />;
}
