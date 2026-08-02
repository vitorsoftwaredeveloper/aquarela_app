import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import {
  devBalanco,
  devDespesas,
  devInadimplentes,
  devRelatorioAnual,
} from "./devData";
import { unwrapItem } from "./unwrap";
import {
  normalizarBalanco,
  normalizarInadimplentes,
  normalizarRelatorioAnual,
} from "./financeiroNormalize";
import type {
  Balanco,
  Despesa,
  Inadimplente,
  NovaDespesa,
  RelatorioAnual,
  ResultadoDisparoCobrancas,
} from "@/types/financeiroAdmin";
import { FinanceiroService } from "./financeiroService";
import type { Mensalidade } from "@/types/financeiro";

/** Balanço, inadimplentes e despesas (admin). Contrato: docs/03-Backend §5. */
export const FinanceiroAdminService = {
  async getBalanco(
    periodo = String(new Date().getFullYear()),
  ): Promise<Balanco> {
    if (IS_DEV_DATA) return devBalanco();
    const { data } = await api.get("/financeiro/balanco", {
      params: { periodo },
    });
    if (process.env.NODE_ENV !== "production" && !data?.data?.resumo) {
      // Ajuda a alinhar o contrato quando o formato divergir do esperado.
      console.info("[financeiro] payload do balanço:", data);
    }
    return normalizarBalanco(data);
  },

  /** Relatório anual de pagamentos por criança/mês (aba Relatórios). */
  async getRelatorioAnual(
    ano = new Date().getFullYear(),
  ): Promise<RelatorioAnual> {
    if (IS_DEV_DATA) return devRelatorioAnual(ano);
    const { data } = await api.get("/financeiro/relatorio-anual", {
      params: { ano },
    });
    return normalizarRelatorioAnual(data, ano);
  },

  async getInadimplentes(): Promise<Inadimplente[]> {
    if (IS_DEV_DATA) return devInadimplentes;
    const { data } = await api.get("/financeiro/inadimplentes");
    return normalizarInadimplentes(data);
  },

  /** Dispara cobrança por push sob demanda (mesmo motor do cron dos dias 05/20). */
  async dispararCobrancas(
    dryRun: boolean,
  ): Promise<ResultadoDisparoCobrancas> {
    if (IS_DEV_DATA) {
      return {
        dryRun,
        responsaveisNotificados: devInadimplentes.length,
        responsaveisSemToken: 0,
        mensalidadesAtualizadas: dryRun ? 0 : devInadimplentes.length,
      };
    }
    const { data } = await api.post("/financeiro/cobrancas/disparar", {
      dryRun,
    });
    return (
      unwrapItem<ResultadoDisparoCobrancas>(data) ?? {
        dryRun,
        responsaveisNotificados: 0,
        responsaveisSemToken: 0,
        mensalidadesAtualizadas: 0,
      }
    );
  },

  async listDespesas(): Promise<Despesa[]> {
    if (IS_DEV_DATA) return devDespesas;
    const { data } = await api.get("/despesas");
    const lista = data?.data ?? data;
    return Array.isArray(lista) ? lista : [];
  },

  async createDespesa(payload: NovaDespesa): Promise<Despesa> {
    if (IS_DEV_DATA) return { ...payload, _id: `dev-${Date.now()}` };
    const { data } = await api.post("/despesas", payload);
    return data.data;
  },

  async updateDespesa(id: string, payload: NovaDespesa): Promise<Despesa> {
    if (IS_DEV_DATA) return { ...payload, _id: id };
    const { data } = await api.put(`/despesas/${id}`, payload);
    return data.data;
  },

  async removeDespesa(id: string): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.delete(`/despesas/${id}`);
  },

  /** Mensalidades de uma criança (grade de meses) — rota compartilhada com o responsável. */
  async listMensalidades(
    criancaId: string,
    ano?: number,
  ): Promise<Mensalidade[]> {
    return FinanceiroService.listMensalidades(criancaId, ano);
  },

  /**
   * Baixa manual de mensalidade (dinheiro físico recebido pela secretaria).
   * Só admin. Contrato: docs/03-Backend §7.1 (`POST /pagamentos/manual`).
   */
  async registrarPagamentoManual(
    mensalidadeId: string,
    valor: number,
  ): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.post("/pagamentos/manual", { mensalidadeId, valor });
  },
};
