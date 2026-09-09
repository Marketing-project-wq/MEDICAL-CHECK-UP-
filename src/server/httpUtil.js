// Small dependency-free HTTP helpers shared by the server's POST route handlers.

export function bearerToken(req) {
  const header = req.headers.authorization;
  return header && header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

export function readJsonBody(req, maxBytes, overLimitCode = "body_too_large") {
  return new Promise((resolve, reject) => {
    const declaredLength = Number(req.headers["content-length"] || 0);
    if (declaredLength > maxBytes) {
      reject({ status: 413, code: overLimitCode });
      return;
    }
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject({ status: 413, code: overLimitCode });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject({ status: 400, code: "invalid_body" });
      }
    });
    req.on("error", () => reject({ status: 400, code: "invalid_body" }));
  });
}

export function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

// Best-effort in-memory sliding-window limiter (single instance per process;
// a hard backstop still belongs upstream for real abuse resistance).
export function createRateLimiter() {
  const hits = new Map();
  return function isRateLimited(key, windowMs, maxReq) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxReq) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);
    return false;
  };
}
