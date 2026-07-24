import { describe, it, expect } from "vitest";
import { isValidCPF, maskCPF, maskPhone, onlyDigits } from "./cpf";

describe("isValidCPF", () => {
  it("aceita CPFs válidos (com e sem máscara)", () => {
    expect(isValidCPF("390.533.447-05")).toBe(true);
    expect(isValidCPF("39053344705")).toBe(true);
    expect(isValidCPF("111.444.777-35")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCPF("390.533.447-00")).toBe(false);
    expect(isValidCPF("12345678900")).toBe(false);
  });

  it("rejeita sequências repetidas", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("00000000000")).toBe(false);
  });

  it("rejeita tamanho incorreto ou vazio", () => {
    expect(isValidCPF("")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("390533447050")).toBe(false);
  });
});

describe("maskCPF", () => {
  it("formata progressivamente", () => {
    expect(maskCPF("390")).toBe("390");
    expect(maskCPF("390533")).toBe("390.533");
    expect(maskCPF("390533447")).toBe("390.533.447");
    expect(maskCPF("39053344705")).toBe("390.533.447-05");
  });

  it("ignora não-dígitos e trunca em 11", () => {
    expect(maskCPF("abc39053344705999")).toBe("390.533.447-05");
  });
});

describe("maskPhone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(maskPhone("11991234567")).toBe("(11) 99123-4567");
  });
  it("formata fixo com 10 dígitos", () => {
    expect(maskPhone("1140001234")).toBe("(11) 4000-1234");
  });
});

describe("onlyDigits", () => {
  it("remove tudo que não for número", () => {
    expect(onlyDigits("(11) 99123-4567")).toBe("11991234567");
    expect(onlyDigits("")).toBe("");
  });
});
