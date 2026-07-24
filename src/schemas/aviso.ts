import * as yup from "yup";

export const avisoSchema = yup.object({
  titulo: yup
    .string()
    .required("Informe o título")
    .min(3, "Título muito curto"),
  corpo: yup.string().required("Informe o texto").min(5, "Texto muito curto"),
  turmaId: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type AvisoFormData = yup.InferType<typeof avisoSchema>;
