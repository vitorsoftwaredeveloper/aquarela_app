import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button, Skeleton } from "@/components";
import styles from "./admin.module.css";

/** Estados de carregamento / erro / vazio para as listas admin. */
export function LoadingState() {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      <span>Carregando…</span>
    </div>
  );
}

/** Skeleton de tabela — imita as linhas/colunas reais enquanto os dados carregam. */
export function TableSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className={styles.tableWrap} role="status" aria-label="Carregando…">
      <table className={styles.table}>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <Skeleton
                    height={13}
                    width={c === 0 ? "72%" : c === columns - 1 ? "40%" : "58%"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.state} role="alert">
      <span
        className={styles.stateIcon}
        style={{ color: "var(--color-danger)" }}
      >
        <AlertCircle size={24} />
      </span>
      <div className={styles.stateTitle}>Não foi possível carregar</div>
      <p className={styles.stateText}>{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Repetir
      </Button>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <span className={styles.stateIcon}>{icon}</span>
      <div className={styles.stateTitle}>{title}</div>
      <p className={styles.stateText}>{text}</p>
      {action}
    </div>
  );
}
