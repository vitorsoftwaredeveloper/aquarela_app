import * as yup from "yup";

export const usuarioSchema = yup.object({
  nome: yup.string().required("Informe o nome").min(2, "Nome muito curto"),
  email: yup.string().required("Informe o e-mail").email("E-mail inválido"),
  telefone: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  papel: yup
    .mixed<"admin" | "professor" | "responsavel">()
    .oneOf(["admin", "professor", "responsavel"], "Selecione um papel")
    .required("Selecione um papel"),
});

export type UsuarioFormData = yup.InferType<typeof usuarioSchema>;

export const redefinirSenhaSchema = yup.object({
  novaSenha: yup
    .string()
    .required("Informe a nova senha")
    .min(8, "Mínimo de 8 caracteres"),
  confirmarSenha: yup
    .string()
    .required("Confirme a nova senha")
    .oneOf([yup.ref("novaSenha")], "As senhas não coincidem"),
});

export type RedefinirSenhaFormData = yup.InferType<typeof redefinirSenhaSchema>;
