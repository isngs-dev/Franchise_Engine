import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Check, Loader2, MessageCircleQuestion, Route, Sparkles } from "lucide-react";
import { SCENARIOS } from "../content";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lily replies on these stages; a typing indicator shows before each. */
const LILY_STAGES = new Set([2, 3, 5]);
const LAST_STAGE = 5;

/** What the simulated assistant is doing right now (drives the loading UI). */
type Busy = null | "typing" | "booking";

export default function LilyAssistantSection() {
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(() => (reducedMotion() ? LAST_STAGE : 0));
  const [busy, setBusy] = useState<Busy>(null);
  const [seen, setSeen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const s = SCENARIOS[idx];

  // Start the demo when the chat first scrolls into view, so the loading states are actually seen.
  useEffect(() => {
    const el = chat.current;
    if (!el || !("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Simulated, local-only playback. Restarts whenever a suggested question is chosen.
  useEffect(() => {
    setBusy(null);
    if (reducedMotion()) {
      setStage(LAST_STAGE);
      return;
    }
    setStage(0); // shows the loading skeleton until the first message arrives
    if (!seen) return;
    const timers: number[] = [];
    let at = 900; // skeleton shimmer before the conversation loads
    for (let n = 1; n <= LAST_STAGE; n++) {
      if (LILY_STAGES.has(n)) {
        const kind: Busy = n === LAST_STAGE ? "booking" : "typing";
        timers.push(window.setTimeout(() => setBusy(kind), at));
        at += kind === "booking" ? 1300 : 1000;
      }
      const stageNo = n;
      timers.push(
        window.setTimeout(() => {
          setBusy(null);
          setStage(stageNo);
        }, at),
      );
      at += 750;
    }
    return () => timers.forEach(window.clearTimeout);
  }, [idx, seen]);

  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [stage, busy]);

  const status = busy === "typing" ? "Lily is typing…" : busy === "booking" ? "Booking a meeting…" : "Interactive demo";

  return (
    <section id="lily" className="section section--navy" data-loop>
      <div className="navy-grid" aria-hidden="true" />
      <div className="deco-rings deco-rings--lily" aria-hidden="true" />
      <div className="container lily">
        <div className="lily__copy reveal">
          <p className="eyebrow eyebrow--light">Lily, your AI assistant</p>
          <h2>Meet Lily. Your Prospects’ First Conversation Starts Here.</h2>
          <p className="lead lead--light">
            From answering franchise questions to guiding interested prospects toward a meeting, Lily helps keep the
            conversation moving.
          </p>

          <ul className="lily__points">
            <li><MessageCircleQuestion size={18} aria-hidden="true" /> Gets prospects answers</li>
            <li><Route size={18} aria-hidden="true" /> Moves them through qualification</li>
            <li><CalendarCheck size={18} aria-hidden="true" /> Schedules a conversation with your team</li>
          </ul>

          <p className="lily__try" id="try-label">Try a sample question</p>
          <div className="lily__chips" role="group" aria-labelledby="try-label">
            {SCENARIOS.map((sc, i) => (
              <button
                key={sc.chip}
                type="button"
                className="qchip"
                aria-pressed={i === idx}
                onClick={() => setIdx(i)}
              >
                {sc.chip}
              </button>
            ))}
          </div>
        </div>

        <div className="chat reveal" data-busy={busy ?? undefined} ref={chat} aria-label="Simulated Lily conversation">
          <div className="chat__head">
            <span className="avatar avatar--ring" aria-hidden="true"><Sparkles size={16} /></span>
            <div>
              <strong>Lily</strong>
              <span className="status"><i /> {status}</span>
            </div>
            <span className="chat__tag">Simulated</span>
            <span className="chat__progress" aria-hidden="true" />
          </div>

          <div className="chat__body" ref={body} role="log" aria-live="polite" aria-relevant="additions">
            {stage === 0 && (
              <>
                <div className="skeleton skeleton--user" aria-hidden="true" />
                <div className="skeleton skeleton--lily" aria-hidden="true" />
              </>
            )}
            {stage >= 1 && <div className="bubble bubble--user">{s.question}</div>}
            {stage >= 2 && <div className="bubble bubble--lily">{s.answer}</div>}
            {stage >= 3 && <div className="bubble bubble--lily">{s.qualify}</div>}
            {stage >= 4 && <div className="bubble bubble--user">{s.reply}</div>}
            {stage >= 5 && (
              <div className="booking">
                <div className="booking__ok"><Check size={16} aria-hidden="true" /> Meeting booked</div>
                <strong>Intro conversation with the franchise team</strong>
                <span>Sample time: Tue, 10:30 AM</span>
                <ul>
                  <li>Details added to your CRM</li>
                  <li>Three reminders sent before the meeting</li>
                </ul>
              </div>
            )}
            {busy === "typing" && (
              <div className="bubble bubble--lily typing" role="status" aria-label="Lily is typing">
                <i /><i /><i />
              </div>
            )}
            {busy === "booking" && (
              <div className="booking booking--loading" role="status">
                <div className="booking__wait"><Loader2 className="spin" size={16} aria-hidden="true" /> Booking your meeting…</div>
                <span className="booking__bar" aria-hidden="true"><i /></span>
              </div>
            )}
          </div>

          <p className="chat__note">
            Fictional sample conversation for demonstration only. It is simulated, not an actual customer interaction.
          </p>
        </div>
      </div>
    </section>
  );
}
