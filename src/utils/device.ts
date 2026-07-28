export type Plataforma = "ios" | "android" | "web" | "desktop";

/** Detecta a plataforma do dispositivo a partir do user agent (enum do backend, docs §Notificações push). */
export function detectPlataforma(userAgent: string = safeUserAgent()): Plataforma {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/mobi/.test(ua)) return "web";
  return "desktop";
}

/** iOS não expõe `MSStream`, então essa checagem exclui falsos-positivos do IE. */
export function isIOS(userAgent: string = safeUserAgent()): boolean {
  return /iphone|ipad|ipod/i.test(userAgent) && !/windows phone/i.test(userAgent);
}

/**
 * Webview de app (Instagram/Facebook/WhatsApp) — confirmado no spike NOT-00
 * (`docs/06-Backlog.md`) que não expõe `PushManager`, então nem tenta pedir
 * permissão nesses casos.
 */
export function isInAppWebview(userAgent: string = safeUserAgent()): boolean {
  return /instagram|fban|fbav|whatsapp|line\/|micromessenger/i.test(userAgent);
}

/** App instalado (modo standalone) — via media query (Android/desktop) ou `navigator.standalone` (iOS Safari legado). */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    nav.standalone === true
  );
}

function safeUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}
