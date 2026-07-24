import * as yup from "yup";

/** Espelha updateConfigPrecos.schema.ts do serverless. */
const numeroOpcional = yup
  .number()
  .transform((v) => (Number.isNaN(v) ? undefined : v))
  .min(0, "Não pode ser negativo");

export const configPrecosSchema = yup.object({
  planos: yup
    .array()
    .min(1, "Cadastre ao menos um plano")
    .of(
      yup.object({
        nome: yup
          .string()
          .required("Informe o nome")
          .min(2, "Nome muito curto"),
        tipo: yup
          .mixed<"integral" | "meioPeriodo">()
          .oneOf(["integral", "meioPeriodo"], "Selecione o tipo")
          .required("Selecione o tipo"),
        valorMensal: yup
          .number()
          .typeError("Informe um valor")
          .required("Informe o valor mensal")
          .min(0, "Não pode ser negativo"),
        valorDiario: numeroOpcional.optional(),
        descontos: yup
          .array()
          .of(
            yup.object({
              meses: yup
                .number()
                .typeError("Informe os meses")
                .required("Informe os meses")
                .min(1, "Mínimo 1 mês"),
              percentual: yup
                .number()
                .typeError("Informe o %")
                .required("Informe o percentual")
                .min(0, "Mínimo 0")
                .max(100, "Máximo 100"),
            }),
          )
          .optional(),
      }),
    )
    .required(),
});

export type ConfigPrecosFormData = yup.InferType<typeof configPrecosSchema>;
