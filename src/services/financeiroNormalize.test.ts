import { describe, it, expect } from "vitest";
import { normalizarBalanco, normalizarInadimplentes } from "./financeiroNormalize";

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
      meses: [{ ano: 2026, mes: 7, mesLabel: "Jul", entradas: 100, despesas: 40 }],
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
});

describe("normalizarInadimplentes", () => {
  it("agrupa por criança o formato real da API: uma linha por mensalidade atrasada", () => {
    const lista = normalizarInadimplentes({
      data: [
        {
          mensalidade: { _id: "m1", criancaId: "c1", ano: 2026, mes: 5, valor: 890, status: "atrasado" },
          crianca: { _id: "c1", nome: "Lorena Souza", responsaveis: [{ nome: "Marina Souza", telefone: "(11) 99000-0000" }] },
        },
        {
          mensalidade: { _id: "m2", criancaId: "c1", ano: 2026, mes: 6, valor: 890, status: "atrasado" },
          crianca: { _id: "c1", nome: "Lorena Souza", responsaveis: [{ nome: "Marina Souza", telefone: "(11) 99000-0000" }] },
        },
      ],
    });
    expect(lista).toHaveLength(1);
    expect(lista[0].criancaNome).toBe("Lorena Souza");
    expect(lista[0].mesesEmAtraso).toBe(2);
    expect(lista[0].valorTotal).toBe(1780);
    expect(lista[0].responsavelContato).toBe("(11) 99000-0000");
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
