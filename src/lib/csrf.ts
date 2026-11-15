export function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const allowed = new Set<string>();
  if (host) allowed.add(host);
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
    } catch {
      /* ignore malformed app url */
    }
  }
  if (origin) {
    const hostName = new URL(origin).host;
    if (!allowed.has(hostName)) {
      const error = new Error("Forbidden");
      error.name = "CSRF";
      throw error;
    }
    return;
  }
  const site = req.headers.get("sec-fetch-site");
  if (site === "same-origin" || site === "same-site" || site === "none") return;
  const error = new Error("Forbidden");
  error.name = "CSRF";
  throw error;
}
