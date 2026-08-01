export type EscopoAnexo = "mensagem" | "agenda" | "mural";

export interface AnexoUploadUrl {
  key: string;
  uploadUrl: string;
  expiraEm: number;
}

export interface AnexoReferencia {
  key: string;
  nome: string;
  contentType: string;
  tamanho: number;
}
