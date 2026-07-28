"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut, Pencil } from "lucide-react";
import { Avatar, ThemeToggle } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import styles from "./responsavel.module.css";

export function PerfilScreen() {
  const { user, logout } = useAuth();
  const { criancas, activeId, setActive, avatarColors } = useResponsavel();
  const router = useRouter();

  const initial = (user?.name ?? "M").charAt(0).toUpperCase();

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <div>
      <div className={`${styles.gradHeader} ${styles.profHeader}`}>
        <span className={styles.profAvatar}>{initial}</span>
        <div style={{ flex: 1 }}>
          <div className={styles.profName}>{user?.name ?? "Responsável"}</div>
          <div className={styles.profEmail}>{user?.email}</div>
        </div>
        <ThemeToggle variant="onBrand" />
      </div>

      <div className={styles.block}>
        <div className={styles.blockTitle} style={{ marginBottom: 11 }}>
          Meus filhos
        </div>
        <div className={styles.stack}>
          {criancas.map((c) => {
            const isActive = c._id === activeId;
            return (
              <div
                key={c._id}
                className={`${styles.profChild} ${isActive ? styles.profChildActive : ""}`}
              >
                <button
                  type="button"
                  className={styles.profChildMain}
                  onClick={() => setActive(c._id)}
                >
                  <Avatar
                    nome={c.nome}
                    fotoUrl={c.fotoUrl}
                    bg={avatarColors[c._id]}
                    size={46}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className={styles.childName}
                      style={{
                        display: "block",
                        color: "var(--text)",
                        fontSize: 14.5,
                      }}
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
                <Link
                  href={`/crianca/${c._id}/editar`}
                  className={styles.profChildEdit}
                  aria-label={`Editar dados de ${c.nome}`}
                  title="Editar dados"
                >
                  <Pencil size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.block}>
        <div className={styles.settingsCard}>
          <Link href="/perfil/notificacoes" className={styles.settingRow}>
            <span className={styles.settingIcon}>
              <Bell size={17} />
            </span>
            <span className={styles.settingLabel}>Notificações</span>
            <span className={styles.settingChevron}>
              <ChevronRight size={18} />
            </span>
          </Link>
        </div>
      </div>

      <div className={styles.block}>
        <button className={styles.signOut} onClick={handleSignOut}>
          <LogOut size={17} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
