// Run with: npm test   (Node's built-in test runner; Google is stubbed, nothing real is called)
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig, slotsForDate, zonedToUtc, validateLead, confirmationEmail } from "./booking.mjs";
import { buildMime } from "./google.mjs";
import { createApp } from "./index.mjs";

const quiet = { info() {}, error() {} };
const baseEnv = { BOOKING_TZ: "Asia/Kolkata", CONFIRMATION_CC: "kaustubh.b1@isngs.com" };
const NOW = new Date("2026-10-01T00:00:00Z");

test("zonedToUtc handles offsets and DST", () => {
  assert.equal(zonedToUtc(2026, 10, 14, 9, 0, "Asia/Kolkata").toISOString(), "2026-10-14T03:30:00.000Z");
  assert.equal(zonedToUtc(2026, 3, 9, 9, 0, "America/New_York").toISOString(), "2026-03-09T13:00:00.000Z"); // EDT
  assert.equal(zonedToUtc(2026, 11, 2, 9, 0, "America/New_York").toISOString(), "2026-11-02T14:00:00.000Z"); // EST
});

test("slots: weekdays only, working hours, notice and range rules", () => {
  const c = loadConfig(baseEnv);
  assert.equal(slotsForDate("2026-10-14", c, NOW).length, 16); // Wed, 9-17 in 30 min slots
  assert.deepEqual(slotsForDate("2026-10-17", c, NOW), []); // Saturday
  assert.equal(slotsForDate("nope", c, NOW), null);
  assert.equal(slotsForDate("2026-02-31", c, NOW), null);
  assert.deepEqual(slotsForDate("2026-09-30", c, NOW), []); // in the past
  assert.deepEqual(slotsForDate("2027-06-01", c, NOW), []); // beyond the booking window
});

test("validation rejects bad input and strips markup/control characters", () => {
  assert.ok(validateLead({ name: "A", company: "B", email: "a@b", phone: "1234567" }).error);
  assert.ok(validateLead({ name: "A", company: "B", email: "a@b.com", phone: "12" }).error);
  const ok = validateLead({ name: "Jane\r\nBcc: x@y.z <b>", company: "Acme", email: "jane@acme.com", phone: "+1 555 123 4567" });
  assert.equal(ok.lead.name, "Jane Bcc: x@y.z b"); // no CR/LF, no angle brackets
  assert.ok(validateLead({ name: "A", company: "B", email: "a@b.com\r\nBcc: evil@x.com", phone: "1234567" }).error);
});

test("MIME message has To, Cc, encoded subject and both bodies", () => {
  const mime = buildMime({ to: "u@x.com", cc: "kaustubh.b1@isngs.com", subject: "Booked: café", text: "plain body", html: "<p>html body</p>" });
  assert.match(mime, /^To: u@x\.com\r\nCc: kaustubh\.b1@isngs\.com\r\nSubject: =\?UTF-8\?B\?/);
  const parts = [...mime.matchAll(/base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)].map((m) => Buffer.from(m[1].replace(/\r\n/g, ""), "base64").toString());
  assert.deepEqual(parts, ["plain body", "<p>html body</p>"]);
});

test("confirmation email escapes HTML and shows the time in the team's zone", () => {
  const start = new Date("2026-10-14T05:00:00Z");
  const mail = confirmationEmail({ lead: { name: "<script>x</script>", company: "A&B", phone: "123" }, start, end: new Date(start.getTime() + 1.8e6), timeZone: "America/New_York", meetLink: "https://meet.google.com/abc" });
  assert.ok(!mail.html.includes("<script>"));
  assert.match(mail.html, /A&amp;B/);
  assert.match(mail.text, /Wednesday, 14 October 2026 at 01:00 \(Eastern Daylight Time\)/);
});

async function withServer(env, fetchImpl, fn) {
  const server = http.createServer(createApp(env, { fetchImpl, now: () => NOW, log: quiet }));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}
const post = (base, path, body) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => [r.status, await r.json()]);
const lead = { name: "Jane Doe", company: "Acme", email: "jane@acme.com", phone: "+1 555 123 4567" };

test("demo mode (no credentials) books nothing and says so", async () => {
  await withServer(baseEnv, undefined, async (base) => {
    const a = await (await fetch(base + "/api/availability?date=2026-10-14")).json();
    assert.equal(a.demo, true);
    assert.equal(a.slots.length, 16);
    const [s, b] = await post(base, "/api/book", { ...lead, start: a.slots[2].start, timeZone: "Asia/Kolkata" });
    assert.equal(s, 200);
    assert.deepEqual([b.demo, b.emailSent], [true, false]);
    assert.equal((await post(base, "/api/book", { ...lead, start: "2026-10-14T03:31:00.000Z" }))[0], 409); // not a real slot
    assert.equal((await post(base, "/api/email-only", { ...lead, email: "bad" }))[0], 400);
  });
});

test("live mode: free/busy check, event with attendee, email to visitor cc the team", async () => {
  const calls = [];
  const slotStart = "2026-10-14T04:00:00.000Z"; // 09:30 IST
  const fakeGoogle = async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? init.body.toString() : "" });
    const reply = (obj) => new Response(JSON.stringify(obj), { status: 200 });
    if (String(url).includes("oauth2.googleapis.com")) return reply({ access_token: "tok", expires_in: 3600 });
    if (String(url).includes("freeBusy")) return reply({ calendars: { primary: { busy: calls.filter((c) => c.url.includes("freeBusy")).length === 1 ? [{ start: "2026-10-14T03:30:00Z", end: "2026-10-14T04:00:00Z" }] : [] } } });
    if (String(url).includes("/events")) return reply({ id: "evt1", htmlLink: "https://cal/x", hangoutLink: "https://meet.google.com/abc-defg" });
    if (String(url).includes("messages/send")) return reply({ id: "m1" });
    return new Response("?", { status: 500 });
  };
  const env = { ...baseEnv, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret", GOOGLE_REFRESH_TOKEN: "refresh" };
  await withServer(env, fakeGoogle, async (base) => {
    const a = await (await fetch(base + "/api/availability?date=2026-10-14")).json();
    assert.equal(a.demo, false);
    assert.equal(a.slots.length, 15); // the 09:00 slot is busy
    assert.ok(!a.slots.some((s) => s.start === "2026-10-14T03:30:00.000Z"));
    const [s, b] = await post(base, "/api/book", { ...lead, start: slotStart, });
    assert.equal(s, 200);
    assert.deepEqual([b.demo, b.emailSent, b.meetLink], [false, true, "https://meet.google.com/abc-defg"]);
    const event = JSON.parse(calls.find((c) => c.url.includes("/events")).body);
    assert.equal(event.attendees[0].email, "jane@acme.com");
    assert.ok(calls.find((c) => c.url.includes("/events")).url.includes("sendUpdates=none"));
    const mail = JSON.parse(calls.find((c) => c.url.includes("messages/send")).body);
    const raw = Buffer.from(mail.raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    assert.match(raw, /^To: jane@acme\.com\r\nCc: kaustubh\.b1@isngs\.com\r\n/);
    const [s2, b2] = await post(base, "/api/email-only", lead);
    assert.deepEqual([s2, b2.emailSent], [200, true]);
  });
});

test("live mode: a slot that became busy is rejected with 409", async () => {
  const fakeGoogle = async (url) => {
    const reply = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (String(url).includes("oauth2")) return reply({ access_token: "t", expires_in: 3600 });
    return reply({ calendars: { primary: { busy: [{ start: "2026-10-14T04:00:00Z", end: "2026-10-14T04:30:00Z" }] } } });
  };
  const env = { ...baseEnv, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s", GOOGLE_REFRESH_TOKEN: "r" };
  await withServer(env, fakeGoogle, async (base) => {
    assert.equal((await post(base, "/api/book", { ...lead, start: "2026-10-14T04:00:00.000Z" }))[0], 409);
  });
});

test("Google failures surface as a generic 502, never leaking details", async () => {
  const env = { ...baseEnv, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s", GOOGLE_REFRESH_TOKEN: "r" };
  await withServer(env, async () => new Response("invalid_grant secret details", { status: 400 }), async (base) => {
    const [s, b] = await post(base, "/api/email-only", lead);
    assert.equal(s, 502);
    assert.ok(!JSON.stringify(b).includes("invalid_grant"));
  });
});

test("static hosting: serves the site, supports Range, blocks path traversal", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fe-dist-"));
  fs.mkdirSync(path.join(dir, "assets"));
  fs.writeFileSync(path.join(dir, "index.html"), "<h1>home</h1>");
  fs.writeFileSync(path.join(dir, "assets", "app-abc.js"), "console.log(1)");
  fs.writeFileSync(path.join(dir, "video.mp4"), "0123456789");
  fs.writeFileSync(path.join(path.dirname(dir), "secret.txt"), "nope");
  try {
    await withServer({ ...baseEnv, STATIC_DIR: dir }, undefined, async (base) => {
      const home = await fetch(base + "/");
      assert.equal(home.status, 200);
      assert.equal(await home.text(), "<h1>home</h1>");
      assert.equal(home.headers.get("cache-control"), "no-cache");
      assert.match((await fetch(base + "/assets/app-abc.js")).headers.get("cache-control"), /immutable/);
      const part = await fetch(base + "/video.mp4", { headers: { Range: "bytes=2-5" } });
      assert.equal(part.status, 206);
      assert.equal(part.headers.get("content-range"), "bytes 2-5/10");
      assert.equal(await part.text(), "2345");
      assert.equal((await fetch(base + "/video.mp4", { headers: { Range: "bytes=99-" } })).status, 416);
      assert.equal((await fetch(base + "/%2e%2e/secret.txt")).status, 404);
      assert.equal((await fetch(base + "/nope.html")).status, 404);
      assert.equal((await fetch(base + "/api/health")).status, 200); // API still wins over static
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(path.join(path.dirname(dir), "secret.txt"), { force: true });
  }
});
