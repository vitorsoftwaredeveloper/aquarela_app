import * as yup from "yup";
import { dataBrParaIso } from "@/utils/dataBr";

export const despesaSchema = yup.object({
  descricao: yup
    .string()
    .required("Informe a descrição")
    .min(3, "Descrição muito curta"),
  categoria: yup.string().required("Selecione a categoria"),
  valor: yup
    .number()
    .typeError("Informe o valor")
    .required("Informe o valor")
    .moreThan(0, "Valor deve ser maior que zero"),
  data: yup
    .string()
    .required("Informe a data")
    .test("formato", "Data inválida (dd/mm/aaaa)", (v) => !!dataBrParaIso(v ?? "")),
});

export type DespesaFormData = yup.InferType<typeof despesaSchema>;
