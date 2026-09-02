// Proxies to the REAL my.20fit.id analysis endpoint (verified against the
// my20fit-dashboard source: POST /api/analyze-mcu, multipart). AI is only
// ever called from here (the server) — never from the browser — and no AI
// key lives in this app either way, since my20fit-dashboard holds its own
// key. Per spec §0.1, /api/scan only ever calls this for an authenticated
// member (see scanHandlers.js); an anonymous document is never analyzed.

function dataUrlToBuffer(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";
  const buffer = isBase64 ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload), "utf8");
  return { mime, buffer };
}

/**
 * @returns {Promise<{ok:true, result:object} | {ok:false, status:number, code:string}>}
 */
export async function callAnalyzeMcu({ my20fitOrigin, dataUrl, mime, timeoutMs = 90_000 }) {
  const decoded = dataUrlToBuffer(dataUrl);
  if (!decoded || decoded.buffer.length === 0) {
    return { ok: false, status: 400, code: "no_file" };
  }

  const form = new FormData();
  const ext = mime === "image/png" ? "png" : mime === "application/pdf" ? "pdf" : "jpg";
  form.append("file", new Blob([decoded.buffer], { type: mime || decoded.mime }), `scan.${ext}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${my20fitOrigin}/api/analyze-mcu`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // body.error is a STABLE, well-known value on these two specific
      // cases (verified against the real my.20fit.id source) — safe to
      // translate ourselves, unlike the free-text body.message, which
      // stays log-only. Distinguishing these matters: before this, any
      // validation rejection (wrong document, missing fields) looked
      // identical to a generic "analysis failed", which is a much less
      // useful thing for someone to see after uploading a real document.
      const code = body.error === "not_mcu" ? "not_mcu" : body.error === "incomplete_mcu" ? "incomplete_mcu" : "analyze_failed";
      console.error(`analyze-mcu upstream error ${res.status} (${body.error || "?"}):`, body.message || "(no message)");
      return { ok: false, status: res.status, code };
    }
    return { ok: true, result: body };
  } catch (err) {
    if (err && err.name === "AbortError") {
      console.error(`callAnalyzeMcu timed out after ${timeoutMs}ms calling ${my20fitOrigin}/api/analyze-mcu`);
      return { ok: false, status: 504, code: "analyze_timeout" };
    }
    console.error("callAnalyzeMcu failed:", err);
    return { ok: false, status: 502, code: "analyze_failed" };
  } finally {
    clearTimeout(timer);
  }
}
