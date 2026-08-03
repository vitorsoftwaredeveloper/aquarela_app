"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Paperclip, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { CriancasService } from "@/services/criancas";
import { HUMOR_ICON } from "@/types/professorAgenda";
import styles from "./professor.module.css";

export function HistoricoScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const crianca = useFetch(() => CriancasService.getById(criancaId));
  const historico = useFetch(() => AgendaService.getHistorico(criancaId));
  const frequencia = useFetch(
    () => AgendaService.getFrequencia(criancaId),
    [criancaId],
  );
  const dias = historico.data ?? [];

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
          <div className={styles.pushTitle}>Histórico</div>
          <div className={styles.pushSub}>
            {crianca.data?.nome ?? "Criança"} · últimas semanas
          </div>
        </div>
      </div>

      {frequencia.data && frequencia.data.total > 0 && (
        <div className={styles.freqResumo}>
          <div className={styles.freqItem}>
            <span className={styles.freqValue}>{frequencia.data.presente}</span>
            <span className={styles.freqLabel}>Presenças</span>
          </div>
          <div
            className={
              frequencia.data.falta > 0
                ? `${styles.freqItem} ${styles.freqItemAlerta}`
                : styles.freqItem
            }
          >
            <span className={styles.freqValue}>{frequencia.data.falta}</span>
            <span className={styles.freqLabel}>Faltas</span>
          </div>
          <div
            className={
              frequencia.data.atrasado > 0
                ? `${styles.freqItem} ${styles.freqItemAlerta}`
                : styles.freqItem
            }
          >
            <span className={styles.freqValue}>{frequencia.data.atrasado}</span>
            <span className={styles.freqLabel}>Atrasos</span>
          </div>
        </div>
      )}

      {historico.loading ? (
        <div className={styles.histList} role="status" aria-label="Carregando…">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.histCard}>
              <div className={styles.histHead}>
                <Skeleton width={80} height={13} />
                <Skeleton width={60} height={12} />
              </div>
              <div className={styles.histChips}>
                <Skeleton width={54} height={19} radius={20} />
                <Skeleton width={70} height={19} radius={20} />
                <Skeleton width={46} height={19} radius={20} />
              </div>
            </div>
          ))}
        </div>
      ) : dias.length === 0 ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Sem histórico</span>
          <p>Ainda não há dias registrados.</p>
        </div>
      ) : (
        <div className={styles.histList}>
          {dias.map((h) => {
            const HumorIcon = h.humorValue
              ? HUMOR_ICON[h.humorValue]
              : undefined;
            return (
              <div key={h.data} className={styles.histCard}>
                <div className={styles.histHead}>
                  <span className={styles.histDate}>{h.dataLabel}</span>
                  <span className={styles.histMood}>
                    {HumorIcon && <HumorIcon size={14} aria-hidden />}{" "}
                    {h.humorLabel}
                  </span>
                </div>
                <div className={styles.histChips}>
                  {h.chips.map((chip) => (
                    <span key={chip} className={styles.histChip}>
                      {chip}
                    </span>
                  ))}
                </div>
                {h.alerta && (
                  <div className={styles.histAlert}>
                    <ShieldAlert size={14} /> {h.alerta}
                  </div>
                )}
                {h.observacoes && (
                  <div className={styles.histObs}>
                    <span>{h.observacoes}</span>
                  </div>
                )}
                {(h.anexos?.length ?? 0) > 0 && (
                  <div className={styles.histAnexos}>
                    {h.anexos!.map((anexo) => (
                      <a
                        key={anexo.key}
                        href={anexo.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.histAnexoLink}
                      >
                        <Paperclip size={12} /> {anexo.nome}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
