"use client";

import { TrendingDown, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { NotificationOnboarding } from "@/features/notificacoes/NotificationOnboarding";
import { CriancasAdminService } from "@/services/criancasAdmin";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { TurmasService } from "@/services/turmas";
import { formatBRL } from "@/types/financeiro";
import { ErrorState } from "../ListState";
import { BalancoChart } from "./BalancoChart";
import adminStyles from "../admin.module.css";
import styles from "./dashboard.module.css";

export function DashboardScreen() {
  // `/financeiro/balanco` não devolve inadimplentes/crianças ativas/turmas —
  // esses contadores vêm de endpoints dedicados, não do resumo do balanço.
  const { data, loading, error, reload } = useFetch(async () => {
    const [balanco, inadimplentes, criancas, turmas] = await Promise.all([
      FinanceiroAdminService.getBalanco(),
      FinanceiroAdminService.getInadimplentes(),
      CriancasAdminService.list(),
      TurmasService.list(),
    ]);
    return {
      ...balanco,
      resumo: {
        ...balanco.resumo,
        inadimplentes: inadimplentes.length,
        criancasAtivas: criancas.filter((c) => c.ativo).length,
        turmas: turmas.length,
      },
    };
  });

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

      <NotificationOnboarding />

      {loading ? (
        <DashboardSkeleton />
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
              value={formatBRL(
                data.resumo.entradasMes - data.resumo.despesasMes,
              )}
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

          <BalancoChart />
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Carregando…">
      <div className={styles.kpiRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.kpi}>
            <div className={styles.kpiHead}>
              <Skeleton width={28} height={28} radius={9} />
              <Skeleton width="60%" height={11} />
            </div>
            <Skeleton width="70%" height={26} style={{ marginBottom: 5 }} />
            <Skeleton width="85%" height={11} />
          </div>
        ))}
      </div>

      <div className={styles.chartFigure}>
        <div className={styles.chartHead}>
          <div>
            <Skeleton width={160} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={120} height={11} />
          </div>
          <Skeleton width={140} height={12} />
        </div>
        <Skeleton width="100%" height={180} radius="var(--radius-md)" />
      </div>
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
