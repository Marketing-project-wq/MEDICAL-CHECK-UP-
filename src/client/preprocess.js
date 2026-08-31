// Browser-side file preprocessing (spec §2 step 2). Runs entirely in the
// browser — the original file never leaves the device except as a downscaled
// JPEG data URL sent to /api/mcu. pdf.js is loaded from a CDN.

import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";

const MAX_DIM = 1500; // longest side for photos
const PDF_MAX_PAGES = 3;
const PDF_PAGE_WIDTH = 1240;
const JPEG_QUALITY = 0.8;

export const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_INPUT_BYTES = 8 * 1024 * 1024;

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error("read_failed"));
    fr.readAsArrayBuffer(file);
  });
}

function loadImage(blobUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_decode_failed"));
    img.src = blobUrl;
  });
}

async function downscalePhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
    const scale = Math.min(1, MAX_DIM / longest);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function pdfToJpeg(file) {
  const buf = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pageCount = Math.min(PDF_MAX_PAGES, pdf.numPages);

  const rendered = [];
  let totalHeight = 0;
  let maxWidth = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = PDF_PAGE_WIDTH / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    rendered.push(canvas);
    totalHeight += canvas.height;
    maxWidth = Math.max(maxWidth, canvas.width);
  }

  // Stack pages vertically into a single tall image.
  const combined = document.createElement("canvas");
  combined.width = maxWidth;
  combined.height = totalHeight;
  const cctx = combined.getContext("2d");
  cctx.fillStyle = "#ffffff";
  cctx.fillRect(0, 0, combined.width, combined.height);
  let y = 0;
  for (const c of rendered) {
    cctx.drawImage(c, 0, y);
    y += c.height;
  }

  // Constrain the combined image's longest side too, to keep payload small.
  const longest = Math.max(combined.width, combined.height) || 1;
  if (longest > MAX_DIM * 2) {
    const scale = (MAX_DIM * 2) / longest;
    const out = document.createElement("canvas");
    out.width = Math.round(combined.width * scale);
    out.height = Math.round(combined.height * scale);
    const octx = out.getContext("2d");
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(combined, 0, 0, out.width, out.height);
    return out.toDataURL("image/jpeg", JPEG_QUALITY);
  }
  return combined.toDataURL("image/jpeg", JPEG_QUALITY);
}

/**
 * Preprocess a user file into a JPEG data URL suitable for POST /api/mcu.
 * @returns {Promise<{ dataUrl: string, mime: "image/jpeg" }>}
 */
export async function preprocess(file) {
  if (file.type === "application/pdf") {
    return { dataUrl: await pdfToJpeg(file), mime: "image/jpeg" };
  }
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return { dataUrl: await downscalePhoto(file), mime: "image/jpeg" };
  }
  throw new Error("unsupported_type");
}
