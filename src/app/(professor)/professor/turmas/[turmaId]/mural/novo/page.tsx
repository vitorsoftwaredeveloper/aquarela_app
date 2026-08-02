import type { Metadata } from "next";
import { NovoEventoScreen } from "@/features/professor/NovoEventoScreen";

export const metadata: Metadata = { title: "Novo evento" };

export default async function NovoEventoPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const { turmaId } = await params;
  return <NovoEventoScreen turmaId={turmaId} />;
}
