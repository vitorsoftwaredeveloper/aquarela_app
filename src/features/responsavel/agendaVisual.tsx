import {
  AlertTriangle,
  Baby,
  Moon,
  Palette,
  Pill,
  Smile,
  StickyNote,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { AgendaTipo } from "@/types/agenda";

/** Ícone + cores por tipo de item da agenda. */
export const AGENDA_VISUAL: Record<
  AgendaTipo,
  { icon: LucideIcon; bg: string; fg: string }
> = {
  alimentacao: { icon: Utensils, bg: "#FDECEC", fg: "#C0342E" },
  sono: { icon: Moon, bg: "#EAF3FC", fg: "#2F7FCB" },
  atividade: { icon: Palette, bg: "#E7F7F1", fg: "#2E9E7B" },
  humor: { icon: Smile, bg: "#FBEAF3", fg: "#C0468A" },
  higiene: { icon: Baby, bg: "#F2EEFB", fg: "#7A57C2" },
  medicacao: { icon: Pill, bg: "#FFF3EE", fg: "#C7522B" },
  intercorrencia: { icon: AlertTriangle, bg: "#FDECEC", fg: "#C0342E" },
  observacao: { icon: StickyNote, bg: "#FFF7E9", fg: "#9A6B14" },
};
