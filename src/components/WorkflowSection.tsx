import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Bell, Check, CalendarCheck } from "lucide-react";
import { STEPS } from "../content";

/** Small decorative UI for each step. Labels are generic; no figures or claims. */
const MINI: ReactNode[] = [
  // 1 AD
  <div className="mini mini-ad" key="1">
    <div className="mini__bar" /><div className="mini__bar w60" />
    <div className="hv__chips"><span className="chip">Meta</span><span className="chip">LinkedIn</span></div>
  </div>,
  // 2 LANDING PAGE
  <div className="mini mini-page" key="2">
    <div className="mini-page__top"><i /><i /><i /></div>
    <div className="mini__bar mini__bar--navy" /><div className="mini__bar w60" />
    <span className="hv-enq__btn">Explore the opportunity</span>
  </div>,
  // 3 LILY
  <div className="mini" key="3">
    <div className="bubble bubble--user">Hello, I have a question</div>
    <div className="bubble bubble--lily">Happy to help</div>
  </div>,
  // 4 QUALIFY
  <div className="mini mini-q" key="4">
    <div><Check size={13} aria-hidden="true" /> Goals</div>
    <div><Check size={13} aria-hidden="true" /> Interest</div>
    <div className="is-pending"><i /> Next steps</div>
  </div>,
  // 5 BOOKED CALL
  <div className="mini mini-cal" key="5">
    <div className="mini-cal__grid" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => <i key={i} className={i === 9 ? "on" : ""} />)}
    </div>
    <span className="mini-cal__ok"><CalendarCheck size={14} aria-hidden="true" /> Booked</span>
  </div>,
  // 6 CRM
  <div className="mini mini-crm" key="6">
    <div className="hv-crm__row"><span>Prospect details</span><em>Updated</em></div>
    <div className="hv-crm__row"><span>Conversation data</span><em>Updated</em></div>
  </div>,
  // 7 NURTURE
  <div className="mini mini-n" key="7">
    {[1, 2, 3].map((n) => (
      <div key={n}><Bell size={13} aria-hidden="true" /> Reminder {n}</div>
    ))}
  </div>,
];

export default function WorkflowSection() {
  const flow = useRef<HTMLOListElement>(null);

  // Progressive enhancement: draw the progress line once and mark the step nearest the
  // middle of the viewport as active. Without JS or with reduced motion the full line shows.
  useEffect(() => {
    const el = flow.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("flow--anim");
    const draw = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("flow--drawn");
          draw.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    draw.observe(el);
    const act = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-active", e.isIntersecting)),
      { rootMargin: "-42% 0px -42% 0px" },
    );
    [...el.children].forEach((s) => act.observe(s));
    return () => {
      draw.disconnect();
      act.disconnect();
    };
  }, []);

  return (
    <section id="how-it-works" className="section section--pattern" data-loop>
      <div className="deco-rings deco-rings--flow" aria-hidden="true" />
      <div className="container">
        <header className="section__head reveal">
          <p className="eyebrow">How it works</p>
          <h2>From First Click to Booked Conversation</h2>
        </header>

        <ol className="flow" ref={flow}>
          {STEPS.map((s, i) => (
            <li key={s.tag} className="flow__step reveal">
              <span className="flow__marker" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div className="flow__text">
                <p className="flow__tag">
                  <span className="flow__icon" aria-hidden="true"><s.icon size={15} strokeWidth={1.9} /></span>
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.tag}
                </p>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              <div className="flow__ui" aria-hidden="true">{MINI[i]}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
