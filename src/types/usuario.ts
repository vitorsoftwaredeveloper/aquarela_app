import type { Role } from "./user";

/** Usuário do sistema (admin/professor/responsavel) — entidade do backend. */
export interface Usuario {
  _id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: Role;
  cognitoSub?: string;
  criadoEm?: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  telefone?: string;
  papel: Role;
}

/** Retorno do create: usuário + senha temporária (entregue UMA vez ao admin). */
export interface UsuarioCriado extends Usuario {
  senhaTemporaria: string;
}

/** Campos editáveis (update). */
export interface EditUsuario {
  nome: string;
  telefone?: string;
  papel: Role;
}

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administração" },
  { value: "professor", label: "Professor(a)" },
  { value: "responsavel", label: "Responsável" },
];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administração",
  professor: "Professor(a)",
  responsavel: "Responsável",
};
