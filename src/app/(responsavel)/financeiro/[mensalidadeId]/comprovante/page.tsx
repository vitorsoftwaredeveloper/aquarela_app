import { FinanceiroComprovanteScreen } from "@/features/responsavel/FinanceiroComprovanteScreen";

export default async function FinanceiroComprovantePage({
  params,
}: {
  params: Promise<{ mensalidadeId: string }>;
}) {
  const { mensalidadeId } = await params;
  return <FinanceiroComprovanteScreen mensalidadeId={mensalidadeId} />;
}
