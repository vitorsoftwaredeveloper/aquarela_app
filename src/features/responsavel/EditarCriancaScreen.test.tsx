// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditarCriancaScreen } from "./EditarCriancaScreen";
import { CriancasService } from "@/services/criancas";
import type { CriancaCadastro } from "@/types/criancaCadastro";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/services/criancas", () => ({
  CriancasService: { getCadastro: vi.fn(), update: vi.fn() },
}));

const recarregarFilhos = vi.fn();
vi.mock("@/contexts/ResponsavelContext", () => ({
  useResponsavel: () => ({ reload: recarregarFilhos }),
}));

const crianca: CriancaCadastro = {
  _id: "c1",
  nome: "Lorena Souza",
  dataNascimento: "2023-04-12",
  cpf: "39053344705",
  turmaId: "t-girassol",
  turmaNome: "Girassol",
  fotoUrl: "https://exemplo/foto.jpg",
  responsaveis: [
    {
      nome: "Marina Souza",
      cpf: "11144477735",
      parentesco: "Mãe",
      telefone: "11990000000",
      email: "marina@email.com",
      podeRetirar: true,
    },
  ],
  saude: {
    alergias: ["amendoim"],
    restricoesAlimentares: [],
    medicacoesContinuas: [],
    condicoesAtipicas: [],
    cuidadosEspeciais: "",
    observacoes: "",
  },
  financeiro: { valorMensalidade: 1490, diaVencimento: 5 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditarCriancaScreen", () => {
  it("carrega o cadastro do filho nos campos editáveis", async () => {
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    expect(await screen.findByDisplayValue("Lorena Souza")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12/04/2023")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Marina Souza")).toBeInTheDocument();
    expect(screen.getByText("amendoim")).toBeInTheDocument();
    expect(screen.getByAltText("Foto de Lorena Souza")).toBeInTheDocument();
  });

  it("não oferece os campos exclusivos do admin", async () => {
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    await screen.findByDisplayValue("Lorena Souza");
    expect(screen.queryByLabelText(/mensalidade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^turma$/i)).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("390.533.447-05"),
    ).not.toBeInTheDocument();
  });

  it("trava o e-mail do responsável já vinculado (é o login no Cognito)", async () => {
    vi.mocked(CriancasService.getCadastro).mockResolvedValue({
      ...crianca,
      responsaveis: [{ ...crianca.responsaveis[0], usuarioId: "u1" }],
    });

    render(<EditarCriancaScreen criancaId="c1" />);

    const email = await screen.findByDisplayValue("marina@email.com");
    expect(email).toHaveAttribute("readonly");
    expect(screen.getByText(/e-mail de login no app/i)).toBeInTheDocument();
  });

  it("deixa editar o e-mail de responsável ainda sem acesso", async () => {
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    const email = await screen.findByDisplayValue("marina@email.com");
    expect(email).not.toHaveAttribute("readonly");
  });

  it("trava o toggle de retirada (só a secretaria autoriza) — OPS-01", async () => {
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    await screen.findByDisplayValue("Marina Souza");
    const podeRetirar = screen.getByRole("checkbox", {
      name: /pode retirar/i,
    });
    expect(podeRetirar).toBeDisabled();
    expect(screen.getByText(/só a secretaria autoriza/i)).toBeInTheDocument();
  });

  it("mantém o podeRetirar carregado mesmo com o toggle travado", async () => {
    const user = userEvent.setup();
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);
    vi.mocked(CriancasService.update).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    await screen.findByDisplayValue("Marina Souza");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(CriancasService.update).toHaveBeenCalledTimes(1),
    );
    const [, payload] = vi.mocked(CriancasService.update).mock.calls[0];
    expect(payload.responsaveis?.[0].podeRetirar).toBe(true);
  });

  it("não oferece adicionar novo responsável — só a secretaria adiciona", async () => {
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    await screen.findByDisplayValue("Marina Souza");
    expect(
      screen.queryByRole("button", { name: /adicionar responsável/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/só a secretaria adiciona um novo responsável/i),
    ).toBeInTheDocument();
  });

  it("salva sem financeiro, turmaId nem cpf da criança", async () => {
    const user = userEvent.setup();
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);
    vi.mocked(CriancasService.update).mockResolvedValue(crianca);

    render(<EditarCriancaScreen criancaId="c1" />);

    const nome = await screen.findByDisplayValue("Lorena Souza");
    await user.clear(nome);
    await user.type(nome, "Lorena S. Souza");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() =>
      expect(CriancasService.update).toHaveBeenCalledTimes(1),
    );
    const [id, payload] = vi.mocked(CriancasService.update).mock.calls[0];
    expect(id).toBe("c1");
    expect(payload.nome).toBe("Lorena S. Souza");
    expect(payload).not.toHaveProperty("financeiro");
    expect(payload).not.toHaveProperty("turmaId");
    expect(payload).not.toHaveProperty("cpf");
    expect(payload.responsaveis?.[0].cpf).toBe("11144477735");
    expect(recarregarFilhos).toHaveBeenCalled();
    expect(await screen.findByText("Dados atualizados.")).toBeInTheDocument();
  });

  it("mostra o erro da API e mantém o formulário", async () => {
    const user = userEvent.setup();
    vi.mocked(CriancasService.getCadastro).mockResolvedValue(crianca);
    vi.mocked(CriancasService.update).mockRejectedValue(
      new Error("Falha ao salvar"),
    );

    render(<EditarCriancaScreen criancaId="c1" />);

    await screen.findByDisplayValue("Lorena Souza");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lorena Souza")).toBeInTheDocument();
  });
});
