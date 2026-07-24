"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/** Campo de texto multi-linha do design system (mesmo visual do Input). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, id, className, ...rest }, ref) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className={[styles.field, className].filter(Boolean).join(" ")}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={`${styles.box} ${error ? styles.boxError : ""}`}>
          <textarea
            id={textareaId}
            ref={ref}
            className={styles.textarea}
            aria-invalid={!!error}
            aria-describedby={error ? `${textareaId}-error` : undefined}
            {...rest}
          />
        </div>
        {error && (
          <span id={`${textareaId}-error`} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);
