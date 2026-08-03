"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  Copy,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { BackButton, Modal, Select, Skeleton } from "@/components";
import { useHideTopbar } from "@/contexts/PageTitleContext";
import { useFetch } from "@/hooks/useFetch";
import { PlanosAulaService } from "@/services/planosAula";
import { ProfessorService } from "@/services/professorService";
import { getApiErrorMessage } from "@/services/apiError";
import type { PlanoAula } from "@/types/planoAula";
import styles from "./professor.module.css";

function formatData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const semana = d.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${dia.replace(".", "")} · ${semana.replace(".", "").replace(/^\w/, (c) => c.toUpperCase())}`;
}

/** PED-02 · Planos de aula (professor) — CRUD por turma. */
export function PlanosAulaScreen({ turmaId }: { turmaId: string }) {
  useHideTopbar();
  const router = useRouter();
  const { data, loading, error, reload } = useFetch(
    () => PlanosAulaService.list(turmaId),
    [turmaId],
  );
  const planos = data ?? [];

  const [deleting, setDeleting] = useState<PlanoAula | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [duplicating, setDuplicating] = useState<PlanoAula | null>(null);
  const [destinoTurmaId, setDestinoTurmaId] = useState("");
  const [duplicateBusy, setDuplicateBusy] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const { data: turmasData } = useFetch(() =>
    ProfessorService.listMinhasTurmas(),
  );
  const outrasTurmas = useMemo(
    () => (turmasData ?? []).filter((t) => t._id !== turmaId),
    [turmasData, turmaId],
  );
  const turmaAtual = turmasData?.find((t) => t._id === turmaId);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await PlanosAulaService.remove(turmaId, deleting._id);
      setDeleting(null);
      reload();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function abrirDuplicar(plano: PlanoAula) {
    setDuplicateError(null);
    setDestinoTurmaId("");
    setDuplicating(plano);
  }

  async function confirmDuplicate() {
    if (!duplicating || !destinoTurmaId) return;
    setDuplicateBusy(true);
    setDuplicateError(null);
    try {
      await PlanosAulaService.create(destinoTurmaId, {
        titulo: duplicating.titulo,
        descricao: duplicating.descricao,
        data: duplicating.data.slice(0, 10),
        objetivos: duplicating.objetivos,
        materiais: duplicating.materiais,
      });
      setDuplicating(null);
      router.push(`/professor/turmas/${destinoTurmaId}/planos-aula`);
    } catch (err) {
      setDuplicateError(getApiErrorMessage(err));
    } finally {
      setDuplicateBusy(false);
    }
  }

  return (
    <div>
      <div className={styles.topRow}>
        <BackButton onClick={() => router.push("/professor/planos-aula")} />
        <div className={styles.pushTitleWrap}>
          <span className={styles.pushTitle}>Planos de aula</span>
          <span className={styles.pushSub}>
            {turmaAtual?.nome ?? "Turma"}
          </span>
        </div>
      </div>

      <button
        className={styles.novoPlanoBtn}
        onClick={() =>
          router.push(`/professor/turmas/${turmaId}/planos-aula/novo`)
        }
      >
        <Plus size={20} strokeWidth={2.5} />
        Novo plano
      </button>

      {loading ? (
        <div
          className={styles.planoList}
          role="status"
          aria-label="Carregando…"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.planoCard}>
              <Skeleton width={78} height={20} radius={20} />
              <Skeleton width="65%" height={16} style={{ marginTop: 9 }} />
              <Skeleton width="95%" height={12} style={{ marginTop: 8 }} />
              <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
              <div className={styles.planoFooter}>
                <Skeleton width="35%" height={12} />
                <div className={styles.planoActions}>
                  <Skeleton width={74} height={32} radius={10} />
                  <Skeleton width={32} height={32} radius={10} />
                  <Skeleton width={32} height={32} radius={10} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{error}</p>
        </div>
      ) : planos.length === 0 ? (
        <div className={styles.state}>
          <BookOpen size={26} />
          <p>Nenhum plano de aula cadastrado para esta turma.</p>
        </div>
      ) : (
        <div className={styles.planoList}>
          {planos.map((p) => (
            <div key={p._id} className={styles.planoCard}>
              <span className={styles.planoDate}>{formatData(p.data)}</span>
              <span className={styles.planoTitle}>{p.titulo}</span>
              <p className={styles.planoDesc}>{p.descricao}</p>
              {!!p.objetivos?.length && (
                <ul className={styles.planoChecklist}>
                  {p.objetivos.map((o) => (
                    <li key={o}>
                      <Check size={13} />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.planoFooter}>
                {!!p.materiais?.length && (
                  <span className={styles.planoMateriais}>
                    <Paperclip size={13} />
                    Materiais: {p.materiais.join(", ")}
                  </span>
                )}
                <div className={styles.planoActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() =>
                      router.push(
                        `/professor/turmas/${turmaId}/planos-aula/${p._id}`,
                      )
                    }
                  >
                    <Pencil size={13} />
                    Editar
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => abrirDuplicar(p)}
                    aria-label={`Duplicar ${p.titulo} para outra turma`}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleting(p);
                    }}
                    aria-label={`Remover ${p.titulo}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remover plano de aula"
        footer={
          <>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.modalConfirmBtn}
              onClick={confirmDelete}
              disabled={busy}
            >
              {busy ? "Removendo…" : "Remover"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.titulo}</b>?
        </p>
        {deleteError && (
          <p
            style={{
              color: "var(--color-danger-strong)",
              fontSize: 13,
              marginTop: 10,
            }}
          >
            {deleteError}
          </p>
        )}
      </Modal>

      <Modal
        open={!!duplicating}
        onClose={() => setDuplicating(null)}
        title="Duplicar plano de aula"
        footer={
          <>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={() => setDuplicating(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.modalConfirmBtn}
              onClick={confirmDuplicate}
              disabled={duplicateBusy || !destinoTurmaId}
            >
              {duplicateBusy ? "Duplicando…" : "Duplicar"}
            </button>
          </>
        }
      >
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--text-soft)",
            marginBottom: 14,
          }}
        >
          Duplicar <b>{duplicating?.titulo}</b> para qual turma?
        </p>
        {outrasTurmas.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
            Você não tem outras turmas vinculadas.
          </p>
        ) : (
          <Select
            label="Turma de destino"
            placeholder="Selecione uma turma"
            value={destinoTurmaId}
            onChange={(e) => setDestinoTurmaId(e.target.value)}
            options={outrasTurmas.map((t) => ({
              value: t._id,
              label: `Turma ${t.nome}`,
            }))}
          />
        )}
        {duplicateError && (
          <p
            style={{
              color: "var(--color-danger-strong)",
              fontSize: 13,
              marginTop: 10,
            }}
          >
            {duplicateError}
          </p>
        )}
      </Modal>
    </div>
  );
}
