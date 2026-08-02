import type { Metadata } from "next";
import { FichaBrancoScreen } from "@/features/admin/criancas/FichaBrancoScreen";

export const metadata: Metadata = { title: "Ficha em branco" };

/** OPS-04 · Ficha de cadastro em branco, para preencher à mão antes do cadastro digital. */
export default function FichaBrancoPage() {
  return <FichaBrancoScreen />;
}
