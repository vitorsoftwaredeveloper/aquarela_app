import { ArrowRight, Play } from "lucide-react";
import { Button, Container } from "@/components";
import styles from "./landing.module.css";
import { heroAvatars, mockAgenda } from "./landing.data";

export function Hero() {
  return (
    <Container as="section" className={styles.hero}>
      <span className={`${styles.blob} ${styles.blobA}`} aria-hidden />
      <span className={`${styles.blob} ${styles.blobB}`} aria-hidden />

      <div className={styles.heroCopy}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />A rotina do berçário à pré-escola,
          no seu bolso
        </div>
        <h1 className={styles.title}>
          O dia do seu filho,
          <br />
          <span className={styles.titleGrad}>do jeitinho</span> que ele merece.
        </h1>
        <p className={styles.subtitle}>
          Agenda diária, fotos, avisos e financeiro reunidos em um só lugar. A
          Aquarela Kids aproxima famílias e escola com carinho e transparência.
        </p>
        <div className={styles.heroCtas}>
          <Button href="#planos" size="lg">
            Agende uma visita <ArrowRight size={18} />
          </Button>
          <Button href="#como" variant="secondary" size="lg">
            <Play size={16} /> Ver como funciona
          </Button>
        </div>
        <div className={styles.social}>
          <div className={styles.avatars}>
            {heroAvatars.map((a, i) => (
              <span
                key={i}
                className={styles.avatar}
                style={{ background: a.bg }}
                aria-hidden
              >
                {a.txt}
              </span>
            ))}
          </div>
          <div className={styles.socialText}>
            <b>+40 famílias</b> acompanham
            <br />o dia a dia por aqui.
          </div>
        </div>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.phoneGlow} aria-hidden />
        <div className={styles.phone}>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneScreen}>
              <div className={styles.phoneHeader}>
                <div className={styles.phoneHeaderTop}>
                  <span>Olá, Marina</span>
                  <span>Ter, 16 jul</span>
                </div>
                <div className={styles.childCard}>
                  <span className={styles.childPhoto} aria-hidden>
                    🧒
                  </span>
                  <div>
                    <div className={styles.childName}>Lorena</div>
                    <div className={styles.childMeta}>
                      Turma Girassol · 3 anos
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.phoneBody}>
                <div className={styles.agendaTitle}>Agenda de hoje</div>
                {mockAgenda.map((e, i) => {
                  const Icon = e.icon;
                  return (
                    <div key={i} className={styles.agendaRow}>
                      <span
                        className={styles.agendaIcon}
                        style={{ background: e.bg, color: e.fg }}
                      >
                        <Icon size={18} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className={styles.agendaRowTitle}>{e.title}</div>
                        <div className={styles.agendaRowTime}>{e.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
