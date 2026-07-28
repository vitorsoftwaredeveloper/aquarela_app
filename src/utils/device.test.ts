import { describe, it, expect } from "vitest";
import {
  detectBrowser,
  detectPlataforma,
  instrucaoReativarNotificacoes,
  isInAppWebview,
  isIOS,
} from "./device";

const UA_IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const UA_ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const UA_DESKTOP_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const UA_DESKTOP_FIREFOX =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15) Gecko/20100101 Firefox/126.0";
const UA_DESKTOP_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const UA_DESKTOP_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0";
const UA_INSTAGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.0.0";
const UA_WHATSAPP_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36 WhatsApp/2.24";

describe("detectPlataforma", () => {
  it("identifica iOS", () => {
    expect(detectPlataforma(UA_IPHONE_SAFARI)).toBe("ios");
  });

  it("identifica Android", () => {
    expect(detectPlataforma(UA_ANDROID_CHROME)).toBe("android");
  });

  it("identifica desktop", () => {
    expect(detectPlataforma(UA_DESKTOP_CHROME)).toBe("desktop");
  });
});

describe("isIOS", () => {
  it("true para iPhone/iPad", () => {
    expect(isIOS(UA_IPHONE_SAFARI)).toBe(true);
  });

  it("false para Android e desktop", () => {
    expect(isIOS(UA_ANDROID_CHROME)).toBe(false);
    expect(isIOS(UA_DESKTOP_CHROME)).toBe(false);
  });
});

describe("detectBrowser", () => {
  it("identifica Chrome", () => {
    expect(detectBrowser(UA_DESKTOP_CHROME)).toBe("chrome");
    expect(detectBrowser(UA_ANDROID_CHROME)).toBe("chrome");
  });

  it("identifica Firefox", () => {
    expect(detectBrowser(UA_DESKTOP_FIREFOX)).toBe("firefox");
  });

  it("identifica Safari", () => {
    expect(detectBrowser(UA_DESKTOP_SAFARI)).toBe("safari");
    expect(detectBrowser(UA_IPHONE_SAFARI)).toBe("safari");
  });

  it("identifica Edge antes de Chrome (mesma engine)", () => {
    expect(detectBrowser(UA_DESKTOP_EDGE)).toBe("edge");
  });
});

describe("instrucaoReativarNotificacoes", () => {
  it("iOS sempre manda pros Ajustes, mesmo em Safari", () => {
    expect(instrucaoReativarNotificacoes(UA_IPHONE_SAFARI)).toContain("Ajustes do iPhone");
  });

  it("varia a instrução por navegador no desktop", () => {
    expect(instrucaoReativarNotificacoes(UA_DESKTOP_CHROME)).toContain("cadeado");
    expect(instrucaoReativarNotificacoes(UA_DESKTOP_FIREFOX)).toContain("Mais informações");
    expect(instrucaoReativarNotificacoes(UA_DESKTOP_SAFARI)).toContain("menu Safari");
    expect(instrucaoReativarNotificacoes(UA_DESKTOP_EDGE)).toContain("cadeado");
  });
});

describe("isInAppWebview", () => {
  it("detecta webview do Instagram", () => {
    expect(isInAppWebview(UA_INSTAGRAM_IOS)).toBe(true);
  });

  it("detecta webview do WhatsApp", () => {
    expect(isInAppWebview(UA_WHATSAPP_ANDROID)).toBe(true);
  });

  it("false pra browser normal", () => {
    expect(isInAppWebview(UA_IPHONE_SAFARI)).toBe(false);
    expect(isInAppWebview(UA_ANDROID_CHROME)).toBe(false);
  });
});
