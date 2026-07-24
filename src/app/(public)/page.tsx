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
