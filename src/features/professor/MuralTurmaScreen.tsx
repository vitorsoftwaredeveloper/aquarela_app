"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, Images, Plus } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { EventosService } from "@/services/eventos";
import { ProfessorService } from "@/services/professorService";
import styles from "./professor.module.css";

function formatData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MuralTurmaScreen({ turmaId }: { turmaId: string }) {
  const router = useRouter();
  const eventos = useFetch(() => EventosService.list({ turmaId }), [turmaId]);
  const alunos = useFetch(
    () => ProfessorService.listAlunos(turmaId),
    [turmaId],
  );

  const semConsentimento = (alunos.data ?? []).filter(
    (a) => !a.consentimentoImagem?.aceito,
  );
  const lista = eventos.data ?? [];

  return (
    <div>
      <div className={styles.pushHeader}>
        <button
          className={styles.backBtn}
          onClick={() => router.push(`/professor/turmas/${turmaId}`)}
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>Mural de fotos</div>
          <div className={styles.pushSub}>
            {eventos.loading
              ? "Carregando…"
              : `${lista.length} evento${lista.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      {!alunos.loading && semConsentimento.length > 0 && (
        <div className={styles.consentBanner}>
          <AlertTriangle size={17} />
          <div>
            <div className={styles.consentBannerTitle}>
              Sem autorização de imagem
            </div>
            <div className={styles.consentBannerText}>
              {semConsentimento.map((a) => a.nome).join(", ")} — evite incluir
              nas fotos publicadas.
            </div>
          </div>
        </div>
      )}

      <button
        className={styles.novoPlanoBtn}
        onClick={() => router.push(`/professor/turmas/${turmaId}/mural/novo`)}
      >
        <Plus size={20} strokeWidth={2.5} />
        Novo evento
      </button>

      {eventos.loading ? (
        <div
          className={styles.eventoList}
          role="status"
          aria-label="Carregando…"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.eventoCard}>
              <Skeleton width={54} height={54} radius={14} />
              <span style={{ flex: 1 }}>
                <Skeleton width="60%" height={15} style={{ marginBottom: 8 }} />
                <Skeleton width="35%" height={11} />
              </span>
            </div>
          ))}
        </div>
      ) : eventos.error ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{eventos.error}</p>
        </div>
      ) : lista.length === 0 ? (
        <div className={styles.state}>
          <Images size={26} />
          <p>Nenhum evento criado ainda para esta turma.</p>
        </div>
      ) : (
        <div className={styles.eventoList}>
          {lista.map((e) => (
            <button
              key={e._id}
              className={styles.eventoCard}
              onClick={() =>
                router.push(`/professor/turmas/${turmaId}/mural/${e._id}`)
              }
            >
              {e.fotos[0]?.url ? (
                <img
                  src={e.fotos[0].url}
                  alt=""
                  className={styles.eventoThumb}
                />
              ) : (
                <span
                  className={`${styles.eventoThumb} ${styles.eventoThumbEmpty}`}
                >
                  <Images size={20} />
                </span>
              )}
              <span style={{ flex: 1 }}>
                <span
                  className={styles.eventoTitle}
                  style={{ display: "block" }}
                >
                  {e.titulo}
                </span>
                <span className={styles.eventoMeta}>
                  {formatData(e.data)} · {e.fotos.length} foto
                  {e.fotos.length === 1 ? "" : "s"}
                  <span
                    className={
                      e.publicado ? styles.badgePublished : styles.badgeDraft
                    }
                  >
                    {e.publicado ? "Publicado" : "Rascunho"}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
