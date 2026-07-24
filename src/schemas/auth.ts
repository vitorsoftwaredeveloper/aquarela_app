import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup.string().required("Informe seu e-mail").email("E-mail inválido"),
  password: yup.string().required("Informe sua senha"),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

/** Regra de senha nova (challenge de primeiro acesso / redefinição). */
const strongPassword = yup
  .string()
  .required("Crie uma senha")
  .min(8, "Mínimo de 8 caracteres");

export const newPasswordSchema = yup.object({
  password: strongPassword,
  confirm: yup
    .string()
    .required("Confirme a senha")
    .oneOf([yup.ref("password")], "As senhas não conferem"),
});

export type NewPasswordFormData = yup.InferType<typeof newPasswordSchema>;

export const forgotRequestSchema = yup.object({
  email: yup.string().required("Informe seu e-mail").email("E-mail inválido"),
});

export type ForgotRequestFormData = yup.InferType<typeof forgotRequestSchema>;

export const forgotConfirmSchema = yup.object({
  code: yup.string().required("Informe o código enviado por e-mail"),
  password: strongPassword,
  confirm: yup
    .string()
    .required("Confirme a senha")
    .oneOf([yup.ref("password")], "As senhas não conferem"),
});

export type ForgotConfirmFormData = yup.InferType<typeof forgotConfirmSchema>;
