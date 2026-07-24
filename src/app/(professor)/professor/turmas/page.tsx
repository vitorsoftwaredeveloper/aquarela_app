import type { Metadata } from "next";
import { TurmasScreen } from "@/features/professor/TurmasScreen";

export const metadata: Metadata = { title: "Minhas turmas" };

/** T-09 · Minhas turmas (professor) — PED-03. */
export default function MinhasTurmasPage() {
  return <TurmasScreen />;
}
