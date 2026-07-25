import { describe, expect, it } from "vitest";
import { dimensionarPara, tamanhoBase64 } from "./imagem";

describe("tamanhoBase64", () => {
  it("ignora o padding ao medir os bytes decodificados", () => {
    expect(tamanhoBase64(btoa("a"))).toBe(1);
    expect(tamanhoBase64(btoa("ab"))).toBe(2);
    expect(tamanhoBase64(btoa("abc"))).toBe(3);
  });

  it("mede uma string longa dentro de 1 byte do tamanho real", () => {
    const bruto = "x".repeat(5000);
    expect(tamanhoBase64(btoa(bruto))).toBe(5000);
  });
});

describe("dimensionarPara", () => {
  it("não amplia imagem menor que o lado máximo", () => {
    expect(dimensionarPara(320, 240, 800)).toEqual({
      largura: 320,
      altura: 240,
    });
  });

  it("reduz pelo maior lado preservando a proporção", () => {
    expect(dimensionarPara(4000, 3000, 800)).toEqual({
      largura: 800,
      altura: 600,
    });
    expect(dimensionarPara(3000, 4000, 800)).toEqual({
      largura: 600,
      altura: 800,
    });
  });

  it("nunca devolve lado zero em imagens muito estreitas", () => {
    expect(dimensionarPara(4000, 3, 800).altura).toBe(1);
  });
});
