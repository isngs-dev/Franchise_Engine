import { LEGAL_LINKS } from "../config";
import { NAV_LINKS } from "../content";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__about">
          <Wordmark light />
          <p>
            Targeted franchise advertising, dynamic landing pages, AI prospect engagement and automated meeting booking,
            connected in one system.
          </p>
        </div>
        <nav aria-label="Footer" className="footer__links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
          <a href="#enquiry">Contact</a>
        </nav>
      </div>
      <div className="container footer__legal">
        <span>© {new Date().getFullYear()} Franchise Engine. All rights reserved.</span>
        {LEGAL_LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
      </div>
    </footer>
  );
}
