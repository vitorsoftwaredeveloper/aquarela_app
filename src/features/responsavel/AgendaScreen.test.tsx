// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendaScreen } from "./AgendaScreen";
import { AgendaService } from "@/services/agendaService";
import { CriancasService } from "@/services/criancas";
import type { Crianca } from "@/types/crianca";
import type { AgendaDia } from "@/types/agenda";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("@/services/agendaService", () => ({
  AgendaService: { getDia: vi.fn() },
}));

vi.mock("@/services/criancas", () => ({
  CriancasService: { getById: vi.fn() },
}));

const crianca: Crianca = {
  _id: "c1",
  nome: "Ana",
  iniciais: "A",
  avatarBg: "#fff",
};

const criancaComCuidados: Crianca = {
  ...crianca,
  cuidados: { alergias: ["amendoim"], medicacoes: ["Dipirona 09h"] },
};

const diaComEntries: AgendaDia = {
  criancaId: "c1",
  data: "2026-07-23",
  dataLabel: "Hoje",
  entries: [
    { tipo: "alimentacao", title: "Almoço", text: "Comeu bem" },
    {
      tipo: "medicacao",
      title: "Dipirona",
      text: "10ml · 09:00",
      destaque: true,
    },
  ],
  registradoPor: "Prof. Bia",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AgendaScreen", () => {
  it("renders agenda entries after load", async () => {
    vi.mocked(CriancasService.getById).mockResolvedValue(crianca);
    vi.mocked(AgendaService.getDia).mockResolvedValue(diaComEntries);

    render(<AgendaScreen criancaId="c1" />);

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Almoço")).toBeInTheDocument();
    expect(screen.getByText("Comeu bem")).toBeInTheDocument();
    expect(screen.getByText("Dipirona")).toBeInTheDocument();
    expect(screen.getByText(/registrado por/)).toBeInTheDocument();
    expect(screen.getByText("Prof. Bia")).toBeInTheDocument();
  });

  it("shows cuidados band when crianca has alergias/medicacoes", async () => {
    vi.mocked(CriancasService.getById).mockResolvedValue(criancaComCuidados);
    vi.mocked(AgendaService.getDia).mockResolvedValue(diaComEntries);

    render(<AgendaScreen criancaId="c1" />);

    expect(await screen.findByText(/Alergia: amendoim/)).toBeInTheDocument();
    expect(screen.getByText(/Dipirona 09h/)).toBeInTheDocument();
  });

  it("does not show cuidados band when crianca has none", async () => {
    vi.mocked(CriancasService.getById).mockResolvedValue(crianca);
    vi.mocked(AgendaService.getDia).mockResolvedValue(diaComEntries);

    render(<AgendaScreen criancaId="c1" />);

    await screen.findByText("Ana");
    expect(screen.queryByText(/Cuidados de hoje/)).not.toBeInTheDocument();
  });

  it("shows empty state when there is no registro for the day", async () => {
    vi.mocked(CriancasService.getById).mockResolvedValue(crianca);
    vi.mocked(AgendaService.getDia).mockRejectedValue(new Error("sem dados"));

    render(<AgendaScreen criancaId="c1" />);

    expect(await screen.findByText("Sem registro hoje")).toBeInTheDocument();
    expect(
      screen.getByText("Ainda não há anotações para este dia."),
    ).toBeInTheDocument();
  });
});
