import { Container, LogoFull } from "@/components";
import styles from "./landing.module.css";
import { footerCols } from "./landing.data";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.footerTop}>
        <div>
          <LogoFull maxWidth={150} className={styles.footerLogo} />
          <p className={styles.footerTag}>
            A agenda diária do seu filho, do jeitinho que ele merece.
          </p>
        </div>
        {footerCols.map((c) => (
          <div key={c.title}>
            <div className={styles.footerColTitle}>{c.title}</div>
            <div className={styles.footerLinks}>
              {c.links.map((l) => (
                <a key={l} href="#" className={styles.footerLink}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        ))}
      </Container>
      <div className={styles.footerBottom}>
        <Container className={styles.footerBottomInner}>
          <span>© 2026 Aquarela Kids. Feito com carinho.</span>
          <span>Termos · Privacidade</span>
        </Container>
      </div>
    </footer>
  );
}
