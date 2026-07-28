import type { Metadata } from "next";
import { NotificacoesScreen } from "@/features/notificacoes/NotificacoesScreen";

export const metadata: Metadata = { title: "Notificações" };

export default function NotificacoesPage() {
  return <NotificacoesScreen />;
}
