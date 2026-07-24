import { api } from "./api";
import { unwrapList } from "./unwrap";
import type {
  EditProfessor,
  NovoProfessor,
  Professor,
  ProfessorCriado,
} from "@/types/professor";

/** CRUD de professores (admin). Contrato: docs/03-Backend.md §5. */
export const ProfessoresService = {
  async list(): Promise<Professor[]> {
    const { data } = await api.get("/professores");
    return unwrapList<Professor>(data);
  },

  async getById(id: string): Promise<Professor> {
    const { data } = await api.get(`/professores/${id}`);
    return data.data;
  },

  /** Cria o usuário (papel=professor) e o professor juntos. Retorna `senhaTemporaria` (mostrar UMA vez). */
  async create(payload: NovoProfessor): Promise<ProfessorCriado> {
    const { data } = await api.post("/professores", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<EditProfessor>): Promise<Professor> {
    const { data } = await api.put(`/professores/${id}`, payload);
    return data.data;
  },

  /** Soft delete. Backend bloqueia (409) se houver turma vinculada. */
  async remove(id: string): Promise<void> {
    await api.delete(`/professores/${id}`);
  },
};
