import { publicApi } from "./api";
import {
  calcularSimulacao,
  type Modo,
  type PlanoId,
  type ResultadoSimulacao,
} from "@/features/simulador/precos";

/**
 * Simulação de mensalidade (rota pública). Tenta o backend
 * (`GET /simulador?meses=&plano=`) e cai no cálculo local quando o
 * `configPrecos` ainda não está populado — comportamento previsto na doc.
 *
 * A API é sondada **no máximo uma vez por carregamento**. O estado é marcado de
 * forma síncrona (antes do await): sem isso, o efeito duplicado do StrictMode e
 * os cliques rápidos nos controles disparavam várias requisições perdidas em
 * paralelo — todas partiam antes da primeira falhar.
 */
type EstadoApi = "desconhecido" | "sondando" | "disponivel" | "indisponivel";

let estado: EstadoApi = "desconhecido";

export const SimuladorService = {
  async calcular(
    plano: PlanoId,
    modo: Modo,
    quantidade: number,
  ): Promise<ResultadoSimulacao> {
    const local = calcularSimulacao(plano, modo, quantidade);

    // O contrato atual só cobre o modo "meses".
    if (modo !== "meses") return local;
    // Já sabemos que não responde, ou há uma sondagem em voo: usa o local.
    if (estado === "indisponivel" || estado === "sondando") return local;

    // Marca ANTES do await — fecha a janela de corrida.
    if (estado === "desconhecido") estado = "sondando";

    try {
      const { data } = await publicApi.get("/simulador", {
        params: { plano, meses: quantidade },
      });
      const r = data?.data ?? data;
      if (typeof r?.total === "number") {
        estado = "disponivel";
        return {
          porUnidade: r.valorMensal ?? Math.round(r.total / quantidade),
          total: r.total,
          totalCheio: r.totalCheio ?? local.totalCheio,
          economia: r.economia ?? Math.max(0, (r.totalCheio ?? 0) - r.total),
          descontoPct: r.descontoPct ?? local.descontoPct,
          descontoRotulo: r.descontoRotulo ?? local.descontoRotulo,
        };
      }
      // Respondeu, mas fora do formato esperado.
      estado = "indisponivel";
      return local;
    } catch {
      // Backend ainda sem tabela de preços — usa a referência local.
      estado = "indisponivel";
      return local;
    }
  },
};
