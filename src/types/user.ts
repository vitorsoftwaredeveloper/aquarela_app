/** Papéis do sistema (grupos do Cognito). A criança NÃO é usuária. */
export type Role = "admin" | "professor" | "responsavel";

export interface AppUser {
  /** `sub` do Cognito. */
  id: string;
  email: string;
  name?: string;
  role: Role | null;
  /** `_id` do cadastro em `professores` vinculado (só role=professor). */
  professorId?: string;
}

/** Home padrão por papel — usada nos guards de rota. */
export const HOME_BY_ROLE: Record<Role, string> = {
  admin: "/admin/dashboard",
  professor: "/professor/turmas",
  responsavel: "/inicio",
};
