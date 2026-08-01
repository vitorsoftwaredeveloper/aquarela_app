import { storage } from "@/storage/localStorage";

const STORAGE_KEY = "recadosNaoLidos";

type UnreadListener = () => void;
type NovoRecadoListener = (criancaId: string) => void;

let naoLidos = new Set<string>(storage.get<string[]>(STORAGE_KEY) ?? []);
const unreadListeners = new Set<UnreadListener>();
const novoRecadoListeners = new Set<NovoRecadoListener>();

function persistir(): void {
  storage.set(STORAGE_KEY, Array.from(naoLidos));
}

function notificarUnread(): void {
  unreadListeners.forEach((fn) => fn());
}

export const RecadosNaoLidos = {
  snapshot(): Set<string> {
    return naoLidos;
  },

  subscribe(fn: UnreadListener): () => void {
    unreadListeners.add(fn);
    return () => unreadListeners.delete(fn);
  },

  marcarLido(criancaId: string): void {
    if (!naoLidos.has(criancaId)) return;
    naoLidos = new Set(naoLidos);
    naoLidos.delete(criancaId);
    persistir();
    notificarUnread();
  },
};

/**
 * Chamado quando um push de recado chega (foreground). Não há mais rastreio
 * de leitura no backend — "não lida" é só o que o cliente viu chegar e ainda
 * não abriu a thread correspondente.
 */
export function registrarNovoRecadoRecebido(criancaId: string): void {
  if (!naoLidos.has(criancaId)) {
    naoLidos = new Set(naoLidos);
    naoLidos.add(criancaId);
    persistir();
    notificarUnread();
  }
  novoRecadoListeners.forEach((fn) => fn(criancaId));
}

/** Thread aberta escuta aqui pra buscar o delta (`desde`) sem polling. */
export function onNovoRecadoRecebido(fn: NovoRecadoListener): () => void {
  novoRecadoListeners.add(fn);
  return () => novoRecadoListeners.delete(fn);
}
