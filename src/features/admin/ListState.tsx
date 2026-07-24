import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components";
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

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.state} role="alert">
      <span className={styles.stateIcon} style={{ color: "var(--color-danger)" }}>
        <AlertCircle size={24} />
      </span>
      <div className={styles.stateTitle}>Não foi possível carregar</div>
      <p className={styles.stateText}>{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Tentar de novo
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
