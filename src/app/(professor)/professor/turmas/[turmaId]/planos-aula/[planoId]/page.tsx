import type { Metadata } from "next";
import { PlanoAulaFormScreen } from "@/features/professor/PlanoAulaFormScreen";

export const metadata: Metadata = { title: "Editar plano de aula" };

export default async function EditarPlanoAulaPage({
  params,
}: {
  params: Promise<{ turmaId: string; planoId: string }>;
}) {
  const { turmaId, planoId } = await params;
  return <PlanoAulaFormScreen turmaId={turmaId} planoId={planoId} />;
}
