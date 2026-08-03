"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTitleValue {
  title: string;
  subtitle?: string;
  hideTopbar?: boolean;
}

interface PageTitleStore extends PageTitleValue {
  setPageTitle: (value: PageTitleValue) => void;
}

const PageTitleContext = createContext<PageTitleStore | null>(null);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  const [value, setPageTitle] = useState<PageTitleValue>({ title: "" });

  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setPageTitle({ title: "" });
  }

  const store = useMemo<PageTitleStore>(
    () => ({ ...value, setPageTitle }),
    [value],
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
  };
}

export function usePageTitle(title: string, subtitle?: string) {
  const ctx = useContext(PageTitleContext);
  const setPageTitle = ctx?.setPageTitle;

  useEffect(() => {
    setPageTitle?.({ title, subtitle });
  }, [setPageTitle, title, subtitle]);
}

/** Telas de drill-down (fora do menu lateral) chamam isso pra esconder o
 * header do shell (hamburguer/logo/tema) e usar só o próprio pushHeader.
 * `enabled` permite telas compartilhadas decidirem em tempo de render
 * (ex.: mesma tela é root para um papel e drill-down para outro). */
export function useHideTopbar(enabled = true) {
  const ctx = useContext(PageTitleContext);
  const setPageTitle = ctx?.setPageTitle;

  useEffect(() => {
    if (!enabled) return;
    setPageTitle?.({ title: "", hideTopbar: true });
  }, [setPageTitle, enabled]);
}
