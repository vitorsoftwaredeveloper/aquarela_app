"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./responsavel.module.css";

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      style={{
        width: 44,
        height: 26,
        borderRadius: 20,
        border: "none",
        cursor: "pointer",
        background: on ? "var(--color-secondary)" : "var(--border-14)",
        position: "relative",
        transition: "background .2s",
        flex: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          transition: "left .2s",
        }}
      />
    </button>
  );
}

export function PerfilScreen() {
  const { user, logout } = useAuth();
  const { criancas, activeId, setActive } = useResponsavel();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();
  const [notif, setNotif] = useState(true);

  const initial = (user?.name ?? "M").charAt(0).toUpperCase();

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <div>
      <div className={`${styles.gradHeader} ${styles.profHeader}`}>
        <span className={styles.profAvatar}>{initial}</span>
        <div>
          <div className={styles.profName}>{user?.name ?? "Responsável"}</div>
          <div className={styles.profEmail}>{user?.email}</div>
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle} style={{ marginBottom: 11 }}>
          Meus filhos
        </div>
        <div className={styles.stack}>
          {criancas.map((c) => {
            const isActive = c._id === activeId;
            return (
              <button
                key={c._id}
                className={`${styles.profChild} ${isActive ? styles.profChildActive : ""}`}
                onClick={() => setActive(c._id)}
              >
                <span
                  className={styles.profChildAvatar}
                  style={{ background: c.avatarBg }}
                >
                  {c.iniciais}
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    className={styles.childName}
                    style={{ display: "block", color: "var(--text)", fontSize: 14.5 }}
                  >
                    {c.nome}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "var(--text-dim)",
                    }}
                  >
                    {c.sub}
                  </span>
                </span>
                {isActive ? (
                  <span className={styles.emptyBadge}>Ativo</span>
                ) : (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "var(--color-primary-link)",
                    }}
                  >
                    Acessar
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle} style={{ marginBottom: 11 }}>
          Configurações
        </div>
        <div className={styles.settingsCard}>
          <div className={styles.settingRow}>
            <span className={styles.settingIcon}>
              <Moon size={17} />
            </span>
            <span className={styles.settingLabel}>Modo escuro</span>
            <Switch on={mode === "dark"} onToggle={toggleTheme} />
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingIcon}>
              <Bell size={17} />
            </span>
            <span className={styles.settingLabel}>Notificações</span>
            <Switch on={notif} onToggle={() => setNotif((v) => !v)} />
          </div>
        </div>
        <button className={styles.signOut} onClick={handleSignOut}>
          <LogOut size={17} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
