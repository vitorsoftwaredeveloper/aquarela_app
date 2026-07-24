import * as yup from "yup";

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
  data: yup.string().required("Informe a data"),
});

export type DespesaFormData = yup.InferType<typeof despesaSchema>;
