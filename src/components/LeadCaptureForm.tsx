import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { FORM_ENDPOINT } from "../config";
import type { Lead } from "../api";
import ScheduleCallModal, { type Outcome } from "./ScheduleCallModal";

type Values = Lead;
type Errors = Partial<Record<keyof Values, string>>;
type Status = "idle" | "submitting" | "ok" | "demo" | "dismissed" | "error";

const FIELDS = [
  { key: "name", label: "Name", placeholder: "Enter your name", type: "text", autoComplete: "name" },
  { key: "company", label: "Company Name", placeholder: "Enter your company name", type: "text", autoComplete: "organization" },
  { key: "email", label: "Email", placeholder: "Enter your email", type: "email", autoComplete: "email" },
  { key: "phone", label: "Phone Number", placeholder: "Enter your phone number", type: "tel", autoComplete: "tel" },
] as const;

const EMPTY: Values = { name: "", company: "", email: "", phone: "" };

const PHONE_EXAMPLE = "(555) 234-5678";

/** The 10 US digits in a string (a leading country code 1 is dropped). */
const usDigits = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  return (d.length > 10 && d[0] === "1" ? d.slice(1) : d).slice(0, 10);
};

/** Formats digits as the visitor types: 555 -> "(555", 5552 -> "(555) 2", 5552345678 -> "(555) 234-5678". */
function formatUsPhone(digits: string) {
  if (digits.length <= 3) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function validateField(key: keyof Values, raw: string): string {
  const v = raw.trim();
  if (!v) return `Please enter ${key === "email" ? "your email" : key === "company" ? "your company name" : key === "phone" ? "your phone number" : "your name"}.`;
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Please enter a valid email address, like name@company.com.";
  if (key === "phone" && !/^[2-9]\d{2}[2-9]\d{6}$/.test(usDigits(v)))
    return `Please enter a 10-digit US phone number, like ${PHONE_EXAMPLE}.`;
  return "";
}

/**
 * Optional lead delivery to your own endpoint (e.g. a CRM webhook). With no VITE_FORM_ENDPOINT configured nothing
 * is posted here: the visitor's details then reach the team through the scheduling step (calendar event and the
 * confirmation email, cc the team), see server/index.mjs.
 */
async function submitEnquiry(values: Values): Promise<void> {
  if (!FORM_ENDPOINT) return;
  const res = await fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

export default function LeadCaptureForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [lead, setLead] = useState<Lead | null>(null); // set => the scheduling dialog is open
  const inFlight = useRef(false);
  const delivered = useRef(""); // the last payload already posted to FORM_ENDPOINT (avoids duplicates on re-submit)
  const formRef = useRef<HTMLFormElement>(null);

  const setField = (key: keyof Values, raw: string) => {
    let value = raw;
    if (key === "phone") {
      // Mask as they type. Deleting a bracket/space/dash must remove a digit, otherwise the mask would put it back.
      let digits = usDigits(raw);
      if (raw.length === values.phone.length - 1 && digits === usDigits(values.phone)) digits = digits.slice(0, -1);
      value = formatUsPhone(digits);
    }
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: validateField(key, value) || undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return; // prevent duplicate submissions

    const next: Errors = {};
    for (const f of FIELDS) {
      const msg = validateField(f.key, values[f.key]);
      if (msg) next[f.key] = msg;
    }
    setErrors(next);
    const firstBad = FIELDS.find((f) => next[f.key]);
    if (firstBad) {
      formRef.current?.querySelector<HTMLInputElement>(`#field-${firstBad.key}`)?.focus();
      return;
    }

    inFlight.current = true;
    setStatus("submitting");
    try {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])) as Values;
      const key = JSON.stringify(trimmed);
      if (delivered.current !== key) {
        await submitEnquiry(trimmed);
        delivered.current = key;
      }
      setStatus("idle");
      setLead(trimmed); // open "Schedule a call"
    } catch {
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  };

  const busy = status === "submitting";

  const onScheduleClose = (outcome: Outcome) => {
    setLead(null);
    if (!outcome) return setStatus("dismissed"); // closed without booking or choosing email: keep their details
    setValues(EMPTY);
    setStatus(outcome.demo ? "demo" : "ok");
  };

  return (
    <section id="enquiry" className="section section--form">
      <div className="container enquiry">
        <div className="enquiry__copy reveal">
          <p className="eyebrow">Get in touch</p>
          <h2>Let’s Talk Growth.</h2>
          <p className="lead">See how Franchise Engine can fit your franchise growth strategy.</p>
          <ul className="enquiry__recap" aria-label="What Franchise Engine connects">
            <li>Targeted franchise advertising</li>
            <li>Lily, AI-powered prospect engagement</li>
            <li>Automated meeting booking</li>
          </ul>
        </div>

        <div className="formcard reveal">
          <h3>Tell Us About You</h3>
          <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={busy}>
            <div className="formcard__fields">
              {FIELDS.map((f) => {
                const err = errors[f.key];
                return (
                  <div className="field" key={f.key}>
                    <label htmlFor={`field-${f.key}`}>
                      {f.label} <span className="req" aria-hidden="true">*</span>
                    </label>
                    <div className={f.key === "phone" ? "phone" : undefined}>
                    {f.key === "phone" && <span className="phone__prefix" aria-hidden="true">+1</span>}
                    <input
                      id={`field-${f.key}`}
                      name={f.key}
                      type={f.type}
                      inputMode={f.type === "tel" ? "tel" : undefined}
                      maxLength={f.key === "phone" ? 14 : undefined}
                      autoComplete={f.key === "phone" ? "tel-national" : f.autoComplete}
                      placeholder={f.placeholder}
                      value={values[f.key]}
                      required
                      aria-required="true"
                      aria-invalid={err ? true : undefined}
                      aria-describedby={err ? `err-${f.key}` : f.key === "phone" ? "hint-phone" : undefined}
                      disabled={busy}
                      onChange={(e) => setField(f.key, e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value || errors[f.key]) {
                          const msg = validateField(f.key, e.target.value);
                          setErrors((p) => ({ ...p, [f.key]: msg || undefined }));
                        }
                      }}
                    />
                    </div>
                    {f.key === "phone" && !err && (
                      <p className="field__hint" id="hint-phone">US number, for example {PHONE_EXAMPLE}</p>
                    )}
                    {err && (
                      <p className="field__error" id={`err-${f.key}`}>
                        <AlertCircle size={14} aria-hidden="true" /> {err}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="spin" size={18} aria-hidden="true" /> Sending…
                </>
              ) : (
                "Start the Conversation"
              )}
            </button>

            <div className="formcard__status" role="status" aria-live="polite">
              {status === "ok" && (
                <p className="notice notice--ok">
                  <CheckCircle2 size={18} aria-hidden="true" /> Thank you. Your enquiry is complete and the team will be in touch.
                </p>
              )}
              {status === "demo" && (
                <p className="notice notice--demo">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>
                    <strong>Demo mode:</strong> the form and scheduling flow worked, but the booking service isn’t connected
                    to Google yet, so no call was booked and no email was sent.
                  </span>
                </p>
              )}
              {status === "dismissed" && (
                <p className="notice notice--info">
                  <AlertCircle size={18} aria-hidden="true" /> Your enquiry isn’t complete yet. Press “Start the Conversation” to choose a time or ask for an email.
                </p>
              )}
              {status === "error" && (
                <p className="notice notice--err">
                  <AlertCircle size={18} aria-hidden="true" /> Something went wrong and your enquiry was not sent. Please
                  try again in a moment.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
      <ScheduleCallModal lead={lead} onClose={onScheduleClose} />
    </section>
  );
}
