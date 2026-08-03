"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { EventosService } from "@/services/eventos";
import { getApiErrorMessage } from "@/services/apiError";
import { eventoSchema, type EventoFormData } from "@/schemas/evento";
import { dataBrParaIso, maskDataBr } from "@/utils/dataBr";
import styles from "./professor.module.css";

const VAZIO: EventoFormData = { titulo: "", descricao: "", data: "" };

export function NovoEventoScreen({ turmaId }: { turmaId: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventoFormData>({
    resolver: yupResolver(eventoSchema),
    defaultValues: VAZIO,
  });
  const dataReg = register("data");

  function voltar() {
    router.push(`/professor/turmas/${turmaId}/mural`);
  }

  async function onSubmit(values: EventoFormData) {
    setSubmitError(null);
    try {
      const evento = await EventosService.create({
        titulo: values.titulo,
        descricao: values.descricao,
        data: dataBrParaIso(values.data),
        turmaId,
      });
      router.push(`/professor/turmas/${turmaId}/mural/${evento._id}`);
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
          <div className={styles.pushTitle}>Novo evento</div>
        </div>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {submitError && (
          <div className={styles.saveError} role="alert">
            <AlertCircle size={17} /> <span>{submitError}</span>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardHead}>Sobre o evento</div>
          <label className={styles.subLabel} htmlFor="titulo">
            Título
          </label>
          <input
            id="titulo"
            className={styles.textarea}
            style={{ minHeight: "auto" }}
            placeholder="Ex.: Festa Junina"
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
            Descrição (opcional)
          </label>
          <textarea
            id="descricao"
            className={styles.textarea}
            placeholder="Detalhes do evento"
            {...register("descricao")}
          />

          <label className={styles.subLabel} htmlFor="data">
            Data
          </label>
          <input
            id="data"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className={styles.textarea}
            style={{ minHeight: "auto" }}
            {...dataReg}
            onChange={(e) => {
              e.target.value = maskDataBr(e.target.value);
              dataReg.onChange(e);
            }}
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

        <button
          type="submit"
          className={styles.saveBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Criando…" : "Criar evento"}
        </button>
      </form>
    </div>
  );
}
