/**
 * Tabela de referência do simulador.
 *
 * A doc do backend permite o cálculo "100% no cliente" (docs/03-Backend §5).
 * Enquanto o `configPrecos` não estiver populado, estes valores são a fonte —
 * `simuladorService` tenta a API primeiro e cai aqui automaticamente.
 */

export type PlanoId = "integral" | "meio";
export type Modo = "meses" | "dias";

export interface PlanoPreco {
  id: PlanoId;
  label: string;
  sub: string;
  /** Valor cheio da mensalidade. */
  mensal: number;
  /** Valor da diária avulsa. */
  diaria: number;
}

export const PLANOS: PlanoPreco[] = [
  {
    id: "integral",
    label: "Integral",
    sub: "Até 10h por dia",
    mensal: 1490,
    diaria: 95,
  },
  {
    id: "meio",
    label: "Meio período",
    sub: "Manhã ou tarde",
    mensal: 890,
    diaria: 65,
  },
];

/** Descontos progressivos por período contratado (do maior para o menor). */
const DESCONTOS_MESES: { min: number; pct: number; rotulo: string }[] = [
  { min: 12, pct: 0.15, rotulo: "plano anual" },
  { min: 6, pct: 0.1, rotulo: "plano semestral" },
  { min: 3, pct: 0.05, rotulo: "plano trimestral" },
];

const DESCONTOS_DIAS: { min: number; pct: number; rotulo: string }[] = [
  { min: 20, pct: 0.1, rotulo: "pacote de 20+ dias" },
  { min: 10, pct: 0.05, rotulo: "pacote de 10+ dias" },
];

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

export function calcularSimulacao(
  planoId: PlanoId,
  modo: Modo,
  quantidade: number,
): ResultadoSimulacao {
  const plano = PLANOS.find((p) => p.id === planoId) ?? PLANOS[0];
  const qtd = Math.max(1, Math.floor(quantidade || 1));
  const base = modo === "meses" ? plano.mensal : plano.diaria;
  const tabela = modo === "meses" ? DESCONTOS_MESES : DESCONTOS_DIAS;

  const faixa = tabela.find((d) => qtd >= d.min);
  const descontoPct = faixa?.pct ?? 0;

  const totalCheio = base * qtd;
  const total = Math.round(totalCheio * (1 - descontoPct));

  return {
    porUnidade: Math.round(total / qtd),
    total,
    totalCheio,
    economia: totalCheio - total,
    descontoPct,
    descontoRotulo: faixa?.rotulo ?? null,
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
