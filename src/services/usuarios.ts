import { api } from "./api";
import { unwrapList } from "./unwrap";
import type {
  EditUsuario,
  NovoUsuario,
  Usuario,
  UsuarioCriado,
} from "@/types/usuario";

/** CRUD de usuários (admin). Contrato: docs/03-Backend.md §5. */
export const UsuariosService = {
  async list(): Promise<Usuario[]> {
    const { data } = await api.get("/usuarios");
    return unwrapList<Usuario>(data);
  },

  async getById(id: string): Promise<Usuario> {
    const { data } = await api.get(`/usuarios/${id}`);
    return data.data;
  },

  /** Retorna o usuário + `senhaTemporaria` (mostrar UMA vez ao admin). */
  async create(payload: NovoUsuario): Promise<UsuarioCriado> {
    const { data } = await api.post("/usuarios", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<EditUsuario>): Promise<Usuario> {
    const { data } = await api.put(`/usuarios/${id}`, payload);
    return data.data;
  },

  /** Remoção DEFINITIVA: apaga do banco e do Cognito (hard delete). */
  async remove(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  },
};
