import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devCriancasCadastro } from "./devData";
import { unwrapList } from "./unwrap";
import type {
  CriancaCadastro,
  CriancaCriada,
  NovaCrianca,
} from "@/types/criancaCadastro";

/** CRUD completo de crianças (admin). Contrato: docs/03-Backend §5. */
export const CriancasAdminService = {
  async list(turmaId?: string): Promise<CriancaCadastro[]> {
    if (IS_DEV_DATA) {
      return turmaId
        ? devCriancasCadastro.filter((c) => c.turmaId === turmaId)
        : devCriancasCadastro;
    }
    const { data } = await api.get("/criancas", {
      params: turmaId ? { turmaId } : undefined,
    });
    return unwrapList<CriancaCadastro>(data);
  },

  async getById(id: string): Promise<CriancaCadastro> {
    if (IS_DEV_DATA) {
      const found = devCriancasCadastro.find((c) => c._id === id);
      if (found) return found;
    }
    const { data } = await api.get(`/criancas/${id}`);
    return data.data;
  },

  /** Retorna a criança + `acessosResponsaveis` (senhas temporárias para o admin). */
  async create(payload: NovaCrianca): Promise<CriancaCriada> {
    if (IS_DEV_DATA) {
      return {
        crianca: { ...payload, _id: `dev-${Date.now()}`, ativo: true },
        acessosResponsaveis: [],
      };
    }
    const { data } = await api.post("/criancas", payload);
    return data.data;
  },

  /**
   * `cpf` é imutável e `turmaId` só muda via `moverTurma` (PATCH dedicado) —
   * o backend rejeita a requisição inteira (`additionalProperties:false`) se
   * qualquer um dos dois vier no corpo do PUT.
   */
  async update(
    id: string,
    payload: Omit<NovaCrianca, "cpf" | "turmaId">,
  ): Promise<CriancaCadastro> {
    if (IS_DEV_DATA)
      return { ...payload, _id: id, cpf: "", turmaId: "", ativo: true };
    const { data } = await api.put(`/criancas/${id}`, payload);
    return data.data;
  },

  /** Move a criança para outra turma (substitui o vínculo anterior). */
  async moverTurma(id: string, turmaId: string): Promise<CriancaCadastro> {
    if (IS_DEV_DATA) {
      const found = devCriancasCadastro.find((c) => c._id === id);
      return { ...(found as CriancaCadastro), turmaId };
    }
    const { data } = await api.patch(`/criancas/${id}/turma`, { turmaId });
    return data.data;
  },

  /** Ativa/desativa sem apagar (mantém agenda/financeiro). Ver `remove`, que é definitivo. */
  async setAtivo(id: string, ativo: boolean): Promise<CriancaCadastro> {
    if (IS_DEV_DATA) {
      const found = devCriancasCadastro.find((c) => c._id === id);
      return { ...(found as CriancaCadastro), ativo };
    }
    const { data } = await api.put(`/criancas/${id}`, { ativo });
    return data.data;
  },

  /** Remoção DEFINITIVA em cadeia: apaga agenda, mensalidades e pagamentos da criança. */
  async remove(id: string): Promise<void> {
    await api.delete(`/criancas/${id}`);
  },
};
