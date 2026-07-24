import Link from "next/link";
import { Button, Container, Logo, ThemeToggle } from "@/components";
import styles from "./landing.module.css";

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#depoimentos", label: "Depoimentos" },
];

export function Navbar() {
  return (
    <header className={styles.header}>
      <Container className={styles.navInner}>
        <Logo />
        <nav className={styles.navLinks} aria-label="Seções">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={styles.navLink}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className={styles.navSpacer} />
        <div className={styles.navActions}>
          <ThemeToggle />
          <Link href="/login" className={styles.enter}>
            Entrar
          </Link>
          <Button href="#planos" size="sm">
            Agende uma visita
          </Button>
        </div>
      </Container>
    </header>
  );
}
