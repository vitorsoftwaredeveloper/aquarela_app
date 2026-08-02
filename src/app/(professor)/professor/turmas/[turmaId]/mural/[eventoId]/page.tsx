import type { Metadata } from "next";
import { EventoMuralDetalheScreen } from "@/features/professor/EventoMuralDetalheScreen";

export const metadata: Metadata = { title: "Evento" };

export default async function EventoMuralPage({
  params,
}: {
  params: Promise<{ turmaId: string; eventoId: string }>;
}) {
  const { turmaId, eventoId } = await params;
  return <EventoMuralDetalheScreen turmaId={turmaId} eventoId={eventoId} />;
}
