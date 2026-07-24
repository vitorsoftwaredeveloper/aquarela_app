"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { School, User, type LucideIcon } from "lucide-react";
import styles from "./professor.module.css";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/professor/turmas", label: "Turmas", icon: School },
  { href: "/professor/perfil", label: "Perfil", icon: User },
];

export function ProfessorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.app}>
      <div className={styles.viewport}>
        <div className={styles.scroll}>{children}</div>
        <nav className={styles.tabbar} aria-label="Navegação">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
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
