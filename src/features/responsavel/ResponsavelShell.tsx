"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Images,
  LogOut,
  Menu,
  MessageCircle,
  User,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo, ThemeToggle } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitleValue } from "@/contexts/PageTitleContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { storage } from "@/storage/localStorage";
import { ChildSwitcher } from "./ChildSwitcher";
import styles from "./responsavel.module.css";

const SIDEBAR_COLLAPSED_KEY = "responsavel-sidebar-collapsed";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  disabled?: boolean;
  showDot?: boolean;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function ResponsavelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeId, inadimplencia } = useResponsavel();
  const { title, subtitle, hideTopbar, hideTopbarDesktop, wide } =
    usePageTitleValue();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const stored = storage.get<boolean>(SIDEBAR_COLLAPSED_KEY);
    if (stored != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(stored);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      storage.set(SIDEBAR_COLLAPSED_KEY, next);
      return next;
    });
  }

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  const displayName = user?.name ?? user?.email ?? "—";

  const NAV: NavItem[] = [
    {
      href: "/inicio",
      label: "Início",
      icon: Home,
      isActive: (p) => p === "/inicio",
    },
    {
      href: activeId ? `/recados/${activeId}` : "/inicio",
      label: "Recados",
      icon: MessageCircle,
      isActive: (p) => p.startsWith("/recados/"),
      disabled: !activeId,
    },
    {
      href: "/mural",
      label: "Mural",
      icon: Images,
      isActive: (p) => p === "/mural",
    },
    {
      href: "/financeiro",
      label: "Financeiro",
      icon: Wallet,
      isActive: (p) => p.startsWith("/financeiro"),
      showDot: inadimplencia.inadimplente,
    },
    {
      href: "/perfil",
      label: "Perfil",
      icon: User,
      isActive: (p) => p === "/perfil" || p.startsWith("/perfil/"),
    },
  ];

  const navLinks = (onNavigate?: () => void, mini = false) =>
    NAV.map(({ href, label, icon: Icon, isActive, disabled, showDot }) => {
      const active = isActive(pathname);
      return (
        <Link
          key={label}
          href={href}
          onClick={(e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            onNavigate?.();
          }}
          className={`${styles.navItem} ${active ? styles.navActive : ""}`}
          aria-current={active ? "page" : undefined}
          aria-disabled={disabled}
          title={mini ? label : undefined}
        >
          <span className={styles.navIconWrap}>
            <Icon size={19} />
            {showDot && <span className={styles.navDot} aria-hidden />}
          </span>
          {!mini && label}
        </Link>
      );
    });

  const sidebarFooter = (mini = false) => (
    <div className={styles.sidebarFooter}>
      <div className={styles.who} title={mini ? displayName : undefined}>
        <div className={styles.whoAvatar} aria-hidden>
          {initials(displayName)}
        </div>
        {!mini && (
          <div className={styles.whoText}>
            <div className={styles.whoName}>{displayName}</div>
            <div className={styles.whoRole}>Responsável</div>
          </div>
        )}
      </div>
      <button
        type="button"
        className={styles.signOutBtn}
        onClick={handleSignOut}
        aria-label="Sair"
        title="Sair"
      >
        <LogOut size={18} />
        {!mini && "Sair"}
      </button>
    </div>
  );

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}
    >
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      >
        <div className={styles.brand}>
          <Logo size={collapsed ? 30 : 90} />
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menu" : "Retrair menu"}
            title={collapsed ? "Expandir menu" : "Retrair menu"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className={styles.nav} aria-label="Navegação">
          {navLinks(undefined, collapsed)}
        </nav>
        {sidebarFooter(collapsed)}
      </aside>

      <div className={styles.main}>
        {!hideTopbar && (
          <header
            className={`${styles.topbar} ${hideTopbarDesktop ? styles.topbarHideDesktop : ""}`}
          >
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="responsavel-mobile-nav"
            >
              <Menu size={22} />
            </button>
            {title ? (
              <div className={styles.topbarTitle}>
                <span className={styles.topbarTitleText}>{title}</span>
                {subtitle && (
                  <span className={styles.topbarSubtitle}>{subtitle}</span>
                )}
              </div>
            ) : (
              <div className={styles.topbarMobileBrand}>
                <Logo size={30} />
              </div>
            )}
            <div className={styles.topbarActions}>
              <ChildSwitcher />
              <span className={styles.topbarThemeToggle}>
                <ThemeToggle />
              </span>
            </div>
          </header>
        )}
        <main className={`${styles.content} ${wide ? styles.contentWide : ""}`}>
          {children}
        </main>
      </div>

      {menuOpen && (
        <div
          className={styles.mobileNavOverlay}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            id="responsavel-mobile-nav"
            className={styles.mobileNav}
            aria-label="Navegação"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileNavHead}>
              <Logo size={30} />
              <button
                type="button"
                className={styles.menuBtn}
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className={styles.mobileNavLinks}>
              {navLinks(() => setMenuOpen(false))}
            </div>
            {sidebarFooter()}
          </nav>
        </div>
      )}
    </div>
  );
}
