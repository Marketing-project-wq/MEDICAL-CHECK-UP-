// Pure renderer for a spec §4 MCU `result`. Returns an HTML string.
// Used identically by the server (SSR sample) and the browser client (real
// results) so that the example and real analyses look exactly the same.
// Dependency-free ESM.

import { escapeHtml } from "./escape.js";

const STATUS_CLASS = { normal: "ok", attention: "attn", unknown: "unk" };
const SEVERITY_CLASS = { ringan: "sev-low", sedang: "sev-mid", tinggi: "sev-high" };

function statusLabel(status, t) {
  if (status === "attention") return t.statusAttention;
  if (status === "normal") return t.statusNormal;
  return t.statusUnknown;
}

function directionArrow(direction) {
  if (direction === "high") return "▲";
  if (direction === "low") return "▼";
  return "";
}

function severityLabel(severity, t) {
  if (severity === "tinggi") return t.severityTinggi;
  if (severity === "sedang") return t.severitySedang;
  return t.severityRingan;
}

function list(items) {
  return (Array.isArray(items) ? items : [])
    .filter((x) => typeof x === "string" && x.trim().length > 0)
    .map((x) => `<li>${escapeHtml(x)}</li>`)
    .join("");
}

function planBlock(title, items) {
  const li = list(items);
  if (!li) return "";
  return `<div class="plan"><h4>${escapeHtml(title)}</h4><ul>${li}</ul></div>`;
}

/**
 * @param {object} result  spec §4 result object
 * @param {object} t       render labels for the language (getRenderLabels)
 * @returns {string} HTML
 */
export function renderResult(result, t) {
  const r = result || {};
  const parameters = Array.isArray(r.parameters) ? r.parameters : [];
  const abnormal = Array.isArray(r.abnormal_findings) ? r.abnormal_findings : [];

  const meta = [];
  if (r.patient_name) meta.push(`<span><strong>${escapeHtml(t.forPatient)}:</strong> ${escapeHtml(r.patient_name)}</span>`);
  if (r.date) meta.push(`<span><strong>${escapeHtml(t.examDate)}:</strong> ${escapeHtml(r.date)}</span>`);

  const disclaimer = `
    <div class="mcu-disclaimer" role="note">
      <strong>${escapeHtml(t.disclaimerTitle)}:</strong>
      ${escapeHtml(r.disclaimer || "")}
    </div>`;

  const header = `
    <div class="mcu-head">
      <h3>${escapeHtml(r.document_type || "MCU")}</h3>
      ${meta.length ? `<div class="mcu-meta">${meta.join("")}</div>` : ""}
    </div>`;

  const summary = r.summary
    ? `<p class="mcu-summary"><strong>${escapeHtml(t.summary)}:</strong> ${escapeHtml(r.summary)}</p>`
    : "";

  const abnormalHtml = abnormal.length
    ? `<section class="mcu-abnormal">
        <h4>${escapeHtml(t.abnormal)}</h4>
        <div class="mcu-cards">
          ${abnormal
            .map((a) => {
              const sevClass = SEVERITY_CLASS[a && a.severity] || "sev-low";
              return `<div class="mcu-card ${sevClass}">
                <div class="mcu-card-top">
                  <span class="mcu-card-label">${escapeHtml(a && a.label)}</span>
                  <span class="mcu-card-value">${escapeHtml(a && a.value)}</span>
                  <span class="mcu-badge">${escapeHtml(severityLabel(a && a.severity, t))}</span>
                </div>
                <p class="mcu-why"><strong>${escapeHtml(t.whyItMatters)}:</strong> ${escapeHtml(a && a.why_it_matters)}</p>
                <p class="mcu-todo"><strong>${escapeHtml(t.whatToDo)}:</strong> ${escapeHtml(a && a.what_to_do)}</p>
              </div>`;
            })
            .join("")}
        </div>
      </section>`
    : "";

  const rows = parameters.length
    ? parameters
        .map((p) => {
          const cls = STATUS_CLASS[p && p.status] || "unk";
          const arrow = directionArrow(p && p.direction);
          return `<tr class="row-${cls}">
            <td data-label="${escapeHtml(t.colParameter)}">
              <span class="p-label">${escapeHtml(p && p.label)}</span>
              ${p && p.explanation ? `<span class="p-explain">${escapeHtml(p.explanation)}</span>` : ""}
            </td>
            <td data-label="${escapeHtml(t.colValue)}" class="num">${arrow ? `<span class="arrow">${arrow}</span> ` : ""}${escapeHtml(p && p.value)}</td>
            <td data-label="${escapeHtml(t.colRange)}" class="num">${escapeHtml(p && p.normal_range)}</td>
            <td data-label="${escapeHtml(t.colStatus)}"><span class="pill pill-${cls}">${escapeHtml(statusLabel(p && p.status, t))}</span></td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4" class="muted">${escapeHtml(t.noParameters)}</td></tr>`;

  const paramsHtml = `
    <section class="mcu-params">
      <h4>${escapeHtml(t.parameters)}</h4>
      <div class="table-wrap">
        <table class="mcu-table">
          <thead>
            <tr>
              <th>${escapeHtml(t.colParameter)}</th>
              <th>${escapeHtml(t.colValue)}</th>
              <th>${escapeHtml(t.colRange)}</th>
              <th>${escapeHtml(t.colStatus)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;

  const plans = [
    planBlock(t.eating, r.eating_plan),
    planBlock(t.exercise, r.exercise_plan),
    planBlock(t.lifestyle, r.lifestyle_plan),
  ].join("");
  const plansHtml = plans ? `<section class="mcu-plans">${plans}</section>` : "";

  const unreadable = list(r.unreadable);
  const unreadableHtml = unreadable
    ? `<section class="mcu-unreadable"><h4>${escapeHtml(t.unreadable)}</h4><ul>${unreadable}</ul></section>`
    : "";

  return `<article class="mcu-result">
    ${disclaimer}
    ${header}
    ${summary}
    ${abnormalHtml}
    ${paramsHtml}
    ${plansHtml}
    ${unreadableHtml}
  </article>`;
}
