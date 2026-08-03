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
  professor: { nome: "Prof. Bia" },
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
    expect(screen.getByText("Oi, família da(o) Ana!")).toBeInTheDocument();
    expect(screen.getByText(/comeu bem/)).toBeInTheDocument();
    expect(screen.getByText("Dipirona")).toBeInTheDocument();
    expect(
      screen.getByText("Registrado no fim do dia · Aquarela Kids"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Prof. Bia").length).toBeGreaterThan(0);
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

  it("still shows header and signature when professor is missing", async () => {
    vi.mocked(CriancasService.getById).mockResolvedValue(crianca);
    vi.mocked(AgendaService.getDia).mockResolvedValue({
      ...diaComEntries,
      professor: undefined,
    });

    render(<AgendaScreen criancaId="c1" />);

    expect(
      await screen.findByText("Oi, família da(o) Ana!"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Professora").length).toBeGreaterThan(0);
    expect(screen.getByText("Com carinho,")).toBeInTheDocument();
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
