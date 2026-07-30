"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  Check,
  Copy,
  GraduationCap,
  KeyRound,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, FotoField, Input, Modal, Tooltip } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { ProfessoresService } from "@/services/professores";
import { getApiErrorMessage } from "@/services/apiError";
import {
  editProfessorSchema,
  professorSchema,
  type EditProfessorFormData,
  type ProfessorFormData,
} from "@/schemas/professor";
import { maskCPF, maskPhone, onlyDigits } from "@/utils/cpf";
import type { Professor, ProfessorCriado } from "@/types/professor";
import type { FotoUpload } from "@/utils/imagem";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

export function ProfessoresScreen() {
  const { data, loading, error, reload } = useFetch(() =>
    ProfessoresService.list(),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Professor | null>(null);
  const [deleting, setDeleting] = useState<Professor | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [credencial, setCredencial] = useState<ProfessorCriado | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Professor) {
    setEditing(p);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await ProfessoresService.remove(deleting._id);
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
          <h1 className={styles.pageTitle}>Professores</h1>
          <p className={styles.pageSub}>
            Cadastro das educadoras e vínculo com as turmas.
          </p>
        </div>
        <div className={styles.pageHeadActions}>
          <Button onClick={openCreate} aria-label="Novo professor">
            <Plus size={18} />
          </Button>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={24} />}
            title="Nenhum professor cadastrado"
            text="Cadastre educadoras para vinculá-las às turmas."
            action={
              <Button
                size="sm"
                onClick={openCreate}
                aria-label="Novo professor"
              >
                <Plus size={16} />
              </Button>
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Turmas</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className={styles.cellName}>{p.nome}</div>
                      <div className={styles.cellSub}>{p.email}</div>
                    </td>
                    <td>{p.telefone ?? "—"}</td>
                    <td>
                      {p.turmas && p.turmas.length > 0
                        ? p.turmas.map((t) => t.nome).join(", ")
                        : "—"}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Tooltip label="Editar">
                          <button
                            className={styles.iconBtn}
                            onClick={() => openEdit(p)}
                            aria-label={`Editar ${p.nome}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Remover">
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(p);
                            }}
                            aria-label={`Remover ${p.nome}`}
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
        title={editing ? "Editar professor" : "Novo professor"}
      >
        <ProfessorForm
          key={editing?._id ?? "new"}
          editing={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={(criado) => {
            setFormOpen(false);
            reload();
            // Só na criação: mostra a senha temporária do usuário criado junto, UMA vez.
            if (criado) setCredencial(criado);
          }}
        />
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remover professor"
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
          Remover <b>{deleting?.nome}</b> em definitivo? Se houver turma
          vinculada, troque a professora da turma antes — o backend bloqueia
          a remoção.
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

      <CredencialModal
        credencial={credencial}
        onClose={() => setCredencial(null)}
      />
    </div>
  );
}

function CredencialModal({
  credencial,
  onClose,
}: {
  credencial: ProfessorCriado | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copiar() {
    if (!credencial) return;
    const texto = [
      "Aquarela Kids — dados de acesso",
      `E-mail: ${credencial.email}`,
      `Senha temporária: ${credencial.senhaTemporaria}`,
      "Troque a senha no primeiro login.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
    } catch {
      /* clipboard indisponível — o admin copia manualmente dos campos */
    }
  }

  return (
    <Modal
      open={!!credencial}
      onClose={onClose}
      title="Professor criado — senha temporária"
      footer={
        <Button variant="primary" onClick={onClose}>
          Entendi, já anotei
        </Button>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
        O usuário de acesso foi criado junto. Repasse estes dados para{" "}
        <b>{credencial?.nome}</b>. No primeiro login o sistema pede a troca por
        uma senha própria.
      </p>

      <div
        style={{
          display: "grid",
          gap: 6,
          margin: "14px 0",
          padding: 14,
          borderRadius: "var(--radius-md)",
          background: "var(--color-primary-soft)",
          border: "1px solid var(--color-primary-soft-border)",
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-mute)" }}>E-mail</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
          {credencial?.email}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 8 }}>
          Senha temporária
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <code
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: "var(--text)",
            }}
          >
            {credencial?.senhaTemporaria}
          </code>
          <button
            type="button"
            onClick={copiar}
            aria-label="Copiar e-mail e senha temporária"
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
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copiado" : "Copiar tudo"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
          color: "var(--color-danger-strong)",
          fontSize: 13,
        }}
      >
        <KeyRound size={17} />
        <span>
          Esta senha aparece só agora e não fica salva. Se perdê-la, use
          &quot;Esqueci minha senha&quot; após o primeiro acesso ou gere uma
          nova.
        </span>
      </div>
    </Modal>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
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
      <AlertCircle size={17} /> <span>{message}</span>
    </div>
  );
}

function ProfessorForm(props: {
  editing: Professor | null;
  onCancel: () => void;
  onSaved: (criado?: ProfessorCriado) => void;
}) {
  return props.editing ? (
    <EditProfessorForm {...props} editing={props.editing} />
  ) : (
    <CreateProfessorForm {...props} />
  );
}

/** Criação: cria o usuário (papel=professor) e o professor juntos, a partir do CPF. */
function CreateProfessorForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (criado?: ProfessorCriado) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [foto, setFoto] = useState<FotoUpload | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfessorFormData>({
    resolver: yupResolver(professorSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      formacao: "",
    },
  });

  const nomeAtual = useWatch({ control, name: "nome" });

  async function onSubmit(values: ProfessorFormData) {
    setSubmitError(null);
    try {
      const criado = await ProfessoresService.create({
        nome: values.nome,
        cpf: onlyDigits(values.cpf),
        telefone: onlyDigits(values.telefone),
        email: values.email,
        formacao: values.formacao,
        ...(foto ? { foto } : {}),
      });
      onSaved(criado);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {submitError && <ErrorAlert message={submitError} />}
      <FotoField
        nome={nomeAtual || "Professor"}
        previewUrl={fotoPreview}
        label="Foto de perfil (opcional)"
        hint="A imagem é reduzida no navegador antes do envio."
        onSelect={(f, p) => {
          setFoto(f);
          setFotoPreview(p);
        }}
      />
      <Input
        label="Nome"
        placeholder="Nome completo"
        error={errors.nome?.message}
        {...register("nome")}
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
            onChange={(e) => field.onChange(maskCPF(e.target.value))}
            onBlur={field.onBlur}
          />
        )}
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@email.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <Controller
        control={control}
        name="telefone"
        render={({ field }) => (
          <Input
            label="Telefone"
            placeholder="(11) 90000-0000"
            inputMode="numeric"
            error={errors.telefone?.message}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(maskPhone(e.target.value))}
            onBlur={field.onBlur}
          />
        )}
      />
      <Input
        label="Formação (opcional)"
        placeholder="Ex.: Pedagogia"
        error={errors.formacao?.message}
        {...register("formacao")}
      />
      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel="Criar professor"
      />
    </form>
  );
}

/** Edição: backend só aceita nome, telefone, email e formação. */
function EditProfessorForm({
  editing,
  onCancel,
  onSaved,
}: {
  editing: Professor;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [foto, setFoto] = useState<FotoUpload | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoAtual, setFotoAtual] = useState(editing.fotoUrl);
  const [removendoFoto, setRemovendoFoto] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfessorFormData>({
    resolver: yupResolver(editProfessorSchema),
    defaultValues: {
      nome: editing.nome,
      email: editing.email,
      telefone: maskPhone(editing.telefone ?? ""),
      formacao: editing.formacao ?? "",
    },
  });

  const nomeAtual = useWatch({ control, name: "nome" });

  async function onSubmit(values: EditProfessorFormData) {
    setSubmitError(null);
    try {
      await ProfessoresService.update(editing._id, {
        ...values,
        telefone: onlyDigits(values.telefone),
        ...(foto ? { foto } : {}),
      });
      onSaved();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  async function removerFoto() {
    setRemovendoFoto(true);
    setSubmitError(null);
    try {
      await ProfessoresService.removerFoto(editing._id);
      setFoto(null);
      setFotoPreview(null);
      setFotoAtual(null);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setRemovendoFoto(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {submitError && <ErrorAlert message={submitError} />}
      <FotoField
        nome={nomeAtual || editing.nome}
        fotoUrl={fotoAtual}
        previewUrl={fotoPreview}
        label="Foto de perfil"
        hint="A imagem é reduzida no navegador antes do envio."
        removendo={removendoFoto}
        onSelect={(f, p) => {
          setFoto(f);
          setFotoPreview(p);
        }}
        onRemove={fotoAtual ? removerFoto : undefined}
      />
      <Input
        label="Nome"
        placeholder="Nome completo"
        error={errors.nome?.message}
        {...register("nome")}
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@email.com"
        readOnly
        error={errors.email?.message}
        {...register("email")}
      />
      <Controller
        control={control}
        name="telefone"
        render={({ field }) => (
          <Input
            label="Telefone"
            placeholder="(11) 90000-0000"
            inputMode="numeric"
            error={errors.telefone?.message}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(maskPhone(e.target.value))}
            onBlur={field.onBlur}
          />
        )}
      />
      <Input
        label="Formação (opcional)"
        placeholder="Ex.: Pedagogia"
        error={errors.formacao?.message}
        {...register("formacao")}
      />
      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel="Salvar"
      />
    </form>
  );
}

function FormActions({
  onCancel,
  isSubmitting,
  submitLabel,
}: {
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  return (
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
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </div>
  );
}
