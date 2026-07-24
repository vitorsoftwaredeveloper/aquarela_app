import type { Metadata } from "next";
import { SimuladorScreen } from "@/features/simulador/SimuladorScreen";

export const metadata: Metadata = {
  title: "Simulador de mensalidade",
  description:
    "Simule a mensalidade da Aquarela Kids por meses ou dias avulsos, sem compromisso.",
};

/** T-02 · Simulador público — SIM-03/SIM-04. */
export default function SimuladorPage() {
  return <SimuladorScreen />;
}
