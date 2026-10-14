/** Serves the built site (dist/) so one Node process can host both the page and the API. Supports Range (video seeking). */
import fs from "node:fs";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

/** Returns a handler (req, res, pathname) => boolean (true when it served the request). */
export function createStatic(dir) {
  const root = path.resolve(dir);
  return function serve(req, res, pathname) {
    let rel;
    try { rel = decodeURIComponent(pathname); } catch { return false; }
    const file = path.join(root, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(root + path.sep)) return false; // no path traversal
    let st;
    try { st = fs.statSync(file); } catch { return false; }
    if (!st.isFile()) return false;

    const ext = path.extname(file).toLowerCase();
    const headers = {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
      // Vite's hashed files never change; everything else is revalidated soon.
      "Cache-Control": rel.startsWith("/assets/") ? "public, max-age=31536000, immutable" : ext === ".html" ? "no-cache" : "public, max-age=3600",
    };

    let start = 0;
    let end = st.size - 1;
    let status = 200;
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range && (range[1] || range[2])) {
      start = range[1] ? Number(range[1]) : Math.max(0, st.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) {
        res.writeHead(416, { "Content-Range": `bytes */${st.size}` });
        res.end();
        return true;
      }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${st.size}`;
    }
    headers["Content-Length"] = end - start + 1;
    res.writeHead(status, headers);
    if (req.method === "HEAD") res.end();
    else fs.createReadStream(file, { start, end }).pipe(res);
    return true;
  };
}
