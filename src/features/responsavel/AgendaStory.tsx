import { Paperclip } from "lucide-react";
import type {
  AgendaEntry,
  AgendaProfessor,
  AgendaTipo,
  AnexoAgenda,
} from "@/types/agenda";
import { Avatar } from "@/components";
import { HUMOR_ICON } from "@/types/professorAgenda";
import { AGENDA_VISUAL } from "./agendaVisual";
import styles from "./responsavel.module.css";

function decapitalizeFirst(s: string): string {
  return s.length ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function primeiroNome(nome?: string): string {
  return nome?.trim().split(/\s+/)[0] ?? "";
}

function nomeSemTitulo(nome: string): string {
  return nome.replace(/^prof(?:a)?\.?\s+/i, "").trim() || nome;
}

interface StoryClause {
  tipo: AgendaTipo;
  label: string;
  value: string;
}

function buildStoryClauses(entries: AgendaEntry[]): StoryClause[] {
  const clauses: StoryClause[] = [];

  const presenca = entries.find((e) => e.tipo === "presenca");
  const faltou = presenca?.value === "falta";

  if (!faltou) {
    for (const e of entries.filter((e) => e.tipo === "alimentacao")) {
      clauses.push({
        tipo: "alimentacao",
        label: `No ${e.title.toLowerCase()},`,
        value: decapitalizeFirst(e.text),
      });
    }

    const sonecas = entries.filter((e) => e.tipo === "sono");
    if (sonecas.length > 0) {
      clauses.push({
        tipo: "sono",
        label: sonecas.length > 1 ? "Tirou sonecas" : "Tirou soneca",
        value: sonecas.map((e) => `das ${e.text}`).join(" e "),
      });
    }

    const atividade = entries.find((e) => e.tipo === "atividade");
    if (atividade) {
      clauses.push({
        tipo: "atividade",
        label: "As atividades foram",
        value: atividade.text,
      });
    }
  }

  const higiene = entries.find((e) => e.tipo === "higiene");
  if (higiene) {
    clauses.push({
      tipo: "higiene",
      label: "Na higiene,",
      value: decapitalizeFirst(higiene.text),
    });
  }

  const tarefaCasa = entries.find((e) => e.tipo === "tarefaCasa");
  if (tarefaCasa && !tarefaCasa.destaque) {
    clauses.push({
      tipo: "tarefaCasa",
      label: "A tarefa de casa ficou",
      value: decapitalizeFirst(tarefaCasa.text),
    });
  }

  return clauses;
}

function StoryHighlight({
  tipo,
  children,
}: {
  tipo: AgendaTipo;
  children: string;
}) {
  const v = AGENDA_VISUAL[tipo];
  return (
    <span
      className={styles.storyHighlight}
      style={{ background: v.bg, color: v.fg }}
    >
      {children}
    </span>
  );
}

function StoryAlert({ entry }: { entry: AgendaEntry }) {
  const v = AGENDA_VISUAL[entry.tipo];
  return (
    <div
      className={styles.storyAlert}
      style={{ background: v.bg, color: v.fg }}
    >
      <b>{entry.title}</b>
      {entry.text && <> — {entry.text}</>}
    </div>
  );
}

function StoryBilhetinho({ entry }: { entry: AgendaEntry }) {
  return (
    <div className={styles.storyObs}>
      <b>Bilhetinho:</b> {entry.text}
    </div>
  );
}

interface AgendaStoryProps {
  entries: AgendaEntry[];
  /** Nome da criança, para a saudação ("Oi, família da Ana!"). */
  criancaNome?: string;
  /** Quem registrou o dia — também assina a carta ao final. */
  professor?: AgendaProfessor;
  dataLabel?: string;
  anexos?: AnexoAgenda[];
}

export function AgendaStory({
  entries,
  criancaNome,
  professor,
  dataLabel,
  anexos = [],
}: AgendaStoryProps) {
  const clauses = buildStoryClauses(entries);
  const humor = entries.find((e) => e.tipo === "humor");
  const HumorIcon = humor?.value ? HUMOR_ICON[humor.value] : undefined;
  const alertas = entries.filter((e) => e.destaque);
  const observacoes = entries.filter((e) => e.tipo === "observacao");

  if (
    clauses.length === 0 &&
    !humor &&
    alertas.length === 0 &&
    observacoes.length === 0 &&
    anexos.length === 0
  ) {
    return (
      <p className={styles.storyEmpty}>Ainda não há registros para hoje.</p>
    );
  }

  const primeiro = primeiroNome(criancaNome);
  const nomeProfessor = professor?.nome.trim() || "Professora";

  return (
    <div className={styles.storyCard}>
      <div className={styles.storyStrip} />

      <div className={styles.storyHeader}>
        <Avatar
          nome={nomeSemTitulo(nomeProfessor)}
          fotoUrl={professor?.fotoUrl}
          bg="var(--grad-primary)"
          size={44}
          radius={14}
          className={styles.storyAvatar}
        />
        <div className={styles.storyHeaderText}>
          <div className={styles.storyProfName}>{nomeProfessor}</div>
          <div className={styles.storyMeta}>
            escreveu sobre o dia{dataLabel ? ` · ${dataLabel}` : ""}
          </div>
        </div>
        {humor && (
          <span className={styles.storyMood}>
            {HumorIcon && <HumorIcon size={16} aria-hidden />} {humor.text}
          </span>
        )}
      </div>

      <p className={styles.storyGreeting}>
        Oi, família{primeiro ? ` da(o) ${primeiro}` : ""}!
      </p>

      {clauses.length > 0 && (
        <p className={styles.storyParagraph}>
          {clauses.map((c, i) => (
            <span key={i}>
              {c.label} <StoryHighlight tipo={c.tipo}>{c.value}</StoryHighlight>
              {i < clauses.length - 1 ? ". " : "."}
            </span>
          ))}
        </p>
      )}

      {alertas.map((e, i) => (
        <StoryAlert key={`alert-${i}`} entry={e} />
      ))}

      {observacoes.map((e, i) => (
        <StoryBilhetinho key={`obs-${i}`} entry={e} />
      ))}

      {anexos.length > 0 && (
        <div className={styles.storyAnexos}>
          {anexos.map((anexo) => (
            <a
              key={anexo.key}
              href={anexo.url}
              target="_blank"
              rel="noreferrer"
              className={styles.storyAnexoLink}
            >
              <Paperclip size={13} /> {anexo.nome}
            </a>
          ))}
        </div>
      )}

      <div className={styles.storySignature}>
        <span className={styles.storySignatureLabel}>Com carinho,</span>
        <span className={styles.storySignatureName}>{nomeProfessor}</span>
      </div>
    </div>
  );
}
