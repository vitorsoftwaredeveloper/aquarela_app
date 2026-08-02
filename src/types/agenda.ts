import type { AnexoReferencia } from "./anexo";

export interface AnexoAgenda extends AnexoReferencia {
  url?: string;
}

/** Tipos de item da agenda diária. */
export type AgendaTipo =
  | "alimentacao"
  | "sono"
  | "atividade"
  | "humor"
  | "higiene"
  | "medicacao"
  | "intercorrencia"
  | "observacao"
  | "tarefaCasa"
  | "presenca";

export interface AgendaEntry {
  tipo: AgendaTipo;
  title: string;
  text: string;
  /** Intercorrência/medicação/falta/tarefa não feita → destaque visual. */
  destaque?: boolean;
  /** Valor cru (ex.: código do humor/presença/tarefa), para quem renderiza escolher ícone. */
  value?: string;
}

export interface AgendaProfessor {
  nome: string;
  fotoUrl?: string;
}

/** Registro do dia de uma criança. */
export interface AgendaDia {
  criancaId: string;
  /** ISO date (YYYY-MM-DD). */
  data: string;
  dataLabel: string;
  entries: AgendaEntry[];
  professor?: AgendaProfessor;
  anexos?: AnexoAgenda[];
}

/** Aviso/recado do mural — visível para todos os responsáveis ou só p/ uma turma. */
export interface Aviso {
  id: string;
  titulo: string;
  corpo: string;
  /** Ausente = visível para todos; presente = só a turma alvo. */
  turmaId?: string;
  dataLabel: string;
}

/** Payload de criação/edição de aviso (admin). */
export type NovoAviso = Pick<Aviso, "titulo" | "corpo" | "turmaId">;

/** Item do histórico (resumo de um dia). */
export interface HistoricoDia {
  data: string;
  dataLabel: string;
  humorLabel: string;
  /** Código cru do humor (feliz|tranquilo|neutro|choroso), pra escolher o ícone. */
  humorValue?: string;
  chips: string[];
  alerta?: string;
  observacoes?: string;
  anexos?: AnexoAgenda[];
}
