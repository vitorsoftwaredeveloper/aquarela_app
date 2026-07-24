import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devAvisos } from "./devData";
import { unwrapItem, unwrapList } from "./unwrap";
import { toAviso, type AvisoRaw } from "./agendaService";
import type { Aviso, NovoAviso } from "@/types/agenda";

/**
 * CRUD de avisos/mural (admin). Leitura do responsável fica em
 * `AgendaService.getAvisos` — mesma rota, escopo filtrado pelo backend.
 * Contrato: docs/03-Backend.md §5 "Avisos (mural)".
 */
export const AvisosAdminService = {
  async list(): Promise<Aviso[]> {
    if (IS_DEV_DATA) return devAvisos;
    const { data } = await api.get("/avisos");
    return unwrapList<AvisoRaw>(data).map(toAviso);
  },

  async create(payload: NovoAviso): Promise<Aviso> {
    if (IS_DEV_DATA) {
      return { ...payload, id: `dev-${Date.now()}`, dataLabel: "Hoje" };
    }
    const { data } = await api.post("/avisos", payload);
    const raw = unwrapItem<AvisoRaw>(data);
    if (!raw) throw new Error("Resposta inesperada ao publicar o aviso.");
    return toAviso(raw);
  },

  async update(id: string, payload: NovoAviso): Promise<Aviso> {
    if (IS_DEV_DATA) return { ...payload, id, dataLabel: "Hoje" };
    const { data } = await api.put(`/avisos/${id}`, payload);
    const raw = unwrapItem<AvisoRaw>(data);
    if (!raw) throw new Error("Resposta inesperada ao atualizar o aviso.");
    return toAviso(raw);
  },

  /** Soft delete. */
  async remove(id: string): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.delete(`/avisos/${id}`);
  },
};
