"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { AlertCircle, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Textarea,
  Tooltip,
} from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { AvisosAdminService } from "@/services/avisosAdminService";
import { TurmasService } from "@/services/turmas";
import { getApiErrorMessage } from "@/services/apiError";
import { avisoSchema, type AvisoFormData } from "@/schemas/aviso";
import type { Aviso } from "@/types/agenda";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

export function AvisosScreen() {
  const { data, loading, error, reload } = useFetch(() =>
    AvisosAdminService.list(),
  );
  const { data: turmasData } = useFetch(() => TurmasService.list());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Aviso | null>(null);
  const [deleting, setDeleting] = useState<Aviso | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const avisos = data ?? [];
  const turmas = turmasData ?? [];
  const turmaNome = (turmaId?: string) =>
    turmaId
      ? (turmas.find((t) => t._id === turmaId)?.nome ?? "Turma removida")
      : null;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: Aviso) {
    setEditing(a);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setActionError(null);
    try {
      await AvisosAdminService.remove(deleting.id);
      setDeleting(null);
      reload();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Avisos</h1>
          <p className={styles.pageSub}>
            Mural de recados para os responsáveis — geral ou por turma.
          </p>
        </div>
        <div className={styles.pageHeadActions}>
          <Button onClick={openCreate}>
            <Plus size={18} />
            Novo aviso
          </Button>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : avisos.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={24} />}
            title="Nenhum aviso publicado"
            text="Publique recados ou eventos para os responsáveis."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={16} />
                Novo aviso
              </Button>
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Turma</th>
                  <th>Publicado</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {avisos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className={styles.cellName}>{a.titulo}</div>
                      <div className={styles.cellSub}>{a.corpo}</div>
                    </td>
                    <td>
                      <Badge tone={a.turmaId ? "info" : "neutral"}>
                        {turmaNome(a.turmaId) ?? "Todas as turmas"}
                      </Badge>
                    </td>
                    <td>{a.dataLabel}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Tooltip label="Editar">
                          <button
                            className={styles.iconBtn}
                            onClick={() => openEdit(a)}
                            aria-label={`Editar ${a.titulo}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Remover">
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => {
                              setActionError(null);
                              setDeleting(a);
                            }}
                            aria-label={`Remover ${a.titulo}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </Tooltip>
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
        title={editing ? "Editar aviso" : "Novo aviso"}
      >
        <AvisoForm
          key={editing?.id ?? "new"}
          editing={editing}
          turmas={turmas}
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
        title="Remover"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={busy}>
              {busy ? "Removendo…" : "Remover"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.titulo}</b>? Deixa de aparecer para os
          responsáveis.
        </p>
        {actionError && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
              color: "var(--color-danger-strong)",
              fontSize: 13,
            }}
          >
            <AlertCircle size={17} /> <span>{actionError}</span>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AvisoForm({
  editing,
  turmas,
  onCancel,
  onSaved,
}: {
  editing: Aviso | null;
  turmas: { _id: string; nome: string }[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AvisoFormData>({
    resolver: yupResolver(avisoSchema),
    defaultValues: {
      titulo: editing?.titulo ?? "",
      corpo: editing?.corpo ?? "",
      turmaId: editing?.turmaId ?? "",
    },
  });

  async function onSubmit(values: AvisoFormData) {
    setSubmitError(null);
    try {
      if (editing) {
        await AvisosAdminService.update(editing.id, values);
      } else {
        await AvisosAdminService.create(values);
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
            color: "var(--color-danger-strong)",
            fontSize: 13,
          }}
          role="alert"
        >
          <AlertCircle size={17} /> <span>{submitError}</span>
        </div>
      )}
      <Input
        label="Título"
        placeholder="Ex.: Reunião de pais"
        error={errors.titulo?.message}
        {...register("titulo")}
      />
      <Textarea
        label="Texto"
        placeholder="Detalhes do aviso"
        error={errors.corpo?.message}
        {...register("corpo")}
      />
      <Select
        label="Turma (opcional)"
        placeholder="Todas as turmas"
        options={turmas.map((t) => ({ value: t._id, label: t.nome }))}
        error={errors.turmaId?.message}
        {...register("turmaId")}
      />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : editing ? "Salvar" : "Publicar aviso"}
        </Button>
      </div>
    </form>
  );
}
