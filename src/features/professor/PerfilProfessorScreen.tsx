"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Moon, Sun, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./professor.module.css";

export function PerfilProfessorScreen() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();
  const nome = user?.name ?? user?.email ?? "Professor(a)";
  const isDark = mode === "dark";

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
      </div>

      <div className={styles.form}>
        <div className={styles.settingsTitle}>Configurações</div>
        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          <button type="button" className={styles.settingsRow} onClick={toggleTheme}>
            <span className={styles.settingsRowIcon}>
              {isDark ? <Moon size={17} /> : <Sun size={17} />}
            </span>
            <span style={{ flex: 1 }}>Modo escuro</span>
            <span
              className={`${styles.switchTrack} ${isDark ? styles.switchOn : ""}`}
              aria-hidden
            >
              <span className={styles.switchThumb} />
            </span>
          </button>
          <button
            type="button"
            className={styles.settingsRow}
            onClick={() => router.push("/professor/perfil/editar")}
          >
            <span className={styles.settingsRowIcon}>
              <User size={17} />
            </span>
            <span style={{ flex: 1 }}>Editar dados pessoais</span>
            <ChevronRight size={18} color="var(--text-mute)" />
          </button>
        </div>

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
