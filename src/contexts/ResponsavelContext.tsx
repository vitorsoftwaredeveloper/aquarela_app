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
import { FinanceiroService } from "@/services/financeiroService";
import { getApiErrorMessage } from "@/services/apiError";
import { storage } from "@/storage/localStorage";
import { sortearCoresAvatar, type Crianca } from "@/types/crianca";

/** Resumo de inadimplência entre todos os filhos — Épico J (COB-09). */
export interface InadimplenciaResumo {
  inadimplente: boolean;
  desde?: string;
  valorTotal: number;
}

const INADIMPLENCIA_VAZIA: InadimplenciaResumo = {
  inadimplente: false,
  valorTotal: 0,
};

interface ResponsavelContextValue {
  criancas: Crianca[];
  active: Crianca | null;
  activeId: string | null;
  loading: boolean;
  error: string | null;
  avatarColors: Record<string, string>;
  inadimplencia: InadimplenciaResumo;
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
  const [avatarColors, setAvatarColors] = useState<Record<string, string>>({});
  const [inadimplencia, setInadimplencia] =
    useState<InadimplenciaResumo>(INADIMPLENCIA_VAZIA);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await CriancasService.listMy();
      setCriancas(list);
      setAvatarColors(sortearCoresAvatar(list.map((c) => c._id)));
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

  useEffect(() => {
    let cancelled = false;
    // Um filho por chamada, em paralelo — família pequena, cabe numa tab bar
    // que envolve toda navegação e não pode reconsultar a cada troca de tela.
    Promise.all(
      criancas.map((crianca) => FinanceiroService.listMensalidades(crianca._id)),
    )
      .then((listas) => {
        if (cancelled) return;
        const emAtraso = listas
          .flat()
          .filter((mensalidade) => mensalidade.inadimplenteDesde);
        if (emAtraso.length === 0) {
          setInadimplencia(INADIMPLENCIA_VAZIA);
          return;
        }
        const desde = emAtraso.reduce<string | undefined>(
          (min, m) =>
            !min || m.inadimplenteDesde! < min ? m.inadimplenteDesde : min,
          undefined,
        );
        const valorTotal = emAtraso.reduce((soma, m) => soma + m.valor, 0);
        setInadimplencia({ inadimplente: true, desde, valorTotal });
      })
      .catch(() => {
        // Best-effort: falha aqui não pode derrubar o app, só o badge some.
        if (!cancelled) setInadimplencia(INADIMPLENCIA_VAZIA);
      });
    return () => {
      cancelled = true;
    };
  }, [criancas]);

  const setActive = useCallback((criancaId: string) => {
    setActiveId(criancaId);
    storage.set(ACTIVE_KEY, criancaId);
  }, []);

  const active = useMemo(
    () => criancas.find((c) => c._id === activeId) ?? null,
    [criancas, activeId],
  );

  const value = useMemo(
    () => ({
      criancas,
      active,
      activeId,
      loading,
      error,
      avatarColors,
      inadimplencia,
      setActive,
      reload: load,
    }),
    [
      criancas,
      active,
      activeId,
      loading,
      error,
      avatarColors,
      inadimplencia,
      setActive,
      load,
    ],
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
