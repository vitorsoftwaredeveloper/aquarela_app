/** Álbum de fotos de um evento — mural (Épico M). Doc: docs/04-Banco-de-Dados.md §"eventos". */
export interface FotoEvento {
  key: string;
  nome: string;
  contentType: string;
  tamanho: number;
  legenda?: string;
  ordem: number;
  enviadoPor: string;
  enviadoEm: string;
  url?: string;
}

export interface Evento {
  _id: string;
  titulo: string;
  descricao?: string;
  /** ISO date YYYY-MM-DD. */
  data: string;
  /** Ausente = evento da escola inteira (só admin gerencia). */
  turmaId?: string;
  autorId: string;
  fotos: FotoEvento[];
  publicado: boolean;
  publicadoEm?: string;
  createdAt?: string;
}

export interface NovoEvento {
  titulo: string;
  descricao?: string;
  data: string;
  turmaId?: string;
}

export interface FotoDeclarada {
  key: string;
  nome: string;
  contentType: string;
  tamanho: number;
  legenda?: string;
}

export interface FotoOrdem {
  key: string;
  legenda?: string;
  ordem: number;
}
