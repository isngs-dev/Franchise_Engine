# Franchise Engine landing page

React + TypeScript + Vite, plain CSS. Runtime dependencies: `react`, `react-dom`, `lucide-react` (icons), `@fontsource-variable/inter` (self-hosted font).

```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api to the booking server)
npm run server     # booking API on http://localhost:8787 (run in a second terminal)
npm test           # server tests (Google is stubbed)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## What still needs real inputs

| Item | Where | What to do |
| --- | --- | --- |
| Page video | `src/config.ts` → `SITE_VIDEO` | Currently the supplied overview video in `public/`. Swap `src`/`poster` (and the heading text) to use another file, e.g. the real client testimony. No autoplay: dimmed thumbnail with a play button; plays with sound on click. |
| Real lead delivery | `src/config.ts` → `FORM_ENDPOINT`, `src/components/LeadCaptureForm.tsx` → `submitEnquiry()` | Set `VITE_FORM_ENDPOINT` (in `.env`) to an HTTPS endpoint that accepts a JSON `POST` of `{ name, company, email, phone }` (Formspree, Make/Zapier webhook, or a serverless function that forwards to the CRM). Without it the form runs in labelled **demo mode** and sends nothing. Keep any CRM credentials server-side, never in this frontend. |
| Privacy policy / terms | `src/config.ts` → `LEGAL_LINKS` | Add `{ label, href }` entries; the footer renders them automatically. |
| Social share image | `index.html` | Add an `og:image` once a real asset exists. |

## Scheduling a call (Google Calendar + Gmail)

After the contact form is submitted, a "Schedule a call" dialog opens: the visitor picks a date and time, or chooses
**No, just send me an email**. Booking creates a Google Calendar event (with a Meet link) and sends a confirmation
email to the visitor, **cc kaustubh.b1@isngs.com**, through the Gmail API. The "email only" option sends a short
acknowledgement with the same cc. Available times come from the calendar's free/busy data.

The Google credentials live **only on the server** (`server/`), never in the frontend. Without them the server runs in
**demo mode**: the whole flow works, but the UI and logs say clearly that nothing was booked or sent.

One-time setup:

1. Google Cloud Console: create/select a project, enable the **Google Calendar API** and **Gmail API**, configure the
   OAuth consent screen and create an **OAuth client ID** (type "Desktop app" is simplest). For a Google Workspace
   (isngs.com) account choose user type **Internal**, otherwise refresh tokens of apps left in "Testing" expire after 7 days.
2. Copy `server/.env.example` to `server/.env` and fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   (and set `BOOKING_TZ` plus your real working hours and days).
3. Run `npm run authorize`, open the printed link, sign in with the Google account that should **own the calendar and send
   the emails**, and paste the printed `GOOGLE_REFRESH_TOKEN` into `server/.env`.
4. Run `npm run server` (restart it after editing `.env`).

Deploying: host `dist/` on any static host and run `server/index.mjs` somewhere with Node 22+ (set the same variables as
environment variables). Either route `/api` to the server, or set `VITE_API_BASE=https://your-api/api` when building and
`ALLOWED_ORIGIN=https://your-site` on the server. Set `TRUST_PROXY=1` behind a reverse proxy.

Notes: the endpoint sends email from your mailbox, so it is rate limited per IP (10 sends / 10 min) and only ever sends
fixed templates to the address the visitor typed (their name and company are escaped). Two visitors booking the same
slot at the same instant is guarded by a free/busy re-check just before the event is created, not by a lock.

## Deploying on Render

`render.yaml` defines one **web service** that builds the site and serves it together with the booking API, so there is
no CORS setup and `/api` just works.

1. Push the repo to GitHub, then in Render choose **New > Blueprint** and select the repo (or create a **Web Service**
   manually: build `npm install --include=dev && npm run build`, start `npm run server`, health check `/api/health`).
2. Enter the three secrets when prompted (copy them from your local `server/.env`): `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`. Do not commit them.
3. Check the non-secret variables in `render.yaml`, above all **`BOOKING_TZ`** (Render servers run in UTC, so without it the
   9-17 working hours would be UTC).
4. Add the final site address (the `https://<name>.onrender.com` URL and any custom domain) to the allowed origins of
   the chatbot widget on the chat server, otherwise it will not appear (it is blocked by CORS on unknown origins).
5. In Google Cloud keep the OAuth consent screen **Internal** (Workspace) or **In production**: tokens of apps left in
   "Testing" stop working after 7 days.

Environment variables (see `server/.env.example` for details): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REFRESH_TOKEN` (secrets); `BOOKING_TZ`, `BOOKING_START_HOUR`, `BOOKING_END_HOUR`, `BOOKING_SLOT_MINUTES`,
`BOOKING_DAYS`, `BOOKING_MIN_NOTICE_MINUTES`, `BOOKING_MAX_DAYS`, `GOOGLE_CALENDAR_ID`, `CONFIRMATION_CC`, `TRUST_PROXY=1`.
`PORT` is provided by Render.

## Content

Source copy lives in `src/content.ts` (features, seven workflow steps, CTA wording, nav links). The Lily demo conversations are fictional, simulated locally (no AI API, no keys) and labelled as such on the page.
