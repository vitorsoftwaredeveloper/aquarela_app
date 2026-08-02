import {
  AlertTriangle,
  Baby,
  BookOpen,
  CalendarCheck,
  Moon,
  Palette,
  Pill,
  Smile,
  StickyNote,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { AgendaTipo } from "@/types/agenda";

export const AGENDA_VISUAL: Record<
  AgendaTipo,
  { icon: LucideIcon; bg: string; fg: string }
> = {
  alimentacao: {
    icon: Utensils,
    bg: "var(--color-primary-soft)",
    fg: "var(--color-primary-strong)",
  },
  sono: {
    icon: Moon,
    bg: "var(--color-primary-soft)",
    fg: "var(--color-primary-strong)",
  },
  atividade: {
    icon: Palette,
    bg: "var(--color-secondary-soft)",
    fg: "var(--color-secondary-strong)",
  },
  humor: {
    icon: Smile,
    bg: "var(--color-secondary-soft)",
    fg: "var(--color-secondary-strong)",
  },
  higiene: {
    icon: Baby,
    bg: "var(--color-primary-soft)",
    fg: "var(--color-primary-strong)",
  },
  medicacao: {
    icon: Pill,
    bg: "var(--color-danger-soft)",
    fg: "var(--color-danger-strong)",
  },
  intercorrencia: {
    icon: AlertTriangle,
    bg: "var(--color-danger-soft)",
    fg: "var(--color-danger-strong)",
  },
  observacao: {
    icon: StickyNote,
    bg: "var(--surface-2)",
    fg: "var(--text-dim)",
  },
  tarefaCasa: {
    icon: BookOpen,
    bg: "var(--color-primary-soft)",
    fg: "var(--color-primary-strong)",
  },
  presenca: {
    icon: CalendarCheck,
    bg: "var(--color-primary-soft)",
    fg: "var(--color-primary-strong)",
  },
};
