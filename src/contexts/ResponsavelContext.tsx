"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CriancasService } from "@/services/criancas";
import { getApiErrorMessage } from "@/services/apiError";
import { storage } from "@/storage/localStorage";
import type { Crianca } from "@/types/crianca";

interface ResponsavelContextValue {
  criancas: Crianca[];
  active: Crianca | null;
  activeId: string | null;
  loading: boolean;
  error: string | null;
  setActive: (criancaId: string) => void;
  reload: () => void;
}

const ResponsavelContext = createContext<ResponsavelContextValue>(
  {} as ResponsavelContextValue,
);

const ACTIVE_KEY = "responsavel:activeChild";

/** Carrega os filhos do responsável e mantém o filho selecionado (troca de criança). */
export function ResponsavelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await CriancasService.listMy();
      setCriancas(list);
      const saved = storage.get<string>(ACTIVE_KEY);
      const initial =
        (saved && list.some((c) => c._id === saved) && saved) ||
        list[0]?._id ||
        null;
      setActiveId(initial);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setCriancas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const setActive = useCallback((criancaId: string) => {
    setActiveId(criancaId);
    storage.set(ACTIVE_KEY, criancaId);
  }, []);

  const active = useMemo(
    () => criancas.find((c) => c._id === activeId) ?? null,
    [criancas, activeId],
  );

  const value = useMemo(
    () => ({ criancas, active, activeId, loading, error, setActive, reload: load }),
    [criancas, active, activeId, loading, error, setActive, load],
  );

  return (
    <ResponsavelContext.Provider value={value}>
      {children}
    </ResponsavelContext.Provider>
  );
}

export function useResponsavel() {
  return useContext(ResponsavelContext);
}
