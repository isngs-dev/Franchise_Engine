/** Minimal Google Calendar + Gmail client over plain REST (no SDK). Credentials come from the environment only. */
import { randomUUID } from "node:crypto";

export class GoogleError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const wrap76 = (s) => s.replace(/(.{76})/g, "$1\r\n");
const encodeHeader = (v) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v, "utf8").toString("base64")}?=`);

/** RFC 5322 multipart/alternative message. The sender is the authorised Gmail account. */
export function buildMime({ to, cc, subject, text, html }) {
  const boundary = "fe_" + randomUUID();
  const part = (type, body) =>
    [`--${boundary}`, `Content-Type: ${type}; charset="UTF-8"`, "Content-Transfer-Encoding: base64", "", wrap76(Buffer.from(body, "utf8").toString("base64"))].join("\r\n");
  return [
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    part("text/plain", text),
    part("text/html", html),
    `--${boundary}--`,
    "",
  ]
    .filter((l) => l !== null)
    .join("\r\n");
}

export function createGoogle({ clientId, clientSecret, refreshToken, calendarId = "primary", fetchImpl = fetch }) {
  let token = null; // { value, expires }

  async function call(url, init, what) {
    const res = await fetchImpl(url, init);
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON error body */ }
    if (!res.ok) throw new GoogleError(`${what} failed (${res.status})`, res.status, text.slice(0, 500));
    return json;
  }

  async function accessToken() {
    if (token && token.expires > Date.now() + 60_000) return token.value;
    const json = await call(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
      },
      "Token refresh",
    );
    token = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return token.value;
  }

  const authed = async (url, init, what) =>
    call(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" } }, what);

  return {
    /** Busy intervals on the booking calendar between two ISO instants. */
    async freeBusy(timeMin, timeMax) {
      const json = await authed(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        { method: "POST", body: JSON.stringify({ timeMin, timeMax, items: [{ id: calendarId }] }) },
        "Free/busy",
      );
      return json?.calendars?.[calendarId]?.busy ?? [];
    },

    /** Creates the event (with a Google Meet link). Invitations are not emailed by Google: our confirmation email covers that. */
    async createEvent({ summary, description, start, end, attendeeEmail }) {
      const json = await authed(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
        {
          method: "POST",
          body: JSON.stringify({
            summary,
            description,
            start: { dateTime: start },
            end: { dateTime: end },
            attendees: [{ email: attendeeEmail }],
            conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
          }),
        },
        "Create event",
      );
      return { id: json.id, link: json.htmlLink, meetLink: json.hangoutLink ?? null };
    },

    async sendMail(mail) {
      await authed(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        { method: "POST", body: JSON.stringify({ raw: b64url(buildMime(mail)) }) },
        "Send email",
      );
    },
  };
}
