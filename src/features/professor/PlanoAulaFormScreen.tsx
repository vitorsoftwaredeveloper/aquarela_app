"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { TagInput } from "@/features/admin/criancas/TagInput";
import { PlanosAulaService } from "@/services/planosAula";
import { getApiErrorMessage } from "@/services/apiError";
import { planoAulaSchema, type PlanoAulaFormData } from "@/schemas/planoAula";
import styles from "./professor.module.css";

const VAZIO: PlanoAulaFormData = {
  titulo: "",
  descricao: "",
  data: "",
  objetivos: [],
  materiais: [],
};

export function PlanoAulaFormScreen({
  turmaId,
  planoId,
}: {
  turmaId: string;
  planoId?: string;
}) {
  const router = useRouter();
  const isEdit = !!planoId;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanoAulaFormData>({
    resolver: yupResolver(planoAulaSchema),
    defaultValues: VAZIO,
  });

  useEffect(() => {
    if (!planoId) return;
    let cancelled = false;
    PlanosAulaService.getById(turmaId, planoId)
      .then((p) => {
        if (cancelled) return;
        reset({
          titulo: p.titulo,
          descricao: p.descricao,
          data: p.data,
          objetivos: p.objetivos ?? [],
          materiais: p.materiais ?? [],
        });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [turmaId, planoId, reset]);

  function voltar() {
    router.push(`/professor/turmas/${turmaId}/planos-aula`);
  }

  async function onSubmit(values: PlanoAulaFormData) {
    setSubmitError(null);
    try {
      if (isEdit && planoId) {
        await PlanosAulaService.update(turmaId, planoId, values);
      } else {
        await PlanosAulaService.create(turmaId, values);
      }
      voltar();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className={styles.pushHeader}>
        <button className={styles.backBtn} onClick={voltar} aria-label="Voltar">
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>
            {isEdit ? "Editar plano de aula" : "Novo plano de aula"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>
          <span className={styles.spinner} aria-hidden />
          <span>Carregando…</span>
        </div>
      ) : loadError ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{loadError}</p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {submitError && (
            <div className={styles.saveError} role="alert">
              <AlertCircle size={17} /> <span>{submitError}</span>
            </div>
          )}

          <div className={styles.card}>
            <div className={styles.cardHead}>Conteúdo</div>
            <label className={styles.subLabel} htmlFor="titulo">
              Título
            </label>
            <input
              id="titulo"
              className={styles.textarea}
              style={{ minHeight: "auto" }}
              placeholder="Ex.: Cores primárias"
              {...register("titulo")}
            />
            {errors.titulo && (
              <span
                className={styles.cardHint}
                style={{ display: "block", color: "var(--color-danger-strong)" }}
              >
                {errors.titulo.message}
              </span>
            )}

            <label className={styles.subLabel} htmlFor="descricao">
              Descrição
            </label>
            <textarea
              id="descricao"
              className={styles.textarea}
              placeholder="O que será trabalhado na atividade"
              {...register("descricao")}
            />
            {errors.descricao && (
              <span
                className={styles.cardHint}
                style={{ display: "block", color: "var(--color-danger-strong)" }}
              >
                {errors.descricao.message}
              </span>
            )}

            <label className={styles.subLabel} htmlFor="data">
              Data
            </label>
            <input
              id="data"
              type="date"
              className={styles.textarea}
              style={{ minHeight: "auto" }}
              {...register("data")}
            />
            {errors.data && (
              <span
                className={styles.cardHint}
                style={{ display: "block", color: "var(--color-danger-strong)" }}
              >
                {errors.data.message}
              </span>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>Planejamento</div>
            <Controller
              control={control}
              name="objetivos"
              render={({ field }) => (
                <TagInput
                  label="Objetivos"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Ex.: coordenação motora — Enter para adicionar"
                />
              )}
            />
            <Controller
              control={control}
              name="materiais"
              render={({ field }) => (
                <TagInput
                  label="Materiais"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Ex.: tinta guache — Enter para adicionar"
                />
              )}
            />
          </div>

          <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar plano"}
          </button>
        </form>
      )}
    </div>
  );
}
