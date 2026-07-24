import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devCriancas } from "./devData";
import { unwrapList } from "./unwrap";
import type { Crianca } from "@/types/crianca";

/** Crianças acessíveis ao usuário logado (responsável → seus filhos). */
export const CriancasService = {
  async listMy(): Promise<Crianca[]> {
    if (IS_DEV_DATA) return devCriancas;
    const { data } = await api.get("/criancas");
    return unwrapList<Crianca>(data);
  },

  async getById(id: string): Promise<Crianca> {
    if (IS_DEV_DATA) {
      const found = devCriancas.find((c) => c._id === id);
      if (found) return found;
    }
    const { data } = await api.get(`/criancas/${id}`);
    return data.data;
  },
};
