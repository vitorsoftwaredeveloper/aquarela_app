import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devEventos } from "./devData";
import { unwrapItem, unwrapList } from "./unwrap";
import type { Evento, FotoDeclarada, FotoOrdem, NovoEvento } from "@/types/evento";

interface ListarEventosFiltros {
  turmaId?: string;
  ano?: number;
  /** Só afeta o modo dev — o backend real já filtra pelo papel do JWT. */
  apenasPublicados?: boolean;
}

let devEventosState: Evento[] = devEventos.map((e) => ({
  ...e,
  fotos: e.fotos.map((f) => ({ ...f })),
}));

function clonarEvento(e: Evento): Evento {
  return { ...e, fotos: e.fotos.map((f) => ({ ...f })) };
}

function encontrarDev(id: string): Evento {
  const encontrado = devEventosState.find((e) => e._id === id);
  if (!encontrado) throw new Error("Evento não encontrado.");
  return clonarEvento(encontrado);
}

/** CRUD do mural de fotos por evento (Épico M). Contrato: docs/03-Backend.md §"Mural de fotos". */
export const EventosService = {
  async list(filtros?: ListarEventosFiltros): Promise<Evento[]> {
    if (IS_DEV_DATA) {
      return devEventosState
        .filter((e) => !filtros?.turmaId || e.turmaId === filtros.turmaId)
        .filter((e) => !filtros?.apenasPublicados || e.publicado)
        .map(clonarEvento);
    }
    const { data } = await api.get("/eventos", {
      params: { turmaId: filtros?.turmaId, ano: filtros?.ano },
    });
    return unwrapList<Evento>(data);
  },

  /** Sem GET por id no backend — busca a lista (já filtrada por turma) e acha em memória. */
  async getById(id: string, turmaId?: string): Promise<Evento> {
    const lista = await EventosService.list({ turmaId });
    const encontrado = lista.find((e) => e._id === id);
    if (!encontrado) throw new Error("Evento não encontrado.");
    return encontrado;
  },

  async create(payload: NovoEvento): Promise<Evento> {
    if (IS_DEV_DATA) {
      const novo: Evento = {
        _id: `dev-evento-${Date.now()}`,
        titulo: payload.titulo,
        descricao: payload.descricao,
        data: payload.data,
        turmaId: payload.turmaId,
        autorId: "dev-professor",
        fotos: [],
        publicado: false,
      };
      devEventosState = [novo, ...devEventosState];
      return clonarEvento(novo);
    }
    const { data } = await api.post("/eventos", payload);
    const evento = unwrapItem<Evento>(data);
    if (!evento) throw new Error("Resposta inesperada ao criar o evento.");
    return evento;
  },

  async update(id: string, payload: Partial<NovoEvento>): Promise<Evento> {
    if (IS_DEV_DATA) {
      devEventosState = devEventosState.map((e) =>
        e._id === id ? { ...e, ...payload } : e,
      );
      return encontrarDev(id);
    }
    const { data } = await api.put(`/eventos/${id}`, payload);
    const evento = unwrapItem<Evento>(data);
    if (!evento) throw new Error("Resposta inesperada ao editar o evento.");
    return evento;
  },

  /** Vincula fotos recém-subidas via `UploadAnexo` (escopo "mural"). */
  async adicionarFotos(id: string, fotos: FotoDeclarada[]): Promise<Evento> {
    if (IS_DEV_DATA) {
      devEventosState = devEventosState.map((e) => {
        if (e._id !== id) return e;
        const ordemInicial = e.fotos.length;
        const novasFotos = fotos.map((f, i) => ({
          ...f,
          ordem: ordemInicial + i,
          enviadoPor: "dev-professor",
          enviadoEm: new Date().toISOString(),
        }));
        return { ...e, fotos: [...e.fotos, ...novasFotos] };
      });
      return encontrarDev(id);
    }
    const { data } = await api.post(`/eventos/${id}/fotos`, { fotos });
    const evento = unwrapItem<Evento>(data);
    if (!evento) throw new Error("Resposta inesperada ao anexar as fotos.");
    return evento;
  },

  /** Reordena e/ou edita a legenda das fotos já vinculadas. */
  async atualizarFotos(id: string, fotos: FotoOrdem[]): Promise<Evento> {
    if (IS_DEV_DATA) {
      devEventosState = devEventosState.map((e) => {
        if (e._id !== id) return e;
        const patchPorKey = new Map(fotos.map((f) => [f.key, f]));
        const atualizadas = [...e.fotos]
          .map((f) => {
            const patch = patchPorKey.get(f.key);
            return patch ? { ...f, legenda: patch.legenda, ordem: patch.ordem } : f;
          })
          .sort((a, b) => a.ordem - b.ordem);
        return { ...e, fotos: atualizadas };
      });
      return encontrarDev(id);
    }
    const { data } = await api.put(`/eventos/${id}/fotos`, { fotos });
    const evento = unwrapItem<Evento>(data);
    if (!evento) throw new Error("Resposta inesperada ao reordenar as fotos.");
    return evento;
  },

  async removerFoto(id: string, fotoKey: string): Promise<void> {
    if (IS_DEV_DATA) {
      devEventosState = devEventosState.map((e) =>
        e._id === id
          ? { ...e, fotos: e.fotos.filter((f) => f.key !== fotoKey) }
          : e,
      );
      return;
    }
    await api.delete(`/eventos/${id}/fotos/${encodeURIComponent(fotoKey)}`);
  },

  /** Idempotente: 2ª chamada não renotifica (`notificado: false`). */
  async publicar(id: string): Promise<Evento & { notificado: boolean }> {
    if (IS_DEV_DATA) {
      let notificado = false;
      devEventosState = devEventosState.map((e) => {
        if (e._id !== id || e.publicadoEm) return e;
        notificado = true;
        return { ...e, publicado: true, publicadoEm: new Date().toISOString() };
      });
      return { ...encontrarDev(id), notificado };
    }
    const { data } = await api.post(`/eventos/${id}/publicar`);
    const evento = unwrapItem<Evento & { notificado: boolean }>(data);
    if (!evento) throw new Error("Resposta inesperada ao publicar o evento.");
    return evento;
  },

  /** Hard delete — remove o evento e todas as fotos no S3. */
  async remove(id: string): Promise<void> {
    if (IS_DEV_DATA) {
      devEventosState = devEventosState.filter((e) => e._id !== id);
      return;
    }
    await api.delete(`/eventos/${id}`);
  },
};
