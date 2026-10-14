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
