import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devTurmas } from "./devData";
import { unwrapList } from "./unwrap";
import type { NovaTurma, Turma } from "@/types/turma";

/** CRUD de turmas (admin). Contrato: docs/03-Backend.md §5. */
export const TurmasService = {
  async list(): Promise<Turma[]> {
    if (IS_DEV_DATA) return devTurmas;
    const { data } = await api.get("/turmas");
    return unwrapList<Turma>(data);
  },

  async getById(id: string): Promise<Turma> {
    const { data } = await api.get(`/turmas/${id}`);
    return data.data;
  },

  async create(payload: NovaTurma): Promise<Turma> {
    const { data } = await api.post("/turmas", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<NovaTurma>): Promise<Turma> {
    const { data } = await api.put(`/turmas/${id}`, payload);
    return data.data;
  },

  /** Soft delete. Backend bloqueia (409) se a turma tiver crianças ativas. */
  async remove(id: string): Promise<void> {
    await api.delete(`/turmas/${id}`);
  },
};
