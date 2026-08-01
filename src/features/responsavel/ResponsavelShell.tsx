"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User, Wallet, type LucideIcon } from "lucide-react";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import styles from "./responsavel.module.css";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  disabled?: boolean;
}

export function ResponsavelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeId } = useResponsavel();

  const tabs: Tab[] = [
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
      href: "/financeiro",
      label: "Financeiro",
      icon: Wallet,
      isActive: (p) => p === "/financeiro",
    },
    {
      href: "/perfil",
      label: "Perfil",
      icon: User,
      isActive: (p) => p === "/perfil" || p.startsWith("/perfil/"),
    },
  ];

  return (
    <div className={styles.app}>
      <div className={styles.viewport}>
        <div className={styles.scroll}>{children}</div>
        <nav className={styles.tabbar} aria-label="Navegação">
          {tabs.map(({ href, label, icon: Icon, isActive, disabled }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={label}
                href={href}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                aria-current={active ? "page" : undefined}
                aria-disabled={disabled}
                onClick={(e) => {
                  if (disabled) e.preventDefault();
                }}
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
