"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import styles from "./criancas.module.css";

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Destaque vermelho (alergias e afins). */
  alert?: boolean;
  hint?: string;
}

/** Entrada de lista por chips: digite e pressione Enter (ou vírgula). */
export function TagInput({
  label,
  value,
  onChange,
  placeholder,
  alert,
  hint,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim().replace(/,$/, "");
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className={styles.tagField}>
      <span className={styles.tagLabel}>{label}</span>
      <div className={styles.tagBox}>
        {value.map((tag) => (
          <span
            key={tag}
            className={`${styles.tag} ${alert ? styles.tagAlert : ""}`}
          >
            {tag}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remover ${tag}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          className={styles.tagInput}
          value={draft}
          placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          aria-label={label}
        />
      </div>
      {hint && <span className={styles.tagHint}>{hint}</span>}
    </div>
  );
}
