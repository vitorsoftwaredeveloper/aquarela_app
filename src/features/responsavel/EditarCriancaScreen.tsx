"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Button,
  DateBRInput,
  FotoField,
  Input,
  Select,
  Skeleton,
  Textarea,
} from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { CriancasService } from "@/services/criancas";
import { getApiErrorMessage } from "@/services/apiError";
import { TagInput } from "@/features/admin/criancas/TagInput";
import {
  criancaResponsavelSchema,
  type CriancaResponsavelFormData,
} from "@/schemas/crianca";
import {
  PARENTESCOS,
  idadeEmAnos,
  type CriancaCadastro,
  type CriancaEditavelResponsavel,
} from "@/types/criancaCadastro";
import { maskCPF, maskPhone } from "@/utils/cpf";
import { dataBrParaIso, isoParaDataBr } from "@/utils/dataBr";
import type { FotoUpload } from "@/utils/imagem";
import shell from "./responsavel.module.css";
import styles from "./editarCrianca.module.css";

const RESP_VAZIO = {
  nome: "",
  cpf: "",
  parentesco: "",
  telefone: "",
  email: "",
  podeRetirar: true,
};

export function EditarCriancaScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const { reload: recarregarFilhos } = useResponsavel();
  const crianca = useFetch(
    () => CriancasService.getCadastro(criancaId),
    [criancaId],
  );

  const [foto, setFoto] = useState<FotoUpload | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CriancaResponsavelFormData>({
    resolver: yupResolver(criancaResponsavelSchema),
    defaultValues: {
      nome: "",
      dataNascimento: "",
      responsaveis: [RESP_VAZIO],
      saude: {
        alergias: [],
        restricoesAlimentares: [],
        medicacoesContinuas: [],
        condicoesAtipicas: [],
        cuidadosEspeciais: "",
        observacoes: "",
      },
    },
  });

  useEffect(() => {
    const c = crianca.data as CriancaCadastro | null;
    if (!c) return;
    reset({
      nome: c.nome,
      dataNascimento: isoParaDataBr(c.dataNascimento ?? ""),
      responsaveis: c.responsaveis?.length
        ? c.responsaveis.map((r) => ({
            ...r,
            cpf: maskCPF(r.cpf ?? ""),
            telefone: maskPhone(r.telefone ?? ""),
          }))
        : [RESP_VAZIO],
      saude: {
        alergias: c.saude?.alergias ?? [],
        restricoesAlimentares: c.saude?.restricoesAlimentares ?? [],
        medicacoesContinuas: (c.saude?.medicacoesContinuas ?? []).map((m) => ({
          ...m,
          observacao: m.observacao ?? "",
        })),
        condicoesAtipicas: c.saude?.condicoesAtipicas ?? [],
        cuidadosEspeciais: c.saude?.cuidadosEspeciais ?? "",
        observacoes: c.saude?.observacoes ?? "",
      },
    });
  }, [crianca.data, reset]);

  const responsaveis = useFieldArray({ control, name: "responsaveis" });
  const medicacoes = useFieldArray({
    control,
    name: "saude.medicacoesContinuas",
  });

  const nomeAtual = useWatch({ control, name: "nome" });
  const nascimento = useWatch({ control, name: "dataNascimento" });
  const idade = idadeEmAnos(dataBrParaIso(nascimento ?? ""));

  async function onSubmit(values: CriancaResponsavelFormData) {
    setErro(null);
    setSalvo(false);
    const payload: CriancaEditavelResponsavel = {
      ...values,
      dataNascimento: dataBrParaIso(values.dataNascimento),
      responsaveis: values.responsaveis.map((r) => ({
        ...r,
        cpf: r.cpf.replace(/\D/g, ""),
        telefone: r.telefone.replace(/\D/g, ""),
      })),
      ...(foto ? { foto } : {}),
    };
    try {
      await CriancasService.update(criancaId, payload);
      setFoto(null);
      setFotoPreview(null);
      setSalvo(true);
      recarregarFilhos();
      crianca.reload();
    } catch (err) {
      setErro(getApiErrorMessage(err));
    }
  }

  if (crianca.loading) {
    return (
      <div role="status" aria-label="Carregando…">
        <div className={shell.pushHeader}>
          <Skeleton width={38} height={38} radius={12} />
          <Skeleton width={150} height={16} />
        </div>
        <div className={styles.section}>
          <div className={styles.card}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={46} radius={14} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (crianca.error || !crianca.data) {
    return (
      <div>
        <div className={shell.pushHeader}>
          <button
            className={shell.backBtn}
            onClick={() => router.back()}
            aria-label="Voltar"
          >
            <ChevronLeft size={20} />
          </button>
          <div className={shell.pushTitle}>Editar dados</div>
        </div>
        <div className={shell.state}>
          <p>{crianca.error ?? "Criança não encontrada."}</p>
          <Button variant="secondary" onClick={crianca.reload}>
            Tentar de novo
          </Button>
        </div>
      </div>
    );
  }

  const c = crianca.data as CriancaCadastro;

  return (
    <form className={styles.wrap} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={shell.pushHeader}>
        <button
          type="button"
          className={shell.backBtn}
          onClick={() => router.back()}
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={shell.pushTitle}>Editar dados</div>
          <div className={shell.pushSub}>{c.nome}</div>
        </div>
      </div>

      {erro && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={17} />
          <span>{erro}</span>
        </div>
      )}
      {salvo && (
        <div className={styles.ok} role="status">
          <CheckCircle2 size={16} /> Dados atualizados.
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Foto</div>
        <p className={styles.sectionHint}>
          Aparece para você e para a equipe da escola.
        </p>
        <div className={styles.card}>
          <FotoField
            nome={nomeAtual || c.nome}
            fotoUrl={c.fotoUrl}
            previewUrl={fotoPreview}
            bg="var(--color-primary-soft)"
            label="Foto da criança"
            hint="A imagem é reduzida no aparelho antes do envio. Salve para aplicar."
            onSelect={(f, p) => {
              setFoto(f);
              setFotoPreview(p);
            }}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Criança</div>
        <div className={styles.card}>
          <Input
            label="Nome completo"
            error={errors.nome?.message}
            {...register("nome")}
          />
          <DateBRInput
            label={`Data de nascimento${idade !== null ? ` (${idade} anos)` : ""}`}
            error={errors.dataNascimento?.message}
            {...register("dataNascimento")}
          />
          <div className={styles.readonly}>
            <Lock size={15} className={styles.readonlyIcon} />
            <span>
              CPF, turma e mensalidade só a secretaria altera. Fale com a escola
              se algum deles estiver errado.
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Responsáveis</div>
        <p className={styles.sectionHint}>
          Quem acompanha {c.nome} no app e quem pode retirá-la na escola.
        </p>
        <div className={styles.card}>
          {responsaveis.fields.map((f, i) => (
            <div key={f.id} className={styles.repeat}>
              <div className={styles.repeatHead}>
                <span className={styles.repeatTitle}>Responsável {i + 1}</span>
                {responsaveis.fields.length > 1 && (
                  <button
                    type="button"
                    className={styles.linkDanger}
                    onClick={() => responsaveis.remove(i)}
                  >
                    <Trash2 size={14} /> remover
                  </button>
                )}
              </div>
              <Input
                label="Nome"
                error={errors.responsaveis?.[i]?.nome?.message}
                {...register(`responsaveis.${i}.nome`)}
              />
              <Controller
                control={control}
                name={`responsaveis.${i}.cpf`}
                render={({ field }) => (
                  <Input
                    label="CPF"
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    error={errors.responsaveis?.[i]?.cpf?.message}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(maskCPF(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <Select
                label="Parentesco"
                placeholder="Selecione"
                options={PARENTESCOS.map((p) => ({ value: p, label: p }))}
                error={errors.responsaveis?.[i]?.parentesco?.message}
                {...register(`responsaveis.${i}.parentesco`)}
              />
              <Controller
                control={control}
                name={`responsaveis.${i}.telefone`}
                render={({ field }) => (
                  <Input
                    label="Telefone"
                    placeholder="(11) 90000-0000"
                    inputMode="numeric"
                    error={errors.responsaveis?.[i]?.telefone?.message}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {f.usuarioId ? (
                <div>
                  <Input
                    label="E-mail"
                    type="email"
                    readOnly
                    className={styles.leitura}
                    {...register(`responsaveis.${i}.email`)}
                  />
                  <span className={styles.campoNota}>
                    <Lock size={12} /> É o e-mail de login no app. Para trocar,
                    fale com a escola.
                  </span>
                </div>
              ) : (
                <Input
                  label="E-mail"
                  type="email"
                  error={errors.responsaveis?.[i]?.email?.message}
                  {...register(`responsaveis.${i}.email`)}
                />
              )}
              <label className={styles.check}>
                <input
                  type="checkbox"
                  {...register(`responsaveis.${i}.podeRetirar`)}
                />
                Pode retirar a criança na escola
              </label>
            </div>
          ))}
          <button
            type="button"
            className={styles.addBlock}
            onClick={() => responsaveis.append(RESP_VAZIO)}
          >
            <Plus size={16} /> Adicionar responsável
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Saúde</div>
        <p className={styles.sectionHint}>
          Alergias e medicações aparecem em destaque na agenda diária e para a
          professora.
        </p>
        <div className={styles.card}>
          <Controller
            control={control}
            name="saude.alergias"
            render={({ field }) => (
              <TagInput
                label="Alergias"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Ex.: amendoim — Enter para adicionar"
                alert
                hint="Exibidas com destaque para professores e responsáveis."
              />
            )}
          />
          <Controller
            control={control}
            name="saude.restricoesAlimentares"
            render={({ field }) => (
              <TagInput
                label="Restrições alimentares"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Ex.: sem lactose"
              />
            )}
          />

          {medicacoes.fields.map((f, i) => (
            <div key={f.id} className={styles.repeat}>
              <div className={styles.repeatHead}>
                <span className={styles.repeatTitle}>Medicação {i + 1}</span>
                <button
                  type="button"
                  className={styles.linkDanger}
                  onClick={() => medicacoes.remove(i)}
                >
                  <Trash2 size={14} /> remover
                </button>
              </div>
              <Input
                label="Medicamento"
                error={errors.saude?.medicacoesContinuas?.[i]?.nome?.message}
                {...register(`saude.medicacoesContinuas.${i}.nome`)}
              />
              <Input
                label="Dose"
                error={errors.saude?.medicacoesContinuas?.[i]?.dose?.message}
                {...register(`saude.medicacoesContinuas.${i}.dose`)}
              />
              <Input
                label="Horário"
                type="time"
                error={errors.saude?.medicacoesContinuas?.[i]?.horario?.message}
                {...register(`saude.medicacoesContinuas.${i}.horario`)}
              />
              <Input
                label="Observação (opcional)"
                placeholder="Ex.: só se febre"
                {...register(`saude.medicacoesContinuas.${i}.observacao`)}
              />
            </div>
          ))}
          <button
            type="button"
            className={styles.addBlock}
            onClick={() =>
              medicacoes.append({
                nome: "",
                dose: "",
                horario: "",
                observacao: "",
              })
            }
          >
            <Plus size={16} /> Adicionar medicação
          </button>

          <Controller
            control={control}
            name="saude.condicoesAtipicas"
            render={({ field }) => (
              <TagInput
                label="Condições atípicas (opcional)"
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder="Ex.: TEA"
              />
            )}
          />
          <Textarea
            label="Cuidados especiais (opcional)"
            rows={3}
            placeholder="Orientações para a equipe"
            {...register("saude.cuidadosEspeciais")}
          />
          <Textarea
            label="Observações (opcional)"
            rows={3}
            placeholder="Outras informações de saúde"
            {...register("saude.observacoes")}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
