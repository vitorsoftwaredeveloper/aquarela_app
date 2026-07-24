"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { storage } from "@/storage/localStorage";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "theme";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

/**
 * Alterna claro/escuro escrevendo `data-theme` em <html> (os tokens em
 * tokens.css reagem ao atributo). O tema inicial é aplicado por um script inline
 * no <head> (ver ThemeScript) para evitar flash antes da hidratação.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const initial =
      (document.documentElement.dataset.theme as ThemeMode | undefined) ??
      storage.get<ThemeMode>(STORAGE_KEY) ??
      "light";
    // Leitura pós-montagem do tema já aplicado no DOM pelo ThemeScript
    // (sincroniza o estado React com a fonte externa; evita flash na hidratação).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(initial);
  }, []);

  const applyTheme = useCallback((next: ThemeMode) => {
    setMode(next);
    document.documentElement.dataset.theme = next;
    storage.set(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(
      (document.documentElement.dataset.theme as ThemeMode) === "dark"
        ? "light"
        : "dark",
    );
  }, [applyTheme]);

  const value = useMemo(
    () => ({ mode, toggleTheme, setTheme: applyTheme }),
    [mode, toggleTheme, applyTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Script inline anti-flash: define o tema antes do paint. */
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('@aquarela:theme');t=t?JSON.parse(t):null;if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
