/** Balanço de um mês (entradas × despesas) — base do gráfico de 12 meses. */
export interface BalancoMes {
  ano: number;
  mes: number; // 1-12
  mesLabel: string; // "Jan"
  entradas: number;
  despesas: number;
}

/** KPIs do topo do dashboard. */
export interface ResumoFinanceiro {
  entradasMes: number;
  despesasMes: number;
  inadimplentes: number;
  criancasAtivas: number;
  turmas: number;
}

export interface Balanco {
  resumo: ResumoFinanceiro;
  meses: BalancoMes[];
}

export interface Inadimplente {
  criancaId: string;
  criancaNome: string;
  turmaNome?: string;
  responsavelNome: string;
  responsavelContato?: string;
  mesesEmAtraso: number;
  valorTotal: number;
  /** ISO date — desde quando a criança está inadimplente (menor data entre as competências). */
  inadimplenteDesde?: string;
}

export interface RelatorioAnualMes {
  mes: number;
  pagamentos: number;
  despesas: number;
  saldo: number;
  quantidadePagamentos: number;
}

export interface RelatorioAnualCriancaMes {
  mes: number;
  valor: number;
  quantidadePagamentos: number;
}

export interface RelatorioAnualCrianca {
  criancaId: string;
  nome: string;
  turmaNome?: string | null;
  total: number;
  meses: RelatorioAnualCriancaMes[];
}

export interface RelatorioAnualTotais {
  pagamentos: number;
  despesas: number;
  saldo: number;
  quantidadePagamentos: number;
  criancasComPagamento: number;
  ticketMedio: number;
}

/**
 * `GET /financeiro/relatorio-anual`. `origem: "consolidado"` = ano já fechado
 * pelo cron anual (os pagamentos crus foram expurgados, este snapshot é o
 * histórico); `"calculado"` = ano ainda aberto, somado ao vivo.
 */
export interface RelatorioAnual {
  ano: number;
  consolidadoEm: string;
  origem: "consolidado" | "calculado";
  anosDisponiveis: number[];
  totais: RelatorioAnualTotais;
  meses: RelatorioAnualMes[];
  criancas: RelatorioAnualCrianca[];
}

/** Resultado de `POST /financeiro/cobrancas/disparar` (dryRun ou real). */
export interface ResultadoDisparoCobrancas {
  dryRun: boolean;
  responsaveisNotificados: number;
  responsaveisSemToken: number;
  mensalidadesAtualizadas: number;
}

export const CATEGORIAS_DESPESA = [
  "Alimentação",
  "Pessoal",
  "Material pedagógico",
  "Manutenção",
  "Aluguel",
  "Contas (água/luz/internet)",
  "Outros",
];

export interface Despesa {
  _id: string;
  descricao: string;
  categoria: string;
  valor: number;
  /** ISO date (YYYY-MM-DD). */
  data: string;
}

export type NovaDespesa = Omit<Despesa, "_id">;
