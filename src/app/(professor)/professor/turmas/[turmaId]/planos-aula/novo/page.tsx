import type { Metadata } from "next";
import { PlanoAulaFormScreen } from "@/features/professor/PlanoAulaFormScreen";

export const metadata: Metadata = { title: "Novo plano de aula" };

export default async function NovoPlanoAulaPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const { turmaId } = await params;
  return <PlanoAulaFormScreen turmaId={turmaId} />;
}
