"use client";

import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.css";

export function BackButton({
  onClick,
  label = "Voltar",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={styles.backBtn}
      onClick={onClick}
      aria-label={label}
    >
      <ChevronLeft size={20} />
    </button>
  );
}
