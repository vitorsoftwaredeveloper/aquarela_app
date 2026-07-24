import type { Crianca } from "./crianca";

/** Turma na visão do professor (com progresso do dia). */
export interface TurmaProfessor {
  _id: string;
  nome: string;
  descricao?: string;
  periodo?: string;
  totalCriancas: number;
  /** Quantas agendas ainda faltam registrar hoje. */
  agendasPendentes: number;
}

/** Criança dentro da turma, com o status da agenda de hoje. */
export interface AlunoTurma extends Crianca {
  agendaRegistrada: boolean;
}

export type Aceitacao = "tudo" | "parte" | "recusou";

/** Payload de criação/edição do registro do dia (contrato §6). */
export interface AgendaRegistroPayload {
  criancaId: string;
  /** ISO date YYYY-MM-DD. */
  data: string;
  alimentacao?: { refeicao: string; aceitacao: Aceitacao }[];
  sono?: { inicio: string; fim: string }[];
  atividades?: string[];
  humor?: string;
  higiene?: { fraldas: number };
  intercorrencias?: { tipo: string; descricao: string; hora: string }[];
  observacoes?: string;
}

/** Opções pré-definidas — preencher em toques, sem digitar (docs §UX). */
export const REFEICOES = ["Café", "Almoço", "Lanche", "Janta"] as const;

/**
 * A API exige o código em `refeicao` (docs/03-Backend §6:
 * cafe|almoco|lanche|janta) — os chips mostram o rótulo em pt-BR.
 */
export const REFEICAO_CODIGO: Record<(typeof REFEICOES)[number], string> = {
  Café: "cafe",
  Almoço: "almoco",
  Lanche: "lanche",
  Janta: "janta",
};

export const ACEITACAO_OPTS: { value: Aceitacao; label: string }[] = [
  { value: "tudo", label: "Comeu tudo" },
  { value: "parte", label: "Comeu parte" },
  { value: "recusou", label: "Recusou" },
];

export const ATIVIDADES = [
  "Pintura",
  "Música",
  "Parquinho",
  "Leitura",
  "Massinha",
  "Circuito motor",
  "Brincadeira livre",
];

/** `value` já é o código aceito pela API (feliz|tranquilo|neutro|choroso). */
export const HUMORES: { value: string; emoji: string; label: string }[] = [
  { value: "feliz", emoji: "😀", label: "Alegre" },
  { value: "tranquilo", emoji: "🙂", label: "Tranquilo" },
  { value: "neutro", emoji: "😐", label: "Quieto" },
  { value: "choroso", emoji: "😢", label: "Choroso" },
];

export const INTERCORRENCIAS = [
  "Febre",
  "Queda",
  "Vômito",
  "Machucado",
  "Mal-estar",
];

/**
 * A API só tem 4 categorias amplas (docs/03-Backend §6:
 * febre|queda|doenca|outro) — os chips são mais específicos para o
 * professor; o rótulo do chip vira `descricao` (texto livre) no envio.
 */
export const INTERCORRENCIA_TIPO: Record<
  (typeof INTERCORRENCIAS)[number],
  string
> = {
  Febre: "febre",
  Queda: "queda",
  Vômito: "outro",
  Machucado: "outro",
  "Mal-estar": "doenca",
};
