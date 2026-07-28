import type { FotoUpload } from "@/utils/imagem";

/** Professor(a) — entidade do backend, vinculada a um usuário e a turmas. */
export interface Professor {
  _id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  formacao?: string;
  usuarioId?: string;
  ativo: boolean;
  turmas?: { _id: string; nome: string }[];
  criadoEm?: string;
  fotoUrl?: string | null;
}

/** Payload de criação. Backend cria o usuário (papel=professor) junto — sem usuarioId. */
export interface NovoProfessor {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  formacao?: string;
  foto?: FotoUpload;
}

/** Retorno do create: professor + senha temporária do usuário criado junto (mostrar UMA vez). */
export interface ProfessorCriado extends Professor {
  senhaTemporaria: string;
}

/** Campos editáveis. Backend (updateProfessor) NÃO aceita usuarioId nem cpf. */
export interface EditProfessor {
  nome: string;
  telefone: string;
  email: string;
  formacao?: string;
  foto?: FotoUpload;
}

/** Edição pelo próprio professor (tela Perfil). Backend bloqueia `email` — nem manda o campo. */
export interface EditMeuCadastroProfessor {
  nome: string;
  telefone: string;
  formacao?: string;
  foto?: FotoUpload;
}
