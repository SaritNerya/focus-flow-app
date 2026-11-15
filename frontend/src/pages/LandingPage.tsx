import Logo from "../components/Logo";
import Features from "../components/landing/Features";
import FinalCta from "../components/landing/FinalCta";
import Hero from "../components/landing/Hero";
import HonestNote from "../components/landing/HonestNote";
import HowItWorks from "../components/landing/HowItWorks";
import PrivacyNote from "../components/landing/PrivacyNote";
import { SITE_NAME } from "../components/landing/content";

/** דף נחיתה ציבורי למי שלא מחובר. סטטי לגמרי: בלי קריאות לשרת ובלי גישה לאחסון. */
export default function LandingPage() {
  return (
    <>
      <a href="#main" className="skip-link">דילוג לתוכן</a>
      <header className="site-header">
        <div className="container header-inner"><Logo /></div>
      </header>
      <main id="main" className="container page landing" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <Features />
        <PrivacyNote />
        <HonestNote />
        <FinalCta />
      </main>
      <footer className="landing-footer">{SITE_NAME}</footer>
    </>
  );
}
