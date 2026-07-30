import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devCriancasCadastro } from "./devData";
import { unwrapList } from "./unwrap";
import type {
  CriancaCadastro,
  CriancaCriada,
  FotoUpload,
  NovaCrianca,
  NovaCriancaPayload,
} from "@/types/criancaCadastro";

function dataUrlDaFoto(foto?: FotoUpload): string | undefined {
  return foto ? `data:${foto.contentType};base64,${foto.base64}` : undefined;
}

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
  async create(payload: NovaCriancaPayload): Promise<CriancaCriada> {
    if (IS_DEV_DATA) {
      const { foto, consentimentoLgpd: _consentimentoLgpd, ...resto } = payload;
      void _consentimentoLgpd;
      return {
        crianca: {
          ...resto,
          _id: `dev-${Date.now()}`,
          fotoUrl: dataUrlDaFoto(foto),
        },
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
    if (IS_DEV_DATA) {
      const { foto, ...resto } = payload;
      return {
        ...resto,
        _id: id,
        cpf: "",
        turmaId: "",
        fotoUrl: dataUrlDaFoto(foto),
      };
    }
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

  /** Apaga só a foto (admin). O cadastro da criança permanece. */
  async removerFoto(id: string): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.delete(`/criancas/${id}/foto`);
  },

  /** Remoção DEFINITIVA em cadeia: apaga agenda, mensalidades e pagamentos da criança. */
  async remove(id: string): Promise<void> {
    await api.delete(`/criancas/${id}`);
  },
};
