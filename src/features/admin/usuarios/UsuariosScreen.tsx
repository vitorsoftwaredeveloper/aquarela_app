"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Trash2,
  UserCog,
} from "lucide-react";
import { Badge, Button, Input, Modal, Select } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { UsuariosService } from "@/services/usuarios";
import { getApiErrorMessage } from "@/services/apiError";
import { usuarioSchema, type UsuarioFormData } from "@/schemas/usuario";
import {
  ROLE_LABEL,
  ROLE_OPTIONS,
  type Usuario,
  type UsuarioCriado,
} from "@/types/usuario";
import type { Role } from "@/types/user";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

const ROLE_TONE: Record<Role, "info" | "success" | "neutral"> = {
  admin: "info",
  professor: "success",
  responsavel: "neutral",
};

export function UsuariosScreen() {
  const { data, loading, error, reload } = useFetch(() =>
    UsuariosService.list(),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState<Usuario | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [credencial, setCredencial] = useState<UsuarioCriado | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(u: Usuario) {
    setEditing(u);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await UsuariosService.remove(deleting._id);
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
          <h1 className={styles.pageTitle}>Usuários</h1>
          <p className={styles.pageSub}>
            Gerencie quem acessa o sistema e seus papéis.
          </p>
        </div>
        <div className={styles.pageHeadActions}>
          <Button onClick={openCreate}>
            <Plus size={18} /> Novo usuário
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
            icon={<UserCog size={24} />}
            title="Nenhum usuário ainda"
            text="Cadastre o primeiro acesso — admin, professor ou responsável."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus size={16} /> Novo usuário
              </Button>
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Papel</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className={styles.cellName}>{u.nome}</div>
                      <div className={styles.cellSub}>{u.email}</div>
                    </td>
                    <td>
                      <Badge tone={ROLE_TONE[u.papel]}>
                        {ROLE_LABEL[u.papel]}
                      </Badge>
                    </td>
                    <td>{u.telefone ?? "—"}</td>
                    <td>
                      <Badge tone={u.ativo ? "success" : "neutral"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(u)}
                          aria-label={`Editar ${u.nome}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(u);
                          }}
                          aria-label={`Remover ${u.nome}`}
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
        title={editing ? "Editar usuário" : "Novo usuário"}
      >
        <UsuarioForm
          key={editing?._id ?? "new"}
          editing={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={(criado) => {
            setFormOpen(false);
            reload();
            // Só na criação: mostra a senha temporária UMA vez ao admin.
            if (criado) setCredencial(criado);
          }}
        />
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remover usuário definitivamente"
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
              {deleteBusy ? "Removendo…" : "Remover definitivamente"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.nome}</b> em definitivo? Isto{" "}
          <b>apaga o usuário do banco e do Cognito</b> —{" "}
          <b>não dá para desfazer</b>. Para apenas bloquear o acesso mantendo o
          cadastro, edite o usuário e defina o status como <b>Inativo</b>.
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
  credencial: UsuarioCriado | null;
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
      title="Usuário criado — senha temporária"
      footer={
        <Button variant="primary" onClick={onClose}>
          Entendi, já anotei
        </Button>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
        Repasse estes dados para <b>{credencial?.nome}</b>. No primeiro login o
        sistema pede a troca por uma senha própria.
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

function UsuarioForm({
  editing,
  onCancel,
  onSaved,
}: {
  editing: Usuario | null;
  onCancel: () => void;
  onSaved: (criado?: UsuarioCriado) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: yupResolver(usuarioSchema),
    defaultValues: editing
      ? {
          nome: editing.nome,
          email: editing.email,
          telefone: editing.telefone ?? "",
          papel: editing.papel,
          ativo: editing.ativo,
        }
      : { nome: "", email: "", telefone: "", papel: undefined },
  });

  async function onSubmit(values: UsuarioFormData) {
    setSubmitError(null);
    try {
      if (editing) {
        // Update não envia e-mail (readOnly); envia `ativo` (ativar/desativar).
        await UsuariosService.update(editing._id, {
          nome: values.nome,
          telefone: values.telefone,
          papel: values.papel,
          ativo: values.ativo ?? editing.ativo,
        });
        onSaved();
      } else {
        // Create não envia `ativo` (backend rejeita: additionalProperties:false).
        const criado = await UsuariosService.create({
          nome: values.nome,
          email: values.email,
          telefone: values.telefone,
          papel: values.papel,
        });
        onSaved(criado);
      }
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
        label="Nome"
        placeholder="Nome completo"
        error={errors.nome?.message}
        {...register("nome")}
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="voce@email.com"
        readOnly={!!editing}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Telefone (opcional)"
        placeholder="(11) 90000-0000"
        error={errors.telefone?.message}
        {...register("telefone")}
      />
      <Select
        label="Papel"
        placeholder="Selecione o papel"
        options={ROLE_OPTIONS}
        error={errors.papel?.message}
        {...register("papel")}
      />
      {editing && (
        <Select
          label="Status do acesso"
          options={[
            { value: "true", label: "Ativo" },
            { value: "false", label: "Inativo (não consegue entrar)" },
          ]}
          error={errors.ativo?.message}
          {...register("ativo", {
            setValueAs: (v) => v === true || v === "true",
          })}
        />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : editing ? "Salvar" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
