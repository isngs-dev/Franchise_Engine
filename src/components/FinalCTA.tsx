import { CTA } from "../content";
import CtaLink from "./CtaLink";

export default function FinalCTA() {
  return (
    <section className="section section--navy final" aria-labelledby="final-title" data-loop>
      <div className="navy-grid" aria-hidden="true" />
      <div className="deco-rings deco-rings--final" aria-hidden="true" />
      <div className="container final__inner reveal">
        <h2 id="final-title">Your Next Franchisee Could Be One Conversation Away.</h2>
        <p className="lead lead--light">Turn franchise interest into qualified conversations with Franchise Engine.</p>
        <CtaLink href="#enquiry" variant="light" size="lg">{CTA}</CtaLink>
      </div>
    </section>
  );
}
