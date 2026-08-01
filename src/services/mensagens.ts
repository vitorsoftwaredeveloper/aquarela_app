import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { unwrapItem, unwrapList } from "./unwrap";
import type { AnexoReferencia } from "@/types/anexo";
import type { AnexoMensagem, Mensagem } from "@/types/mensagem";

interface MensagemRaw {
  _id: string;
  criancaId: string;
  autorId: string;
  autorNome: string;
  autorPapel: "professor" | "responsavel";
  corpo: string;
  anexos?: AnexoMensagem[];
  createdAt: string;
}

function normalize(raw: MensagemRaw): Mensagem {
  return {
    id: raw._id,
    criancaId: raw.criancaId,
    autorId: raw.autorId,
    autorNome: raw.autorNome,
    autorPapel: raw.autorPapel,
    corpo: raw.corpo,
    anexos: raw.anexos ?? [],
    createdAt: raw.createdAt,
    status: "enviada",
  };
}

export const MensagensService = {
  async listar(
    criancaId: string,
    antesDe?: string,
    desde?: string,
  ): Promise<Mensagem[]> {
    if (IS_DEV_DATA) return [];
    const { data } = await api.get("/mensagens", {
      params: { criancaId, antesDe, desde },
    });
    return unwrapList<MensagemRaw>(data).map(normalize);
  },

  async enviar(
    criancaId: string,
    corpo: string,
    anexos?: AnexoReferencia[],
  ): Promise<Mensagem> {
    const { data } = await api.post("/mensagens", { criancaId, corpo, anexos });
    const raw = unwrapItem<MensagemRaw>(data);
    if (!raw) throw new Error("Resposta inválida ao enviar o recado.");
    return normalize(raw);
  },

  async remover(id: string): Promise<void> {
    await api.delete(`/mensagens/${id}`);
  },
};
