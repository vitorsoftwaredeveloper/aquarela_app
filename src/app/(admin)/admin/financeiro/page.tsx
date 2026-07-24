import type { Metadata } from "next";
import { FinanceiroAdminScreen } from "@/features/admin/financeiro/FinanceiroAdminScreen";

export const metadata: Metadata = { title: "Financeiro" };

/** T-18 · Financeiro admin: despesas + inadimplentes — FIN-10/12/14. */
export default function FinanceiroAdminPage() {
  return <FinanceiroAdminScreen />;
}
