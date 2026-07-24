import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devPlanosAula } from "./devData";
import { unwrapList } from "./unwrap";
import type { NovoPlanoAula, PlanoAula } from "@/types/planoAula";

/**
 * CRUD de planos de aula por turma (professor autor). Rotas ainda não
 * documentadas em docs/03-Backend.md — seguem a convenção de subrecurso de
 * `turmas` (como `/turmas/{id}/criancas`); `professorId`/autoria vêm do JWT.
 */
export const PlanosAulaService = {
  async list(turmaId: string): Promise<PlanoAula[]> {
    if (IS_DEV_DATA) {
      return devPlanosAula.filter((p) => p.turmaId === turmaId);
    }
    const { data } = await api.get(`/turmas/${turmaId}/planos-aula`);
    return unwrapList<PlanoAula>(data);
  },

  async getById(turmaId: string, id: string): Promise<PlanoAula> {
    if (IS_DEV_DATA) {
      const found = devPlanosAula.find((p) => p._id === id);
      if (found) return found;
    }
    const { data } = await api.get(`/turmas/${turmaId}/planos-aula/${id}`);
    return data.data;
  },

  async create(turmaId: string, payload: NovoPlanoAula): Promise<PlanoAula> {
    if (IS_DEV_DATA) {
      return { ...payload, _id: `dev-${Date.now()}`, turmaId, professorId: "dev" };
    }
    const { data } = await api.post(`/turmas/${turmaId}/planos-aula`, payload);
    return data.data;
  },

  async update(
    turmaId: string,
    id: string,
    payload: NovoPlanoAula,
  ): Promise<PlanoAula> {
    if (IS_DEV_DATA) {
      return { ...payload, _id: id, turmaId, professorId: "dev" };
    }
    const { data } = await api.put(`/turmas/${turmaId}/planos-aula/${id}`, payload);
    return data.data;
  },

  async remove(turmaId: string, id: string): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.delete(`/turmas/${turmaId}/planos-aula/${id}`);
  },
};
