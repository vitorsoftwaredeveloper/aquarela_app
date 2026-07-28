"use client";

import { useRouter } from "next/navigation";
import { School } from "lucide-react";
import { Skeleton, ThemeToggle } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { NotificationOnboarding } from "@/features/notificacoes/NotificationOnboarding";
import { ProfessorService } from "@/services/professorService";
import styles from "./professor.module.css";

const CORES = [
  { bg: "#F1ECFB", fg: "#6D45C4" },
  { bg: "#E7F7F1", fg: "#2E9E7B" },
  { bg: "#FBEAF3", fg: "#C0468A" },
  { bg: "#FFF3EE", fg: "#C7522B" },
];

export function TurmasScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, error } = useFetch(() =>
    ProfessorService.listMinhasTurmas(),
  );
  const turmas = data ?? [];
  const nome = user?.name ?? user?.email ?? "Professor(a)";

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.headerWho}>{nome}</div>
          <div className={styles.headerTitle}>Minhas turmas</div>
        </div>
        <ThemeToggle variant="onBrand" />
      </div>

      <NotificationOnboarding />

      {loading ? (
        <TurmaListSkeleton />
      ) : error ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{error}</p>
        </div>
      ) : turmas.length === 0 ? (
        <div className={styles.state}>
          <School size={26} />
          <p>Você ainda não tem turmas vinculadas.</p>
        </div>
      ) : (
        <div className={styles.turmaList}>
          {turmas.map((t, i) => {
            const cor = CORES[i % CORES.length];
            const emDia = t.agendasPendentes === 0;
            return (
              <button
                key={t._id}
                className={styles.turmaCard}
                onClick={() => router.push(`/professor/turmas/${t._id}`)}
              >
                <span
                  className={styles.turmaLetter}
                  style={{ background: cor.bg, color: cor.fg }}
                >
                  {t.nome.charAt(0).toUpperCase()}
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    className={styles.turmaName}
                    style={{ display: "block" }}
                  >
                    Turma {t.nome}
                  </span>
                  <span
                    className={styles.turmaMeta}
                    style={{ display: "block" }}
                  >
                    {t.totalCriancas}{" "}
                    {t.totalCriancas === 1 ? "criança" : "crianças"}
                    {t.periodo ? ` · ${t.periodo}` : ""}
                  </span>
                </span>
                <span
                  className={`${styles.pill} ${emDia ? styles.pillDone : styles.pillPend}`}
                >
                  {emDia
                    ? "Tudo em dia"
                    : `${t.agendasPendentes} pendente${t.agendasPendentes > 1 ? "s" : ""}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TurmaListSkeleton() {
  return (
    <div className={styles.turmaList} role="status" aria-label="Carregando…">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.turmaCard}>
          <Skeleton width={50} height={50} radius={15} />
          <span style={{ flex: 1 }}>
            <Skeleton width="55%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="35%" height={12} />
          </span>
          <Skeleton width={70} height={22} radius={20} />
        </div>
      ))}
    </div>
  );
}
