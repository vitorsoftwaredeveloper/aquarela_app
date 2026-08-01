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
