"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, Check, ChevronLeft, Lock } from "lucide-react";
import { FotoField, Skeleton } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { ProfessorService } from "@/services/professorService";
import { getApiErrorMessage } from "@/services/apiError";
import {
  meuCadastroProfessorSchema,
  type MeuCadastroProfessorFormData,
} from "@/schemas/professor";
import { maskPhone, onlyDigits } from "@/utils/cpf";
import type { FotoUpload } from "@/utils/imagem";
import styles from "./professor.module.css";

/** T-12: professor edita o próprio cadastro (nome, telefone, formação) — nunca o e-mail. */
export function EditarDadosProfessorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const professorId = user?.professorId;
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [foto, setFoto] = useState<FotoUpload | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const {
    data: professor,
    loading,
    error: loadError,
    reload: recarregarProfessor,
  } = useFetch(
    () =>
      professorId
        ? ProfessorService.getMeuCadastro(professorId)
        : Promise.resolve(null),
    [professorId],
  );

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MeuCadastroProfessorFormData>({
    resolver: yupResolver(meuCadastroProfessorSchema),
    defaultValues: { nome: "", telefone: "", formacao: "" },
  });

  const nomeAtual = useWatch({ control, name: "nome" });

  useEffect(() => {
    if (!professor) return;
    reset({
      nome: professor.nome,
      telefone: maskPhone(professor.telefone ?? ""),
      formacao: professor.formacao ?? "",
    });
  }, [professor, reset]);

  async function onSubmit(values: MeuCadastroProfessorFormData) {
    if (!professorId) return;
    setSubmitError(null);
    setSaved(false);
    try {
      await ProfessorService.atualizarMeuCadastro(professorId, {
        nome: values.nome,
        telefone: onlyDigits(values.telefone),
        formacao: values.formacao,
        ...(foto ? { foto } : {}),
      });
      setFoto(null);
      setFotoPreview(null);
      reset(values);
      setSaved(true);
      recarregarProfessor();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  function voltar() {
    router.push("/professor/perfil");
  }

  return (
    <div>
      <div className={styles.pushHeader}>
        <button className={styles.backBtn} onClick={voltar} aria-label="Voltar">
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>Editar dados pessoais</div>
        </div>
      </div>

      {loading || !professorId ? (
        <div className={styles.form}>
          <div className={styles.card}>
            <Skeleton width={90} height={13} style={{ marginBottom: 16 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <Skeleton width="25%" height={11} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={40} radius="var(--radius-md)" />
              </div>
            ))}
          </div>
        </div>
      ) : loadError ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{loadError}</p>
        </div>
      ) : (
        <form
          className={styles.form}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className={styles.card}>
            <FotoField
              nome={nomeAtual || professor?.nome || "Professor"}
              fotoUrl={professor?.fotoUrl}
              previewUrl={fotoPreview}
              label="Foto de perfil"
              hint="A imagem é reduzida no aparelho antes do envio. Salve para aplicar."
              onSelect={(f, p) => {
                setFoto(f);
                setFotoPreview(p);
              }}
            />

            <label
              className={styles.subLabel}
              htmlFor="meuNome"
              style={{ marginTop: 14 }}
            >
              Nome
            </label>
            <input
              id="meuNome"
              className={styles.textarea}
              style={{ minHeight: "auto" }}
              placeholder="Nome completo"
              {...register("nome")}
            />
            {errors.nome && (
              <span
                className={styles.cardHint}
                style={{
                  display: "block",
                  color: "var(--color-danger-strong)",
                }}
              >
                {errors.nome.message}
              </span>
            )}

            <label className={styles.subLabel} htmlFor="meuEmail">
              E-mail
            </label>
            <input
              id="meuEmail"
              className={styles.textarea}
              style={{ minHeight: "auto", color: "var(--text-mute)" }}
              value={professor?.email ?? ""}
              readOnly
              disabled
            />
            <span
              className={styles.cardHint}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <Lock size={11} /> Login vinculado — só a administração altera.
            </span>

            <label className={styles.subLabel} htmlFor="meuTelefone">
              Telefone
            </label>
            <input
              id="meuTelefone"
              className={styles.textarea}
              style={{ minHeight: "auto" }}
              placeholder="(11) 90000-0000"
              inputMode="numeric"
              {...register("telefone", {
                onChange: (e) => {
                  e.target.value = maskPhone(e.target.value);
                },
              })}
            />
            {errors.telefone && (
              <span
                className={styles.cardHint}
                style={{
                  display: "block",
                  color: "var(--color-danger-strong)",
                }}
              >
                {errors.telefone.message}
              </span>
            )}

            <label className={styles.subLabel} htmlFor="meuFormacao">
              Formação (opcional)
            </label>
            <input
              id="meuFormacao"
              className={styles.textarea}
              style={{ minHeight: "auto" }}
              placeholder="Ex.: Pedagogia"
              {...register("formacao")}
            />
          </div>

          <button
            type="submit"
            className={`${styles.saveBtn} ${saved && !isDirty ? styles.saveBtnDone : ""}`}
            disabled={isSubmitting}
          >
            {saved && !isDirty ? (
              <>
                <Check size={18} /> Dados salvos
              </>
            ) : isSubmitting ? (
              "Salvando…"
            ) : (
              "Salvar alterações"
            )}
          </button>

          {submitError && (
            <div className={styles.saveError} role="alert">
              <AlertCircle size={17} /> <span>{submitError}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
