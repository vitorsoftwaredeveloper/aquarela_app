import { Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react";
import type { Crianca } from "./crianca";
import type { AnexoReferencia } from "./anexo";

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
  /** Agenda de hoje já enviada aos pais (`POST /agenda/{id}/enviar`). */
  agendaEnviada: boolean;
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
  tarefaCasa?: { status: string; observacao?: string };
  presenca?: { status: string; horaChegada?: string; justificativa?: string };
  anexos?: AnexoReferencia[];
}

/** Opções pré-definidas — preencher em toques, sem digitar (docs §UX). */
export const REFEICOES = ["Café", "Almoço", "Lanche", "Jantar"] as const;

/**
 * A API exige o código em `refeicao` (docs/03-Backend §6:
 * cafe|almoco|lanche|jantar) — os chips mostram o rótulo em pt-BR.
 */
export const REFEICAO_CODIGO: Record<(typeof REFEICOES)[number], string> = {
  Café: "cafe",
  Almoço: "almoco",
  Lanche: "lanche",
  Jantar: "janta",
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
export const HUMORES: { value: string; icon: LucideIcon; label: string }[] = [
  { value: "feliz", icon: Laugh, label: "Alegre" },
  { value: "tranquilo", icon: Smile, label: "Tranquilo" },
  { value: "neutro", icon: Meh, label: "Quieto" },
  { value: "choroso", icon: Frown, label: "Choroso" },
];

export const HUMOR_ICON: Record<string, LucideIcon> = Object.fromEntries(
  HUMORES.map((h) => [h.value, h.icon]),
);

export const TAREFAS_CASA: { value: string; label: string }[] = [
  { value: "feito", label: "Feito" },
  { value: "nao_feito", label: "Não feito" },
  { value: "incompleto", label: "Incompleto" },
];

export const PRESENCAS: { value: string; label: string }[] = [
  { value: "presente", label: "Presente" },
  { value: "falta", label: "Falta" },
  { value: "atrasado", label: "Atrasado" },
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
