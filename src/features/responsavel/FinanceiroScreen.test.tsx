// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { FinanceiroScreen } from "./FinanceiroScreen";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { FinanceiroService } from "@/services/financeiroService";
import type { Crianca } from "@/types/crianca";
import type { Mensalidade, Pagamento } from "@/types/financeiro";

vi.mock("@/contexts/ResponsavelContext", () => ({
  useResponsavel: vi.fn(),
}));

vi.mock("@/services/financeiroService", () => ({
  FinanceiroService: {
    listMensalidades: vi.fn(),
    criarPagamento: vi.fn(),
    getPagamento: vi.fn(),
  },
}));

vi.mock("@/config/env", () => ({
  ENV: { API_BASE_URL: "" },
  IS_DEV_DATA: false,
}));

const active: Crianca = {
  _id: "c1",
  nome: "Ana",
  iniciais: "A",
  avatarBg: "#fff",
  sub: "Turma Girassol · 3 anos",
};

const mensalidadeAberta: Mensalidade = {
  _id: "m1",
  criancaId: "c1",
  ano: 2026,
  mes: 7,
  mesLabel: "Julho",
  mesShort: "Jul",
  valor: 89000,
  status: "aberto",
};

const mensalidadePaga: Mensalidade = {
  _id: "m2",
  criancaId: "c1",
  ano: 2026,
  mes: 6,
  mesLabel: "Junho",
  mesShort: "Jun",
  valor: 89000,
  status: "pago",
};

const pagamento: Pagamento = {
  txid: "txid-1",
  pixCopiaECola: "00020126-copia-e-cola-fake",
  status: "pendente",
};

function mockResponsavel(
  overrides: Partial<ReturnType<typeof useResponsavel>> = {},
) {
  vi.mocked(useResponsavel).mockReturnValue({
    criancas: [active],
    active,
    activeId: active._id,
    loading: false,
    error: null,
    avatarColors: {},
    setActive: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FinanceiroScreen", () => {
  it("shows empty state when there is no active child", async () => {
    mockResponsavel({ active: null, activeId: null });
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([]);

    render(<FinanceiroScreen />);

    expect(
      await screen.findByText("Sem filhos vinculados"),
    ).toBeInTheDocument();
  });

  it("renders months with pago/aberto status", async () => {
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
      mensalidadePaga,
    ]);

    render(<FinanceiroScreen />);

    expect(await screen.findByText("Julho")).toBeInTheDocument();
    expect(screen.getByText("Junho")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Recibo/ })).toBeInTheDocument();
  });

  it("opens PIX modal and shows QR + copia-e-cola after clicking Pagar", async () => {
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento).mockResolvedValue(pagamento);
    const user = userEvent.setup();

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));

    expect(
      screen.getByRole("dialog", { name: "Pagamento via PIX" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(pagamento.pixCopiaECola),
    ).toBeInTheDocument();
    expect(FinanceiroService.criarPagamento).toHaveBeenCalledWith("m1");
  });

  it("copies pix code to clipboard", async () => {
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento).mockResolvedValue(pagamento);
    const user = userEvent.setup();
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    await screen.findByText(pagamento.pixCopiaECola);
    await user.click(screen.getByRole("button", { name: "Copiar" }));

    expect(writeText).toHaveBeenCalledWith(pagamento.pixCopiaECola);
    expect(
      await screen.findByRole("button", { name: "Copiado!" }),
    ).toBeInTheDocument();
  });

  it("shows error with retry when criarPagamento fails, and recovers on retry", async () => {
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento)
      .mockRejectedValueOnce(new Error("falha ao gerar cobranca"))
      .mockResolvedValueOnce(pagamento);
    const user = userEvent.setup();

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(
      await screen.findByText(pagamento.pixCopiaECola),
    ).toBeInTheDocument();
  });

  it("shows confirmation (not error) when criarPagamento returns MENSALIDADE_PAGA", async () => {
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento).mockRejectedValue(
      new AxiosError("conflict", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        data: {
          code: "MENSALIDADE_PAGA",
          message: "Esta mensalidade já está paga.",
        },
      } as AxiosError["response"]),
    );
    const user = userEvent.setup();

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));

    expect(await screen.findByText("Pagamento confirmado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tentar de novo" }),
    ).not.toBeInTheDocument();
  });

  it("shows the pending-payment message when criarPagamento returns PAGAMENTO_PENDENTE", async () => {
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    const mensagem =
      "Já existe um pagamento pendente para esta mensalidade. Aguarde a resolução do pagamento até 1 hora após a criação.";
    vi.mocked(FinanceiroService.criarPagamento).mockRejectedValue(
      new AxiosError("conflict", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        data: { code: "PAGAMENTO_PENDENTE", message: mensagem },
      } as AxiosError["response"]),
    );
    const user = userEvent.setup();

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(mensagem);
    expect(
      screen.getByRole("button", { name: "Tentar de novo" }),
    ).toBeInTheDocument();
  });

  it("polls payment status and shows confirmation when pago", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento).mockResolvedValue(pagamento);
    vi.mocked(FinanceiroService.getPagamento).mockResolvedValue({
      ...pagamento,
      status: "pago",
    });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    await screen.findByText(pagamento.pixCopiaECola);

    await vi.advanceTimersByTimeAsync(4000);

    expect(await screen.findByText("Pagamento confirmado")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("closes the modal automatically after 5 minutes if still unpaid", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento).mockResolvedValue(pagamento);
    vi.mocked(FinanceiroService.getPagamento).mockResolvedValue(pagamento);
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    await screen.findByText(pagamento.pixCopiaECola);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not auto-close the modal once the payment is confirmed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockResponsavel();
    vi.mocked(FinanceiroService.listMensalidades).mockResolvedValue([
      mensalidadeAberta,
    ]);
    vi.mocked(FinanceiroService.criarPagamento).mockResolvedValue(pagamento);
    vi.mocked(FinanceiroService.getPagamento).mockResolvedValue({
      ...pagamento,
      status: "pago",
    });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<FinanceiroScreen />);
    await user.click(await screen.findByRole("button", { name: "Pagar" }));
    await screen.findByText(pagamento.pixCopiaECola);
    await vi.advanceTimersByTimeAsync(4000);
    await screen.findByText("Pagamento confirmado");

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

    expect(await screen.findByText("Pagamento confirmado")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
