"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal, Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { PlanosAulaService } from "@/services/planosAula";
import { getApiErrorMessage } from "@/services/apiError";
import type { PlanoAula } from "@/types/planoAula";
import styles from "./professor.module.css";

function formatData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

/** PED-02 · Planos de aula (professor) — CRUD por turma. */
export function PlanosAulaScreen({ turmaId }: { turmaId: string }) {
  const router = useRouter();
  const { data, loading, error, reload } = useFetch(
    () => PlanosAulaService.list(turmaId),
    [turmaId],
  );
  const planos = data ?? [];

  const [deleting, setDeleting] = useState<PlanoAula | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  return (
    <div>
      <div className={styles.pushHeader}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/professor/planos-aula")}
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>Planos de aula</div>
          <div className={styles.pushSub}>
            {loading
              ? "Carregando…"
              : `${planos.length} plano${planos.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <button
          className={styles.backBtn}
          onClick={() =>
            router.push(`/professor/turmas/${turmaId}/planos-aula/novo`)
          }
          aria-label="Novo plano de aula"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className={styles.planoList} role="status" aria-label="Carregando…">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.planoCard}>
              <div className={styles.planoTop}>
                <Skeleton width="50%" height={14} />
                <Skeleton width={60} height={11} />
              </div>
              <Skeleton width="90%" height={12} style={{ marginTop: 8 }} />
              <div className={styles.planoTags}>
                <Skeleton width={54} height={20} radius={20} />
                <Skeleton width={70} height={20} radius={20} />
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
              <div className={styles.planoTop}>
                <span className={styles.planoTitle}>{p.titulo}</span>
                <span className={styles.planoDate}>{formatData(p.data)}</span>
              </div>
              <p className={styles.planoDesc}>{p.descricao}</p>
              {(p.objetivos?.length || p.materiais?.length) && (
                <div className={styles.planoTags}>
                  {p.objetivos?.map((o) => (
                    <span key={o} className={styles.planoTag}>
                      {o}
                    </span>
                  ))}
                  {p.materiais?.map((m) => (
                    <span
                      key={m}
                      className={`${styles.planoTag} ${styles.planoTagMaterial}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.planoActions}>
                <button
                  className={styles.iconBtn}
                  onClick={() =>
                    router.push(
                      `/professor/turmas/${turmaId}/planos-aula/${p._id}`,
                    )
                  }
                  aria-label={`Editar ${p.titulo}`}
                >
                  <Pencil size={15} />
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
              className={styles.backBtn}
              style={{ width: "auto", padding: "0 16px" }}
              onClick={() => setDeleting(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              style={{ margin: 0 }}
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
    </div>
  );
}
