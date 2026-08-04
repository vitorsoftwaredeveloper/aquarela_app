"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut, Moon, Pencil, Sun } from "lucide-react";
import { Avatar } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./responsavel.module.css";

export function PerfilScreen() {
  const { user, logout } = useAuth();
  const { criancas, activeId, setActive, avatarColors } = useResponsavel();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();

  usePageTitle(user?.name ?? "Responsável", user?.email);

  const isDark = mode === "dark";

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className={styles.perfilGrid}>
      <div className={styles.block}>
        <div className={styles.sectionCard}>
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
                    <span className={styles.childRowText}>
                      <span className={styles.childRowName}>{c.nome}</span>
                      <span className={styles.childRowSub}>{c.sub}</span>
                    </span>
                    {isActive ? (
                      <span className={styles.emptyBadge}>Ativo</span>
                    ) : (
                      <span className={styles.accessBadge}>Acessar</span>
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
      </div>

      <div className={styles.perfilGridSide}>
        <div className={styles.block}>
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardTitle}>Configurações</div>
            <button
              type="button"
              className={styles.settingRow}
              onClick={toggleTheme}
              aria-pressed={isDark}
            >
              <span className={styles.settingIcon}>
                {isDark ? <Moon size={17} /> : <Sun size={17} />}
              </span>
              <span className={styles.settingLabel}>Modo escuro</span>
              <span
                className={`${styles.switchTrack} ${isDark ? styles.switchOn : ""}`}
                aria-hidden
              >
                <span className={styles.switchThumb} />
              </span>
            </button>
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
    </div>
  );
}
