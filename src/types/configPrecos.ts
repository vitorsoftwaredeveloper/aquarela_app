/** Configuração de preços do simulador (singleton) — espelha o backend. */

export type PlanoTipo = "integral" | "meioPeriodo";

export interface DescontoConfig {
  meses: number;
  percentual: number; // 0-100
}

export interface PlanoConfig {
  nome: string;
  tipo: PlanoTipo;
  valorMensal: number;
  valorDiario?: number | null;
  descontos?: DescontoConfig[] | null;
}

export interface InadimplenciaConfig {
  diasCarencia: number; // 0-365, contados a partir do vencimento da mensalidade
}

export interface ConfigPrecos {
  planos: PlanoConfig[];
  inadimplencia?: InadimplenciaConfig;
}

/** Payload do PUT (igual ao IUpdateConfigPrecosPayload do serverless). */
export type UpdateConfigPrecos = ConfigPrecos;

export const TIPO_LABEL: Record<PlanoTipo, string> = {
  integral: "Integral",
  meioPeriodo: "Meio período",
};

/** Carência sugerida quando o `configPrecos` ainda não foi populado. */
export const INADIMPLENCIA_PADRAO: InadimplenciaConfig = {
  diasCarencia: 10,
};

/** Planos-base sugeridos quando o `configPrecos` ainda não foi populado. */
export const PLANOS_PADRAO: PlanoConfig[] = [
  {
    nome: "Integral",
    tipo: "integral",
    valorMensal: 1490,
    valorDiario: 95,
    descontos: [
      { meses: 3, percentual: 5 },
      { meses: 6, percentual: 10 },
      { meses: 12, percentual: 15 },
    ],
  },
  {
    nome: "Meio período",
    tipo: "meioPeriodo",
    valorMensal: 890,
    valorDiario: 65,
    descontos: [
      { meses: 6, percentual: 10 },
      { meses: 12, percentual: 15 },
    ],
  },
];
