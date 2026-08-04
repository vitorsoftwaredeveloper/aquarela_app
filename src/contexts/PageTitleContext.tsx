"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface PageTitleValue {
  title: string;
  subtitle?: string;
  hideTopbar?: boolean;
  hideTopbarDesktop?: boolean;
  wide?: boolean;
}

interface PageTitleStore extends PageTitleValue {
  patchPageTitle: (patch: Partial<PageTitleValue>) => void;
}

const PageTitleContext = createContext<PageTitleStore | null>(null);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  const [value, setValue] = useState<PageTitleValue>({ title: "" });

  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setValue({ title: "" });
  }

  const patchPageTitle = useCallback(
    (patch: Partial<PageTitleValue>) =>
      setValue((prev) => ({ ...prev, ...patch })),
    [],
  );

  const store = useMemo<PageTitleStore>(
    () => ({ ...value, patchPageTitle }),
    [value, patchPageTitle],
  );

  return (
    <PageTitleContext.Provider value={store}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitleValue(): PageTitleValue {
  const ctx = useContext(PageTitleContext);
  return {
    title: ctx?.title ?? "",
    subtitle: ctx?.subtitle,
    hideTopbar: ctx?.hideTopbar,
    hideTopbarDesktop: ctx?.hideTopbarDesktop,
    wide: ctx?.wide,
  };
}

export function usePageTitle(title: string, subtitle?: string) {
  const ctx = useContext(PageTitleContext);
  const patchPageTitle = ctx?.patchPageTitle;

  useEffect(() => {
    patchPageTitle?.({ title, subtitle });
  }, [patchPageTitle, title, subtitle]);
}

/** Telas de drill-down (fora do menu lateral) chamam isso pra esconder o
 * header do shell (hamburguer/logo/tema) e usar só o próprio pushHeader.
 * `enabled` permite telas compartilhadas decidirem em tempo de render
 * (ex.: mesma tela é root para um papel e drill-down para outro). */
export function useHideTopbar(enabled = true) {
  const ctx = useContext(PageTitleContext);
  const patchPageTitle = ctx?.patchPageTitle;

  useEffect(() => {
    if (!enabled) return;
    patchPageTitle?.({ hideTopbar: true });
    return () => patchPageTitle?.({ hideTopbar: false });
  }, [patchPageTitle, enabled]);
}

export function useHideTopbarOnDesktop(enabled = true) {
  const ctx = useContext(PageTitleContext);
  const patchPageTitle = ctx?.patchPageTitle;

  useEffect(() => {
    patchPageTitle?.({ hideTopbarDesktop: enabled });
    return () => patchPageTitle?.({ hideTopbarDesktop: false });
  }, [patchPageTitle, enabled]);
}

export function useWideContent(enabled = true) {
  const ctx = useContext(PageTitleContext);
  const patchPageTitle = ctx?.patchPageTitle;

  useEffect(() => {
    patchPageTitle?.({ wide: enabled });
    return () => patchPageTitle?.({ wide: false });
  }, [patchPageTitle, enabled]);
}
