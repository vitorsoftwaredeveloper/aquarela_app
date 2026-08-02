import type { Metadata } from "next";
import { MuralTurmaScreen } from "@/features/professor/MuralTurmaScreen";

export const metadata: Metadata = { title: "Mural de fotos" };

/** FOT-06 · Mural de fotos da turma (professor). */
export default async function MuralTurmaPage({
  params,
}: {
  params: Promise<{ turmaId: string }>;
}) {
  const { turmaId } = await params;
  return <MuralTurmaScreen turmaId={turmaId} />;
}
