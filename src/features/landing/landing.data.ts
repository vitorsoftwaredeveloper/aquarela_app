import {
  Bell,
  BookOpen,
  Camera,
  Heart,
  MessageCircle,
  Moon,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { PlanoTipo } from "@/types/configPrecos";

/** Avatares empilhados na prova social do hero. */
export const heroAvatars = [
  { bg: "#4C9BE8", txt: "L" },
  { bg: "#5FC9A6", txt: "M" },
  { bg: "#F5B841", txt: "T" },
  { bg: "#E8825F", txt: "+" },
];

export interface AgendaEntry {
  icon: LucideIcon;
  bg: string;
  fg: string;
  title: string;
  time: string;
}

/** Mock de agenda exibido no mockup do celular. */
export const mockAgenda: AgendaEntry[] = [
  {
    icon: Utensils,
    bg: "#FDECEC",
    fg: "#C0342E",
    title: "Almoço completo",
    time: "11:20",
  },
  {
    icon: Moon,
    bg: "#EAF3FC",
    fg: "#2F7FCB",
    title: "Soneca tranquila",
    time: "13:00",
  },
  {
    icon: Camera,
    bg: "#E7F7F1",
    fg: "#2E9E7B",
    title: "Nova foto da turma",
    time: "15:10",
  },
  {
    icon: Heart,
    bg: "#FBEAF3",
    fg: "#C0468A",
    title: "Dia feliz",
    time: "16:40",
  },
];

export const stats = [
  { num: "+40", label: "Famílias ativas" },
  { num: "12", label: "Turmas acompanhadas" },
  { num: "98%", label: "Registros no mesmo dia" },
  { num: "4,9", label: "Avaliação das famílias" },
];

export interface Feature {
  icon: LucideIcon;
  bg: string;
  fg: string;
  title: string;
  desc: string;
}

export const features: Feature[] = [
  {
    icon: BookOpen,
    bg: "#EAF3FC",
    fg: "#2F7FCB",
    title: "Agenda diária",
    desc: "Refeições, sono, higiene e humor registrados pela educadora em tempo real.",
  },
  {
    icon: Camera,
    bg: "#E7F7F1",
    fg: "#2E9E7B",
    title: "Fotos e momentos",
    desc: "Receba fotos do dia e guarde as melhores lembranças da turma.",
  },
  {
    icon: Bell,
    bg: "#FFF3EE",
    fg: "#C7522B",
    title: "Avisos e recados",
    desc: "Comunicados da escola e cuidados especiais chegam direto no seu celular.",
  },
  {
    icon: Wallet,
    bg: "#F2EEFB",
    fg: "#7A57C2",
    title: "Financeiro simples",
    desc: "Mensalidades, PIX e comprovantes organizados, sem filas nem papel.",
  },
  {
    icon: MessageCircle,
    bg: "#EAF3FC",
    fg: "#2F7FCB",
    title: "Conversa direta",
    desc: "Fale com a educadora e tire dúvidas por um canal só para a sua família.",
  },
  {
    icon: Heart,
    bg: "#FBEAF3",
    fg: "#C0468A",
    title: "Feito com carinho",
    desc: "Uma experiência acolhedora, pensada para pais e para quem cuida.",
  },
];

export const steps = [
  {
    n: "1",
    title: "Agende sua visita",
    desc: "Conheça a estrutura e nossa proposta pedagógica sem compromisso.",
  },
  {
    n: "2",
    title: "Matricule com apoio",
    desc: "A gente cuida da papelada e cria o acesso da sua família no app.",
  },
  {
    n: "3",
    title: "Acompanhe todo dia",
    desc: "Receba agenda, fotos e avisos e sinta-se pertinho do seu filho.",
  },
];

/**
 * Itens de cada card de plano na landing — copy fixa, casada por `tipo`.
 * Quais planos existem, nome e valores vêm da API
 * (`ConfigPrecosService.listPlanos`, ver `Pricing.tsx`).
 */
export const FEATURE_ITEMS: Record<PlanoTipo, string[]> = {
  integral: [
    "Até 10h por dia",
    "Todas as refeições",
    "Agenda, fotos e avisos",
    "Canal direto com a educadora",
    "Financeiro no app",
  ],
  meioPeriodo: [
    "4h por dia",
    "Agenda diária e fotos",
    "Avisos e recados",
    "Financeiro no app",
  ],
};

export interface Testimonial {
  stars: number;
  quote: string;
  initials: string;
  name: string;
  role: string;
  bg: string;
}

export const testimonials: Testimonial[] = [
  {
    stars: 5,
    quote:
      "Amo receber as fotos e a agenda no meio do dia. Fico tranquila no trabalho sabendo que está tudo bem.",
    initials: "CM",
    name: "Camila Moraes",
    role: "Mãe da Lorena",
    bg: "#4C9BE8",
  },
  {
    stars: 5,
    quote:
      "O financeiro ficou muito mais fácil. Pago o PIX pelo app e o comprovante já fica salvo.",
    initials: "RF",
    name: "Rafael Fontes",
    role: "Pai do Theo",
    bg: "#5FC9A6",
  },
  {
    stars: 5,
    quote:
      "Os avisos de cuidados especiais me dão segurança. Sinto que a escola realmente conversa comigo.",
    initials: "JP",
    name: "Juliana Prado",
    role: "Mãe da Alice",
    bg: "#E8825F",
  },
];

export const footerCols = [
  { title: "Produto", links: ["Recursos", "Planos", "Simulador", "Entrar"] },
  {
    title: "Escola",
    links: ["Nossa proposta", "Estrutura", "Turmas", "Agende uma visita"],
  },
  {
    title: "Contato",
    links: [
      "WhatsApp",
      "Instagram",
      "contato@aquarelakids.com",
      "(11) 4000-0000",
    ],
  },
];
