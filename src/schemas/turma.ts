import * as yup from "yup";

export const turmaSchema = yup.object({
  nome: yup.string().required("Informe o nome").min(2, "Nome muito curto"),
  descricao: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  idadeMin: yup
    .number()
    .typeError("Informe a idade mínima")
    .required("Informe a idade mínima")
    .integer("Use anos inteiros")
    .min(0, "Mínimo 0")
    .max(12, "Máximo 12"),
  idadeMax: yup
    .number()
    .typeError("Informe a idade máxima")
    .required("Informe a idade máxima")
    .integer("Use anos inteiros")
    .max(12, "Máximo 12")
    .min(yup.ref("idadeMin"), "Deve ser ≥ idade mínima"),
  professorIds: yup
    .array()
    .of(yup.string().required())
    .min(1, "Selecione ao menos uma professora")
    .required("Selecione ao menos uma professora"),
});

export type TurmaFormData = yup.InferType<typeof turmaSchema>;
