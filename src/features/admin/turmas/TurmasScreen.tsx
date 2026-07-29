"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, Pencil, Plus, School, Trash2 } from "lucide-react";
import { Badge, Button, Input, Modal, Select } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { TurmasService } from "@/services/turmas";
import { ProfessoresService } from "@/services/professores";
import { getApiErrorMessage } from "@/services/apiError";
import { turmaSchema, type TurmaFormData } from "@/schemas/turma";
import { formatFaixa, type Turma } from "@/types/turma";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

export function TurmasScreen() {
  const { data, loading, error, reload } = useFetch(() => TurmasService.list());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [deleting, setDeleting] = useState<Turma | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(t: Turma) {
    setEditing(t);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await TurmasService.remove(deleting._id);
      setDeleting(null);
      reload();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Turmas</h1>
          <p className={styles.pageSub}>
            Organize as turmas por faixa etária e professora responsável.
          </p>
        </div>
        <div className={styles.pageHeadActions}>
          <Button onClick={openCreate} aria-label="Nova turma">
            <Plus size={18} />
          </Button>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<School size={24} />}
            title="Nenhuma turma ainda"
            text="Crie a primeira turma e vincule uma professora responsável."
            action={
              <Button size="sm" onClick={openCreate} aria-label="Nova turma">
                <Plus size={16} />
              </Button>
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Faixa etária</th>
                  <th>Professora</th>
                  <th>Crianças</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div className={styles.cellName}>{t.nome}</div>
                      {t.descricao && (
                        <div className={styles.cellSub}>{t.descricao}</div>
                      )}
                    </td>
                    <td>{formatFaixa(t.faixaEtaria)}</td>
                    <td>{t.professor?.nome ?? "—"}</td>
                    <td>{t.totalCriancas ?? 0}</td>
                    <td>
                      <Badge tone={t.ativo ? "success" : "neutral"}>
                        {t.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(t)}
                          aria-label={`Editar ${t.nome}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(t);
                          }}
                          aria-label={`Remover ${t.nome}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar turma" : "Nova turma"}
      >
        <TurmaForm
          key={editing?._id ?? "new"}
          editing={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            reload();
          }}
        />
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remover turma"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              disabled={deleteBusy}
            >
              {deleteBusy ? "Removendo…" : "Remover"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.nome}</b>? Se houver crianças ativas,
          realoque-as antes (o backend bloqueia a remoção). Soft delete preserva
          o histórico.
        </p>
        {deleteError && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginTop: 14,
              color: "var(--color-danger-strong)",
              fontSize: 13,
            }}
          >
            <AlertCircle size={17} /> <span>{deleteError}</span>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TurmaForm({
  editing,
  onCancel,
  onSaved,
}: {
  editing: Turma | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const professores = useFetch(() => ProfessoresService.list());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TurmaFormData>({
    resolver: yupResolver(turmaSchema),
    defaultValues: editing
      ? {
          nome: editing.nome,
          descricao: editing.descricao ?? "",
          idadeMin: editing.faixaEtaria.min,
          idadeMax: editing.faixaEtaria.max,
          professorId: editing.professorId,
        }
      : { nome: "", descricao: "", professorId: "" },
  });

  const professorOptions = (professores.data ?? []).map((p) => ({
    value: p._id,
    label: p.nome,
  }));
  const noProfessores =
    !professores.loading && !professores.error && professorOptions.length === 0;

  async function onSubmit(values: TurmaFormData) {
    setSubmitError(null);
    const payload = {
      nome: values.nome,
      descricao: values.descricao,
      faixaEtaria: { min: values.idadeMin, max: values.idadeMax },
      professorId: values.professorId,
    };
    try {
      if (editing) {
        await TurmasService.update(editing._id, payload);
      } else {
        await TurmasService.create(payload);
      }
      onSaved();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {submitError && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            color: "var(--color-danger-strong)",
            fontSize: 13,
          }}
          role="alert"
        >
          <AlertCircle size={17} /> <span>{submitError}</span>
        </div>
      )}
      <Input
        label="Nome da turma"
        placeholder="Ex.: Girassóis"
        error={errors.nome?.message}
        {...register("nome")}
      />
      <Input
        label="Descrição (opcional)"
        placeholder="Ex.: Berçário II — período integral"
        error={errors.descricao?.message}
        {...register("descricao")}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <Input
          label="Idade mínima (anos)"
          type="number"
          min={0}
          max={12}
          placeholder="1"
          error={errors.idadeMin?.message}
          {...register("idadeMin", { valueAsNumber: true })}
        />
        <Input
          label="Idade máxima (anos)"
          type="number"
          min={0}
          max={12}
          placeholder="3"
          error={errors.idadeMax?.message}
          {...register("idadeMax", { valueAsNumber: true })}
        />
      </div>
      <Select
        label="Professora responsável"
        placeholder={
          professores.loading ? "Carregando…" : "Selecione a professora"
        }
        options={professorOptions}
        disabled={professores.loading || noProfessores}
        error={errors.professorId?.message}
        {...register("professorId")}
      />
      {noProfessores && (
        <p style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: -6 }}>
          Cadastre um professor antes de criar a turma.
        </p>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 6,
        }}
      >
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || noProfessores}>
          {isSubmitting ? "Salvando…" : editing ? "Salvar" : "Criar turma"}
        </Button>
      </div>
    </form>
  );
}
