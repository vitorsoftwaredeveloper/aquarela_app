"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useFetch } from "@/hooks/useFetch";
import { ProfessorService } from "@/services/professorService";
import { TurmaListSkeleton } from "./TurmasScreen";
import styles from "./professor.module.css";

const CORES = [
  { bg: "#F1ECFB", fg: "#6D45C4" },
  { bg: "#E7F7F1", fg: "#2E9E7B" },
  { bg: "#FBEAF3", fg: "#C0468A" },
  { bg: "#FFF3EE", fg: "#C7522B" },
];

/** Entrada da tab "Planos" — escolhe a turma antes de ver os planos dela. */
export function PlanosAulaTurmasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const nome = user?.name ?? user?.email ?? "Professor(a)";
  const { data, loading, error } = useFetch(() =>
    ProfessorService.listMinhasTurmas(),
  );
  const turmas = data ?? [];

  usePageTitle("Planos de aula", `${nome} · escolha a turma`);

  return (
    <div>
      {loading ? (
        <TurmaListSkeleton />
      ) : error ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{error}</p>
        </div>
      ) : turmas.length === 0 ? (
        <div className={styles.state}>
          <BookOpen size={26} />
          <p>Você ainda não tem turmas vinculadas.</p>
        </div>
      ) : (
        <div className={styles.turmaList}>
          {turmas.map((t, i) => {
            const cor = CORES[i % CORES.length];
            return (
              <button
                key={t._id}
                className={styles.turmaCard}
                onClick={() =>
                  router.push(`/professor/turmas/${t._id}/planos-aula`)
                }
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
