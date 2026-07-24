import { ArrowRight } from "lucide-react";
import { Button, Container } from "@/components";
import styles from "./landing.module.css";

export function FinalCta() {
  return (
    <Container as="section" className={styles.finalWrap}>
      <div className={styles.finalCta}>
        <span className={styles.finalBlobA} aria-hidden />
        <span className={styles.finalBlobB} aria-hidden />
        <div className={styles.finalInner}>
          <h2 className={styles.finalTitle}>Venha conhecer a Aquarela Kids</h2>
          <p className={styles.finalLead}>
            Agende uma visita e veja de perto como cuidamos de cada detalhe do
            dia do seu filho.
          </p>
          <div className={styles.finalBtns}>
            <Button href="#" variant="onBrand" size="lg">
              Agende uma visita <ArrowRight size={18} />
            </Button>
            <Button href="#" variant="onBrandGhost" size="lg">
              Falar no WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
