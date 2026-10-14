import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarCheck, CheckCircle2, Loader2, Mail, Video, X } from "lucide-react";
import { ApiError, bookCall, getAvailability, requestEmail, type Lead, type Slot } from "../api";

export type Outcome = { kind: "booked" | "email"; demo: boolean } | null;

type View =
  | { name: "pick" }
  | { name: "booked"; start: string; meetLink: string | null; emailSent: boolean; demo: boolean }
  | { name: "emailed"; demo: boolean; emailSent: boolean };

const MAX_DAYS = 60; // keep in step with BOOKING_MAX_DAYS on the server

/** YYYY-MM-DD for a local calendar day offset from today. */
function dayString(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const dayLabel = (date: string) => dayFmt.format(new Date(`${date}T00:00:00Z`));

export default function ScheduleCallModal({ lead, onClose }: { lead: Lead | null; onClose: (outcome: Outcome) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const outcome = useRef<Outcome>(null);
  const [view, setView] = useState<View>({ name: "pick" });
  const [date, setDate] = useState(dayString());
  const [slots, setSlots] = useState<Slot[] | null>(null); // null = loading
  const [teamTz, setTeamTz] = useState("");
  const [demo, setDemo] = useState(false);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState<null | "book" | "email">(null);
  const [error, setError] = useState("");

  // Every time on this dialog is shown in the team's time zone (BOOKING_TZ on the server), e.g. America/New_York.
  const zone = teamTz || undefined;
  const timeFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: zone }), [zone]);
  const longFmt = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: zone }), [zone]);
  const zoneName = useMemo(() => {
    if (!teamTz) return "";
    try {
      const generic = new Intl.DateTimeFormat("en-US", { timeZone: teamTz, timeZoneName: "longGeneric" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
      return `${generic ?? teamTz} (${teamTz})`;
    } catch {
      return teamTz; // older browsers without the "longGeneric" option
    }
  }, [teamTz]);

  // Open/close the native <dialog> (it provides the focus trap, Esc handling and backdrop).
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (lead && !d.open) {
      outcome.current = null;
      setView({ name: "pick" });
      setSelected("");
      setError("");
      setBusy(null);
      d.showModal();
      d.scrollTop = 0; // always open at the top, even if focus lands lower in a short window
    } else if (!lead && d.open) d.close();
  }, [lead]);

  // On open, jump to the first day that has free times (looks up to two weeks ahead).
  useEffect(() => {
    if (!lead) return;
    const ctl = new AbortController();
    setSlots(null);
    (async () => {
      try {
        for (let i = 0; i < 14; i++) {
          const day = dayString(i);
          const a = await getAvailability(day, ctl.signal);
          setTeamTz(a.timezone);
          setDemo(a.demo);
          if (a.slots.length || i === 13) {
            setDate(a.slots.length ? day : dayString());
            setSlots(a.slots);
            return;
          }
        }
      } catch (err) {
        if (ctl.signal.aborted) return;
        setSlots([]);
        setError(err instanceof ApiError ? err.message : "Couldn’t load available times.");
      }
    })();
    return () => ctl.abort();
  }, [lead]);

  const chooseDate = async (next: string) => {
    setDate(next);
    setSelected("");
    setError("");
    if (!next) return;
    setSlots(null);
    try {
      setSlots((await getAvailability(next)).slots);
    } catch (err) {
      setSlots([]);
      setError(err instanceof ApiError ? err.message : "Couldn’t load available times.");
    }
  };

  // Move focus to the confirmation heading when the view changes.
  useEffect(() => {
    if (view.name !== "pick") heading.current?.focus();
  }, [view]);

  const finish = () => dialog.current?.close(); // the "close" event reports the outcome

  const book = async () => {
    if (!lead || !selected || busy) return;
    setBusy("book");
    setError("");
    try {
      const r = await bookCall(lead, selected);
      outcome.current = { kind: "booked", demo: r.demo };
      setView({ name: "booked", start: r.start, meetLink: r.meetLink, emailSent: r.emailSent, demo: r.demo });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiError && err.status === 409) chooseDate(date); // refresh: that time was taken
    } finally {
      setBusy(null);
    }
  };

  const emailOnly = async () => {
    if (!lead || busy) return;
    setBusy("email");
    setError("");
    try {
      const r = await requestEmail(lead);
      outcome.current = { kind: "email", demo: r.demo };
      setView({ name: "emailed", demo: r.demo, emailSent: r.emailSent });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const demoNote = "Demo mode: the booking service has no Google credentials yet, so nothing was booked and no email was sent.";

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="schedule-title"
      onCancel={(e) => busy && e.preventDefault()}
      onClose={() => onClose(outcome.current)}
      onClick={(e) => e.target === dialog.current && !busy && finish()} // click on the backdrop
    >
      <div className="modal__panel">
        <button type="button" className="modal__x" aria-label="Close" onClick={finish} disabled={Boolean(busy)}>
          <X size={20} aria-hidden="true" />
        </button>

        {view.name === "pick" && (
          <>
            <p className="eyebrow">Next step</p>
            <h2 id="schedule-title" tabIndex={-1} ref={heading}>Schedule a call</h2>
            <p className="muted">
              Pick a date and time that suits you{lead ? <>, and we’ll send a confirmation to <strong>{lead.email}</strong></> : null}.
            </p>

            <div className="field modal__date">
              <label htmlFor="call-date">Date</label>
              <input id="call-date" type="date" value={date} min={dayString()} max={dayString(MAX_DAYS)} onChange={(e) => chooseDate(e.target.value)} disabled={Boolean(busy)} />
            </div>

            <fieldset className="modal__times" disabled={Boolean(busy)}>
              <legend>{date ? dayLabel(date) : "Choose a date"}</legend>
              {slots === null ? (
                <div className="slots" aria-busy="true" aria-label="Loading available times">
                  {Array.from({ length: 6 }, (_, i) => <span key={i} className="slot slot--skeleton skeleton" />)}
                </div>
              ) : slots.length ? (
                <div className="slots" role="radiogroup" aria-label="Available times">
                  {slots.map((s) => (
                    <label key={s.start} className="slot">
                      <input type="radio" name="slot" value={s.start} checked={selected === s.start} onChange={() => setSelected(s.start)} />
                      <span>{timeFmt.format(new Date(s.start))}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="muted">No times are available on this day. Please pick another date.</p>
              )}
              {zoneName && <p className="modal__tz">All times are shown in {zoneName}.</p>}
            </fieldset>

            {demo && (
              <p className="notice notice--demo" role="status">
                <AlertCircle size={18} aria-hidden="true" />
                <span><strong>Demo mode:</strong> the booking service isn’t connected to Google yet, so nothing will be booked or sent.</span>
              </p>
            )}
            {error && (
              <p className="notice notice--err" role="alert">
                <AlertCircle size={18} aria-hidden="true" /> {error}
              </p>
            )}

            <div className="modal__actions">
              <button type="button" className="btn btn--primary btn--lg" onClick={book} disabled={!selected || Boolean(busy)}>
                {busy === "book" ? <><Loader2 className="spin" size={18} aria-hidden="true" /> Booking…</> : <><CalendarCheck size={18} aria-hidden="true" /> Book my call</>}
              </button>
              <button type="button" className="btn btn--secondary btn--lg" onClick={emailOnly} disabled={Boolean(busy)}>
                {busy === "email" ? <><Loader2 className="spin" size={18} aria-hidden="true" /> Sending…</> : <><Mail size={18} aria-hidden="true" /> No, just send me an email</>}
              </button>
            </div>
          </>
        )}

        {view.name === "booked" && (
          <div className="modal__done">
            <CheckCircle2 size={44} className="modal__tick" aria-hidden="true" />
            <h2 id="schedule-title" tabIndex={-1} ref={heading}>{view.demo ? "Demo: no call was booked" : "Your call is booked"}</h2>
            <p><strong>{longFmt.format(new Date(view.start))}</strong><br /><span className="muted">{zoneName}</span></p>
            {view.meetLink && (
              <p><a className="modal__link" href={view.meetLink} target="_blank" rel="noopener noreferrer"><Video size={16} aria-hidden="true" /> Google Meet link</a></p>
            )}
            {view.demo ? (
              <p className="notice notice--demo" role="status"><AlertCircle size={18} aria-hidden="true" /> {demoNote}</p>
            ) : view.emailSent ? (
              <p className="muted">A confirmation has been sent to {lead?.email}, with our team in copy.</p>
            ) : (
              <p className="notice notice--err" role="status"><AlertCircle size={18} aria-hidden="true" /> Your call is booked, but we couldn’t send the confirmation email. Our team will follow up with you.</p>
            )}
            <button type="button" className="btn btn--primary btn--lg" onClick={finish}>Done</button>
          </div>
        )}

        {view.name === "emailed" && (
          <div className="modal__done">
            <CheckCircle2 size={44} className="modal__tick" aria-hidden="true" />
            <h2 id="schedule-title" tabIndex={-1} ref={heading}>{view.demo ? "Demo: no email was sent" : "Thanks, we’ve emailed you"}</h2>
            {view.demo ? (
              <p className="notice notice--demo" role="status"><AlertCircle size={18} aria-hidden="true" /> {demoNote}</p>
            ) : (
              <p className="muted">We’ve sent a message to {lead?.email}, with our team in copy. We’ll follow up with you by email.</p>
            )}
            <button type="button" className="btn btn--primary btn--lg" onClick={finish}>Done</button>
          </div>
        )}
      </div>
    </dialog>
  );
}
