import { describe, it, expect } from "vitest";
import { calcularSimulacao } from "./precos";

describe("calcularSimulacao — modo meses", () => {
  it("aplica desconto semestral (6 meses, 10%)", () => {
    const r = calcularSimulacao("integral", "meses", 6);
    // 1490 * 6 = 8940 · -10% = 8046 · por mês 1341 · economia 894
    expect(r.totalCheio).toBe(8940);
    expect(r.total).toBe(8046);
    expect(r.porUnidade).toBe(1341);
    expect(r.economia).toBe(894);
    expect(r.descontoPct).toBe(0.1);
    expect(r.descontoRotulo).toBe("plano semestral");
  });

  it("sem desconto para 1 mês", () => {
    const r = calcularSimulacao("integral", "meses", 1);
    expect(r.total).toBe(1490);
    expect(r.economia).toBe(0);
    expect(r.descontoRotulo).toBeNull();
  });

  it("desconto anual (12 meses, 15%)", () => {
    const r = calcularSimulacao("integral", "meses", 12);
    expect(r.total).toBe(15198); // 17880 * 0.85
    expect(r.descontoRotulo).toBe("plano anual");
  });

  it("usa o valor do plano meio período", () => {
    const r = calcularSimulacao("meio", "meses", 1);
    expect(r.total).toBe(890);
  });
});

describe("calcularSimulacao — modo dias", () => {
  it("aplica desconto de pacote 10+ dias (5%)", () => {
    const r = calcularSimulacao("meio", "dias", 10);
    // 65 * 10 = 650 · -5% = 618 (arred.) · por dia 62 · economia 32
    expect(r.totalCheio).toBe(650);
    expect(r.total).toBe(618);
    expect(r.porUnidade).toBe(62);
    expect(r.economia).toBe(32);
  });

  it("sem desconto abaixo de 10 dias", () => {
    const r = calcularSimulacao("integral", "dias", 5);
    expect(r.total).toBe(475); // 95 * 5, sem desconto
    expect(r.economia).toBe(0);
  });
});

describe("calcularSimulacao — bordas", () => {
  it("quantidade inválida vira 1", () => {
    const r = calcularSimulacao("integral", "meses", 0);
    expect(r.total).toBe(1490);
  });

  it("quantidade fracionária é truncada", () => {
    const r = calcularSimulacao("integral", "meses", 2.9);
    expect(r.total).toBe(2980); // trata como 2 meses
  });
});
