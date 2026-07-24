"use client";

import { useState } from "react";
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
  Utensils,
} from "lucide-react";
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

export function RegistrarAgendaScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const crianca = useFetch(() => CriancasService.getById(criancaId), [criancaId]);
  const c = crianca.data;

  const [refeicoes, setRefeicoes] = useState<string[]>([]);
  const [aceitacao, setAceitacao] = useState<Aceitacao | null>(null);
  const [sonoOn, setSonoOn] = useState(false);
  const [sonoDe, setSonoDe] = useState("12:30");
  const [sonoAte, setSonoAte] = useState("14:00");
  const [atividades, setAtividades] = useState<string[]>([]);
  const [humor, setHumor] = useState<string | null>(null);
  const [fraldas, setFraldas] = useState(0);
  const [intercorrencias, setIntercorrencias] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const alergias = c?.cuidados?.alergias ?? [];
  const medicacoes = c?.cuidados?.medicacoes ?? [];
  const temCuidado = alergias.length > 0 || medicacoes.length > 0;

  async function salvar() {
    setSaving(true);
    setSaveError(null);
    // Salvamento otimista: o professor não espera a resposta.
    setSaved(true);

    const payload: AgendaRegistroPayload = {
      criancaId,
      data: hojeISO(),
      alimentacao: aceitacao
        ? refeicoes.map((refeicao) => ({
            refeicao: REFEICAO_CODIGO[refeicao as keyof typeof REFEICAO_CODIGO],
            aceitacao,
          }))
        : undefined,
      sono: sonoOn ? [{ inicio: sonoDe, fim: sonoAte }] : undefined,
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
      await ProfessorService.salvarAgenda(payload);
    } catch (err) {
      setSaved(false);
      setSaveError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
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
          </div>
        </div>
      </div>

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
            <Utensils size={17} color="#2168B8" /> Alimentação
          </div>
          <div className={styles.chipRow}>
            {REFEICOES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={refeicoes.includes(r)}
                className={`${styles.chip} ${refeicoes.includes(r) ? styles.chipOn : ""}`}
                onClick={() => setRefeicoes((prev) => toggle(prev, r))}
              >
                {r}
              </button>
            ))}
          </div>
          <div className={styles.subLabel}>Aceitação</div>
          <div className={styles.chipRow}>
            {ACEITACAO_OPTS.map((a) => (
              <button
                key={a.value}
                type="button"
                aria-pressed={aceitacao === a.value}
                className={`${styles.chip} ${aceitacao === a.value ? styles.chipOn : ""}`}
                onClick={() =>
                  setAceitacao((prev) => (prev === a.value ? null : a.value))
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sono */}
        <section className={styles.card}>
          <div className={`${styles.cardHead} ${styles.cardHeadRow}`}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Moon size={17} color="#2168B8" /> Sono
            </span>
            {sonoOn && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setSonoOn(false)}
              >
                remover
              </button>
            )}
          </div>
          {sonoOn ? (
            <div className={styles.sleepRow}>
              <input
                type="time"
                className={styles.timeInput}
                value={sonoDe}
                onChange={(e) => setSonoDe(e.target.value)}
                aria-label="Início da soneca"
              />
              <span className={styles.sleepSep}>até</span>
              <input
                type="time"
                className={styles.timeInput}
                value={sonoAte}
                onChange={(e) => setSonoAte(e.target.value)}
                aria-label="Fim da soneca"
              />
            </div>
          ) : (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setSonoOn(true)}
            >
              + adicionar soneca
            </button>
          )}
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
            <Baby size={17} color="#2168B8" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Higiene</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 1 }}>
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
                onClick={() => setIntercorrencias((prev) => toggle(prev, i))}
              >
                {i}
              </button>
            ))}
          </div>
          {intercorrencias.length > 0 && (
            <div className={styles.incidentAlert}>
              <Bell size={15} /> Um alerta será enviado ao responsável ao salvar.
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
          disabled={saving}
        >
          {saved ? (
            <>
              <Check size={18} /> Agenda salva
            </>
          ) : (
            "Salvar agenda"
          )}
        </button>

        {saveError && (
          <div className={styles.saveError} role="alert">
            <AlertCircle size={16} /> <span>{saveError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
