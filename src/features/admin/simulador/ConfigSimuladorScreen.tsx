"use client";

import { useState } from "react";
import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { Button, Input, Select, Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { ConfigPrecosService } from "@/services/configPrecosService";
import { getApiErrorMessage } from "@/services/apiError";
import {
  configPrecosSchema,
  type ConfigPrecosFormData,
} from "@/schemas/configPrecos";
import { PLANOS_PADRAO, type PlanoConfig } from "@/types/configPrecos";
import { ErrorState } from "../ListState";
import admin from "../admin.module.css";
import styles from "./configSimulador.module.css";

const TIPO_OPTIONS = [
  { value: "integral", label: "Integral" },
  { value: "meioPeriodo", label: "Meio período" },
];

/** Divisor usado para converter mensal ↔ diária (dias úteis/mês). */
const DIAS_UTEIS_MES = 22;

function arredonda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Backend usa null; o form usa undefined. Normaliza ao carregar. */
function toFormPlanos(planos: PlanoConfig[]): ConfigPrecosFormData["planos"] {
  return planos.map((p) => ({
    nome: p.nome,
    tipo: p.tipo,
    valorMensal: p.valorMensal,
    valorDiario: p.valorDiario ?? undefined,
    descontos: p.descontos ?? [],
  }));
}

const PLANO_VAZIO = {
  nome: "",
  tipo: "integral" as const,
  valorMensal: 0,
  valorDiario: undefined,
  descontos: [] as { meses: number; percentual: number }[],
};

export function ConfigSimuladorScreen() {
  const { data, loading, error, reload } = useFetch(() =>
    ConfigPrecosService.get(),
  );

  return (
    <div className={admin.page}>
      <div className={admin.pageHead}>
        <div>
          <h1 className={admin.pageTitle}>Valores do simulador</h1>
          <p className={admin.pageSub}>
            Planos, mensalidades e descontos progressivos usados no simulador
            público e no cálculo de mensalidade.
          </p>
        </div>
      </div>

      {loading && !data ? (
        <ConfigSimuladorSkeleton />
      ) : error ? (
        <div className={admin.card}>
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <ConfigForm
          initial={toFormPlanos(data?.planos ?? PLANOS_PADRAO)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function ConfigSimuladorSkeleton() {
  return (
    <div className={styles.planos} role="status" aria-label="Carregando…">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className={styles.planoCard}>
          <div className={styles.planoHead}>
            <Skeleton width={90} height={26} radius="var(--radius-sm)" />
          </div>
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, f) => (
              <div key={f}>
                <Skeleton
                  width="40%"
                  height={11}
                  style={{ marginBottom: 8 }}
                />
                <Skeleton width="100%" height={44} radius="var(--radius-md)" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigForm({
  initial,
  onSaved,
}: {
  initial: ConfigPrecosFormData["planos"];
  onSaved: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConfigPrecosFormData>({
    resolver: yupResolver(configPrecosSchema),
    defaultValues: { planos: initial },
  });
  const planos = useFieldArray({ control, name: "planos" });

  async function onSubmit(values: ConfigPrecosFormData) {
    setSubmitError(null);
    setSaved(false);
    try {
      await ConfigPrecosService.update({
        planos: values.planos.map((p) => ({
          nome: p.nome,
          tipo: p.tipo,
          valorMensal: p.valorMensal,
          valorDiario: p.valorDiario ?? null,
          descontos: p.descontos ?? [],
        })),
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {submitError && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={17} /> <span>{submitError}</span>
        </div>
      )}

      <div className={styles.planos}>
        {planos.fields.map((field, i) => (
          <PlanoCard
            key={field.id}
            index={i}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            onRemove={
              planos.fields.length > 1 ? () => planos.remove(i) : undefined
            }
          />
        ))}
      </div>

      {typeof errors.planos?.message === "string" && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={17} /> <span>{errors.planos.message}</span>
        </div>
      )}

      <button
        type="button"
        className={styles.addPlano}
        onClick={() => planos.append(PLANO_VAZIO)}
      >
        <Plus size={16} /> Adicionar plano
      </button>

      <div className={styles.footer}>
        {saved && (
          <span className={styles.saved}>
            <Check size={16} /> Salvo
          </span>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar valores"}
        </Button>
      </div>
    </form>
  );
}

function PlanoCard({
  index,
  control,
  register,
  setValue,
  errors,
  onRemove,
}: {
  index: number;
  control: Control<ConfigPrecosFormData>;
  register: UseFormRegister<ConfigPrecosFormData>;
  setValue: UseFormSetValue<ConfigPrecosFormData>;
  errors: import("react-hook-form").FieldErrors<ConfigPrecosFormData>;
  onRemove?: () => void;
}) {
  const descontos = useFieldArray({
    control,
    name: `planos.${index}.descontos` as const,
  });
  const err = errors.planos?.[index];

  return (
    <div className={styles.planoCard}>
      <div className={styles.planoHead}>
        <span className={styles.planoBadge}>Plano {index + 1}</span>
        {onRemove && (
          <button
            type="button"
            className={styles.removePlano}
            onClick={onRemove}
            aria-label={`Remover plano ${index + 1}`}
          >
            <Trash2 size={15} /> remover plano
          </button>
        )}
      </div>

      <div className={styles.grid}>
        <Input
          label="Nome"
          placeholder="Ex.: Integral"
          error={err?.nome?.message}
          {...register(`planos.${index}.nome`)}
        />
        <Select
          label="Tipo"
          options={TIPO_OPTIONS}
          error={err?.tipo?.message}
          {...register(`planos.${index}.tipo`)}
        />
        <Input
          label="Valor mensal (R$)"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          error={err?.valorMensal?.message}
          {...register(`planos.${index}.valorMensal`, {
            valueAsNumber: true,
            onChange: (e) => {
              const valor = Number(e.target.value);
              if (!Number.isFinite(valor)) return;
              setValue(
                `planos.${index}.valorDiario`,
                arredonda(valor / DIAS_UTEIS_MES),
                { shouldDirty: true },
              );
            },
          })}
        />
        <Input
          label="Valor diário (R$) — opcional"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          error={err?.valorDiario?.message}
          {...register(`planos.${index}.valorDiario`, {
            valueAsNumber: true,
            onChange: (e) => {
              const valor = Number(e.target.value);
              if (!Number.isFinite(valor)) return;
              setValue(
                `planos.${index}.valorMensal`,
                arredonda(valor * DIAS_UTEIS_MES),
                { shouldDirty: true },
              );
            },
          })}
        />
      </div>

      <div className={styles.descontos}>
        <div className={styles.descontosHead}>
          <span className={styles.descontosTitle}>
            Descontos progressivos por período
          </span>
        </div>
        {descontos.fields.length === 0 && (
          <p className={styles.descontosEmpty}>Sem descontos neste plano.</p>
        )}
        {descontos.fields.map((f, di) => (
          <div key={f.id} className={styles.descontoRow}>
            <Input
              label="A partir de (meses)"
              type="number"
              min="1"
              placeholder="1"
              error={err?.descontos?.[di]?.meses?.message}
              {...register(`planos.${index}.descontos.${di}.meses`, {
                valueAsNumber: true,
              })}
            />
            <Input
              label="Desconto (%)"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              error={err?.descontos?.[di]?.percentual?.message}
              {...register(`planos.${index}.descontos.${di}.percentual`, {
                valueAsNumber: true,
              })}
            />
            <button
              type="button"
              className={styles.removeDesconto}
              onClick={() => descontos.remove(di)}
              aria-label="Remover desconto"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addDesconto}
          onClick={() => descontos.append({ meses: 1, percentual: 0 })}
        >
          <Plus size={15} /> Adicionar desconto
        </button>
      </div>
    </div>
  );
}
