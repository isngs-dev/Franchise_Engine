/**
 * One-time helper: signs in the Google account that will own the calendar and send the emails,
 * and prints a refresh token to put in server/.env as GOOGLE_REFRESH_TOKEN.
 *   npm run authorize
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env first. Nothing is written to disk.
 */
import http from "node:http";

const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env first (see server/.env.example).");
  process.exit(1);
}

const PORT = 53682;
const redirect = `http://localhost:${PORT}/oauth2callback`;
const scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/gmail.send",
];

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({ client_id: id, redirect_uri: redirect, response_type: "code", scope: scopes.join(" "), access_type: "offline", prompt: "consent" });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirect);
  if (url.pathname !== "/oauth2callback") { res.writeHead(404); return res.end(); }
  const code = url.searchParams.get("code");
  if (!code) { res.end("No authorisation code received. You can close this tab."); return; }
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" }),
    });
    const json = await r.json();
    if (!json.refresh_token) throw new Error(json.error_description || json.error || "No refresh token returned. Revoke the app's access in your Google account and run again.");
    res.end("Done. You can close this tab and go back to the terminal.");
    console.log("\nAdd this line to server/.env:\n\nGOOGLE_REFRESH_TOKEN=" + json.refresh_token + "\n");
  } catch (err) {
    res.end("Authorisation failed: " + err.message);
    console.error("Authorisation failed:", err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in a browser and sign in with the Google account that should own the calendar and send the emails:\n\n" + authUrl + "\n");
  console.log(`(The OAuth client must allow the redirect URI ${redirect}; a "Desktop app" client allows it automatically.)`);
});
