import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { unwrapItem } from "./unwrap";
import {
  PLANOS_PADRAO,
  type ConfigPrecos,
  type UpdateConfigPrecos,
} from "@/types/configPrecos";

let devConfig: ConfigPrecos = { planos: PLANOS_PADRAO };

/** Configuração de preços do simulador (admin). Contrato: docs/03-Backend §5. */
export const ConfigPrecosService = {
  async get(): Promise<ConfigPrecos> {
    if (IS_DEV_DATA) return devConfig;
    const { data } = await api.get("/config/precos");
    const cfg = unwrapItem<ConfigPrecos>(data);
    // Config ainda não populado → sugere os planos-base para o admin editar.
    if (!cfg || !Array.isArray(cfg.planos) || cfg.planos.length === 0) {
      return { planos: PLANOS_PADRAO };
    }
    return cfg;
  },

  async update(payload: UpdateConfigPrecos): Promise<ConfigPrecos> {
    if (IS_DEV_DATA) {
      devConfig = { planos: payload.planos };
      return devConfig;
    }
    const { data } = await api.put("/config/precos", payload);
    return unwrapItem<ConfigPrecos>(data) ?? payload;
  },
};
