"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./ThemeToggle.module.css";

/** Alterna tema claro/escuro. Ícone + rótulo acessível. */
export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
