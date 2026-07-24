/** Plano de aula — vinculado a uma turma e à professora autora. Doc: docs/04-Banco-de-Dados.md §3. */
export interface PlanoAula {
  _id: string;
  turmaId: string;
  professorId: string;
  titulo: string;
  descricao: string;
  /** ISO date YYYY-MM-DD. */
  data: string;
  objetivos?: string[];
  materiais?: string[];
  criadoEm?: string;
}

export interface NovoPlanoAula {
  titulo: string;
  descricao: string;
  data: string;
  objetivos?: string[];
  materiais?: string[];
}
