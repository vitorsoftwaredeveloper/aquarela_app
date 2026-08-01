"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  MessageCircle,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import styles from "./professor.module.css";

const TABS: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/professor/turmas",
    label: "Turmas",
    icon: School,
    // Planos de aula é sub-rota de turmas na URL, mas pertence à tab "Planos".
    isActive: (pathname) =>
      !pathname.includes("/planos-aula") &&
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

  return (
    <div className={styles.app}>
      <div className={styles.viewport}>
        <div className={styles.scroll}>{children}</div>
        <nav className={styles.tabbar} aria-label="Navegação">
          {TABS.map(({ href, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
