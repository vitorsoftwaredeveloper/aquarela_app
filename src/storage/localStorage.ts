/**
 * Wrapper seguro de localStorage. Só preferências/rascunhos — NUNCA PII ou
 * dados de saúde de crianças (LGPD). Protegido contra SSR (`window` ausente).
 */
const PREFIX = "@aquarela:";

export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // storage cheio/indisponível — ignora silenciosamente.
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      // ignora
    }
  },
};
