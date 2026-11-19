import QRCode from "qrcode";
import type { Lang } from "./types";

export type PrintDoc = {
  lang: Lang;
  university: string;
  title: string;
  subtitle: string;
  ref: string;
  dateText: string;
  paragraphs: string[];
  table?: { head: string[]; rows: string[][] };
  meta?: { label: string; value: string }[];
  qrValue: string;
  signer: string;
  signerRole: string;
  verify: string;
  footer?: string;
  fileBase: string;
};

const ACCENT = "#0e5b45";
const INK = "#14201a";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function printDoc(doc: PrintDoc) {
  QRCode.toDataURL(doc.qrValue, { width: 220, margin: 1, color: { dark: INK, light: "#ffffff" } })
    .then((qr) => {
      const table = doc.table
        ? `<table><thead><tr>${doc.table.head.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead><tbody>${doc.table.rows
            .map((row) => `<tr>${row.map((cell, index) => `<td${index === 0 ? ' class="wide"' : ""}>${escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        : "";
      const meta = doc.meta?.length
        ? `<div class="meta">${doc.meta.map((item) => `<div><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.value)}</b></div>`).join("")}</div>`
        : "";
      const html = `<!doctype html><html lang="${doc.lang}"><head><meta charset="utf-8"><title>${escapeHtml(doc.title)} ${escapeHtml(doc.ref)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: ${INK}; font-family: "Golos Text", "Segoe UI", Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm 17mm 16mm; display: flex; flex-direction: column; }
  .band { height: 6px; background: ${ACCENT}; margin: -18mm -17mm 12mm; }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 1.5px solid ${ACCENT}; padding-bottom: 10px; }
  .mark { width: 46px; height: 46px; border-radius: 13px; background: ${ACCENT}; color: #f8f4e8; display: grid; place-items: center; font-family: Georgia, serif; font-size: 24px; font-weight: 700; }
  .head div p { margin: 0; }
  .atlas { font-size: 20px; font-weight: 700; letter-spacing: 0.04em; }
  .uni { font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: #5b6660; margin-top: 3px; }
  .title { text-align: center; margin: 17mm 0 4mm; font-family: "Literata", Georgia, serif; font-size: 30px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }
  .subtitle { text-align: center; font-size: 14px; color: #4c5751; margin-bottom: 4mm; }
  .ref { text-align: center; font-size: 11.5px; color: #5b6660; letter-spacing: 0.05em; margin-bottom: 11mm; }
  p.body { font-size: 13.5px; line-height: 1.85; text-align: justify; margin: 0 0 5mm; }
  .name { font-family: "Literata", Georgia, serif; font-size: 19px; text-align: center; margin: 8mm 0 7mm; }
  table { width: 100%; border-collapse: collapse; margin: 2mm 0 6mm; font-size: 11.5px; }
  th { text-align: left; background: #eef4ef; color: ${ACCENT}; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 10px; border-bottom: 1px solid #cfdcd4; }
  td { padding: 7.5px 10px; border-bottom: 1px solid #e4e8e4; }
  td.wide { width: 60%; }
  tr:nth-child(even) td { background: #fafbf9; }
  .meta { display: flex; gap: 10mm; margin: 2mm 0 6mm; }
  .meta div { border-left: 2px solid ${ACCENT}; padding-left: 4mm; }
  .meta span { display: block; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #5b6660; }
  .meta b { font-size: 15px; }
  .foot { margin-top: auto; padding-top: 10mm; display: flex; align-items: flex-end; justify-content: space-between; gap: 8mm; }
  .sign { font-size: 11px; text-align: center; }
  .line { width: 55mm; border-bottom: 1px solid ${INK}; height: 12mm; margin-bottom: 2mm; }
  .line span { display: block; font-family: "Literata", Georgia, serif; font-size: 12px; color: #33413a; padding-left: 3mm; }
  .seal { width: 30mm; height: 30mm; border: 1.2px dashed ${ACCENT}; border-radius: 50%; display: grid; place-items: center; color: ${ACCENT}; text-align: center; font-size: 8px; letter-spacing: 0.12em; line-height: 1.5; text-transform: uppercase; transform: rotate(-7deg); }
  .qr { display: flex; align-items: center; gap: 3mm; max-width: 72mm; }
  .qr img { width: 24mm; height: 24mm; }
  .qr p { margin: 0; font-size: 8px; color: #5b6660; line-height: 1.55; }
  .foot-note { margin-top: 6mm; border-top: 1px solid #e4e8e4; padding-top: 3mm; font-size: 8px; color: #75807a; letter-spacing: 0.04em; }
</style></head><body><div class="page">
  <div class="band"></div>
  <div class="head"><span class="mark">A</span><div><p class="atlas">ATLAS</p><p class="uni">${escapeHtml(doc.university)}</p></div></div>
  <h1 class="title">${escapeHtml(doc.title)}</h1>
  <div class="subtitle">${escapeHtml(doc.subtitle)}</div>
  <div class="ref">${escapeHtml(doc.ref)} · ${escapeHtml(doc.dateText)}</div>
  ${doc.paragraphs.map((text, index) => index === 0 && text.startsWith("__NAME__")
    ? `<div class="name">${escapeHtml(text.replace("__NAME__", ""))}</div>`
    : `<p class="body">${escapeHtml(text)}</p>`).join("")}
  ${table}
  ${meta}
  <div class="foot">
    <div class="qr"><img src="${qr}" alt="QR"><p>${escapeHtml(doc.verify)}<br>${escapeHtml(doc.ref)}</p></div>
    <div class="seal">Aurora<br>University<br>Dean’s office</div>
    <div class="sign"><div class="line"><span>${escapeHtml(doc.signer)}</span></div>${escapeHtml(doc.signerRole)}</div>
  </div>
  ${doc.footer ? `<div class="foot-note">${escapeHtml(doc.footer)}</div>` : ""}
</div><script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 260); });</script></body></html>`;

      const frame = document.createElement("iframe");
      frame.setAttribute("title", doc.title);
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;border:0;pointer-events:none";
      document.body.appendChild(frame);
      frame.srcdoc = html;
      window.setTimeout(() => frame.remove(), 120_000);
    })
    .catch(() => undefined);
}

function loadFonts() {
  const specs = ['600 44px "Literata"', '400 20px "Literata"', '400 17px "Golos Text"', '600 17px "Golos Text"', '700 15px "Golos Text"'];
  return Promise.all(specs.map((spec) => document.fonts.load(spec).catch(() => [])));
}

export async function downloadDocPng(doc: PrintDoc) {
  await loadFonts();
  const W = 1240;
  const H = 1754;
  const M = 112;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 16);

  // header
  ctx.fillStyle = ACCENT;
  const r = 16;
  ctx.beginPath();
  ctx.roundRect(M, 64, 64, 64, r);
  ctx.fill();
  ctx.fillStyle = "#f8f4e8";
  ctx.font = '700 34px "Literata", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", M + 32, 98);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = '700 25px "Golos Text", Arial, sans-serif';
  ctx.fillText("ATLAS", M + 82, 82);
  ctx.fillStyle = "#5b6660";
  ctx.font = '500 12px "Golos Text", Arial, sans-serif';
  ctx.fillText(doc.university.toUpperCase(), M + 82, 104);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, 154);
  ctx.lineTo(W - M, 154);
  ctx.stroke();

  // title
  ctx.fillStyle = INK;
  ctx.font = '600 42px "Literata", Georgia, serif';
  const titleWidth = ctx.measureText(doc.title).width + (doc.title.length - 1) * 14;
  let cursor = W / 2 - titleWidth / 2;
  ctx.textAlign = "left";
  for (const char of doc.title) {
    ctx.fillText(char, cursor, 270);
    cursor += ctx.measureText(char).width + 14;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#4c5751";
  ctx.font = '400 19px "Golos Text", Arial, sans-serif';
  ctx.fillText(doc.subtitle, W / 2, 310);
  ctx.fillStyle = "#6b756f";
  ctx.font = '500 14px "Golos Text", Arial, sans-serif';
  ctx.fillText(`${doc.ref} · ${doc.dateText}`, W / 2, 344);

  // body
  let y = 410;
  ctx.textAlign = "left";
  const maxWidth = W - M * 2;
  for (const [index, text] of doc.paragraphs.entries()) {
    if (index === 0 && text.startsWith("__NAME__")) {
      ctx.fillStyle = INK;
      ctx.font = '600 30px "Literata", Georgia, serif';
      ctx.textAlign = "center";
      ctx.fillText(text.replace("__NAME__", ""), W / 2, y + 14);
      ctx.textAlign = "left";
      y += 56;
      continue;
    }
    ctx.fillStyle = INK;
    ctx.font = '400 17px "Golos Text", Arial, sans-serif';
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const probe = line ? `${line} ${word}` : word;
      if (ctx.measureText(probe).width > maxWidth) {
        ctx.fillText(line, M, y);
        y += 31;
        line = word;
      } else {
        line = probe;
      }
    }
    if (line) {
      ctx.fillText(line, M, y);
      y += 31;
    }
    y += 16;
  }

  // table
  if (doc.table) {
    y += 8;
    const widths = [0.58, 0.16, 0.26];
    const rowH = 40;
    const tableW = maxWidth;
    ctx.fillStyle = "#eef4ef";
    ctx.fillRect(M, y - 27, tableW, 40);
    ctx.fillStyle = ACCENT;
    ctx.font = '700 12px "Golos Text", Arial, sans-serif';
    let x = M + 14;
    doc.table.head.forEach((cell, index) => {
      ctx.fillText(cell.toUpperCase(), x, y - 2);
      x += tableW * widths[index];
    });
    y += 38;
    ctx.font = '400 15px "Golos Text", Arial, sans-serif';
    doc.table.rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        ctx.fillStyle = "#fafbf9";
        ctx.fillRect(M, y - 26, tableW, rowH);
      }
      ctx.strokeStyle = "#e6eae6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, y + 14);
      ctx.lineTo(M + tableW, y + 14);
      ctx.stroke();
      ctx.fillStyle = INK;
      x = M + 14;
      row.forEach((cell, index) => {
        ctx.textAlign = index === row.length - 1 ? "right" : "left";
        ctx.fillText(cell, index === row.length - 1 ? x + tableW * widths[index] - 28 : x, y);
        x += tableW * widths[index];
      });
      ctx.textAlign = "left";
      y += rowH;
    });
    y += 26;
  }

  // meta
  if (doc.meta?.length) {
    let x = M;
    for (const item of doc.meta) {
      ctx.fillStyle = ACCENT;
      ctx.fillRect(x, y - 28, 3, 46);
      ctx.fillStyle = "#5b6660";
      ctx.font = '600 10px "Golos Text", Arial, sans-serif';
      ctx.fillText(item.label.toUpperCase(), x + 13, y - 14);
      ctx.fillStyle = INK;
      ctx.font = '600 22px "Literata", Georgia, serif';
      ctx.fillText(item.value, x + 13, y + 12);
      x += 210;
    }
    y += 52;
  }

  // footer
  const footY = H - 300;
  const qrData = await QRCode.toDataURL(doc.qrValue, { width: 280, margin: 1, color: { dark: INK, light: "#ffffff" } });
  const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = qrData;
  });
  ctx.drawImage(qrImage, M, footY, 150, 150);
  ctx.fillStyle = "#5b6660";
  ctx.font = '400 11px "Golos Text", Arial, sans-serif';
  const verifyLines = doc.verify.split("\n").flatMap((line) => {
    const words = line.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const probe = current ? `${current} ${word}` : word;
      if (ctx.measureText(probe).width > 210) {
        lines.push(current);
        current = word;
      } else current = probe;
    }
    if (current) lines.push(current);
    return lines;
  });
  verifyLines.slice(0, 5).forEach((line, index) => ctx.fillText(line, M + 170, footY + 30 + index * 17));
  ctx.fillText(doc.ref, M + 170, footY + 30 + Math.min(verifyLines.length, 5) * 17 + 8);

  // seal
  const sealX = W - 300;
  const sealY = footY + 60;
  ctx.save();
  ctx.translate(sealX, sealY);
  ctx.rotate(-0.1);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.font = '600 11px "Golos Text", Arial, sans-serif';
  ctx.fillText("AURORA", 0, -14);
  ctx.fillText("UNIVERSITY", 0, 2);
  ctx.font = '700 14px "Golos Text", Arial, sans-serif';
  ctx.fillText("DEAN", 0, 24);
  ctx.restore();
  ctx.textAlign = "left";

  // signature
  const signX = W - M - 250;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(signX, footY + 120);
  ctx.lineTo(signX + 250, footY + 120);
  ctx.stroke();
  ctx.fillStyle = "#33413a";
  ctx.font = 'italic 20px "Literata", Georgia, serif';
  ctx.fillText(doc.signer, signX + 8, footY + 108);
  ctx.fillStyle = "#5b6660";
  ctx.font = '400 12px "Golos Text", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(doc.signerRole, signX + 125, footY + 146);
  ctx.textAlign = "left";

  if (doc.footer) {
    ctx.strokeStyle = "#e4e8e4";
    ctx.beginPath();
    ctx.moveTo(M, H - 60);
    ctx.lineTo(W - M, H - 60);
    ctx.stroke();
    ctx.fillStyle = "#75807a";
    ctx.font = '400 10px "Golos Text", Arial, sans-serif';
    ctx.fillText(doc.footer, M, H - 36);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.fileBase.replace(/[^A-Za-z0-9._-]/g, "-")}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, "image/png");
}
