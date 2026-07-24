import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devPlanosAula } from "./devData";
import { unwrapList } from "./unwrap";
import type { NovoPlanoAula, PlanoAula } from "@/types/planoAula";

/**
 * CRUD de planos de aula. Rota real é `/planosAula` (não sub-recurso de
 * turma): list filtra por `?turmaId=`, create/update levam `turmaId` no body.
 * Sem GET por id no backend — `getById` busca na lista e filtra em memória.
 */
export const PlanosAulaService = {
  async list(turmaId: string): Promise<PlanoAula[]> {
    if (IS_DEV_DATA) {
      return devPlanosAula.filter((p) => p.turmaId === turmaId);
    }
    const { data } = await api.get("/planosAula", { params: { turmaId } });
    return unwrapList<PlanoAula>(data);
  },

  async getById(turmaId: string, id: string): Promise<PlanoAula> {
    if (IS_DEV_DATA) {
      const found = devPlanosAula.find((p) => p._id === id);
      if (found) return found;
    }
    const planos = await this.list(turmaId);
    const found = planos.find((p) => p._id === id);
    if (!found) throw new Error("Plano de aula não encontrado.");
    return found;
  },

  async create(turmaId: string, payload: NovoPlanoAula): Promise<PlanoAula> {
    if (IS_DEV_DATA) {
      return {
        ...payload,
        _id: `dev-${Date.now()}`,
        turmaId,
        professorId: "dev",
      };
    }
    const { data } = await api.post("/planosAula", { ...payload, turmaId });
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
    const { data } = await api.put(`/planosAula/${id}`, {
      ...payload,
      turmaId,
    });
    return data.data;
  },

  async remove(turmaId: string, id: string): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.delete(`/planosAula/${id}`);
  },
};
