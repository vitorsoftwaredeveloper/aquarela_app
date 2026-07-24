import { Check } from "lucide-react";
import styles from "./Stepper.module.css";

interface StepperProps {
  steps: string[];
  /** Índice da etapa atual (0-based). */
  current: number;
  /** Permite voltar clicando numa etapa já concluída. */
  onStepClick?: (index: number) => void;
}

/** Indicador de progresso de formulário em etapas. */
export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <ol className={styles.stepper}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && !!onStepClick;
        return (
          <li key={label} className={styles.step}>
            <button
              type="button"
              className={`${styles.bullet} ${done ? styles.done : ""} ${active ? styles.active : ""}`}
              onClick={clickable ? () => onStepClick(i) : undefined}
              disabled={!clickable}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check size={15} /> : i + 1}
            </button>
            <span
              className={`${styles.label} ${active ? styles.labelActive : ""}`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`${styles.bar} ${done ? styles.barDone : ""}`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
