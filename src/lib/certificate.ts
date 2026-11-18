import "server-only";
import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { ageGroupById, site, times } from "./config";
import type { Award } from "./db/schema";
import { levelById } from "./exam/levels";
import { AWARD_META, fmtDate } from "./format";

const INK = rgb(21 / 255, 18 / 255, 59 / 255);
const INDIGO = rgb(79 / 255, 70 / 255, 229 / 255);
const GOLD = rgb(217 / 255, 119 / 255, 6 / 255);
const GOLD_LIGHT = rgb(252 / 255, 211 / 255, 77 / 255);
const CREAM = rgb(251 / 255, 248 / 255, 242 / 255);
const MUTED = rgb(0.38, 0.37, 0.48);

/** Standard PDF fonts only cover Latin-1; strip anything else so generation never fails. */
function latin(s: string) {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E -ÿ–—·]/g, "")
    .trim();
}

function center(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK, spacing = 0) {
  const t = latin(text);
  const w = font.widthOfTextAtSize(t, size) + spacing * Math.max(0, t.length - 1);
  const x = (page.getWidth() - w) / 2;
  if (!spacing) {
    page.drawText(t, { x, y, size, font, color });
    return;
  }
  let cx = x;
  for (const ch of t) {
    page.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + spacing;
  }
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = latin(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export type CertData = {
  certNo: string;
  award: Award;
  rank: number | null;
  score: number | null;
  maxScore: number | null;
  ageGroup: string;
  level: string;
  studentName: string;
  school: string | null;
  city: string;
  state: string;
};

export async function renderCertificate(c: CertData) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate ${c.certNo}`);
  pdf.setAuthor(site.organiser);
  const page = pdf.addPage([842, 595]);
  const W = page.getWidth();
  const H = page.getHeight();

  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Background & frames
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
  page.drawRectangle({ x: 16, y: 16, width: W - 32, height: H - 32, borderColor: INK, borderWidth: 6 });
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: GOLD, borderWidth: 1.2 });

  // Corner beads
  const beads = [GOLD_LIGHT, INDIGO, rgb(244 / 255, 63 / 255, 94 / 255)];
  for (const [cx, cy] of [
    [52, H - 52],
    [W - 52, H - 52],
  ]) {
    beads.forEach((col, i) => page.drawEllipse({ x: cx + (cx < W / 2 ? i * 14 : -i * 14), y: cy, xScale: 6.5, yScale: 5, color: col }));
  }

  const meta = AWARD_META[c.award];
  const podium = c.award === "champion" || c.award === "runner_up_1" || c.award === "runner_up_2";
  const group = ageGroupById(c.ageGroup);
  const level = levelById(c.level);

  center(page, site.organiser.toUpperCase(), H - 78, sansBold, 10, MUTED, 2.2);
  center(page, "CERTIFICATE", H - 132, serif, 46, INK, 6);
  center(page, c.award === "participation" ? "OF PARTICIPATION" : "OF ACHIEVEMENT", H - 158, sansBold, 13, GOLD, 4);

  center(page, "This certificate is proudly presented to", H - 202, italic, 15, MUTED);

  const name = latin(c.studentName) || "Participant";
  let nameSize = 40;
  while (serifItalic.widthOfTextAtSize(name, nameSize) > W - 220 && nameSize > 22) nameSize -= 2;
  center(page, name, H - 252, serifItalic, nameSize, INDIGO);
  page.drawLine({ start: { x: W / 2 - 190, y: H - 266 }, end: { x: W / 2 + 190, y: H - 266 }, thickness: 0.8, color: GOLD });

  const from = [c.school, `${c.city}, ${c.state}`].filter(Boolean).join(" · ");
  center(page, from, H - 286, sans, 11, MUTED);

  const achievement =
    c.award === "participation"
      ? `for participating in the ${site.name}`
      : `for being awarded ${meta.label.toUpperCase()} in the ${site.name}`;
  const body = `${achievement}, Group ${group?.id ?? c.ageGroup} (${group?.label ?? ""}, ages ${group?.min}-${group?.max}) · ${level?.name ?? c.level} level, held online from 1 to 31 December 2026.`;
  wrap(body, sans, 13, 560).forEach((line, i) => center(page, line, H - 322 - i * 19, sans, 13, INK));

  if (c.score != null && c.maxScore) {
    const stat = `Score ${c.score} / ${c.maxScore}${c.rank ? `   ·   Rank ${c.rank} in category` : ""}`;
    center(page, stat, H - 380, sansBold, 12, INK);
  }

  // Medal
  const mx = W / 2;
  const my = 108;
  if (podium) {
    const ribbon = c.award === "champion" ? GOLD : c.award === "runner_up_1" ? rgb(0.55, 0.58, 0.66) : rgb(0.7, 0.42, 0.2);
    page.drawRectangle({ x: mx - 22, y: my - 46, width: 14, height: 34, color: INDIGO });
    page.drawRectangle({ x: mx + 8, y: my - 46, width: 14, height: 34, color: INDIGO });
    page.drawCircle({ x: mx, y: my, size: 34, color: ribbon });
    page.drawCircle({ x: mx, y: my, size: 27, borderColor: CREAM, borderWidth: 1.4 });
    const label = c.award === "champion" ? "1st" : c.award === "runner_up_1" ? "2nd" : "3rd";
    const lw = serif.widthOfTextAtSize(label, 20);
    page.drawText(label, { x: mx - lw / 2, y: my - 7, size: 20, font: serif, color: CREAM });
  } else {
    page.drawCircle({ x: mx, y: my, size: 30, borderColor: GOLD, borderWidth: 2 });
    page.drawCircle({ x: mx, y: my, size: 24, color: c.award === "participation" ? INDIGO : GOLD });
    const label = c.award === "participation" ? "*" : c.award === "distinction" ? "90%+" : "75%+";
    const size = label === "*" ? 26 : 11;
    const lw = sansBold.widthOfTextAtSize(label, size);
    page.drawText(label, { x: mx - lw / 2, y: my - (label === "*" ? 12 : 4), size, font: sansBold, color: CREAM });
  }

  // Signature & date
  page.drawLine({ start: { x: 110, y: 96 }, end: { x: 290, y: 96 }, thickness: 0.8, color: INK });
  const dateText = fmtDate(times.resultsAt, { day: "numeric", month: "long", year: "numeric" });
  page.drawText(latin(dateText), { x: 200 - sansBold.widthOfTextAtSize(latin(dateText), 11) / 2, y: 104, size: 11, font: sansBold, color: INK });
  page.drawText("Date of result", { x: 200 - sans.widthOfTextAtSize("Date of result", 9) / 2, y: 82, size: 9, font: sans, color: MUTED });

  page.drawLine({ start: { x: W - 300, y: 96 }, end: { x: W - 120, y: 96 }, thickness: 0.8, color: INK });
  const org = latin(site.organiser);
  page.drawText("Organiser", { x: W - 210 - sans.widthOfTextAtSize("Organiser", 9) / 2, y: 82, size: 9, font: sans, color: MUTED });
  page.drawText(org, { x: W - 210 - serifItalic.widthOfTextAtSize(org, 13) / 2, y: 104, size: 13, font: serifItalic, color: INK });

  // Verification QR
  const verifyUrl = `${site.url}/verify?cert=${encodeURIComponent(c.certNo)}`;
  const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 220, color: { dark: "#15123b", light: "#fbf8f2" } });
  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: W - 112, y: 128, width: 58, height: 58 });
  page.drawText("Scan to verify", { x: W - 111, y: 118, size: 7, font: sans, color: MUTED });
  page.drawText(`Certificate No. ${c.certNo}`, { x: 54, y: 46, size: 8, font: sans, color: MUTED });
  const vtxt = latin(`Verify at ${site.url.replace(/^https?:\/\//, "")}/verify`);
  page.drawText(vtxt, { x: W - 54 - sans.widthOfTextAtSize(vtxt, 8), y: 46, size: 8, font: sans, color: MUTED });

  return pdf.save();
}
