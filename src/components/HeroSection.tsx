import type { CSSProperties } from "react";
import { ArrowRight, ArrowDown, Check, CalendarCheck, Database, Megaphone, RefreshCw, Bell } from "lucide-react";
import { CTA } from "../content";
import CtaLink from "./CtaLink";

/** Flow connector between hero cards. Points right on desktop rows, down otherwise (CSS). */
const Link = ({ className }: { className: string }) => (
  <span className={`hv-link ${className}`} aria-hidden="true">
    <ArrowRight className="hv-link__r" size={16} />
    <ArrowDown className="hv-link__d" size={16} />
  </span>
);

function HeroVisual() {
  return (
    <figure className="hv" aria-label="Illustration of the Franchise Engine flow: an ad, a prospect enquiry, a Lily conversation, a booked meeting and a CRM update">
      <div className="hv__grid-bg" aria-hidden="true" />
      <svg className="hv__growth" viewBox="0 0 560 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="hv-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E0561B" stopOpacity="0.24" />
            <stop offset="1" stopColor="#E0561B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g>
          <rect className="gbar" x="34" y="460" width="38" height="60" rx="7" style={{ "--i": 0 } as CSSProperties} />
          <rect className="gbar" x="98" y="425" width="38" height="95" rx="7" style={{ "--i": 1 } as CSSProperties} />
          <rect className="gbar" x="162" y="440" width="38" height="80" rx="7" style={{ "--i": 2 } as CSSProperties} />
          <rect className="gbar" x="226" y="390" width="38" height="130" rx="7" style={{ "--i": 3 } as CSSProperties} />
          <rect className="gbar" x="290" y="405" width="38" height="115" rx="7" style={{ "--i": 4 } as CSSProperties} />
          <rect className="gbar" x="354" y="350" width="38" height="170" rx="7" style={{ "--i": 5 } as CSSProperties} />
          <rect className="gbar" x="418" y="370" width="38" height="150" rx="7" style={{ "--i": 6 } as CSSProperties} />
          <rect className="gbar" x="482" y="305" width="38" height="215" rx="7" style={{ "--i": 7 } as CSSProperties} />
        </g>
        <path className="garea" d="M0 470 C 90 462, 150 430, 230 380 S 360 290, 420 200 S 500 90, 540 62 L540 520 L0 520 Z" fill="url(#hv-area)" />
        <path className="gline" pathLength="1" d="M0 470 C 90 462, 150 430, 230 380 S 360 290, 420 200 S 500 90, 540 62" />
        <circle className="gring" cx="540" cy="62" r="7" />
        <circle className="gdot" cx="540" cy="62" r="6" />
      </svg>

      <div className="hv__card hv-ad hv--ghost">
        <span className="hv__step">1</span>
        <div className="hv__label"><Megaphone size={14} aria-hidden="true" /> Campaign</div>
        <div className="hv-ad__body">
          <strong>Own a franchise with [Your Brand]</strong>
          <span>Targeted ad shown to your ideal prospects</span>
        </div>
        <div className="hv__chips">
          <span className="chip">Meta</span>
          <span className="chip">LinkedIn</span>
        </div>
      </div>

      <Link className="hv-l1" />

      <div className="hv__card hv-enq">
        <span className="hv__step">2</span>
        <div className="hv__label">Prospect enquiry</div>
        <div className="hv-enq__page">
          <i /><i className="w60" />
          <span className="hv-enq__btn">Explore the opportunity</span>
        </div>
        <div className="hv__chips">
          <span className="chip chip--accent">Interested</span>
          <span className="chip">Qualifying</span>
        </div>
        <span className="hv__float hv__float--a" aria-hidden="true"><Bell size={12} /> New enquiry</span>
      </div>

      <Link className="hv-l2" />

      <div className="hv__card hv-lily hv--ghost">
        <span className="hv__step">3</span>
        <div className="hv__label">
          <span className="avatar avatar--sm" aria-hidden="true">L</span> Lily <span className="status"><i /> Sample</span>
        </div>
        <div className="bubble bubble--user">What does the franchise process look like?</div>
        <div className="bubble bubble--lily">Happy to walk you through it. Want to book a time with the team?</div>
      </div>

      <Link className="hv-l3" />

      <div className="hv__card hv-meet">
        <span className="hv__step">4</span>
        <div className="hv__label"><CalendarCheck size={14} aria-hidden="true" /> Meeting booked</div>
        <div className="hv-meet__row">
          <span className="hv-meet__tick"><Check size={14} aria-hidden="true" /></span>
          <div><strong>Conversation confirmed</strong><span>With your franchise team</span></div>
        </div>
      </div>

      <Link className="hv-l4" />

      <div className="hv__card hv-crm">
        <span className="hv__step">5</span>
        <div className="hv__label"><Database size={14} aria-hidden="true" /> CRM</div>
        <div className="hv-crm__row"><span>Prospect details</span><em>Updated</em></div>
        <div className="hv-crm__row"><span>Conversation data</span><em>Updated</em></div>
        <span className="hv__float hv__float--b" aria-hidden="true"><RefreshCw size={12} /> Synced</span>
      </div>

      <figcaption className="hv__caption">Illustrative example of the flow</figcaption>
    </figure>
  );
}

export default function HeroSection() {
  return (
    <section id="top" className="hero" data-loop>
      <div className="hero__bg" aria-hidden="true" />
      <div className="deco-rings deco-rings--hero" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">Franchise advertising, AI engagement &amp; meeting booking</p>
          <h1>Turn Franchise Interest Into Qualified Meetings.</h1>
          <p className="lead">
            From targeted advertising to AI-powered prospect engagement and automated meeting booking, Franchise Engine
            helps turn franchise interest into meaningful conversations with your team.
          </p>
          <div className="hero__ctas">
            <CtaLink href="#enquiry" size="lg">{CTA}</CtaLink>
            <CtaLink href="#how-it-works" variant="secondary" size="lg" arrow="down">See How It Works</CtaLink>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
