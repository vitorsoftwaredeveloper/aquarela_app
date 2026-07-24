import type { Metadata } from "next";
import { AlunosScreen } from "@/features/professor/AlunosScreen";

export const metadata: Metadata = { title: "Alunos da turma" };

/** T-10 · Alunos da turma (professor) — PED-03. */
export default async function AlunosPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const { turmaId } = await params;
  return <AlunosScreen turmaId={turmaId} />;
}
