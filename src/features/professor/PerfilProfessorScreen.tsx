"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, School } from "lucide-react";
import { Skeleton } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFetch } from "@/hooks/useFetch";
import { ProfessorService } from "@/services/professorService";
import styles from "./professor.module.css";

const CORES = [
  { bg: "#F1ECFB", fg: "#6D45C4" },
  { bg: "#E7F7F1", fg: "#2E9E7B" },
  { bg: "#FBEAF3", fg: "#C0468A" },
  { bg: "#FFF3EE", fg: "#C7522B" },
];

export function PerfilProfessorScreen() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();
  const nome = user?.name ?? user?.email ?? "Professor(a)";
  const { data: turmas, loading: loadingTurmas } = useFetch(() =>
    ProfessorService.listMinhasTurmas(),
  );

  async function sair() {
    await logout();
    router.replace("/login");
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.headerWho}>{user?.email}</div>
          <div className={styles.headerTitle}>{nome}</div>
        </div>
        <span className={styles.avatar}>{nome.charAt(0).toUpperCase()}</span>
      </div>

      <div className={styles.form}>
        <div className={styles.pushTitle}>Minhas turmas</div>
        {loadingTurmas ? (
          <div
            className={styles.turmaList}
            role="status"
            aria-label="Carregando…"
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={styles.turmaCard}>
                <Skeleton width={50} height={50} radius={15} />
                <span style={{ flex: 1 }}>
                  <Skeleton
                    width="55%"
                    height={16}
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton width="35%" height={12} />
                </span>
              </div>
            ))}
          </div>
        ) : !turmas || turmas.length === 0 ? (
          <div className={styles.state}>
            <School size={26} />
            <p>Você ainda não tem turmas vinculadas.</p>
          </div>
        ) : (
          <div className={styles.turmaList}>
            {turmas.map((t, i) => {
              const cor = CORES[i % CORES.length];
              return (
                <button
                  key={t._id}
                  type="button"
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
                </button>
              );
            })}
          </div>
        )}

        <section className={`${styles.card} ${styles.counterCard}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Moon size={17} color="#6D45C4" />
            <span style={{ fontWeight: 500, fontSize: 13.5 }}>Modo escuro</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={mode === "dark"}
            style={{
              width: 44,
              height: 26,
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              background:
                mode === "dark" ? "var(--color-secondary)" : "var(--border-14)",
              position: "relative",
              transition: "background .2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: mode === "dark" ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                transition: "left .2s",
              }}
            />
          </button>
        </section>

        <button
          type="button"
          className={styles.saveBtn}
          style={{
            background: "var(--color-danger-soft)",
            color: "var(--color-danger-strong)",
            boxShadow: "none",
            border:
              "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)",
          }}
          onClick={sair}
        >
          <LogOut size={17} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
