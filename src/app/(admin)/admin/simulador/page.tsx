import type { Metadata } from "next";
import { ConfigSimuladorScreen } from "@/features/admin/simulador/ConfigSimuladorScreen";

export const metadata: Metadata = { title: "Valores do simulador" };

/** SIM · Configuração de valores do simulador (admin) — GET/PUT /config/precos. */
export default function ConfigSimuladorPage() {
  return <ConfigSimuladorScreen />;
}
