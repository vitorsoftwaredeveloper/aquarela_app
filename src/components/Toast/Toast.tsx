"use client";

import { Bell, X } from "lucide-react";
import styles from "./Toast.module.css";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  url?: string;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onClick: (toast: ToastItem) => void;
}

/** Pilha de avisos em primeiro plano — o SW cobre background, isto cobre app aberto. */
export function ToastStack({ toasts, onDismiss, onClick }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={styles.toast}
          onClick={() => onClick(toast)}
        >
          <span className={styles.icon} aria-hidden>
            <Bell size={16} />
          </span>
          <span className={styles.body}>
            <span className={styles.title}>{toast.title}</span>
            <span className={styles.message}>{toast.message}</span>
          </span>
          <button
            type="button"
            className={styles.close}
            aria-label="Fechar aviso"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
