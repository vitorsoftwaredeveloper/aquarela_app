import type { Metadata } from "next";
import { PlanosAulaScreen } from "@/features/professor/PlanosAulaScreen";

export const metadata: Metadata = { title: "Planos de aula" };

/** PED-02 · Planos de aula da turma (professor). */
export default async function PlanosAulaPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const { turmaId } = await params;
  return <PlanosAulaScreen turmaId={turmaId} />;
}
