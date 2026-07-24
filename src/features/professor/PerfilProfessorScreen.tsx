"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./professor.module.css";

export function PerfilProfessorScreen() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();
  const nome = user?.name ?? user?.email ?? "Professor(a)";

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
        <section className={`${styles.card} ${styles.counterCard}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Moon size={17} color="#2168B8" />
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
