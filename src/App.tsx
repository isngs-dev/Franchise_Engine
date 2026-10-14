import { useEffect } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import VideoSection from "./components/VideoSection";
import FeaturesSection from "./components/FeaturesSection";
import LilyAssistantSection from "./components/LilyAssistantSection";
import WorkflowSection from "./components/WorkflowSection";
import LeadCaptureForm from "./components/LeadCaptureForm";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

/** Fades in `.reveal` elements as they scroll into view (CSS ignores it under reduced motion). */
function useReveal() {
  useEffect(() => {
    // Content is only hidden for reveal once this has run (see index.html); a failure leaves it visible.
    (window as unknown as { __revealOK?: boolean }).__revealOK = true;
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.classList.add("in");
            io.unobserve(el);
            // Once revealed, drop the reveal styles so the element's own hover transitions are not delayed.
            el.addEventListener("transitionend", function done(ev) {
              if (ev.target !== el || ev.propertyName !== "opacity") return;
              el.classList.remove("reveal", "in");
              el.removeEventListener("transitionend", done);
            });
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Pauses looping animations in sections that are scrolled out of view (see `.is-offscreen` in CSS). */
function usePauseOffscreen() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => e.target.classList.toggle("is-offscreen", !e.isIntersecting)),
    );
    document.querySelectorAll("[data-loop]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function App() {
  useReveal();
  usePauseOffscreen();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <HeroSection />
        <VideoSection />
        <FeaturesSection />
        <LilyAssistantSection />
        <WorkflowSection />
        <LeadCaptureForm />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
