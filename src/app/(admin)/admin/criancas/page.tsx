import type { Metadata } from "next";
import { CriancasScreen } from "@/features/admin/criancas/CriancasScreen";

export const metadata: Metadata = { title: "Crianças" };

/** T-14 · Lista de crianças (admin) — CAD-13. */
export default function CriancasPage() {
  return <CriancasScreen />;
}
