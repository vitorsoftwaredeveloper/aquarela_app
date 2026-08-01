import type { AnexoReferencia } from "./anexo";

export interface AnexoMensagem extends AnexoReferencia {
  url?: string;
}

export interface Mensagem {
  id: string;
  criancaId: string;
  autorId: string;
  autorNome: string;
  autorPapel: "professor" | "responsavel";
  corpo: string;
  anexos: AnexoMensagem[];
  createdAt: string;
  status: "enviando" | "enviada";
}

export interface MensagemNaoLidas {
  criancaId: string;
  naoLidas: number;
}
