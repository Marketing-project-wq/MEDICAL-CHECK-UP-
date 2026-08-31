// Pure renderer for the MCU analysis result returned by my.20fit.id's
// POST /api/analyze-mcu (the REAL backend contract — verified against the
// my20fit-dashboard source, not an aspirational spec). Shape:
//   {
//     patient_name: string|null, summary: string, grade: "A"|"B"|"C"|"D",
//     metrics: [{label, value, status: "ok"|"high"|"low"|"warning", note}],
//     recommendations: [string],
//     checklist: [{icon, title, reason, priority: "high"|"med"|"low",
//                  duration: string|null, location: "gym"|"home"|"clinic"|null}],
//     doctor_notes: string, reviewed_at: string,
//   }
// Used identically by the server (SSR sample) and the browser client (real
// results) so the example and real analyses look exactly the same.
// The safety disclaimer is ALWAYS rendered from `t` (fixed copy) — the
// backend does not return one, so it must never depend on `result` data.
// Dependency-free ESM.

import { escapeHtml } from "./escape.js";

const STATUS_CLASS = { ok: "ok", high: "attn", low: "attn", warning: "attn" };
const PRIORITY_CLASS = { high: "attn", med: "unk", low: "ok" };

function statusLabel(status, t) {
  if (status === "ok") return t.statusOk;
  if (status === "high") return t.statusHigh;
  if (status === "low") return t.statusLow;
  if (status === "warning") return t.statusWarning;
  return t.statusUnknown;
}

function directionArrow(status) {
  if (status === "high") return "▲";
  if (status === "low") return "▼";
  return "";
}

function priorityLabel(priority, t) {
  if (priority === "high") return t.priorityHigh;
  if (priority === "low") return t.priorityLow;
  return t.priorityMed;
}

function locationLabel(location, t) {
  if (location === "gym") return t.locationGym;
  if (location === "home") return t.locationHome;
  if (location === "clinic") return t.locationClinic;
  return "";
}

function list(items) {
  return (Array.isArray(items) ? items : [])
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .map((x) => `<li>${escapeHtml(x)}</li>`)
    .join("");
}

/**
 * @param {object} result  the raw /api/analyze-mcu response (or sample data)
 * @param {object} t       render labels for the language (getRenderLabels)
 * @returns {string} HTML
 */
export function renderResult(result, t) {
  const r = result || {};
  const metrics = Array.isArray(r.metrics) ? r.metrics : [];
  const checklist = Array.isArray(r.checklist) ? r.checklist : [];

  const disclaimer = `
    <div class="mcu-disclaimer" role="note">
      <strong>${escapeHtml(t.disclaimerTitle)}:</strong>
      ${escapeHtml(t.disclaimerText)}
    </div>`;

  const meta = [];
  if (r.reviewed_at) meta.push(`<span><strong>${escapeHtml(t.reviewedAt)}:</strong> ${escapeHtml(r.reviewed_at)}</span>`);
  if (r.grade) meta.push(`<span class="mcu-grade">${escapeHtml(t.gradeLabel)}: <strong>${escapeHtml(r.grade)}</strong></span>`);

  const header = `
    <div class="mcu-head">
      <h3>${r.patient_name ? `${escapeHtml(t.forPatient)}: ${escapeHtml(r.patient_name)}` : escapeHtml(t.resultTitle)}</h3>
      ${meta.length ? `<div class="mcu-meta">${meta.join("")}</div>` : ""}
    </div>`;

  const summary = r.summary
    ? `<p class="mcu-summary"><strong>${escapeHtml(t.summary)}:</strong> ${escapeHtml(r.summary)}</p>`
    : "";

  const rows = metrics.length
    ? metrics
        .map((m) => {
          const cls = STATUS_CLASS[m && m.status] || "unk";
          const arrow = directionArrow(m && m.status);
          return `<tr class="row-${cls}">
            <td data-label="${escapeHtml(t.colLabel)}"><span class="p-label">${escapeHtml(m && m.label)}</span></td>
            <td data-label="${escapeHtml(t.colValue)}" class="num">${arrow ? `<span class="arrow">${arrow}</span> ` : ""}${escapeHtml(m && m.value)}</td>
            <td data-label="${escapeHtml(t.colStatus)}"><span class="pill pill-${cls}">${escapeHtml(statusLabel(m && m.status, t))}</span></td>
            <td data-label="${escapeHtml(t.colNote)}" class="p-explain">${escapeHtml((m && m.note) || "")}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" class="muted">${escapeHtml(t.noMetrics)}</td></tr>`;

  const metricsHtml = `
    <section class="mcu-params">
      <h4>${escapeHtml(t.metricsHeading)}</h4>
      <div class="table-wrap">
        <table class="mcu-table">
          <thead>
            <tr>
              <th>${escapeHtml(t.colLabel)}</th>
              <th>${escapeHtml(t.colValue)}</th>
              <th>${escapeHtml(t.colStatus)}</th>
              <th>${escapeHtml(t.colNote)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;

  const recommendationsLi = list(r.recommendations);
  const recommendationsHtml = recommendationsLi
    ? `<section class="mcu-plans"><div class="plan"><h4>${escapeHtml(t.recommendationsHeading)}</h4><ul>${recommendationsLi}</ul></div></section>`
    : "";

  const checklistHtml = checklist.length
    ? `<section class="mcu-checklist">
        <h4>${escapeHtml(t.checklistHeading)}</h4>
        <div class="mcu-cards">
          ${checklist
            .map((c) => {
              const cls = PRIORITY_CLASS[c && c.priority] || "unk";
              const loc = locationLabel(c && c.location, t);
              const extras = [c && c.duration, loc].filter(Boolean).map(escapeHtml).join(" · ");
              return `<div class="mcu-card sev-${cls === "attn" ? "high" : cls === "ok" ? "low" : "mid"}">
                <div class="mcu-card-top">
                  <span class="mcu-card-label">${c && c.icon ? escapeHtml(c.icon) + " " : ""}${escapeHtml(c && c.title)}</span>
                  <span class="mcu-badge">${escapeHtml(priorityLabel(c && c.priority, t))}</span>
                </div>
                <p class="mcu-why">${escapeHtml(c && c.reason)}</p>
                ${extras ? `<p class="mcu-todo">${extras}</p>` : ""}
              </div>`;
            })
            .join("")}
        </div>
      </section>`
    : "";

  const doctorNotesHtml = r.doctor_notes
    ? `<section class="mcu-doctor-notes"><h4>${escapeHtml(t.doctorNotesHeading)}</h4><p>${escapeHtml(r.doctor_notes)}</p></section>`
    : "";

  return `<article class="mcu-result">
    ${disclaimer}
    ${header}
    ${summary}
    ${metricsHtml}
    ${recommendationsHtml}
    ${checklistHtml}
    ${doctorNotesHtml}
  </article>`;
}
