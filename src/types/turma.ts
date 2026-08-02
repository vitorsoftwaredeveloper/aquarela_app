/** Turma — vincula uma ou mais professoras e agrupa crianças por faixa etária. */
export interface Turma {
  _id: string;
  nome: string;
  descricao?: string;
  faixaEtaria: { min: number; max: number };
  professorIds: string[];
  /** Resumo das professoras vinculadas (quando o backend popula). */
  professores?: { _id: string; nome: string; email: string }[];
  /** Nº de crianças ativas — usado no aviso de remoção. */
  totalCriancas?: number;
  criadoEm?: string;
}

export interface NovaTurma {
  nome: string;
  descricao?: string;
  faixaEtaria: { min: number; max: number };
  professorIds: string[];
}

/** "3–4 anos" / "3 anos". */
export function formatFaixa(faixa: { min: number; max: number }): string {
  if (faixa.min === faixa.max) return `${faixa.min} anos`;
  return `${faixa.min}–${faixa.max} anos`;
}
