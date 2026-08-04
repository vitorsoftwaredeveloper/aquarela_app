import { FinanceiroPixScreen } from "@/features/responsavel/FinanceiroPixScreen";

export default async function FinanceiroPixPage({
  params,
}: {
  params: Promise<{ mensalidadeId: string }>;
}) {
  const { mensalidadeId } = await params;
  return <FinanceiroPixScreen mensalidadeId={mensalidadeId} />;
}
