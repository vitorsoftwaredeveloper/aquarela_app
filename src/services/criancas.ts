import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devCriancas, devCriancasCadastro } from "./devData";
import { unwrapList } from "./unwrap";
import type { Crianca } from "@/types/crianca";
import type {
  CriancaCadastro,
  CriancaEditavelResponsavel,
  FotoUpload,
} from "@/types/criancaCadastro";

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

  /** Cadastro completo do próprio filho (mesma rota do admin; ownership é do backend). */
  async getCadastro(id: string): Promise<CriancaCadastro> {
    if (IS_DEV_DATA) {
      const found = devCriancasCadastro.find((c) => c._id === id);
      if (found) return found;
    }
    const { data } = await api.get(`/criancas/${id}`);
    return data.data;
  },

  /**
   * Edição pelo responsável. `financeiro` é bloqueado pelo backend (403) e
   * `cpf`/`turmaId` derrubam o PUT inteiro — nenhum vai no corpo.
   */
  async update(
    id: string,
    payload: CriancaEditavelResponsavel,
  ): Promise<CriancaCadastro> {
    if (IS_DEV_DATA) {
      const found = devCriancasCadastro.find((c) => c._id === id);
      const { foto, ...resto } = payload;
      return {
        ...(found as CriancaCadastro),
        ...resto,
        fotoUrl: foto
          ? `data:${foto.contentType};base64,${foto.base64}`
          : found?.fotoUrl,
      };
    }
    const { data } = await api.put(`/criancas/${id}`, payload);
    return data.data;
  },

  /** Upload isolado da foto — mesmo PUT, só com o campo `foto`. */
  async enviarFoto(id: string, foto: FotoUpload): Promise<CriancaCadastro> {
    return CriancasService.update(id, { foto });
  },
};
