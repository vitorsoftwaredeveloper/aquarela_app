import { describe, it, expect } from "vitest";
import { unwrapItem, unwrapList } from "./unwrap";

describe("unwrapList", () => {
  it("desembrulha { data: [...] }", () => {
    expect(unwrapList<number>({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });
  it("aceita array na raiz", () => {
    expect(unwrapList<number>([1, 2])).toEqual([1, 2]);
  });
  it("retorna [] quando o corpo é objeto (não lista)", () => {
    expect(unwrapList({ data: { foo: 1 } })).toEqual([]);
    expect(unwrapList({ foo: 1 })).toEqual([]);
  });
  it("retorna [] para undefined/null", () => {
    expect(unwrapList(undefined)).toEqual([]);
    expect(unwrapList(null)).toEqual([]);
  });
});

describe("unwrapItem", () => {
  it("desembrulha { data: {...} }", () => {
    expect(unwrapItem<{ a: number }>({ data: { a: 1 } })).toEqual({ a: 1 });
  });
  it("aceita objeto na raiz", () => {
    expect(unwrapItem<{ a: number }>({ a: 1 })).toEqual({ a: 1 });
  });
  it("retorna null quando não há objeto", () => {
    expect(unwrapItem(undefined)).toBeNull();
    expect(unwrapItem("texto")).toBeNull();
  });
});
