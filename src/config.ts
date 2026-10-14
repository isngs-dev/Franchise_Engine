/**
 * Integration points. Everything that needs real data later is configured here.
 * Nothing in this file is secret: never put private API keys in frontend code.
 */

/**
 * Page video. The supplied file is the "Franchise Engine: The Automated Path to Growth" overview, so the
 * section is labelled as an overview rather than a client testimony.
 * To show the real client testimony later ("CR3 - Carnie's Video Testimony"), point `src` at that file and set
 * eyebrow "Client story", heading "Hear it directly from one of our clients" and caption to the testimony title.
 * `src` and `poster` are paths in /public. The video does not autoplay: it starts, with sound, when the
 * viewer presses the play button on the thumbnail.
 */
export const SITE_VIDEO = {
  eyebrow: "Watch",
  heading: "The Automated Path to Growth",
  caption: "A short overview of Franchise Engine, from first click to booked meeting.",
  title: "Franchise Engine: The Automated Path to Growth",
  src: "/Franchise Engine_ The Automated Path to Growth_1080p_caption.mp4",
  poster: "/video-poster.jpg",
};

/**
 * Enquiry form delivery. Set VITE_FORM_ENDPOINT (in a .env file or the host's
 * environment) to an HTTPS endpoint that accepts a JSON POST of
 * { name, company, email, phone }, e.g. a Formspree/Make/Zapier webhook or a
 * serverless function that forwards to your CRM.
 * When empty, the form runs in clearly labelled demo mode and sends nothing.
 */
export const FORM_ENDPOINT: string = import.meta.env.VITE_FORM_ENDPOINT ?? "";

/**
 * Booking API (server/index.mjs): availability, Google Calendar booking and Gmail confirmation emails.
 * In development Vite proxies /api to the local server. If the API lives on another origin, build with
 * VITE_API_BASE=https://your-api.example.com/api (and set ALLOWED_ORIGIN on the server).
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "/api";

/** Footer legal links. Add { label, href } entries once real pages exist. */
export const LEGAL_LINKS: { label: string; href: string }[] = [];
