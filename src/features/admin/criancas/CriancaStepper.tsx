"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldPath,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  KeyRound,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Button,
  FotoField,
  Input,
  Modal,
  Select,
  Skeleton,
  Stepper,
} from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { TurmasService } from "@/services/turmas";
import { UsuariosService } from "@/services/usuarios";
import { CriancasAdminService } from "@/services/criancasAdmin";
import { ConfigPrecosService } from "@/services/configPrecosService";
import { getApiErrorMessage } from "@/services/apiError";
import { inferirModo } from "@/features/simulador/precos";
import type { PlanoConfig } from "@/types/configPrecos";
import {
  criancaSchema,
  STEP_FIELDS,
  STEP_LABELS,
  type CriancaFormData,
} from "@/schemas/crianca";
import {
  PARENTESCOS,
  idadeEmAnos,
  type AcessoResponsavel,
  type CriancaCadastro,
  type NovaCrianca,
  type NovaCriancaPayload,
} from "@/types/criancaCadastro";
import { maskCPF, maskPhone } from "@/utils/cpf";
import type { FotoUpload } from "@/utils/imagem";
import { formatBRL } from "@/types/financeiro";
import { TagInput } from "./TagInput";
import { ErrorState } from "../ListState";
import adminStyles from "../admin.module.css";
import styles from "./criancas.module.css";

/**
 * Descobre qual plano (e, se "Diária…", quantos dias) gerou o valor salvo —
 * best-effort, já que o backend só guarda o valor final, não o plano de origem.
 */
function detectarPlano(
  valor: number | undefined,
  lista: PlanoConfig[] | null,
): { nome: string; dias: number } {
  if (!lista || lista.length === 0 || valor === undefined) {
    return { nome: "", dias: 20 };
  }
  const mensal = lista.find(
    (p) => inferirModo(p.nome) === "meses" && p.valorMensal === valor,
  );
  if (mensal) return { nome: mensal.nome, dias: 20 };
  for (const p of lista.filter((p) => inferirModo(p.nome) === "dias")) {
    const diario = p.valorDiario ?? Math.round(p.valorMensal / 30);
    if (diario <= 0) continue;
    const dias = Math.round(valor / diario);
    if (dias >= 1 && dias <= 31 && diario * dias === valor) {
      return { nome: p.nome, dias };
    }
  }
  return { nome: "", dias: 20 };
}

const RESP_VAZIO = {
  nome: "",
  cpf: "",
  parentesco: "",
  telefone: "",
  email: "",
  podeRetirar: true,
};

export function CriancaStepper({ criancaId }: { criancaId?: string }) {
  const router = useRouter();
  const editing = !!criancaId;
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acessos, setAcessos] = useState<AcessoResponsavel[] | null>(null);
  const [foto, setFoto] = useState<FotoUpload | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [removendoFoto, setRemovendoFoto] = useState(false);
  const [consentimento, setConsentimento] = useState(false);
  const [consentimentoError, setConsentimentoError] = useState(false);

  const turmas = useFetch(() => TurmasService.list());
  // Mesma fonte de planos do simulador — mensalidade da criança tem que bater
  // com um plano vigente, nunca um valor digitado à mão. Planos "Diária…"
  // (inferirModo) cobram por dia contratado, não um valor mensal fixo.
  const planos = useFetch(() => ConfigPrecosService.listPlanos());
  const planoOptions = (planos.data ?? []).map((p) => ({
    value: p.nome,
    label:
      inferirModo(p.nome) === "dias"
        ? `${p.nome} — ${formatBRL(p.valorDiario ?? Math.round(p.valorMensal / 30))}/dia`
        : `${p.nome} — ${formatBRL(p.valorMensal)}/mês`,
  }));
  // Usuários responsáveis já cadastrados — para avisar se o e-mail do
  // responsável já tem acesso ao app (o create de criança NÃO cria o acesso).
  const usuariosResp = useFetch(() => UsuariosService.list());
  const emailsComAcesso = new Set(
    (usuariosResp.data ?? [])
      .filter((u) => u.papel === "responsavel" && u.ativo)
      .map((u) => u.email.toLowerCase()),
  );
  const existente = useFetch(
    () =>
      criancaId
        ? CriancasAdminService.getById(criancaId)
        : Promise.resolve(null),
    [criancaId],
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CriancaFormData>({
    resolver: yupResolver(criancaSchema),
    defaultValues: {
      nome: "",
      dataNascimento: "",
      cpf: "",
      turmaId: "",
      responsaveis: [RESP_VAZIO],
      saude: {
        alergias: [],
        restricoesAlimentares: [],
        medicacoesContinuas: [],
        condicoesAtipicas: [],
        cuidadosEspeciais: "",
        observacoes: "",
      },
      financeiro: { diaVencimento: 5 },
    },
  });

  // Preenche o formulário ao editar.
  useEffect(() => {
    const c = existente.data as CriancaCadastro | null;
    if (!c) return;
    reset({
      nome: c.nome,
      dataNascimento: c.dataNascimento?.slice(0, 10) ?? "",
      cpf: maskCPF(c.cpf ?? ""),
      turmaId: c.turmaId ?? "",
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
      financeiro: {
        valorMensalidade: c.financeiro?.valorMensalidade,
        diaVencimento: c.financeiro?.diaVencimento ?? 5,
      },
    });
  }, [existente.data, reset]);

  // Derivado (sem efeito): a escolha manual do admin vive em `overridePlano`
  // e tem prioridade sobre o valor detectado a partir do que já foi salvo.
  const planoDetectado = detectarPlano(
    (existente.data as CriancaCadastro | null)?.financeiro?.valorMensalidade,
    planos.data,
  );

  const [overridePlano, setOverridePlano] = useState<{
    nome: string;
    dias: number;
  } | null>(null);
  const planoNome = overridePlano?.nome ?? planoDetectado.nome;
  const diasContratados = overridePlano?.dias ?? planoDetectado.dias;
  const planoSelecionado = (planos.data ?? []).find(
    (p) => p.nome === planoNome,
  );
  const modoPlano = planoNome ? inferirModo(planoNome) : null;

  function selecionarPlano(nome: string) {
    const plano = (planos.data ?? []).find((p) => p.nome === nome);
    setOverridePlano({ nome, dias: diasContratados });
    if (!plano) return;
    if (inferirModo(nome) === "meses") {
      setValue("financeiro.valorMensalidade", plano.valorMensal, {
        shouldValidate: true,
      });
    } else {
      const diario = plano.valorDiario ?? Math.round(plano.valorMensal / 30);
      setValue(
        "financeiro.valorMensalidade",
        Math.round(diario * diasContratados),
        { shouldValidate: true },
      );
    }
  }

  function alterarDias(dias: number) {
    const d = Math.max(1, Math.min(31, Math.floor(dias) || 1));
    setOverridePlano({ nome: planoNome, dias: d });
    if (!planoSelecionado) return;
    const diario =
      planoSelecionado.valorDiario ??
      Math.round(planoSelecionado.valorMensal / 30);
    setValue("financeiro.valorMensalidade", Math.round(diario * d), {
      shouldValidate: true,
    });
  }

  const responsaveis = useFieldArray({ control, name: "responsaveis" });
  const medicacoes = useFieldArray({
    control,
    name: "saude.medicacoesContinuas",
  });

  const turmaOptions = (turmas.data ?? []).map((t) => ({
    value: t._id,
    label: t.nome,
  }));

  async function avancar() {
    const campos = STEP_FIELDS[step] as unknown as FieldPath<CriancaFormData>[];
    if (await trigger(campos)) setStep((s) => s + 1);
  }

  async function onSubmit(values: CriancaFormData) {
    setSubmitError(null);
    if (!editing && !consentimento) {
      setConsentimentoError(true);
      return;
    }
    const responsaveis = values.responsaveis.map((r) => ({
      ...r,
      cpf: r.cpf.replace(/\D/g, ""),
      telefone: r.telefone.replace(/\D/g, ""),
    }));

    try {
      if (editing && criancaId) {
        // cpf e turmaId são imutáveis via PUT (o backend rejeita o corpo
        // inteiro se vierem) — turma muda por endpoint dedicado (PATCH .../turma).
        const { cpf: _cpf, turmaId, ...resto } = values;
        void _cpf;
        await CriancasAdminService.update(criancaId, {
          ...resto,
          responsaveis,
          ...(foto ? { foto } : {}),
        } as unknown as Omit<NovaCrianca, "cpf" | "turmaId">);

        if (turmaId && turmaId !== existente.data?.turmaId) {
          await CriancasAdminService.moverTurma(criancaId, turmaId);
        }
      } else {
        const payload = {
          ...values,
          cpf: values.cpf.replace(/\D/g, ""),
          responsaveis,
          consentimentoLgpd: consentimento,
          ...(foto ? { foto } : {}),
        } as unknown as NovaCriancaPayload;
        const { acessosResponsaveis } =
          await CriancasAdminService.create(payload);
        // Acessos novos → mostra as senhas temporárias antes de sair.
        if (acessosResponsaveis.length > 0) {
          setAcessos(acessosResponsaveis);
          return;
        }
      }
      router.push("/admin/criancas");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  async function removerFoto() {
    if (!criancaId) return;
    setRemovendoFoto(true);
    setSubmitError(null);
    try {
      await CriancasAdminService.removerFoto(criancaId);
      setFoto(null);
      setFotoPreview(null);
      existente.reload();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setRemovendoFoto(false);
    }
  }

  const nascimento = useWatch({ control, name: "dataNascimento" });
  const idade = idadeEmAnos(nascimento ?? "");
  const nomeAtual = useWatch({ control, name: "nome" });
  const fotoAtual = (existente.data as CriancaCadastro | null)?.fotoUrl;

  return (
    <div className={styles.wizard}>
      <div className={adminStyles.pageHead}>
        <div>
          <h1 className={adminStyles.pageTitle}>
            {editing ? "Editar criança" : "Nova criança"}
          </h1>
          <p className={adminStyles.pageSub}>
            Preencha as etapas — os dados de saúde ficam em destaque para a
            equipe.
          </p>
        </div>
      </div>

      {editing && existente.loading ? (
        <div className={styles.stepperWrap} style={{ marginBottom: 0 }}>
          <div className={styles.stepCard}>
            <Skeleton width={140} height={18} style={{ marginBottom: 18 }} />
            <div className={styles.fields}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton
                    width="30%"
                    height={11}
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton
                    width="100%"
                    height={44}
                    radius="var(--radius-md)"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : editing && existente.error ? (
        <div className={styles.stepCard}>
          <ErrorState message={existente.error} onRetry={existente.reload} />
        </div>
      ) : (
        <>
          <div className={styles.stepperWrap}>
            <Stepper steps={STEP_LABELS} current={step} onStepClick={setStep} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.stepCard}>
              {submitError && (
                <div className={styles.alert} role="alert">
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* ---------- 1. Identificação ---------- */}
              {step === 0 && (
                <>
                  <div className={styles.stepTitle}>Identificação</div>
                  <p className={styles.stepHint}>
                    Dados básicos da criança e a turma em que ela será
                    matriculada.
                  </p>
                  <div className={styles.fields}>
                    <FotoField
                      nome={nomeAtual || "Criança"}
                      fotoUrl={fotoAtual}
                      previewUrl={fotoPreview}
                      bg="var(--color-primary-soft)"
                      hint="Opcional. A imagem é reduzida no navegador antes do envio."
                      removendo={removendoFoto}
                      onSelect={(f, p) => {
                        setFoto(f);
                        setFotoPreview(p);
                      }}
                      onRemove={editing ? removerFoto : undefined}
                    />
                    <Input
                      label="Nome completo"
                      placeholder="Ex.: Lorena Souza"
                      error={errors.nome?.message}
                      {...register("nome")}
                    />
                    <div className={styles.grid2}>
                      <Input
                        label={`Data de nascimento${idade !== null ? ` (${idade} anos)` : ""}`}
                        type="date"
                        error={errors.dataNascimento?.message}
                        {...register("dataNascimento")}
                      />
                      <Controller
                        control={control}
                        name="cpf"
                        render={({ field }) => (
                          <Input
                            label="CPF"
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                            error={errors.cpf?.message}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(maskCPF(e.target.value))
                            }
                            onBlur={field.onBlur}
                          />
                        )}
                      />
                    </div>
                    <Select
                      label="Turma"
                      placeholder={
                        turmas.loading ? "Carregando…" : "Selecione a turma"
                      }
                      options={turmaOptions}
                      disabled={turmas.loading}
                      error={errors.turmaId?.message}
                      {...register("turmaId")}
                    />
                  </div>
                </>
              )}

              {/* ---------- 2. Responsáveis ---------- */}
              {step === 1 && (
                <>
                  <div className={styles.stepTitle}>Responsáveis</div>
                  <p className={styles.stepHint}>
                    Quem acompanha a criança no app e quem pode retirá-la na
                    escola.
                  </p>
                  <div className={styles.fields}>
                    {responsaveis.fields.map((f, i) => (
                      <div key={f.id} className={styles.repeatBlock}>
                        <div className={styles.repeatHead}>
                          <span className={styles.repeatTitle}>
                            Responsável {i + 1}
                          </span>
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
                          placeholder="Nome completo"
                          error={errors.responsaveis?.[i]?.nome?.message}
                          {...register(`responsaveis.${i}.nome`)}
                        />
                        <div className={styles.grid2}>
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
                                onChange={(e) =>
                                  field.onChange(maskCPF(e.target.value))
                                }
                                onBlur={field.onBlur}
                              />
                            )}
                          />
                          <Select
                            label="Parentesco"
                            placeholder="Selecione"
                            options={PARENTESCOS.map((p) => ({
                              value: p,
                              label: p,
                            }))}
                            error={
                              errors.responsaveis?.[i]?.parentesco?.message
                            }
                            {...register(`responsaveis.${i}.parentesco`)}
                          />
                        </div>
                        <div className={styles.grid2}>
                          <Controller
                            control={control}
                            name={`responsaveis.${i}.telefone`}
                            render={({ field }) => (
                              <Input
                                label="Telefone"
                                placeholder="(11) 90000-0000"
                                inputMode="numeric"
                                error={
                                  errors.responsaveis?.[i]?.telefone?.message
                                }
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(maskPhone(e.target.value))
                                }
                                onBlur={field.onBlur}
                              />
                            )}
                          />
                          <div>
                            <Input
                              label="E-mail (acesso ao app)"
                              type="email"
                              placeholder="responsavel@email.com"
                              error={errors.responsaveis?.[i]?.email?.message}
                              {...register(`responsaveis.${i}.email`)}
                            />
                            <EmailAcessoStatus
                              control={control}
                              name={`responsaveis.${i}.email`}
                              emails={emailsComAcesso}
                              loading={usuariosResp.loading}
                            />
                          </div>
                        </div>
                        <label className={styles.check}>
                          <input
                            type="checkbox"
                            {...register(`responsaveis.${i}.podeRetirar`)}
                          />
                          Pode retirar a criança na escola
                        </label>
                      </div>
                    ))}
                    {typeof errors.responsaveis?.message === "string" && (
                      <span
                        style={{ fontSize: 12, color: "var(--color-danger)" }}
                      >
                        {errors.responsaveis.message}
                      </span>
                    )}
                    <button
                      type="button"
                      className={styles.addBlock}
                      onClick={() => responsaveis.append(RESP_VAZIO)}
                    >
                      <Plus size={16} /> Adicionar responsável
                    </button>
                  </div>
                </>
              )}

              {/* ---------- 3. Saúde ---------- */}
              {step === 2 && (
                <>
                  <div className={styles.stepTitle}>Saúde</div>
                  <p className={styles.stepHint}>
                    Alergias e medicações aparecem em destaque na agenda diária
                    e na lista da turma.
                  </p>
                  <div className={styles.fields}>
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

                    <div>
                      <span className={styles.tagLabel}>
                        Medicações contínuas
                      </span>
                      <div
                        className={styles.fields}
                        style={{ marginTop: 8, gap: 12 }}
                      >
                        {medicacoes.fields.map((f, i) => (
                          <div key={f.id} className={styles.repeatBlock}>
                            <div className={styles.repeatHead}>
                              <span className={styles.repeatTitle}>
                                Medicação {i + 1}
                              </span>
                              <button
                                type="button"
                                className={styles.linkDanger}
                                onClick={() => medicacoes.remove(i)}
                              >
                                <Trash2 size={14} /> remover
                              </button>
                            </div>
                            <div className={styles.grid2}>
                              <Input
                                label="Medicamento"
                                placeholder="Ex.: Dipirona"
                                error={
                                  errors.saude?.medicacoesContinuas?.[i]?.nome
                                    ?.message
                                }
                                {...register(
                                  `saude.medicacoesContinuas.${i}.nome`,
                                )}
                              />
                              <Input
                                label="Dose"
                                placeholder="Ex.: 10 gotas"
                                error={
                                  errors.saude?.medicacoesContinuas?.[i]?.dose
                                    ?.message
                                }
                                {...register(
                                  `saude.medicacoesContinuas.${i}.dose`,
                                )}
                              />
                            </div>
                            <div className={styles.grid2}>
                              <Input
                                label="Horário"
                                type="time"
                                error={
                                  errors.saude?.medicacoesContinuas?.[i]
                                    ?.horario?.message
                                }
                                {...register(
                                  `saude.medicacoesContinuas.${i}.horario`,
                                )}
                              />
                              <Input
                                label="Observação (opcional)"
                                placeholder="Ex.: só se febre"
                                {...register(
                                  `saude.medicacoesContinuas.${i}.observacao`,
                                )}
                              />
                            </div>
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
                      </div>
                    </div>

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
                    <Input
                      label="Cuidados especiais (opcional)"
                      placeholder="Orientações para a equipe"
                      {...register("saude.cuidadosEspeciais")}
                    />
                    <Input
                      label="Observações (opcional)"
                      placeholder="Outras informações de saúde"
                      {...register("saude.observacoes")}
                    />
                  </div>
                </>
              )}

              {/* ---------- 4. Financeiro ---------- */}
              {step === 3 && (
                <>
                  <div className={styles.stepTitle}>Financeiro</div>
                  <p className={styles.stepHint}>
                    Valor e vencimento usados para gerar as mensalidades.
                  </p>
                  <div className={styles.fields}>
                    {(() => {
                      const selectPlano = (
                        <Select
                          label="Plano"
                          placeholder={
                            planos.loading
                              ? "Carregando planos…"
                              : "Selecione o plano"
                          }
                          options={planoOptions}
                          disabled={planos.loading}
                          error={errors.financeiro?.valorMensalidade?.message}
                          value={planoNome}
                          onChange={(e) => selecionarPlano(e.target.value)}
                        />
                      );
                      const inputVencimento = (
                        <Input
                          label="Dia do vencimento"
                          type="number"
                          min={1}
                          max={28}
                          placeholder="5"
                          error={errors.financeiro?.diaVencimento?.message}
                          {...register("financeiro.diaVencimento", {
                            valueAsNumber: true,
                          })}
                        />
                      );
                      return modoPlano === "dias" ? (
                        <>
                          {selectPlano}
                          <div className={styles.grid2}>
                            <Input
                              label="Dias contratados por mês"
                              type="number"
                              min={1}
                              max={31}
                              value={diasContratados}
                              onChange={(e) =>
                                alterarDias(Number(e.target.value))
                              }
                            />
                            {inputVencimento}
                          </div>
                        </>
                      ) : (
                        <div className={styles.grid2}>
                          {selectPlano}
                          {inputVencimento}
                        </div>
                      );
                    })()}
                    <Resumo
                      control={control}
                      turmaOptions={turmaOptions}
                      planoSelecionado={planoSelecionado}
                      diasContratados={diasContratados}
                    />
                    {!editing && (
                      <div className={styles.consentBox}>
                        <label className={styles.check}>
                          <input
                            type="checkbox"
                            checked={consentimento}
                            onChange={(e) => {
                              setConsentimento(e.target.checked);
                              if (e.target.checked)
                                setConsentimentoError(false);
                            }}
                          />
                          Os responsáveis autorizam o tratamento dos dados desta
                          criança (inclusive dados de saúde) pela Aquarela Kids,
                          conforme a LGPD.
                        </label>
                        {consentimentoError && (
                          <span className={styles.consentError} role="alert">
                            Confirme o consentimento para cadastrar a criança.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ---------- Navegação ---------- */}
              <div className={styles.nav}>
                {step > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ArrowLeft size={16} /> Voltar
                  </Button>
                )}
                <div className={styles.navRight}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/admin/criancas")}
                  >
                    Cancelar
                  </Button>
                  {step < STEP_LABELS.length - 1 ? (
                    <Button key="nav-continuar" type="button" onClick={avancar}>
                      Continuar <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button
                      key="nav-salvar"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Salvando…"
                        : editing
                          ? "Salvar alterações"
                          : "Cadastrar criança"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </>
      )}

      <AcessosResponsavelModal
        acessos={acessos}
        onClose={() => {
          setAcessos(null);
          router.push("/admin/criancas");
        }}
      />
    </div>
  );
}

/**
 * Mostra as senhas temporárias dos acessos de responsável criados junto com a
 * criança (entregues UMA vez ao admin). Fechar segue para a lista de crianças.
 */
function AcessosResponsavelModal({
  acessos,
  onClose,
}: {
  acessos: AcessoResponsavel[] | null;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(a: AcessoResponsavel) {
    const texto = [
      "Aquarela Kids — dados de acesso",
      `E-mail: ${a.email}`,
      `Senha temporária: ${a.senhaTemporaria}`,
      "Troque a senha no primeiro login.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(a.email);
    } catch {
      /* clipboard indisponível — copiar manualmente do campo */
    }
  }

  return (
    <Modal
      open={!!acessos && acessos.length > 0}
      onClose={onClose}
      title="Acesso dos responsáveis criado"
      footer={
        <Button variant="primary" onClick={onClose}>
          Entendi, já anotei
        </Button>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
        Foi criado um acesso ao app para {acessos?.length === 1 ? "o" : "os"}{" "}
        responsável{acessos && acessos.length > 1 ? "is" : ""} abaixo. Repasse a
        senha — no primeiro login o sistema pede a troca.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {(acessos ?? []).map((a) => (
          <div
            key={a.email}
            style={{
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: "var(--color-primary-soft)",
              border: "1px solid var(--color-primary-soft-border)",
            }}
          >
            <div
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
            >
              {a.nome}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}
            >
              {a.email}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: 8,
              }}
            >
              <code
                style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}
              >
                {a.senhaTemporaria}
              </code>
              <button
                type="button"
                onClick={() => copiar(a)}
                aria-label={`Copiar acesso de ${a.nome}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  background: "none",
                  border: "1px solid var(--color-primary-soft-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-primary-link)",
                  fontSize: 13,
                  padding: "6px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                {copiado === a.email ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <Copy size={15} />
                )}
                {copiado === a.email ? "Copiado" : "Copiar tudo"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          marginTop: 14,
          color: "var(--color-warning)",
          fontSize: 13,
        }}
      >
        <KeyRound size={17} />
        <span>
          As senhas aparecem só agora e não ficam salvas. Se perder, use
          &quot;Esqueci minha senha&quot; após o primeiro acesso.
        </span>
      </div>
    </Modal>
  );
}

/** Resumo final antes de salvar. */
function Resumo({
  control,
  turmaOptions,
  planoSelecionado,
  diasContratados,
}: {
  control: Control<CriancaFormData>;
  turmaOptions: { value: string; label: string }[];
  planoSelecionado?: PlanoConfig;
  diasContratados: number;
}) {
  const nome = useWatch({ control, name: "nome" });
  const turmaId = useWatch({ control, name: "turmaId" });
  const resp = useWatch({ control, name: "responsaveis" }) ?? [];
  const alergias = useWatch({ control, name: "saude.alergias" }) ?? [];
  const valor = useWatch({ control, name: "financeiro.valorMensalidade" });
  const dia = useWatch({ control, name: "financeiro.diaVencimento" });
  const turma = turmaOptions.find((t) => t.value === turmaId)?.label ?? "—";
  const temValor = typeof valor === "number" && !Number.isNaN(valor);
  const plano = planoSelecionado
    ? inferirModo(planoSelecionado.nome) === "dias"
      ? `${planoSelecionado.nome} — ${diasContratados} dias/mês`
      : planoSelecionado.nome
    : null;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryRow}>
        <span className={styles.summaryKey}>Criança</span>
        <span className={styles.summaryVal}>{nome || "—"}</span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryKey}>Turma</span>
        <span className={styles.summaryVal}>{turma}</span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryKey}>Responsáveis</span>
        <span className={styles.summaryVal}>
          {resp.filter((r) => r?.nome).length || 0}
        </span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryKey}>Alergias</span>
        <span className={styles.summaryVal}>
          {alergias.length ? alergias.join(", ") : "nenhuma"}
        </span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryKey}>Plano</span>
        <span className={styles.summaryVal}>
          {plano ? `${plano} · vence dia ${dia ?? "—"}` : "—"}
        </span>
      </div>
      <div className={styles.summaryRow}>
        <span className={styles.summaryKey}>Total mensal</span>
        <span className={styles.summaryVal}>
          {temValor ? formatBRL(valor) : "—"}
        </span>
      </div>
    </div>
  );
}

/**
 * Avisa se o e-mail do responsável já corresponde a um usuário responsável
 * ativo (acesso ao app existente). É informativo: o cadastro da criança não
 * cria o acesso — um usuário papel=responsavel precisa existir para o pai logar.
 */
function EmailAcessoStatus({
  control,
  name,
  emails,
  loading,
}: {
  control: Control<CriancaFormData>;
  name: FieldPath<CriancaFormData>;
  emails: Set<string>;
  loading: boolean;
}) {
  const value = useWatch({ control, name }) as string | undefined;
  const email = (value ?? "").trim().toLowerCase();
  const pareceEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!pareceEmail || loading) return null;

  const temAcesso = emails.has(email);
  const cor = temAcesso ? "var(--color-primary-link)" : "var(--color-warning)";
  const Icon = temAcesso ? CheckCircle2 : AlertCircle;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 6,
        fontSize: 12.5,
        color: cor,
      }}
      role="status"
    >
      <Icon size={15} />
      <span>
        {temAcesso
          ? "E-mail já tem acesso ao app (usuário responsável cadastrado)."
          : "E-mail ainda sem acesso — cadastre um usuário responsável para o pai poder entrar."}
      </span>
    </div>
  );
}
