"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeftRight,
  Baby,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge, Button, Input, Modal, Select, Tooltip } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { CriancasAdminService } from "@/services/criancasAdmin";
import { TurmasService } from "@/services/turmas";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { getApiErrorMessage } from "@/services/apiError";
import { idadeEmAnos, type CriancaCadastro } from "@/types/criancaCadastro";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

export function CriancasScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useFetch(() =>
    CriancasAdminService.list(),
  );
  const [busca, setBusca] = useState("");
  const [deleting, setDeleting] = useState<CriancaCadastro | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const turmas = useFetch(() => TurmasService.list());
  const inadimplentes = useFetch(() =>
    FinanceiroAdminService.getInadimplentes(),
  );
  const criancasInadimplentes = useMemo(
    () => new Set((inadimplentes.data ?? []).map((i) => i.criancaId)),
    [inadimplentes.data],
  );
  const [moving, setMoving] = useState<CriancaCadastro | null>(null);
  const [moveTurmaId, setMoveTurmaId] = useState("");
  const [moveBusy, setMoveBusy] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const criancas = useMemo(() => {
    const list = data ?? [];
    const q = busca.trim().toLowerCase();
    return q ? list.filter((c) => c.nome?.toLowerCase().includes(q)) : list;
  }, [data, busca]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await CriancasAdminService.remove(deleting._id);
      setDeleting(null);
      reload();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  function openMover(c: CriancaCadastro) {
    setMoveError(null);
    setMoveTurmaId(c.turmaId ?? "");
    setMoving(c);
  }

  async function confirmMover() {
    if (!moving || !moveTurmaId) return;
    setMoveBusy(true);
    setMoveError(null);
    try {
      await CriancasAdminService.moverTurma(moving._id, moveTurmaId);
      setMoving(null);
      reload();
    } catch (err) {
      setMoveError(getApiErrorMessage(err));
    } finally {
      setMoveBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Crianças</h1>
          <p className={styles.pageSub}>
            Cadastro completo: identificação, responsáveis, saúde e financeiro.
          </p>
        </div>
        <div className={styles.pageHeadActions}>
          <Button onClick={() => router.push("/admin/criancas/nova")}>
            <Plus size={18} />
            Adicionar
          </Button>
        </div>
      </div>

      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div style={{ marginBottom: 16, maxWidth: 340 }}>
          <Input
            placeholder="Buscar por nome…"
            leftIcon={<Search size={18} />}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar criança"
          />
        </div>
      )}

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : criancas.length === 0 ? (
          <EmptyState
            icon={<Baby size={24} />}
            title={busca ? "Nenhum resultado" : "Nenhuma criança cadastrada"}
            text={
              busca
                ? "Tente outro nome."
                : "Cadastre a primeira criança para começar a registrar agendas."
            }
            action={
              !busca && (
                <Button
                  size="sm"
                  onClick={() => router.push("/admin/criancas/nova")}
                >
                  <Plus size={16} />
                  Adicionar
                </Button>
              )
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Criança</th>
                  <th>Turma</th>
                  <th>Responsável</th>
                  <th>Saúde</th>
                  <th>Financeiro</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {criancas.map((c) => {
                  const idade = idadeEmAnos(c.dataNascimento);
                  const alergias = c.saude?.alergias ?? [];
                  const resp = c.responsaveis?.[0];
                  return (
                    <tr key={c._id}>
                      <td>
                        <div className={styles.cellName}>{c.nome}</div>
                        <div className={styles.cellSub}>
                          {idade !== null ? `${idade} anos` : "—"}
                        </div>
                      </td>
                      <td>{c.turmaNome ?? "—"}</td>
                      <td>
                        <div>{resp?.nome ?? "—"}</div>
                        {resp?.parentesco && (
                          <div className={styles.cellSub}>
                            {resp.parentesco}
                          </div>
                        )}
                      </td>
                      <td>
                        {alergias.length > 0 ? (
                          <Badge tone="danger">
                            <ShieldAlert size={12} /> {alergias.join(", ")}
                          </Badge>
                        ) : (
                          <span className={styles.cellSub}>—</span>
                        )}
                      </td>
                      <td>
                        {criancasInadimplentes.has(c._id) ? (
                          <Badge tone="danger">
                            <TriangleAlert size={12} /> Inadimplente
                          </Badge>
                        ) : (
                          <span className={styles.cellSub}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Tooltip label="Editar">
                            <button
                              className={styles.iconBtn}
                              onClick={() =>
                                router.push(`/admin/criancas/${c._id}`)
                              }
                              aria-label={`Editar ${c.nome}`}
                            >
                              <Pencil size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Mover de turma">
                            <button
                              className={styles.iconBtn}
                              onClick={() => openMover(c)}
                              aria-label={`Mover ${c.nome} de turma`}
                            >
                              <ArrowLeftRight size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip label="Remover">
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={() => {
                                setDeleteError(null);
                                setDeleting(c);
                              }}
                              aria-label={`Remover ${c.nome}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!moving}
        onClose={() => setMoving(null)}
        title="Mover de turma"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoving(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmMover}
              disabled={
                moveBusy || !moveTurmaId || moveTurmaId === moving?.turmaId
              }
            >
              {moveBusy ? "Movendo…" : "Mover"}
            </Button>
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
          Mover <b>{moving?.nome}</b> para outra turma. O vínculo anterior é
          substituído; agenda e histórico não são afetados.
        </p>
        <Select
          label="Nova turma"
          placeholder={turmas.loading ? "Carregando…" : "Selecione a turma"}
          options={(turmas.data ?? []).map((t) => ({
            value: t._id,
            label: t.nome,
          }))}
          disabled={turmas.loading}
          value={moveTurmaId}
          onChange={(e) => setMoveTurmaId(e.target.value)}
        />
        {moveError && (
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
            <AlertCircle size={17} /> <span>{moveError}</span>
          </div>
        )}
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
            <Button onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? "Removendo…" : "Remover"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.nome}</b> em definitivo? Apaga o histórico
          junto (agenda, mensalidades, pagamentos) e não dá para desfazer.
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
