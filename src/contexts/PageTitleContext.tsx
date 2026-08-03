"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface PageTitleValue {
  title: string;
  subtitle?: string;
}

interface PageTitleStore extends PageTitleValue {
  setPageTitle: (value: PageTitleValue) => void;
}

const PageTitleContext = createContext<PageTitleStore | null>(null);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [value, setPageTitle] = useState<PageTitleValue>({ title: "" });

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
  return { title: ctx?.title ?? "", subtitle: ctx?.subtitle };
}

export function usePageTitle(title: string, subtitle?: string) {
  const ctx = useContext(PageTitleContext);
  const setPageTitle = ctx?.setPageTitle;

  useEffect(() => {
    setPageTitle?.({ title, subtitle });
  }, [setPageTitle, title, subtitle]);
}
