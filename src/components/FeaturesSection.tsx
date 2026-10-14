import type { CSSProperties } from "react";
import { FEATURES } from "../content";

export default function FeaturesSection() {
  return (
    <section id="features" className="section" data-loop>
      <div className="container">
        <header className="section__head reveal">
          <p className="eyebrow">What you get</p>
          <h2>Everything You Need to Turn Interest Into Action</h2>
        </header>

        <ul className="bento">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const isLily = i === 2;
            return (
              <li
                key={f.title}
                className={`feature reveal feature--${i + 1}${isLily ? " feature--lily" : ""}`}
                style={{ "--i": i % 3 } as CSSProperties}
              >
                <div className="feature__top">
                  <span className="feature__icon">
                    <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="feature__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {isLily && (
                  <div className="feature__lily" aria-hidden="true">
                    <span className="status"><i /> Lily</span>
                    <span className="chip chip--dark">Answers questions</span>
                    <span className="chip chip--dark">Qualifies interest</span>
                    <span className="chip chip--dark">Books meetings</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
