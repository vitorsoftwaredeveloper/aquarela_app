/**
 * Cálculo do simulador — 100% no cliente a partir do `configPrecos` público
 * (`ConfigPrecosService.listPlanos`, rota `GET /config/precos/planos`).
 *
 * Os planos (nome, valores, descontos) não são mais fixos aqui: vêm do
 * backend, com `PLANOS_PADRAO` (types/configPrecos.ts) como referência
 * enquanto a lista carrega ou se a API estiver fora do ar.
 */
import type {
  DescontoConfig,
  PlanoConfig,
  PlanoTipo,
} from "@/types/configPrecos";

export type Modo = "meses" | "dias";

/** Texto complementar por tipo — não vem do config (é só copy da landing). */
export const SUBTITULO_TIPO: Record<PlanoTipo, string> = {
  integral: "Até 10h por dia",
  meioPeriodo: "Manhã ou tarde",
};

/**
 * O nome do plano (ex.: "Diária Integral" vs "Mensal Integral") já indica o
 * modo de cálculo — escolher um desses planos na tela decide "por meses" ou
 * "dias avulsos" junto, sem precisar mexer no segmentado à parte.
 */
export function inferirModo(nome: string): Modo {
  return /di[áa]ria/i.test(nome) ? "dias" : "meses";
}

export const PRESETS: Record<Modo, number[]> = {
  meses: [1, 3, 6, 12],
  dias: [5, 10, 15, 20],
};

export interface ResultadoSimulacao {
  /** Valor por mês (modo meses) ou por dia (modo dias), já com desconto. */
  porUnidade: number;
  /** Total do período. */
  total: number;
  /** Total sem desconto — para mostrar a economia. */
  totalCheio: number;
  economia: number;
  descontoPct: number;
  descontoRotulo: string | null;
}

function rotuloDesconto(meses: number): string {
  if (meses >= 12) return "plano anual";
  if (meses >= 6) return "plano semestral";
  if (meses >= 3) return "plano trimestral";
  return `plano de ${meses} meses`;
}

/** Maior desconto aplicável (meses de corte mais alto que a quantidade cobre). */
function melhorDesconto(
  descontos: DescontoConfig[] | null | undefined,
  qtd: number,
): DescontoConfig | undefined {
  return [...(descontos ?? [])]
    .sort((a, b) => b.meses - a.meses)
    .find((d) => qtd >= d.meses);
}

export function calcularSimulacao(
  plano: PlanoConfig,
  modo: Modo,
  quantidade: number,
): ResultadoSimulacao {
  const qtd = Math.max(1, Math.floor(quantidade || 1));
  const base =
    modo === "meses"
      ? plano.valorMensal
      : (plano.valorDiario ?? Math.round(plano.valorMensal / 30));

  // Desconto só existe para "meses" — é o que o admin configura
  // (`plano.descontos`). "Dias" avulsos não tem desconto na API: não inventa
  // um aqui, mesmo que fosse plausível.
  let descontoPct = 0;
  let descontoRotulo: string | null = null;

  if (modo === "meses") {
    const melhor = melhorDesconto(plano.descontos, qtd);
    if (melhor) {
      descontoPct = melhor.percentual / 100;
      descontoRotulo = rotuloDesconto(melhor.meses);
    }
  }

  const totalCheio = base * qtd;
  const total = Math.round(totalCheio * (1 - descontoPct));

  return {
    porUnidade: Math.round(total / qtd),
    total,
    totalCheio,
    economia: totalCheio - total,
    descontoPct,
    descontoRotulo,
  };
}

export function formatBRLCompacto(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
