"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Badge, Button, Input, Modal, Select, Tooltip } from "@/components";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useFetch } from "@/hooks/useFetch";
import { UsuariosService } from "@/services/usuarios";
import { getApiErrorMessage } from "@/services/apiError";
import {
  usuarioSchema,
  redefinirSenhaSchema,
  type UsuarioFormData,
  type RedefinirSenhaFormData,
} from "@/schemas/usuario";
import { maskPhone, onlyDigits } from "@/utils/cpf";
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
  usePageTitle("Usuários", "Gerencie quem acessa o sistema e seus papéis.");

  const { data, loading, error, reload } = useFetch(() =>
    UsuariosService.list(),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState<Usuario | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [credencial, setCredencial] = useState<UsuarioCriado | null>(null);
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null);
  const [senhaRedefinida, setSenhaRedefinida] =
    useState<SenhaRedefinida | null>(null);

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
        <div className={styles.pageHeadActions}>
          <Button onClick={openCreate}>
            <Plus size={18} />
            Adicionar
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
                <Plus size={16} />
                Adicionar
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
                      <div className={styles.rowActions}>
                        <Tooltip label="Editar">
                          <button
                            className={styles.iconBtn}
                            onClick={() => openEdit(u)}
                            aria-label={`Editar ${u.nome}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Redefinir senha">
                          <button
                            className={styles.iconBtn}
                            onClick={() => setRedefinindo(u)}
                            aria-label={`Redefinir senha de ${u.nome}`}
                          >
                            <KeyRound size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Remover">
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
        title="Remover"
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
          Remover <b>{deleting?.nome}</b>? Isto apaga o usuário e o acesso no
          Cognito — não dá para desfazer.
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

      <Modal
        open={!!redefinindo}
        onClose={() => setRedefinindo(null)}
        title={`Redefinir senha${redefinindo ? ` — ${redefinindo.nome}` : ""}`}
      >
        {redefinindo && (
          <RedefinirSenhaForm
            usuario={redefinindo}
            onCancel={() => setRedefinindo(null)}
            onSaved={(novaSenha) => {
              setRedefinindo(null);
              setSenhaRedefinida({
                nome: redefinindo.nome,
                email: redefinindo.email,
                senha: novaSenha,
              });
            }}
          />
        )}
      </Modal>

      <CredencialModal
        credencial={credencial}
        onClose={() => setCredencial(null)}
      />

      <SenhaRedefinidaModal
        senhaRedefinida={senhaRedefinida}
        onClose={() => setSenhaRedefinida(null)}
      />
    </div>
  );
}

interface SenhaRedefinida {
  nome: string;
  email: string;
  senha: string;
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
          Entendi
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

function RedefinirSenhaForm({
  usuario,
  onCancel,
  onSaved,
}: {
  usuario: Usuario;
  onCancel: () => void;
  onSaved: (novaSenha: string) => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirSenhaFormData>({
    resolver: yupResolver(redefinirSenhaSchema),
    defaultValues: { novaSenha: "", confirmarSenha: "" },
  });

  async function onSubmit(values: RedefinirSenhaFormData) {
    setSubmitError(null);
    try {
      await UsuariosService.redefinirSenha(usuario._id, values.novaSenha);
      onSaved(values.novaSenha);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
        Defina uma nova senha e repasse a <b>{usuario.nome}</b>. No próximo
        login o sistema pede a troca por uma senha própria.
      </p>
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
        label="Nova senha"
        type="password"
        placeholder="Mínimo de 8 caracteres"
        error={errors.novaSenha?.message}
        {...register("novaSenha")}
      />
      <Input
        label="Confirmar senha"
        type="password"
        placeholder="Repita a nova senha"
        error={errors.confirmarSenha?.message}
        {...register("confirmarSenha")}
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
          {isSubmitting ? "Salvando…" : "Redefinir"}
        </Button>
      </div>
    </form>
  );
}

function SenhaRedefinidaModal({
  senhaRedefinida,
  onClose,
}: {
  senhaRedefinida: SenhaRedefinida | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copiar() {
    if (!senhaRedefinida) return;
    const texto = [
      "Aquarela Kids — dados de acesso",
      `E-mail: ${senhaRedefinida.email}`,
      `Nova senha: ${senhaRedefinida.senha}`,
      "Troque a senha no próximo login.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal
      open={!!senhaRedefinida}
      onClose={onClose}
      title="Senha redefinida"
      footer={
        <Button variant="primary" onClick={onClose}>
          Entendi
        </Button>
      }
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
        Repasse estes dados para <b>{senhaRedefinida?.nome}</b>. No próximo
        login o sistema pede a troca por uma senha própria.
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
          {senhaRedefinida?.email}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 8 }}>
          Nova senha
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
            {senhaRedefinida?.senha}
          </code>
          <button
            type="button"
            onClick={copiar}
            aria-label="Copiar e-mail e nova senha"
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
        <span>Esta senha aparece só agora e não fica salva.</span>
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
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: yupResolver(usuarioSchema),
    defaultValues: editing
      ? {
          nome: editing.nome,
          email: editing.email,
          telefone: maskPhone(editing.telefone ?? ""),
          papel: editing.papel,
        }
      : { nome: "", email: "", telefone: "", papel: undefined },
  });

  async function onSubmit(values: UsuarioFormData) {
    setSubmitError(null);
    try {
      if (editing) {
        // Update não envia e-mail (readOnly, é o username no Cognito).
        await UsuariosService.update(editing._id, {
          nome: values.nome,
          telefone: values.telefone ? onlyDigits(values.telefone) : undefined,
          papel: values.papel,
        });
        onSaved();
      } else {
        const criado = await UsuariosService.create({
          nome: values.nome,
          email: values.email,
          telefone: values.telefone ? onlyDigits(values.telefone) : undefined,
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
      <Controller
        control={control}
        name="telefone"
        render={({ field }) => (
          <Input
            label="Telefone (opcional)"
            placeholder="(11) 90000-0000"
            inputMode="numeric"
            error={errors.telefone?.message}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(maskPhone(e.target.value))}
            onBlur={field.onBlur}
          />
        )}
      />
      <Select
        label="Papel"
        placeholder="Selecione o papel"
        options={ROLE_OPTIONS}
        error={errors.papel?.message}
        {...register("papel")}
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
          {isSubmitting ? "Salvando…" : editing ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
