import type { Metadata } from "next";
import { DashboardScreen } from "@/features/admin/dashboard/DashboardScreen";

export const metadata: Metadata = { title: "Dashboard" };

/** T-13 · Dashboard admin (KPIs + balanço 12 meses) — FIN-13. */
export default function DashboardPage() {
  return <DashboardScreen />;
}
