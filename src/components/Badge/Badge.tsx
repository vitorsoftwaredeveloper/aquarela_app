import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

/** Selo de status (papel, ativo/inativo, pago/atrasado…). */
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
