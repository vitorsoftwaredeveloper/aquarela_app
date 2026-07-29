import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import type { Plataforma } from "@/utils/device";

/** Registro de dispositivo (Web Push/FCM). Contrato: docs/03-Backend.md §Notificações push. */
export const DispositivosService = {
  /** Upsert idempotente por token — reenviar não duplica. */
  async registrar(
    token: string,
    plataforma: Plataforma,
    instalado: boolean,
  ): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.post("/dispositivos", { token, plataforma, instalado });
  },

  /** Token de terceiro é no-op silencioso (204) no backend. */
  async remover(token: string): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.delete(`/dispositivos/${token}`);
  },
};
