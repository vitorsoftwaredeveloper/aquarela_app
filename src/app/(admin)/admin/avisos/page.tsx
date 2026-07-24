import type { Metadata } from "next";
import { AvisosScreen } from "@/features/admin/avisos/AvisosScreen";

export const metadata: Metadata = { title: "Avisos" };

export default function AvisosPage() {
  return <AvisosScreen />;
}
