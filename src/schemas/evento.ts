import * as yup from "yup";
import { dataBrParaIso } from "@/utils/dataBr";

export const eventoSchema = yup.object({
  titulo: yup
    .string()
    .required("Informe o título")
    .min(3, "Título muito curto"),
  descricao: yup.string().optional(),
  data: yup
    .string()
    .required("Informe a data")
    .test("formato", "Data inválida (dd/mm/aaaa)", (v) => !!dataBrParaIso(v ?? "")),
});

export type EventoFormData = yup.InferType<typeof eventoSchema>;
