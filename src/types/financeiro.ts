export type StatusMensalidade = "pago" | "aberto" | "atrasado";

export interface Mensalidade {
  _id: string;
  criancaId: string;
  ano: number;
  mes: number; // 1-12
  mesLabel: string; // "Julho"
  mesShort: string; // "Jul"
  valor: number;
  status: StatusMensalidade;
  pagoEm?: string;
}

/** Cobrança PIX gerada para uma mensalidade. */
export interface Pagamento {
  txid: string;
  pixCopiaECola: string;
  qrBase64?: string;
  status: "pendente" | "pago" | "expirado";
}

export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
