/** Turma — vincula uma professora e agrupa crianças por faixa etária. */
export interface Turma {
  _id: string;
  nome: string;
  descricao?: string;
  faixaEtaria: { min: number; max: number };
  professorId: string;
  /** Resumo da professora vinculada (quando o backend popula). */
  professor?: { _id: string; nome: string; email: string } | null;
  /** Nº de crianças ativas — usado no aviso de remoção. */
  totalCriancas?: number;
  ativo: boolean;
  criadoEm?: string;
}

export interface NovaTurma {
  nome: string;
  descricao?: string;
  faixaEtaria: { min: number; max: number };
  professorId: string;
}

/** "3–4 anos" / "3 anos". */
export function formatFaixa(faixa: { min: number; max: number }): string {
  if (faixa.min === faixa.max) return `${faixa.min} anos`;
  return `${faixa.min}–${faixa.max} anos`;
}
