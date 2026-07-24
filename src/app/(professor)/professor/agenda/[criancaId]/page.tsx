import type { Metadata } from "next";
import { RegistrarAgendaScreen } from "@/features/professor/RegistrarAgendaScreen";

export const metadata: Metadata = { title: "Registrar agenda" };

/** T-11 · Registrar agenda diária (professor) — AGD-05..AGD-08. */
export default async function RegistrarAgendaPage({
  params,
}: {
  params: Promise<{ criancaId: string }>;
}) {
  const { criancaId } = await params;
  return <RegistrarAgendaScreen criancaId={criancaId} />;
}
