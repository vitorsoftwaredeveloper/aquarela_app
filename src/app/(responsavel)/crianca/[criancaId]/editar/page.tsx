import { EditarCriancaScreen } from "@/features/responsavel/EditarCriancaScreen";

/** Edição dos dados do próprio filho pelo responsável (foto, cadastro e saúde). */
export default async function EditarCriancaPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <EditarCriancaScreen criancaId={criancaId} />;
}
