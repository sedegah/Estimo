import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  FITTINGS,
  computeEstimate,
  estimateLines,
  projectType,
  totalSpaces,
  type Counts,
  type FittingQuality,
} from "@/lib/estimate-model";

const NAVY = rgb(0x0b / 255, 0x1f / 255, 0x3f / 255);
const AMBER = rgb(0xf5 / 255, 0xb3 / 255, 0x01 / 255);
const PLASTER = rgb(0xf7 / 255, 0xf5 / 255, 0xef / 255);
const MUTED = rgb(0x5f / 255, 0x6b / 255, 0x7a / 255);
const LINE = rgb(0xe2 / 255, 0xe4 / 255, 0xdc / 255);
const WHITE = rgb(1, 1, 1);
const PALE = rgb(0xc3 / 255, 0xce / 255, 0xe2 / 255);

const money = (value: number, digits = 0) =>
  `GHS ${value.toLocaleString("en-GH", { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

type Input = {
  template: string;
  quality: FittingQuality;
  counts: Counts;
  name?: string;
  issuedAt?: Date;
};

type DrawOptions = NonNullable<Parameters<PDFPage["drawText"]>[1]> & { x: number };

/** The system typeface (Bricolage Grotesque), read from /public/fonts. */
function loadFontFile(fileName: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(process.cwd(), "public", "fonts", fileName)));
}

function strongText(page: PDFPage, text: string, options: DrawOptions) {
  page.drawText(text, options);
}

function rightText(page: PDFPage, text: string, right: number, y: number, size: number, font: PDFFont, color = NAVY) {
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function rightStrong(page: PDFPage, text: string, right: number, y: number, size: number, font: PDFFont, color = NAVY) {
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, size, font, color });
}

/** The busbar "E" mark, drawn with primitives so the PDF needs no embedded images. */
function drawMark(page: PDFPage, x: number, y: number, scale = 1) {
  const bar = 3.4 * scale;
  const height = 26 * scale;
  const width = 18 * scale;

  page.drawRectangle({ x, y, width: bar, height, color: WHITE });
  page.drawRectangle({ x, y: y + height - bar, width, height: bar, color: WHITE });
  page.drawRectangle({ x, y: y + height / 2 - bar / 2, width: width * 0.72, height: bar, color: WHITE });
  page.drawRectangle({ x, y, width, height: bar, color: WHITE });

  const radius = 4.4 * scale;
  const dotX = x + width + 7 * scale;
  [y + height - bar / 2, y + height / 2, y + bar / 2].forEach((cy) => {
    page.drawCircle({ x: dotX, y: cy, size: radius, color: AMBER });
  });
}

export async function buildEstimatePdf({ template, quality, counts, name, issuedAt = new Date() }: Input): Promise<Uint8Array> {
  const type = projectType(template);
  const total = computeEstimate(type.code, counts, quality);
  const lines = estimateLines(total, type.code, counts);
  const fittings = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = totalSpaces(counts);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(`${name ?? type.label} - ESTIMO estimate`);
  pdf.setAuthor("ESTIMO");
  pdf.setSubject("Electrical estimate");
  pdf.setCreator("ESTIMO");

  const font = await pdf.embedFont(loadFontFile("bricolage-regular.ttf"), { subset: false });
  const bold = await pdf.embedFont(loadFontFile("bricolage-bold.ttf"), { subset: false });

  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 48;

  // ── header ────────────────────────────────────────────────────────────────
  const headerHeight = 168;
  page.drawRectangle({ x: 0, y: height - headerHeight, width, height: headerHeight, color: NAVY });
  page.drawRectangle({ x: 0, y: height - headerHeight, width, height: 4, color: AMBER });

  drawMark(page, margin, height - 62, 1.05);
  strongText(page, "estimo", { x: margin + 42, y: height - 58, size: 24, font: bold, color: WHITE });

  strongText(page, "ELECTRICAL ESTIMATE", { x: margin, y: height - 92, size: 8.5, font: bold, color: AMBER });
  strongText(page, name ?? type.label, { x: margin, y: height - 122, size: 22, font: bold, color: WHITE });
  page.drawText(`${type.label} · ${fittings} fittings · ${spaces} spaces`, {
    x: margin,
    y: height - 142,
    size: 10,
    font,
    color: PALE,
  });

  const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(issuedAt);
  rightText(page, dateLabel, width - margin, height - 142, 10, font, PALE);

  // ── total card ────────────────────────────────────────────────────────────
  let y = height - headerHeight - 36;
  page.drawRectangle({ x: margin, y: y - 74, width: width - margin * 2, height: 74, color: PLASTER });
  page.drawRectangle({ x: margin, y: y - 74, width: 4, height: 74, color: AMBER });
  strongText(page, "ESTIMATED TOTAL", { x: margin + 20, y: y - 24, size: 8, font: bold, color: MUTED });
  strongText(page, money(total), { x: margin + 20, y: y - 58, size: 28, font: bold, color: NAVY });
  page.drawText("Materials and labour. Illustrative planning figure, not a quotation.", {
    x: margin + 250,
    y: y - 34,
    size: 8.5,
    font,
    color: MUTED,
  });

  // ── table ─────────────────────────────────────────────────────────────────
  y -= 110;
  const tableRight = width - margin;
  const columns = { item: margin + 14, qty: 330, unit: 430, amount: tableRight - 14 };

  page.drawRectangle({ x: margin, y: y - 26, width: tableRight - margin, height: 26, color: NAVY });
  strongText(page, "Item", { x: columns.item, y: y - 17, size: 9, font: bold, color: WHITE });
  strongText(page, "Qty", { x: columns.qty, y: y - 17, size: 9, font: bold, color: WHITE });
  rightStrong(page, "Unit price", columns.unit, y - 17, 9, bold, WHITE);
  rightStrong(page, "Amount", columns.amount, y - 17, 9, bold, WHITE);

  y -= 26;
  const rowHeight = 26;
  lines.forEach((line, index) => {
    if (index % 2 === 1) {
      page.drawRectangle({ x: margin, y: y - rowHeight, width: tableRight - margin, height: rowHeight, color: PLASTER });
    }
    page.drawText(line.label, { x: columns.item, y: y - 17, size: 9.5, font, color: NAVY });
    page.drawText(line.quantity, { x: columns.qty, y: y - 17, size: 9.5, font, color: MUTED });
    rightText(page, money(line.unitPrice), columns.unit, y - 17, 9.5, font, MUTED);
    rightStrong(page, money(line.amount), columns.amount, y - 17, 9.5, bold, NAVY);
    page.drawLine({ start: { x: margin, y: y - rowHeight }, end: { x: tableRight, y: y - rowHeight }, thickness: 0.6, color: LINE });
    y -= rowHeight;
  });

  // total row
  page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: 2, color: NAVY });
  strongText(page, "Total", { x: columns.item, y: y - 20, size: 10.5, font: bold, color: NAVY });
  rightStrong(page, money(total), columns.amount, y - 20, 11, bold, NAVY);
  y -= 46;

  // ── breakdown note ────────────────────────────────────────────────────────
  strongText(page, "How this is built up", { x: margin, y, size: 10, font: bold, color: NAVY });
  y -= 16;
  const notes = [
    "Cables and conduit, sockets and switches, light fittings, distribution board and breakers,",
    "earthing and labour are allowance groups from the ESTIMO staging model.",
    "Prices are planning assumptions and are not verified supplier prices.",
  ];
  notes.forEach((line) => {
    page.drawText(line, { x: margin, y, size: 8.5, font, color: MUTED });
    y -= 12;
  });

  // ── footer ────────────────────────────────────────────────────────────────
  const footerY = 54;
  page.drawLine({ start: { x: margin, y: footerY + 16 }, end: { x: tableRight, y: footerY + 16 }, thickness: 0.7, color: LINE });
  drawMark(page, margin, footerY - 2, 0.55);
  strongText(page, "ESTIMO · Ghana electrical estimates", { x: margin + 30, y: footerY, size: 8, font: bold, color: NAVY });
  rightText(page, "estimo.app", tableRight, footerY, 8, font, MUTED);
  page.drawText(`Issued ${dateLabel} · Reference ${type.code}-${quality.slice(0, 3).toUpperCase()}`, {
    x: margin + 30,
    y: footerY - 12,
    size: 7.5,
    font,
    color: MUTED,
  });

  return pdf.save();
}
