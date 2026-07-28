import * as yup from "yup";
import { isValidCPF } from "@/utils/cpf";

export const professorSchema = yup.object({
  nome: yup.string().required("Informe o nome").min(3, "Nome muito curto"),
  cpf: yup
    .string()
    .required("Informe o CPF")
    .test("cpf", "CPF inválido", (v) => isValidCPF(v ?? "")),
  telefone: yup
    .string()
    .required("Informe o telefone")
    .min(8, "Telefone inválido"),
  email: yup.string().required("Informe o e-mail").email("E-mail inválido"),
  formacao: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type ProfessorFormData = yup.InferType<typeof professorSchema>;

/** Edição: backend não aceita trocar usuarioId nem cpf. */
export const editProfessorSchema = yup.object({
  nome: yup.string().required("Informe o nome").min(3, "Nome muito curto"),
  telefone: yup
    .string()
    .required("Informe o telefone")
    .min(8, "Telefone inválido"),
  email: yup.string().required("Informe o e-mail").email("E-mail inválido"),
  formacao: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type EditProfessorFormData = yup.InferType<typeof editProfessorSchema>;

/** Perfil do próprio professor: sem `email` (backend bloqueia trocar o próprio). */
export const meuCadastroProfessorSchema = yup.object({
  nome: yup.string().required("Informe o nome").min(3, "Nome muito curto"),
  telefone: yup
    .string()
    .required("Informe o telefone")
    .min(8, "Telefone inválido"),
  formacao: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type MeuCadastroProfessorFormData = yup.InferType<
  typeof meuCadastroProfessorSchema
>;
