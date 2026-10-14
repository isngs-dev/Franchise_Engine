/** Pure booking logic: config, time zones, slots, validation and email content. No network, no secrets. */

export function loadConfig(env) {
  const num = (v, d) => (v !== undefined && v !== "" && Number.isFinite(+v) ? +v : d);
  return {
    tz: env.BOOKING_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone, // the team's time zone
    startHour: num(env.BOOKING_START_HOUR, 9),
    endHour: num(env.BOOKING_END_HOUR, 17),
    slotMinutes: num(env.BOOKING_SLOT_MINUTES, 30),
    days: (env.BOOKING_DAYS || "1,2,3,4,5").split(",").map((d) => +d.trim()), // 0 = Sunday
    minNoticeMinutes: num(env.BOOKING_MIN_NOTICE_MINUTES, 60),
    maxDays: num(env.BOOKING_MAX_DAYS, 60),
    cc: env.CONFIRMATION_CC || "kaustubh.b1@isngs.com",
  };
}

// ── time zones (no libraries: Intl does the work) ──────────────────────────────────────────────────────────────

function tzOffsetMs(date, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** Wall-clock time in `tz` -> UTC Date (handles DST). */
export function zonedToUtc(y, mo, d, hh, mm, tz) {
  const guess = Date.UTC(y, mo - 1, d, hh, mm);
  const off = tzOffsetMs(new Date(guess), tz);
  let t = guess - off;
  const off2 = tzOffsetMs(new Date(t), tz);
  if (off2 !== off) t = guess - off2;
  return new Date(t);
}

/** The calendar date (YYYY-MM-DD) of an instant in `tz`. */
export function businessDate(instant, tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

// ── slots ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Bookable slots for a business-time-zone date. Returns null for a malformed date. */
export function slotsForDate(dateStr, c, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr));
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1) return null;
  if (!c.days.includes(probe.getUTCDay())) return [];
  const earliest = now.getTime() + c.minNoticeMinutes * 60_000;
  const latest = now.getTime() + c.maxDays * 86_400_000;
  const out = [];
  for (let mins = c.startHour * 60; mins + c.slotMinutes <= c.endHour * 60; mins += c.slotMinutes) {
    const start = zonedToUtc(y, mo, d, Math.floor(mins / 60), mins % 60, c.tz);
    const end = new Date(start.getTime() + c.slotMinutes * 60_000);
    if (start.getTime() >= earliest && start.getTime() <= latest) out.push({ start: start.toISOString(), end: end.toISOString() });
  }
  return out;
}

export const overlaps = (slot, busy) => busy.some((b) => new Date(slot.start) < new Date(b.end) && new Date(slot.end) > new Date(b.start));

// ── validation ──────────────────────────────────────────────────────────────────────────────────────────────────

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** US (NANP) phone number -> "(555) 234-5678", or null. Accepts an optional leading +1 / 1. Area code and exchange start with 2-9. */
export function normalizeUsPhone(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return null;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Validates the visitor's details. Names/companies are stripped of control characters (no header injection). */
export function validateLead(body) {
  const lead = {
    name: clean(body?.name, 100),
    company: clean(body?.company, 120),
    email: String(body?.email ?? "").trim().slice(0, 254),
    phone: clean(body?.phone, 30),
  };
  if (!lead.name || !lead.company) return { error: "Name and company are required." };
  if (!/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/.test(lead.email)) return { error: "A valid email address is required." };
  const phone = /^[+\d\s().-]+$/.test(lead.phone) ? normalizeUsPhone(lead.phone) : null;
  if (!phone) return { error: "A valid US phone number is required." };
  lead.phone = phone;
  return { lead };
}

// ── email content ───────────────────────────────────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const compact = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function shell(title, bodyHtml) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#faf7f2;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e3da;border-radius:14px;padding:28px;color:#344054;line-height:1.6">
<p style="margin:0 0 18px;font-weight:700;font-size:18px;color:#14283f">Franchise<span style="color:#c2410c">Engine</span></p>
<h1 style="margin:0 0 14px;font-size:20px;color:#14283f">${esc(title)}</h1>${bodyHtml}</div></div>`;
}

function detailsList(lead) {
  return `<ul style="padding-left:18px;margin:8px 0 0"><li>Name: ${esc(lead.name)}</li><li>Company: ${esc(lead.company)}</li><li>Phone: ${esc(lead.phone)}</li></ul>`;
}

/** Booking confirmation, with times shown in the team's time zone (the same one the booking page shows). */
export function confirmationEmail({ lead, start, end, timeZone, meetLink }) {
  const when = new Intl.DateTimeFormat("en-GB", { timeZone, dateStyle: "full", timeStyle: "short" }).format(start);
  const zone = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "long" }).formatToParts(start).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  const addUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Call with Franchise Engine") +
    `&dates=${compact(start)}/${compact(end)}` + (meetLink ? "&location=" + encodeURIComponent(meetLink) : "");
  const subject = `Your call with Franchise Engine is booked: ${new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(start)}`;
  const text = [
    `Hi ${lead.name},`, "",
    "Thank you for getting in touch. Your call with the Franchise Engine team is booked.", "",
    `When: ${when} (${zone})`,
    meetLink ? `Join: ${meetLink}` : "", `Add to calendar: ${addUrl}`, "",
    "Your details:", `Name: ${lead.name}`, `Company: ${lead.company}`, `Phone: ${lead.phone}`, "",
    "Need to change the time? Just reply to this email.", "", "Franchise Engine",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  const html = shell("Your call is booked", `<p style="margin:0 0 12px">Hi ${esc(lead.name)}, thank you for getting in touch. Your call with the Franchise Engine team is booked.</p>
<p style="margin:0 0 6px"><strong>${esc(when)}</strong><br><span style="color:#667085">${esc(zone)}</span></p>
${meetLink ? `<p style="margin:14px 0"><a href="${esc(meetLink)}" style="background:#c2410c;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:700;display:inline-block">Join the call</a></p>` : ""}
<p style="margin:0 0 14px"><a href="${esc(addUrl)}" style="color:#c2410c">Add to Google Calendar</a></p>
<p style="margin:14px 0 0"><strong>Your details</strong></p>${detailsList(lead)}
<p style="margin:16px 0 0;color:#667085">Need to change the time? Just reply to this email.</p>`);
  return { subject, text, html };
}

/** For visitors who chose email instead of a call. */
export function enquiryEmail({ lead }) {
  const subject = "Thanks for contacting Franchise Engine";
  const text = [
    `Hi ${lead.name},`, "",
    "Thank you for getting in touch. We have your details and will follow up with you by email.", "",
    "Your details:", `Name: ${lead.name}`, `Company: ${lead.company}`, `Phone: ${lead.phone}`, "",
    "If you would like a call, just reply to this email.", "", "Franchise Engine",
  ].join("\n");
  const html = shell("Thanks for getting in touch", `<p style="margin:0 0 12px">Hi ${esc(lead.name)}, thank you for getting in touch. We have your details and will follow up with you by email.</p>
<p style="margin:14px 0 0"><strong>Your details</strong></p>${detailsList(lead)}
<p style="margin:16px 0 0;color:#667085">If you would like a call, just reply to this email.</p>`);
  return { subject, text, html };
}
