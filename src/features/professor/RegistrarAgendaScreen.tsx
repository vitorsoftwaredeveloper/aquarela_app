"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Baby,
  Bell,
  Check,
  ChevronLeft,
  FileText,
  Minus,
  Moon,
  Palette,
  Pill,
  Plus,
  ShieldAlert,
  Smile,
  Thermometer,
  Trash2,
  Utensils,
} from "lucide-react";
import { Button, Modal, Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { CriancasService } from "@/services/criancas";
import { ProfessorService } from "@/services/professorService";
import { agoraHHMM, hojeISO } from "@/utils/date";
import { getApiErrorMessage } from "@/services/apiError";
import {
  ACEITACAO_OPTS,
  ATIVIDADES,
  HUMORES,
  INTERCORRENCIA_TIPO,
  INTERCORRENCIAS,
  REFEICAO_CODIGO,
  REFEICOES,
  type Aceitacao,
  type AgendaRegistroPayload,
} from "@/types/professorAgenda";
import styles from "./professor.module.css";

/** Alterna um item em uma lista (chips multi-seleção). */
function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

/** `refeicao` vem em código da API (docs §6) — os chips usam o rótulo pt-BR. */
const REFEICAO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REFEICAO_CODIGO).map(([label, code]) => [code, label]),
);

export function RegistrarAgendaScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const crianca = useFetch(
    () => CriancasService.getById(criancaId),
    [criancaId],
  );
  const agendaExistente = useFetch(
    () => ProfessorService.getAgendaDoDia(criancaId),
    [criancaId],
  );
  const c = crianca.data;

  const [agendaId, setAgendaId] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const [refeicoes, setRefeicoes] = useState<string[]>([]);
  const [aceitacaoPorRefeicao, setAceitacaoPorRefeicao] = useState<
    Partial<Record<string, Aceitacao>>
  >({});
  const [sonecas, setSonecas] = useState<{ inicio: string; fim: string }[]>([]);
  const [atividades, setAtividades] = useState<string[]>([]);
  const [humor, setHumor] = useState<string | null>(null);
  const [fraldas, setFraldas] = useState(0);
  const [intercorrencias, setIntercorrencias] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [removerError, setRemoverError] = useState<string | null>(null);

  const alergias = c?.cuidados?.alergias ?? [];
  const medicacoes = c?.cuidados?.medicacoes ?? [];
  const temCuidado = alergias.length > 0 || medicacoes.length > 0;

  const alimentacaoPreenchida = refeicoes.some((r) => aceitacaoPorRefeicao[r]);
  const temInformacaoMinima =
    alimentacaoPreenchida ||
    sonecas.length > 0 ||
    atividades.length > 0 ||
    humor !== null ||
    fraldas > 0 ||
    intercorrencias.length > 0 ||
    observacoes.trim().length > 0;

  const carregando = crianca.loading || agendaExistente.loading;
  const erroCarregar = crianca.error || agendaExistente.error;

  // Pré-preenche o form quando já existe agenda hoje, para editar em vez de duplicar.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (prefilled || agendaExistente.loading) return;
    const raw = agendaExistente.data;
    if (!raw) {
      setPrefilled(true);
      return;
    }

    const refeicoesCarregadas: string[] = [];
    const aceitacaoCarregada: Partial<Record<string, Aceitacao>> = {};
    for (const item of raw.alimentacao ?? []) {
      const label = REFEICAO_LABEL[item.refeicao] ?? item.refeicao;
      refeicoesCarregadas.push(label);
      aceitacaoCarregada[label] = item.aceitacao;
    }

    setAgendaId(raw._id);
    setRefeicoes(refeicoesCarregadas);
    setAceitacaoPorRefeicao(aceitacaoCarregada);
    setSonecas(raw.sono ?? []);
    setAtividades(raw.atividades ?? []);
    setHumor(raw.humor ?? null);
    setFraldas(raw.higiene?.fraldas ?? 0);
    setIntercorrencias((raw.intercorrencias ?? []).map((i) => i.descricao));
    setObservacoes(raw.observacoes ?? "");
    setPrefilled(true);
  }, [agendaExistente.loading, agendaExistente.data, prefilled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggleRefeicao(refeicao: string) {
    setRefeicoes((prev) => toggle(prev, refeicao));
    setAceitacaoPorRefeicao((prev) => {
      if (!(refeicao in prev)) return prev;
      const next = { ...prev };
      delete next[refeicao];
      return next;
    });
  }

  function setAceitacaoDaRefeicao(refeicao: string, valor: Aceitacao) {
    setAceitacaoPorRefeicao((prev) => ({
      ...prev,
      [refeicao]: prev[refeicao] === valor ? undefined : valor,
    }));
  }

  function addSoneca() {
    setSonecas((prev) => [...prev, { inicio: "12:30", fim: "14:00" }]);
  }

  function removeSoneca(index: number) {
    setSonecas((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSoneca(index: number, campo: "inicio" | "fim", valor: string) {
    setSonecas((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [campo]: valor } : s)),
    );
  }

  async function salvar() {
    setSaving(true);
    setSaveError(null);

    const alimentacao = refeicoes
      .filter((r) => aceitacaoPorRefeicao[r])
      .map((refeicao) => ({
        refeicao: REFEICAO_CODIGO[refeicao as keyof typeof REFEICAO_CODIGO],
        aceitacao: aceitacaoPorRefeicao[refeicao]!,
      }));

    const payload: AgendaRegistroPayload = {
      criancaId,
      data: hojeISO(),
      alimentacao: alimentacao.length ? alimentacao : undefined,
      sono: sonecas.length ? sonecas : undefined,
      atividades: atividades.length ? atividades : undefined,
      humor: humor ?? undefined,
      higiene: fraldas > 0 ? { fraldas } : undefined,
      intercorrencias: intercorrencias.length
        ? intercorrencias.map((label) => ({
            tipo: INTERCORRENCIA_TIPO[
              label as keyof typeof INTERCORRENCIA_TIPO
            ],
            descricao: label,
            hora: agoraHHMM(),
          }))
        : undefined,
      observacoes: observacoes.trim() || undefined,
    };

    try {
      let id = agendaId;
      if (id) {
        await ProfessorService.atualizarAgenda(id, payload);
      } else {
        const criada = await ProfessorService.salvarAgenda(payload);
        id = criada._id;
        setAgendaId(id);
      }
      ProfessorService.enviarAgenda(id).catch(() => {});
      setSaved(true);
      setTimeout(() => router.back(), 700);
    } catch (err) {
      setSaveError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removerAgenda() {
    if (!agendaId) return;
    setRemovendo(true);
    setRemoverError(null);
    try {
      await ProfessorService.removerAgenda(agendaId, criancaId);
      router.back();
    } catch (err) {
      setRemoverError(getApiErrorMessage(err));
    } finally {
      setRemovendo(false);
    }
  }

  return (
    <div>
      <div className={styles.pushHeader}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>
            {c?.nome ?? "Registrar agenda"}
            {c?.idadeLabel && (
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  color: "var(--text-dim)",
                }}
              >
                {" "}
                · {c.idadeLabel}
              </span>
            )}
          </div>
          <div className={styles.pushSub}>
            {c?.turmaNome ? `Turma ${c.turmaNome} · hoje` : "hoje"}
            {agendaId && " · editando registro já salvo"}
          </div>
        </div>
        <Link
          href={`/professor/historico/${criancaId}`}
          className={styles.pushAction}
        >
          Histórico
        </Link>
      </div>

      {carregando ? (
        <div
          className={styles.form}
          role="status"
          aria-label="Carregando agenda…"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <section key={i} className={styles.card}>
              <Skeleton width={130} height={15} style={{ marginBottom: 14 }} />
              <div className={styles.chipRow}>
                {Array.from({ length: 4 }).map((_, c) => (
                  <Skeleton key={c} width={72} height={34} radius={20} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : erroCarregar ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{erroCarregar}</p>
        </div>
      ) : (
        <>
          {temCuidado && (
            <div className={styles.careStrip}>
              {alergias.length > 0 && (
                <span className={styles.careItem}>
                  <ShieldAlert size={14} /> Alergia: {alergias.join(", ")}
                </span>
              )}
              {medicacoes.length > 0 && (
                <span className={styles.careItem}>
                  <Pill size={14} /> {medicacoes.join(" · ")}
                </span>
              )}
            </div>
          )}

          <div className={styles.form}>
            {/* Alimentação */}
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <Utensils size={17} color="#6D45C4" /> Alimentação
              </div>
              <div className={styles.chipRow}>
                {REFEICOES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={refeicoes.includes(r)}
                    className={`${styles.chip} ${refeicoes.includes(r) ? styles.chipOn : ""}`}
                    onClick={() => toggleRefeicao(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {refeicoes.map((r) => (
                <div key={r} className={styles.mealRow}>
                  <div className={styles.mealLabel}>Aceitação · {r}</div>
                  <div className={styles.chipRow}>
                    {ACEITACAO_OPTS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        aria-pressed={aceitacaoPorRefeicao[r] === a.value}
                        className={`${styles.chip} ${aceitacaoPorRefeicao[r] === a.value ? styles.chipOn : ""}`}
                        onClick={() => setAceitacaoDaRefeicao(r, a.value)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Sono */}
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <Moon size={17} color="#6D45C4" /> Sono
              </div>
              {sonecas.length > 0 && (
                <div className={styles.sleepBlock}>
                  {sonecas.map((s, i) => (
                    <div key={i} className={styles.sleepRow}>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={s.inicio}
                        onChange={(e) =>
                          updateSoneca(i, "inicio", e.target.value)
                        }
                        aria-label={`Início da soneca ${i + 1}`}
                      />
                      <span className={styles.sleepSep}>até</span>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={s.fim}
                        onChange={(e) => updateSoneca(i, "fim", e.target.value)}
                        aria-label={`Fim da soneca ${i + 1}`}
                      />
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeSoneca(i)}
                      >
                        remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className={styles.addBtn}
                onClick={addSoneca}
              >
                + adicionar {sonecas.length > 0 ? "outra soneca" : "soneca"}
              </button>
            </section>

            {/* Atividades */}
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <Palette size={17} color="#2E9E7B" /> Atividades
              </div>
              <div className={styles.chipWrap}>
                {ATIVIDADES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={atividades.includes(a)}
                    className={`${styles.chip} ${styles.chipPill} ${
                      atividades.includes(a) ? styles.chipOnGreen : ""
                    }`}
                    onClick={() => setAtividades((prev) => toggle(prev, a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>

            {/* Humor */}
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <Smile size={17} color="#2E9E7B" /> Humor
              </div>
              <div className={styles.chipRow}>
                {HUMORES.map((h) => (
                  <button
                    key={h.value}
                    type="button"
                    aria-pressed={humor === h.value}
                    className={`${styles.moodBtn} ${humor === h.value ? styles.chipOnGreen : ""}`}
                    onClick={() =>
                      setHumor((prev) => (prev === h.value ? null : h.value))
                    }
                  >
                    {humor === h.value && (
                      <span className={styles.moodCheck} aria-hidden>
                        <Check size={11} />
                      </span>
                    )}
                    <span className={styles.moodEmoji} aria-hidden>
                      {h.emoji}
                    </span>
                    <span className={styles.moodLabel}>{h.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Higiene */}
            <section className={`${styles.card} ${styles.counterCard}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Baby size={17} color="#6D45C4" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Higiene</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-dim)",
                      marginTop: 1,
                    }}
                  >
                    Trocas de fralda
                  </div>
                </div>
              </div>
              <div className={styles.counter}>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => setFraldas((n) => Math.max(0, n - 1))}
                  aria-label="Menos uma troca"
                >
                  <Minus size={17} />
                </button>
                <span className={styles.counterValue} aria-live="polite">
                  {fraldas}
                </span>
                <button
                  type="button"
                  className={`${styles.counterBtn} ${styles.counterBtnPlus}`}
                  onClick={() => setFraldas((n) => n + 1)}
                  aria-label="Mais uma troca"
                >
                  <Plus size={17} />
                </button>
              </div>
            </section>

            {/* Intercorrência */}
            <section className={styles.card}>
              <div className={styles.cardHead} style={{ marginBottom: 0 }}>
                <Thermometer size={17} color="#C0342E" /> Intercorrência
              </div>
              <div className={styles.cardHint}>
                Marque se algo aconteceu — o responsável é avisado.
              </div>
              <div className={styles.chipWrap}>
                {INTERCORRENCIAS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={intercorrencias.includes(i)}
                    className={`${styles.chip} ${styles.chipPill} ${
                      intercorrencias.includes(i) ? styles.chipOnRed : ""
                    }`}
                    onClick={() =>
                      setIntercorrencias((prev) => toggle(prev, i))
                    }
                  >
                    {i}
                  </button>
                ))}
              </div>
              {intercorrencias.length > 0 && (
                <div className={styles.incidentAlert}>
                  <Bell size={15} /> Um alerta será enviado ao responsável ao
                  salvar.
                </div>
              )}
            </section>

            {/* Observações */}
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <FileText size={17} color="var(--text-dim)" /> Observações
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Um recado carinhoso para a família…"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </section>

            <button
              type="button"
              className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ""}`}
              onClick={salvar}
              disabled={saving || saved || !temInformacaoMinima}
            >
              {saved ? (
                <>
                  <Check size={18} /> Agenda salva
                </>
              ) : saving ? (
                "Salvando…"
              ) : (
                "Salvar agenda"
              )}
            </button>

            {!temInformacaoMinima && !saved && (
              <div className={styles.minInfoHint} role="status">
                <AlertCircle size={16} />{" "}
                <span>Preencha ao menos uma informação para salvar.</span>
              </div>
            )}

            {saveError && (
              <div className={styles.saveError} role="alert">
                <AlertCircle size={16} /> <span>{saveError}</span>
              </div>
            )}

            {agendaId && (
              <button
                type="button"
                className={styles.saveBtn}
                style={{
                  background: "none",
                  color: "var(--color-danger-strong)",
                  boxShadow: "none",
                  border: "1px solid var(--border-08)",
                }}
                onClick={() => setConfirmandoRemocao(true)}
              >
                <Trash2 size={17} /> Remover agenda de hoje
              </button>
            )}
          </div>
        </>
      )}

      <Modal
        open={confirmandoRemocao}
        onClose={() => setConfirmandoRemocao(false)}
        title="Remover agenda de hoje"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmandoRemocao(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={removerAgenda}
              disabled={removendo}
            >
              {removendo ? "Removendo…" : "Remover"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover a agenda de hoje de <b>{c?.nome}</b>? Não é possível
          desfazer.
        </p>
        {removerError && (
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
            <AlertCircle size={17} /> <span>{removerError}</span>
          </div>
        )}
      </Modal>
    </div>
  );
}
