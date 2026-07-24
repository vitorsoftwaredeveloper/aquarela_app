"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Baby,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  School,
  SlidersHorizontal,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Logo, SignOutButton, ThemeToggle } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./admin.module.css";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/criancas", label: "Crianças", icon: Baby },
  { href: "/admin/turmas", label: "Turmas", icon: School },
  { href: "/admin/professores", label: "Professores", icon: GraduationCap },
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
  { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  {
    href: "/admin/simulador",
    label: "Valores do simulador",
    icon: SlidersHorizontal,
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo size={34} />
        </div>
        <nav className={styles.nav} aria-label="Administração">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${active ? styles.navActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarMobileBrand}>
            <Logo size={30} />
          </div>
          <div className={styles.topbarActions}>
            <ThemeToggle />
            <div className={styles.who}>
              <div className={styles.whoName}>
                {user?.name ?? user?.email ?? "—"}
              </div>
              <div className={styles.whoRole}>Administração</div>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
