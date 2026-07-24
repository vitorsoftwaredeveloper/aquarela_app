import {
  Features,
  FinalCta,
  Hero,
  HowItWorks,
  Navbar,
  Pricing,
  SiteFooter,
  Stats,
  Testimonials,
} from "@/features/landing";
import styles from "@/features/landing/landing.module.css";

// Os preços dos planos vêm ao vivo de ConfigPrecosService.listPlanos (rota
// pública); sem isso, a página estática ficaria com o valor congelado do
// último build.
export const revalidate = 300;

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
