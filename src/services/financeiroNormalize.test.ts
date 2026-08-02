import { describe, it, expect } from "vitest";
import {
  normalizarBalanco,
  normalizarInadimplentes,
  normalizarRelatorioAnual,
} from "./financeiroNormalize";

describe("normalizarBalanco", () => {
  it("passa o formato esperado { resumo, meses }", () => {
    const b = normalizarBalanco({
      resumo: {
        entradasMes: 42300,
        despesasMes: 18900,
        inadimplentes: 4,
        criancasAtivas: 58,
        turmas: 6,
      },
      meses: [
        { ano: 2026, mes: 7, mesLabel: "Jul", entradas: 100, despesas: 40 },
      ],
    });
    expect(b.resumo.entradasMes).toBe(42300);
    expect(b.meses).toHaveLength(1);
    expect(b.meses[0].entradas).toBe(100);
  });

  it("desembrulha { data: {...} }", () => {
    const b = normalizarBalanco({ data: { resumo: { entradasMes: 10 } } });
    expect(b.resumo.entradasMes).toBe(10);
  });

  it("lê campos no nível raiz e nomes alternativos", () => {
    const b = normalizarBalanco({
      entradas: 200,
      despesas: 80,
      meses: [{ mes: 1, receitas: 55, saidas: 20 }],
    });
    expect(b.resumo.entradasMes).toBe(200);
    expect(b.resumo.despesasMes).toBe(80);
    expect(b.meses[0].entradas).toBe(55); // de "receitas"
    expect(b.meses[0].despesas).toBe(20); // de "saidas"
    expect(b.meses[0].mesLabel).toBe("Jan"); // derivado do número do mês
  });

  it("NÃO quebra com payload inesperado (regressão do crash do dashboard)", () => {
    const b = normalizarBalanco({ formatoInesperado: true });
    expect(b.resumo.entradasMes).toBe(0);
    expect(b.resumo.inadimplentes).toBe(0);
    expect(b.meses).toEqual([]);
  });

  it("NÃO quebra com undefined/null", () => {
    expect(normalizarBalanco(undefined).resumo.entradasMes).toBe(0);
    expect(normalizarBalanco(null).meses).toEqual([]);
  });

  it("ignora meses que não são array", () => {
    const b = normalizarBalanco({ resumo: {}, meses: "oops" });
    expect(b.meses).toEqual([]);
  });

  it("deriva resumo do mês atual quando a API devolve o array de meses direto em data (sem envelope resumo)", () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    const b = normalizarBalanco({
      data: [
        { ano: anoAtual, mes: mesAtual, entradas: 1, despesas: 0, saldo: 1 },
        { ano: anoAtual, mes: (mesAtual % 12) + 1, entradas: 5, despesas: 2 },
      ],
    });
    expect(b.meses).toHaveLength(2);
    expect(b.resumo.entradasMes).toBe(1);
    expect(b.resumo.despesasMes).toBe(0);
  });
});

describe("normalizarInadimplentes", () => {
  it("agrupa por criança o formato real da API: uma linha por mensalidade atrasada", () => {
    const lista = normalizarInadimplentes({
      data: [
        {
          mensalidade: {
            _id: "m1",
            criancaId: "c1",
            ano: 2026,
            mes: 5,
            valor: 890,
            status: "atrasado",
          },
          crianca: {
            _id: "c1",
            nome: "Lorena Souza",
            responsaveis: [
              { nome: "Marina Souza", telefone: "(11) 99000-0000" },
            ],
          },
        },
        {
          mensalidade: {
            _id: "m2",
            criancaId: "c1",
            ano: 2026,
            mes: 6,
            valor: 890,
            status: "atrasado",
          },
          crianca: {
            _id: "c1",
            nome: "Lorena Souza",
            responsaveis: [
              { nome: "Marina Souza", telefone: "(11) 99000-0000" },
            ],
          },
        },
      ],
    });
    expect(lista).toHaveLength(1);
    expect(lista[0].criancaNome).toBe("Lorena Souza");
    expect(lista[0].mesesEmAtraso).toBe(2);
    expect(lista[0].valorTotal).toBe(1780);
    expect(lista[0].responsavelContato).toBe("(11) 99000-0000");
  });

  it("extrai inadimplenteDesde como a menor data entre as competências do mesmo filho", () => {
    const lista = normalizarInadimplentes({
      data: [
        {
          mensalidade: {
            _id: "m1",
            criancaId: "c1",
            valor: 890,
            inadimplenteDesde: "2026-10-10T03:00:00.000Z",
          },
          crianca: { _id: "c1", nome: "Lorena Souza", responsaveis: [] },
        },
        {
          mensalidade: {
            _id: "m2",
            criancaId: "c1",
            valor: 890,
            inadimplenteDesde: "2026-09-10T03:00:00.000Z",
          },
          crianca: { _id: "c1", nome: "Lorena Souza", responsaveis: [] },
        },
      ],
    });
    expect(lista[0].inadimplenteDesde).toBe("2026-09-10T03:00:00.000Z");
  });

  it("NÃO quebra quando a resposta já vem no formato antigo (flat, sem mensalidade/crianca)", () => {
    const lista = normalizarInadimplentes({
      data: [{ criancaId: "c9" }],
    });
    expect(lista).toHaveLength(1);
    expect(lista[0].valorTotal).toBe(0);
  });

  it("NÃO quebra com payload inesperado (regressão do crash de toLocaleString)", () => {
    expect(normalizarInadimplentes(undefined)).toEqual([]);
    expect(normalizarInadimplentes({ formatoInesperado: true })).toEqual([]);
    expect(normalizarInadimplentes({ data: "oops" })).toEqual([]);
  });
});

describe("normalizarRelatorioAnual", () => {
  it("completa os 12 meses quando a API manda só os meses com movimento", () => {
    const relatorio = normalizarRelatorioAnual(
      { data: { ano: 2025, meses: [{ mes: 3, pagamentos: 900, despesas: 400 }] } },
      2025,
    );
    expect(relatorio.meses).toHaveLength(12);
    expect(relatorio.meses[2]).toEqual({
      mes: 3,
      pagamentos: 900,
      despesas: 400,
      saldo: 500,
      quantidadePagamentos: 0,
    });
    expect(relatorio.meses[0].pagamentos).toBe(0);
  });

  it("preserva o saldo que a API mandou em vez de recalcular", () => {
    const relatorio = normalizarRelatorioAnual(
      { data: { meses: [{ mes: 1, pagamentos: 100, despesas: 40, saldo: 55 }] } },
      2025,
    );
    expect(relatorio.meses[0].saldo).toBe(55);
  });

  it("marca origem consolidado só quando a API diz isso", () => {
    expect(
      normalizarRelatorioAnual({ data: { origem: "consolidado" } }, 2025).origem,
    ).toBe("consolidado");
    expect(normalizarRelatorioAnual({ data: {} }, 2025).origem).toBe(
      "calculado",
    );
  });

  it("cai no ano pedido e numa lista de anos usável quando a API omite", () => {
    const relatorio = normalizarRelatorioAnual({ data: {} }, 2024);
    expect(relatorio.ano).toBe(2024);
    expect(relatorio.anosDisponiveis).toEqual([2024]);
  });

  it("NÃO quebra com payload inesperado", () => {
    const relatorio = normalizarRelatorioAnual(undefined, 2025);
    expect(relatorio.criancas).toEqual([]);
    expect(relatorio.meses).toHaveLength(12);
    expect(relatorio.totais.pagamentos).toBe(0);
  });
});
