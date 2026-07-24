/**
 * Desembrulha respostas da API com tolerância a formato.
 *
 * O backend responde `{ data: ... }`, mas nem toda rota segue isso à risca.
 * Antes, `return data.data` cru fazia a tela quebrar quando o formato divergia
 * (ex.: `data.resumo` undefined derrubou o dashboard inteiro). Estes helpers
 * garantem que a UI receba sempre algo utilizável.
 */

/** Lista sempre array — nunca `undefined`, nunca objeto solto. */
export function unwrapList<T>(payload: unknown): T[] {
  const raiz = payload as { data?: unknown } | undefined;
  const corpo = raiz?.data ?? payload;
  return Array.isArray(corpo) ? (corpo as T[]) : [];
}

/** Item único; retorna `null` quando a resposta não traz objeto. */
export function unwrapItem<T>(payload: unknown): T | null {
  const raiz = payload as { data?: unknown } | undefined;
  const corpo = raiz?.data ?? payload;
  return corpo && typeof corpo === "object" ? (corpo as T) : null;
}
