import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { CTA, NAV_LINKS } from "../content";
import Wordmark from "./Wordmark";
import CtaLink from "./CtaLink";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // Scrolled state: one IntersectionObserver on a sentinel at the top of the page,
  // so React only re-renders when the state actually flips (no scroll listener).
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Active section: highlight the nav link whose section crosses a band near the top of the viewport.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
          else setActive((cur) => (cur === e.target.id ? null : cur));
        }),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div ref={sentinel} className="nav-sentinel" aria-hidden="true" />
      <header className={`nav${scrolled ? " nav--scrolled" : ""}`}>
        <div className="container nav__bar">
          <a href="#top" className="nav__brand" aria-label="Franchise Engine, back to top" onClick={close}>
            <Wordmark />
          </a>

          <nav className="nav__links" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} aria-current={active === l.href.slice(1) ? "true" : undefined}>
                {l.label}
              </a>
            ))}
            <CtaLink href="#enquiry" size="sm" className="nav__cta">
              {CTA}
            </CtaLink>
          </nav>

          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        <nav id="mobile-menu" className="nav__mobile" aria-label="Mobile" hidden={!open}>
          <div className="container">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={close} aria-current={active === l.href.slice(1) ? "true" : undefined}>
                {l.label}
              </a>
            ))}
            <CtaLink href="#enquiry" onClick={close}>
              {CTA}
            </CtaLink>
          </div>
        </nav>
      </header>
    </>
  );
}
