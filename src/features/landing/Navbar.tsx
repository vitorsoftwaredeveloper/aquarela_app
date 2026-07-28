import { Button, Container, Logo, ThemeToggle } from "@/components";
import styles from "./landing.module.css";

export function Navbar() {
  return (
    <header className={styles.header}>
      <Container className={styles.navInner}>
        <Logo />
        <div className={styles.navSpacer} />
        <div className={styles.navActions}>
          <ThemeToggle />
          <Button href="/login" size="sm">
            Entrar
          </Button>
        </div>
      </Container>
    </header>
  );
}
