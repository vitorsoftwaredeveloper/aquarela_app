"use client";

import Link from "next/link";
import {
  Baby,
  GraduationCap,
  School,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  UserCog,
  Wallet,
} from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { formatBRL } from "@/types/financeiro";
import { ErrorState, LoadingState } from "../ListState";
import { BalancoChart } from "./BalancoChart";
import adminStyles from "../admin.module.css";
import styles from "./dashboard.module.css";

const ATALHOS = [
  { href: "/admin/criancas", label: "Crianças", icon: Baby },
  { href: "/admin/turmas", label: "Turmas", icon: School },
  { href: "/admin/professores", label: "Professores", icon: GraduationCap },
  { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
];

export function DashboardScreen() {
  const { data, loading, error, reload } = useFetch(() =>
    FinanceiroAdminService.getBalanco(),
  );

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHead}>
        <div>
          <h1 className={adminStyles.pageTitle}>Dashboard</h1>
          <p className={adminStyles.pageSub}>
            Visão geral do mês e dos últimos 12 meses.
          </p>
        </div>
      </div>

      {loading ? (
        <div className={adminStyles.card}>
          <LoadingState />
        </div>
      ) : error || !data ? (
        <div className={adminStyles.card}>
          <ErrorState message={error ?? "Sem dados."} onRetry={reload} />
        </div>
      ) : (
        <>
          <div className={styles.kpiRow}>
            <Kpi
              label="Entradas do mês"
              value={formatBRL(data.resumo.entradasMes)}
              icon={<TrendingUp size={16} />}
              bg="var(--color-secondary-soft)"
              fg="var(--color-secondary-strong)"
              foot="mensalidades recebidas"
            />
            <Kpi
              label="Despesas do mês"
              value={formatBRL(data.resumo.despesasMes)}
              icon={<TrendingDown size={16} />}
              bg="var(--color-accent-soft)"
              fg="#C7522B"
              foot="lançamentos do período"
            />
            <Kpi
              label="Saldo do mês"
              value={formatBRL(data.resumo.entradasMes - data.resumo.despesasMes)}
              icon={<Wallet size={16} />}
              bg="var(--color-primary-soft)"
              fg="var(--color-primary-link)"
              foot="entradas − despesas"
            />
            <Kpi
              label="Inadimplentes"
              value={String(data.resumo.inadimplentes)}
              icon={<TriangleAlert size={16} />}
              bg="var(--color-danger-soft)"
              fg="var(--color-danger-strong)"
              foot={`${data.resumo.criancasAtivas} crianças ativas · ${data.resumo.turmas} turmas`}
            />
          </div>

          <BalancoChart meses={data.meses} />

          <h2 className={styles.sectionTitle}>Atalhos</h2>
          <div className={styles.shortcuts}>
            {ATALHOS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={styles.shortcut}>
                <span className={styles.shortcutIcon}>
                  <Icon size={18} />
                </span>
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  bg,
  fg,
  foot,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  fg: string;
  foot: string;
}) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiHead}>
        <span className={styles.kpiIcon} style={{ background: bg, color: fg }}>
          {icon}
        </span>
        {label}
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiFoot}>{foot}</div>
    </div>
  );
}
