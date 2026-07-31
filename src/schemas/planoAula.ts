import * as yup from "yup";
import { dataBrParaIso } from "@/utils/dataBr";

export const planoAulaSchema = yup.object({
  titulo: yup
    .string()
    .required("Informe o título")
    .min(3, "Título muito curto"),
  descricao: yup
    .string()
    .required("Informe a descrição")
    .min(3, "Descrição muito curta"),
  data: yup
    .string()
    .required("Informe a data")
    .test("formato", "Data inválida (dd/mm/aaaa)", (v) => !!dataBrParaIso(v ?? "")),
  objetivos: yup.array().of(yup.string().required()).default([]),
  materiais: yup.array().of(yup.string().required()).default([]),
});

export type PlanoAulaFormData = yup.InferType<typeof planoAulaSchema>;
