// Cross-subdomain redirect safety helpers (spec §5).
// Dependency-free ESM — shared by the Node server, the browser client, and tests.
//
// The ONLY accepted redirect targets are https `*.20fit.id` hosts. Everything
// else (other schemes, external hosts, look-alikes, userinfo tricks, protocol-
// relative URLs) is rejected — this is the open-redirect guard.

const APEX = "20fit.id";
const SUFFIX = ".20fit.id";

/** Parse `raw` and return a URL only if it is an https `*.20fit.id` address. */
export function safe20fitUrl(raw) {
  if (typeof raw !== "string" || raw.length === 0) return null;
  let url;
  try {
    url = new URL(raw); // absolute URLs only → rejects "//evil.com", "/path"
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === APEX || host.endsWith(SUFFIX)) return url;
  return null;
}

/** Boolean form of {@link safe20fitUrl}. */
export function isSafe20fitUrl(raw) {
  return safe20fitUrl(raw) !== null;
}

/**
 * A safe SAME-ORIGIN relative path (must start with a single "/"). Blocks
 * protocol-relative ("//host") and backslash ("/\\host") tricks. Returns
 * `fallback` for anything unsafe.
 */
export function safeNextPath(raw, fallback = "/") {
  if (typeof raw !== "string" || raw.length === 0) return fallback;
  if (raw[0] !== "/") return fallback;
  if (raw[1] === "/" || raw[1] === "\\") return fallback;
  return raw;
}

/**
 * Build a `my.20fit.id/login?return_to=<url>` link. `returnTo` is only attached
 * when it is a valid `*.20fit.id` URL; otherwise the bare login URL is returned.
 */
export function buildLoginUrl(loginBase, returnTo) {
  let url;
  try {
    url = new URL(loginBase);
  } catch {
    return loginBase;
  }
  if (isSafe20fitUrl(returnTo)) url.searchParams.set("return_to", returnTo);
  return url.toString();
}
