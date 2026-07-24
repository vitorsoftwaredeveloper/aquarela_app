"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

/**
 * Campo de formulário do design system. Rótulo, ícone à esquerda, mensagem de
 * erro e — para `type="password"` — botão de mostrar/ocultar. Encaminha `ref`
 * para integrar com o `register` do react-hook-form.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, leftIcon, type = "text", id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && reveal ? "text" : type;

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.box} ${error ? styles.boxError : ""}`}>
        {leftIcon && (
          <span className={styles.leftIcon} aria-hidden>
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          type={resolvedType}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
