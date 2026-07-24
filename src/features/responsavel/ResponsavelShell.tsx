"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Wallet, type LucideIcon } from "lucide-react";
import styles from "./responsavel.module.css";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function ResponsavelShell({ children }: { children: React.ReactNode }) {
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
