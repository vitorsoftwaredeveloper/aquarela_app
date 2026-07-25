import * as yup from "yup";
import { isValidCPF } from "@/utils/cpf";
import { idadeEmAnos } from "@/types/criancaCadastro";

const cpfField = (label: string) =>
  yup
    .string()
    .required(`Informe o CPF ${label}`)
    .test("cpf", "CPF inválido", (v) => isValidCPF(v ?? ""));

export const criancaSchema = yup.object({
  // ---- 1. Identificação ----
  nome: yup
    .string()
    .required("Informe o nome da criança")
    .min(2, "Nome muito curto"),
  dataNascimento: yup
    .string()
    .required("Informe a data de nascimento")
    .test("faixa", "Idade fora da faixa atendida (0 a 8 anos)", (v) => {
      const anos = idadeEmAnos(v ?? "");
      return anos !== null && anos >= 0 && anos <= 8;
    }),
  cpf: cpfField("da criança"),
  turmaId: yup.string().required("Selecione a turma"),

  // ---- 2. Responsáveis ----
  responsaveis: yup
    .array()
    .of(
      yup.object({
        // Vem do backend quando o responsável já tem acesso ao app. Fica no
        // form só para a tela saber que aquele e-mail é o login dele.
        usuarioId: yup.string().optional(),
        nome: yup.string().required("Informe o nome"),
        cpf: cpfField("do responsável"),
        parentesco: yup.string().required("Informe o parentesco"),
        telefone: yup.string().required("Informe o telefone"),
        email: yup
          .string()
          .required("Informe o e-mail")
          .email("E-mail inválido"),
        podeRetirar: yup.boolean().default(false),
      }),
    )
    .min(1, "Cadastre ao menos um responsável")
    .required(),

  // ---- 3. Saúde ----
  saude: yup.object({
    alergias: yup.array().of(yup.string().required()).default([]),
    restricoesAlimentares: yup.array().of(yup.string().required()).default([]),
    medicacoesContinuas: yup
      .array()
      .of(
        yup.object({
          nome: yup.string().required("Informe o medicamento"),
          dose: yup.string().required("Informe a dose"),
          horario: yup.string().required("Informe o horário"),
          observacao: yup.string().default(""),
        }),
      )
      .default([]),
    condicoesAtipicas: yup.array().of(yup.string().required()).default([]),
    cuidadosEspeciais: yup.string().default(""),
    observacoes: yup.string().default(""),
  }),

  // ---- 4. Financeiro ----
  financeiro: yup.object({
    valorMensalidade: yup
      .number()
      .typeError("Selecione um plano")
      .required("Selecione um plano")
      .min(0, "Valor inválido"),
    diaVencimento: yup
      .number()
      .typeError("Informe o dia de vencimento")
      .required("Informe o dia de vencimento")
      .integer("Use um dia inteiro")
      .min(1, "Entre 1 e 28")
      .max(28, "Entre 1 e 28"),
  }),
});

export type CriancaFormData = yup.InferType<typeof criancaSchema>;

/**
 * Edição pelo responsável: sem `cpf`/`turmaId` (o PUT rejeita) e sem
 * `financeiro` (403 — só o admin muda mensalidade).
 */
export const criancaResponsavelSchema = criancaSchema.omit([
  "cpf",
  "turmaId",
  "financeiro",
]);

export type CriancaResponsavelFormData = yup.InferType<
  typeof criancaResponsavelSchema
>;

/** Campos validados em cada etapa do stepper (para `trigger`). */
export const STEP_FIELDS = [
  ["nome", "dataNascimento", "cpf", "turmaId"],
  ["responsaveis"],
  ["saude"],
  ["financeiro"],
] as const;

export const STEP_LABELS = [
  "Identificação",
  "Responsáveis",
  "Saúde",
  "Financeiro",
];
