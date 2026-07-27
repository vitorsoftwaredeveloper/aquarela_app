/** Modelo completo da criança — espelha a coleção `criancas` (docs/04 §3). */

import type { FotoUpload } from "@/utils/imagem";

export type { FotoUpload };

export interface ResponsavelVinculo {
  usuarioId?: string;
  nome: string;
  cpf: string;
  parentesco: string;
  telefone: string;
  email: string;
  podeRetirar: boolean;
}

export interface MedicacaoContinua {
  nome: string;
  dose: string;
  horario: string;
  observacao?: string;
}

export interface SaudeCrianca {
  alergias: string[];
  restricoesAlimentares: string[];
  medicacoesContinuas: MedicacaoContinua[];
  condicoesAtipicas?: string[];
  cuidadosEspeciais?: string;
  observacoes?: string;
}

export interface FinanceiroCrianca {
  valorMensalidade: number;
  diaVencimento: number;
}

export interface CriancaCadastro {
  _id: string;
  nome: string;
  /** ISO date (YYYY-MM-DD). */
  dataNascimento: string;
  cpf: string;
  foto?: string;
  fotoUrl?: string;
  turmaId: string;
  turmaNome?: string;
  responsaveis: ResponsavelVinculo[];
  saude: SaudeCrianca;
  financeiro: FinanceiroCrianca;
  ativo: boolean;
}

export type NovaCrianca = Omit<
  CriancaCadastro,
  "_id" | "ativo" | "turmaNome" | "foto" | "fotoUrl"
> & { foto?: FotoUpload };
export type NovaCriancaPayload = NovaCrianca & { consentimentoLgpd: boolean };

export type CriancaEditavelResponsavel = Partial<
  Omit<NovaCrianca, "cpf" | "turmaId" | "financeiro">
>;

/** Acesso de responsável criado junto com a criança (senha entregue 1x). */
export interface AcessoResponsavel {
  nome: string;
  email: string;
  senhaTemporaria: string;
}

/** Retorno do create: a criança + acessos de responsável recém-criados. */
export interface CriancaCriada {
  crianca: CriancaCadastro;
  acessosResponsaveis: AcessoResponsavel[];
}

export const PARENTESCOS = [
  "Mãe",
  "Pai",
  "Avó",
  "Avô",
  "Tia",
  "Tio",
  "Responsável legal",
  "Outro",
];

/** Idade em anos a partir da data de nascimento (ISO). */
export function idadeEmAnos(dataNascimento: string): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}
