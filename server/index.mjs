/**
 * Booking API for the landing page: Google Calendar (event + availability) and Gmail (confirmation email).
 *   GET  /api/availability?date=YYYY-MM-DD   free slots for a date (team time zone)
 *   POST /api/book                            create the event, email the visitor (cc the team)
 *   POST /api/email-only                      "No, just send me an email"
 * Without GOOGLE_* credentials it runs in demo mode: it validates and logs, but books and sends nothing.
 */
import http from "node:http";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadConfig, slotsForDate, businessDate, overlaps, validateLead, confirmationEmail, enquiryEmail } from "./booking.mjs";
import { createGoogle } from "./google.mjs";
import { createStatic } from "./static.mjs";

export function createApp(env = process.env, { fetchImpl = fetch, now = () => new Date(), log = console } = {}) {
  const cfg = loadConfig(env);
  if (!env.BOOKING_TZ) log.info(`BOOKING_TZ is not set: using this server's time zone (${cfg.tz}). Set it to your team's IANA time zone.`);
  // Also serve the built site (dist/) so one process can host both the page and the API (e.g. a single Render web service).
  const staticDir = env.STATIC_DIR || fileURLToPath(new URL("../dist", import.meta.url));
  const serveStatic = fs.existsSync(staticDir) ? createStatic(staticDir) : null;
  const live = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN);
  const google = live
    ? createGoogle({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, refreshToken: env.GOOGLE_REFRESH_TOKEN, calendarId: env.GOOGLE_CALENDAR_ID || "primary", fetchImpl })
    : null;

  // Basic per-IP rate limiting: this endpoint sends email from the company mailbox, so it must not be a free relay.
  const hits = new Map();
  const limited = (ip, bucket, max, windowMs) => {
    const key = `${bucket}:${ip}`;
    const t = Date.now();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    recent.push(t);
    hits.set(key, recent);
    return recent.length > max;
  };

  const send = (res, status, body, extra = {}) => {
    res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra });
    res.end(JSON.stringify(body));
  };

  const readJson = (req) =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on("data", (c) => {
        size += c.length;
        if (size > 16_384) { reject(Object.assign(new Error("Body too large"), { status: 413 })); req.destroy(); }
        else chunks.push(c);
      });
      req.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
        catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); }
      });
      req.on("error", reject);
    });

  async function availability(url) {
    const date = url.searchParams.get("date");
    let slots = slotsForDate(date, cfg, now());
    if (slots === null) return [400, { error: "Invalid date." }];
    if (google && slots.length) {
      const busy = await google.freeBusy(slots[0].start, slots[slots.length - 1].end);
      slots = slots.filter((s) => !overlaps(s, busy));
    }
    return [200, { demo: !live, timezone: cfg.tz, slots }];
  }

  async function book(body) {
    const v = validateLead(body);
    if (v.error) return [400, { error: v.error }];
    const startDate = new Date(body.start);
    if (Number.isNaN(startDate.getTime())) return [400, { error: "Please choose a time." }];
    const slot = slotsForDate(businessDate(startDate, cfg.tz), cfg, now())?.find((s) => s.start === startDate.toISOString());
    if (!slot) return [409, { error: "That time is no longer available. Please pick another." }];

    if (!google) {
      log.info(`[demo] would book ${slot.start} for ${v.lead.email} (cc ${cfg.cc}); nothing booked or sent`);
      return [200, { ok: true, demo: true, start: slot.start, end: slot.end, meetLink: null, emailSent: false }];
    }

    if (overlaps(slot, await google.freeBusy(slot.start, slot.end))) return [409, { error: "That time was just taken. Please pick another." }];
    const event = await google.createEvent({
      summary: `Franchise Engine call: ${v.lead.name} (${v.lead.company})`,
      description: `Booked via the Franchise Engine website.\n\nName: ${v.lead.name}\nCompany: ${v.lead.company}\nEmail: ${v.lead.email}\nPhone: ${v.lead.phone}`,
      start: slot.start,
      end: slot.end,
      attendeeEmail: v.lead.email,
    });
    let emailSent = true;
    try {
      const mail = confirmationEmail({ lead: v.lead, start: new Date(slot.start), end: new Date(slot.end), timeZone: cfg.tz, meetLink: event.meetLink });
      await google.sendMail({ to: v.lead.email, cc: cfg.cc, ...mail });
    } catch (err) {
      emailSent = false; // the call IS booked; tell the visitor honestly
      log.error("Confirmation email failed:", err.message, err.body ?? "");
    }
    return [200, { ok: true, demo: false, start: slot.start, end: slot.end, meetLink: event.meetLink, emailSent }];
  }

  async function emailOnly(body) {
    const v = validateLead(body);
    if (v.error) return [400, { error: v.error }];
    if (!google) {
      log.info(`[demo] would email ${v.lead.email} (cc ${cfg.cc}); nothing sent`);
      return [200, { ok: true, demo: true, emailSent: false }];
    }
    await google.sendMail({ to: v.lead.email, cc: cfg.cc, ...enquiryEmail({ lead: v.lead }) });
    return [200, { ok: true, demo: false, emailSent: true }];
  }

  return async function handler(req, res) {
    const url = new URL(req.url, "http://localhost");
    const ip = (env.TRUST_PROXY ? String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() : "") || req.socket.remoteAddress || "?";
    const cors = env.ALLOWED_ORIGIN && req.headers.origin === env.ALLOWED_ORIGIN
      ? { "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", Vary: "Origin" }
      : {};
    if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }

    if (serveStatic && (req.method === "GET" || req.method === "HEAD") && !url.pathname.startsWith("/api/") && serveStatic(req, res, url.pathname)) return;

    try {
      let result;
      if (req.method === "GET" && url.pathname === "/api/health") result = [200, { ok: true, demo: !live }];
      else if (req.method === "GET" && url.pathname === "/api/availability") {
        if (limited(ip, "avail", 60, 60_000)) result = [429, { error: "Too many requests." }];
        else result = await availability(url);
      } else if (req.method === "POST" && (url.pathname === "/api/book" || url.pathname === "/api/email-only")) {
        if (limited(ip, "send", 10, 600_000)) result = [429, { error: "Too many requests. Please try again later." }];
        else {
          const body = await readJson(req);
          result = url.pathname === "/api/book" ? await book(body) : await emailOnly(body);
        }
      } else result = [404, { error: "Not found." }];
      send(res, result[0], result[1], cors);
    } catch (err) {
      if (err.status && err.status < 500 && !err.body) return send(res, err.status, { error: err.message }, cors);
      log.error("Request failed:", err.message, err.body ?? "");
      send(res, 502, { error: "The scheduling service had a problem. Please try again in a moment." }, cors);
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 8787;
  http.createServer(createApp()).listen(port, () => {
    const live = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN;
    console.log(`Booking API on http://localhost:${port} (${live ? "Google connected" : "DEMO MODE: no Google credentials, nothing is booked or sent"})`);
  });
}
