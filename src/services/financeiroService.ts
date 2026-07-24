import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devMensalidades } from "./devData";
import { unwrapList } from "./unwrap";
import type { Mensalidade, Pagamento } from "@/types/financeiro";

const MESES: [string, string][] = [
  ["Janeiro", "Jan"],
  ["Fevereiro", "Fev"],
  ["Março", "Mar"],
  ["Abril", "Abr"],
  ["Maio", "Mai"],
  ["Junho", "Jun"],
  ["Julho", "Jul"],
  ["Agosto", "Ago"],
  ["Setembro", "Set"],
  ["Outubro", "Out"],
  ["Novembro", "Nov"],
  ["Dezembro", "Dez"],
];

/** O backend devolve só `mes` (1-12) — deriva os rótulos que a UI usa. */
function normalizarMensalidade(raw: Omit<Mensalidade, "mesLabel" | "mesShort">): Mensalidade {
  const [mesLabel, mesShort] = MESES[raw.mes - 1] ?? ["", ""];
  return { ...raw, mesLabel, mesShort };
}

// Colapsa chamadas concorrentes de `criarPagamento` para a mesma mensalidade
// numa única request. O modal dispara a cobrança dentro de um `useEffect`; em
// StrictMode (dev) o effect roda mount → unmount → mount, então o POST sai
// duas vezes quase junto e o backend gera duas cobranças PIX. Escopo de módulo
// sobrevive ao remount do StrictMode; a promise é limpa ao concluir.
const cobrancaEmVoo = new Map<string, Promise<Pagamento>>();

/** Mensalidades e pagamentos PIX (responsável). Contrato: §5 e §7. */
export const FinanceiroService = {
  async listMensalidades(criancaId: string, ano = 2026): Promise<Mensalidade[]> {
    if (IS_DEV_DATA) return devMensalidades(criancaId);
    const { data } = await api.get("/mensalidades", {
      params: { criancaId, ano },
    });
    return unwrapList<Omit<Mensalidade, "mesLabel" | "mesShort">>(data).map(
      normalizarMensalidade,
    );
  },

  /** Gera a cobrança PIX (copia-e-cola + txid). */
  async criarPagamento(mensalidadeId: string): Promise<Pagamento> {
    if (IS_DEV_DATA) {
      return {
        txid: `dev-${mensalidadeId}-${Date.now()}`,
        pixCopiaECola:
          "00020126580014BR.GOV.BCB.PIX0136aquarela-kids-demo-txid-0000000005204000053039865802BR5910AquarelaKid6009SAO PAULO62070503***6304AB12",
        status: "pendente",
      };
    }
    const emVoo = cobrancaEmVoo.get(mensalidadeId);
    if (emVoo) return emVoo;

    const req = api
      .post("/pagamentos", { mensalidadeId })
      .then(({ data }) => data.data as Pagamento)
      .finally(() => cobrancaEmVoo.delete(mensalidadeId));

    cobrancaEmVoo.set(mensalidadeId, req);
    return req;
  },

  /** Consulta status do pagamento (polling até "pago"). */
  async getPagamento(txid: string): Promise<Pagamento> {
    const { data } = await api.get(`/pagamentos/${txid}`);
    return data.data;
  },
};
