"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Images,
  LogOut,
  Menu,
  MessageCircle,
  School,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo, ThemeToggle } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitleValue } from "@/contexts/PageTitleContext";
import { storage } from "@/storage/localStorage";
import styles from "./professor.module.css";

const SIDEBAR_COLLAPSED_KEY = "professor-sidebar-collapsed";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

const NAV: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/professor/turmas",
    label: "Turmas",
    icon: School,
    // Planos de aula e mural são sub-rotas de turmas na URL, mas pertencem aos
    // itens "Planos" e "Mural".
    isActive: (pathname) =>
      !pathname.includes("/planos-aula") &&
      !pathname.includes("/mural") &&
      (pathname === "/professor/turmas" ||
        pathname.startsWith("/professor/turmas/")),
  },
  {
    href: "/professor/recados",
    label: "Recados",
    icon: MessageCircle,
    isActive: (pathname) => pathname.startsWith("/professor/recados"),
  },
  {
    href: "/professor/mural",
    label: "Mural",
    icon: Images,
    isActive: (pathname) => pathname.includes("/mural"),
  },
  {
    href: "/professor/planos-aula",
    label: "Planos",
    icon: BookOpen,
    isActive: (pathname) => pathname.includes("/planos-aula"),
  },
  {
    href: "/professor/perfil",
    label: "Perfil",
    icon: User,
    isActive: (pathname) =>
      pathname === "/professor/perfil" ||
      pathname.startsWith("/professor/perfil/"),
  },
];

export function ProfessorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { title, subtitle } = usePageTitleValue();
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

  const navLinks = (onNavigate?: () => void, mini = false) =>
    NAV.map(({ href, label, icon: Icon, isActive }) => {
      const active = isActive(pathname);
      return (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={`${styles.navItem} ${active ? styles.navActive : ""}`}
          aria-current={active ? "page" : undefined}
          title={mini ? label : undefined}
        >
          <Icon size={19} />
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
            <div className={styles.whoRole}>Professor(a)</div>
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
        <nav className={styles.nav} aria-label="Professor">
          {navLinks(undefined, collapsed)}
        </nav>
        {sidebarFooter(collapsed)}
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="professor-mobile-nav"
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
            <ThemeToggle />
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      {menuOpen && (
        <div
          className={styles.mobileNavOverlay}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            id="professor-mobile-nav"
            className={styles.mobileNav}
            aria-label="Professor"
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
