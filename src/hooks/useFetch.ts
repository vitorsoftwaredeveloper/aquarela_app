"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/apiError";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Carrega dados de servidor de um `services/*`. Expõe loading/erro/reload
 * para os estados de UI (skeleton, empty, erro). Reexecuta quando `deps` muda.
 * Estado local à tela — não vai para Context (docs/02-Frontend.md §4).
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;
    // Reset controlado antes de cada busca (sincroniza a UI com o carregamento).
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `fetcher` é recriado a cada render; a reexecução é controlada por depsKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, nonce]);

  return { data, loading, error, reload };
}
