"use client";

import { useSyncExternalStore } from "react";
import { RecadosNaoLidos } from "@/services/recadosNaoLidos";

const snapshotVazio = new Set<string>();

export function useRecadosNaoLidos(): Set<string> {
  return useSyncExternalStore(
    RecadosNaoLidos.subscribe,
    RecadosNaoLidos.snapshot,
    () => snapshotVazio,
  );
}
