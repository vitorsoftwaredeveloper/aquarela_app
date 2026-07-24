"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeftRight,
  Baby,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Badge, Button, Input, Modal, Select } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { CriancasAdminService } from "@/services/criancasAdmin";
import { TurmasService } from "@/services/turmas";
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [desativando, setDesativando] = useState<CriancaCadastro | null>(null);
  const turmas = useFetch(() => TurmasService.list());
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

  async function setAtivo(c: CriancaCadastro, ativo: boolean) {
    setToggleError(null);
    setTogglingId(c._id);
    try {
      await CriancasAdminService.setAtivo(c._id, ativo);
      reload();
    } catch (err) {
      setToggleError(getApiErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  /** Desativar pede confirmação (bloqueia acesso); reativar é direto (seguro/reversível). */
  function onTogglePower(c: CriancaCadastro) {
    if (c.ativo) {
      setToggleError(null);
      setDesativando(c);
    } else {
      setAtivo(c, true);
    }
  }

  async function confirmDesativar() {
    if (!desativando) return;
    await setAtivo(desativando, false);
    setDesativando(null);
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
            <Plus size={18} /> Nova criança
          </Button>
        </div>
      </div>

      {toggleError && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            marginBottom: 14,
            color: "var(--color-danger-strong)",
            fontSize: 13,
          }}
          role="alert"
        >
          <AlertCircle size={17} /> <span>{toggleError}</span>
        </div>
      )}

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
          <TableSkeleton columns={6} />
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
                  <Plus size={16} /> Nova criança
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
                  <th>Status</th>
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
                        <Badge tone={c.ativo ? "success" : "neutral"}>
                          {c.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            onClick={() =>
                              router.push(`/admin/criancas/${c._id}`)
                            }
                            aria-label={`Editar ${c.nome}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className={styles.iconBtn}
                            onClick={() => openMover(c)}
                            aria-label={`Mover ${c.nome} de turma`}
                            title="Mover de turma"
                          >
                            <ArrowLeftRight size={16} />
                          </button>
                          <button
                            className={styles.iconBtn}
                            onClick={() => onTogglePower(c)}
                            disabled={togglingId === c._id}
                            aria-label={
                              c.ativo
                                ? `Desativar ${c.nome}`
                                : `Ativar ${c.nome}`
                            }
                            title={
                              c.ativo ? "Desativar acesso" : "Ativar acesso"
                            }
                          >
                            <Power size={16} />
                          </button>
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
        open={!!desativando}
        onClose={() => setDesativando(null)}
        title="Desativar criança"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDesativando(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDesativar}
              disabled={togglingId === desativando?._id}
            >
              {togglingId === desativando?._id ? "Desativando…" : "Desativar"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Desativar <b>{desativando?.nome}</b>? Ela some das telas do professor
          e do responsável (agenda, financeiro), mas o cadastro e todo o
          histórico ficam preservados. Para reativar depois, use este mesmo
          botão (<Power size={13} style={{ verticalAlign: -2 }} />) na lista — a
          reativação é imediata, sem confirmação.
        </p>
      </Modal>

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
        title="Remover criança definitivamente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={deleteBusy}>
              {deleteBusy ? "Removendo…" : "Remover definitivamente"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.nome}</b> em definitivo? Isto apaga a criança{" "}
          <b>e todo o histórico vinculado</b> — agenda diária, mensalidades e
          pagamentos — <b>sem possibilidade de desfazer</b>. Os responsáveis
          continuam com acesso ao app, só perdem o vínculo com esta criança.
          Para apenas bloquear o acesso mantendo o histórico, use o botão de
          ativar/desativar (<Power size={13} style={{ verticalAlign: -2 }} />)
          na lista.
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
