import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { unitLabel } from "@/lib/format";
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
  /** Load keys confirmed outside the estimate, listed but not priced. */
  specialLoads?: string[];
  /** When present these priced lines are printed exactly as the app shows them. */
  items?: { name: string; quantity: number; unit: string; priceGhs: number | null }[];
  /** Total of those lines; defaults to their sum. */
  totalOverride?: number;
  subtitle?: string;
};

const LOAD_LABELS: Record<string, string> = {
  refrigerator: "Refrigerator",
  freezer: "Freezer",
  microwave: "Microwave",
  electric_cooker: "Electric cooker",
  dishwasher: "Dishwasher",
  washing_machine: "Washing machine",
  extractor: "Extractor",
  water_heater: "Water heater",
  air_conditioner: "Air conditioner",
  water_pump: "Water pump",
  gate_motor: "Gate motor",
  ev_charger: "EV charger",
  workshop_machine: "Workshop machine",
  refrigeration_equipment: "Refrigeration equipment",
};

const loadLabel = (key: string) =>
  LOAD_LABELS[key] ?? key.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());

type DrawOptions = NonNullable<Parameters<PDFPage["drawText"]>[1]> & { x: number };

/** The system typeface (Bricolage Grotesque), read from /public/fonts.
 * These .ttf files are static instances of the site's variable WOFF2: wght 400
 * and 700 at opsz 14, so the PDF is set in the same face as the app. */
function loadFontFile(fileName: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(process.cwd(), "public", "fonts", fileName)));
}

/** Official brand artwork, so the PDF carries the same wordmark as the app. */
function loadBrandFile(fileName: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(process.cwd(), "public", "brand", fileName)));
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

/** Breaks a single line into as many lines as the width needs. */
function wrapToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = current ? `${current} ${word}` : word;
    if (!current || font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/** Trims a line until it and its ellipsis fit the width. */
function ellipsize(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}...`, size) > maxWidth) cut = cut.slice(0, -1).trimEnd();
  return `${cut}...`;
}

/** Fits a project name into at most two header lines, shrinking the type first. */
function fitTitle(text: string, font: PDFFont, maxWidth: number, maxLines = 2) {
  let size = 22;
  let lines = wrapToWidth(text, font, size, maxWidth);
  while (lines.length > maxLines && size > 15) {
    size -= 1;
    lines = wrapToWidth(text, font, size, maxWidth);
  }
  if (lines.length > maxLines) {
    const tail = lines.slice(maxLines - 1).join(" ");
    lines = [...lines.slice(0, maxLines - 1), ellipsize(tail, font, size, maxWidth)];
  }
  return { size, lines };
}

export async function buildEstimatePdf({ template, quality, counts, name, issuedAt = new Date(), specialLoads = [], items, totalOverride, subtitle }: Input): Promise<Uint8Array> {
  const type = projectType(template);
  const model = computeEstimate(type.code, counts, quality);
  const quantityLines = items?.map((line) => {
    const amount = line.priceGhs == null ? 0 : line.priceGhs * line.quantity;
    return {
      label: line.name,
      quantity: `${line.quantity} ${unitLabel(line.unit)}`,
      unitPrice: line.priceGhs ?? 0,
      amount,
      pending: line.priceGhs == null,
    };
  });
  const total = totalOverride ?? (quantityLines ? quantityLines.reduce((sum, line) => sum + line.amount, 0) : model);
  const lines = quantityLines ?? estimateLines(model, type.code, counts);
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
  const wordmark = await pdf.embedPng(loadBrandFile("estimo-logo-horizontal-dark.png"));
  const footerMark = await pdf.embedPng(loadBrandFile("estimo-logo-horizontal-mono-navy.png"));

  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 48;

  // ── header ────────────────────────────────────────────────────────────────
  const title = fitTitle(name ?? type.label, bold, width - margin * 2);
  const titleLead = 26;
  const headerHeight = 168 + (title.lines.length - 1) * titleLead;
  page.drawRectangle({ x: 0, y: height - headerHeight, width, height: headerHeight, color: NAVY });
  page.drawRectangle({ x: 0, y: height - headerHeight, width, height: 4, color: AMBER });

  const wordmarkHeight = 26;
  const wordmarkWidth = (wordmark.width / wordmark.height) * wordmarkHeight;
  page.drawImage(wordmark, { x: margin, y: height - 66, width: wordmarkWidth, height: wordmarkHeight });

  strongText(page, "ELECTRICAL ESTIMATE", { x: margin, y: height - 96, size: 8.5, font: bold, color: AMBER });
  title.lines.forEach((line, index) => {
    strongText(page, line, { x: margin, y: height - 126 - index * titleLead, size: title.size, font: bold, color: WHITE });
  });

  const subtitleY = height - 126 - (title.lines.length - 1) * titleLead - 20;
  page.drawText(subtitle ?? `${type.label} · ${fittings} fittings · ${spaces} spaces`, {
    x: margin,
    y: subtitleY,
    size: 10,
    font,
    color: PALE,
  });

  const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(issuedAt);
  rightText(page, dateLabel, width - margin, subtitleY, 10, font, PALE);

  // ── total card ────────────────────────────────────────────────────────────
  let y = height - headerHeight - 36;
  page.drawRectangle({ x: margin, y: y - 74, width: width - margin * 2, height: 74, color: PLASTER });
  page.drawRectangle({ x: margin, y: y - 74, width: 4, height: 74, color: AMBER });
  strongText(page, "ESTIMATED TOTAL", { x: margin + 20, y: y - 24, size: 8, font: bold, color: MUTED });
  strongText(page, money(total), { x: margin + 20, y: y - 58, size: 28, font: bold, color: NAVY });

  const cardRight = width - margin - 20;
  rightText(page, quantityLines ? "Materials only, at catalogue prices." : "Materials only.", cardRight, y - 30, 8.5, font, MUTED);
  rightText(page, quantityLines ? "Preliminary take-off, not a quotation." : "Illustrative planning figure, not a quotation.", cardRight, y - 43, 8.5, font, MUTED);

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
    if ("pending" in line && line.pending) {
      rightText(page, "Pending", columns.unit, y - 17, 9.5, font, MUTED);
      rightText(page, "—", columns.amount, y - 17, 9.5, font, MUTED);
    } else {
      rightText(page, money(line.unitPrice), columns.unit, y - 17, 9.5, font, MUTED);
      rightStrong(page, money(line.amount), columns.amount, y - 17, 9.5, bold, NAVY);
    }
    page.drawLine({ start: { x: margin, y: y - rowHeight }, end: { x: tableRight, y: y - rowHeight }, thickness: 0.6, color: LINE });
    y -= rowHeight;
  });

  // total row
  page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: 2, color: NAVY });
  strongText(page, "Total", { x: columns.item, y: y - 20, size: 10.5, font: bold, color: NAVY });
  rightStrong(page, money(total), columns.amount, y - 20, 11, bold, NAVY);
  y -= 46;

  // ── special loads ──────────────────────────────────────────────
  if (specialLoads.length) {
    strongText(page, 'Special loads', { x: margin, y, size: 10, font: bold, color: NAVY });
    y -= 15;
    specialLoads.forEach((key) => {
      page.drawText(`• ${loadLabel(key)}`, { x: margin, y, size: 9, font, color: MUTED });
      y -= 12;
    });
    page.drawText('Concluded by phone call or WhatsApp.', { x: margin, y: y - 2, size: 8.5, font, color: MUTED });
    y -= 22;
  }

  // ── breakdown note ────────────────────────────────────────────────────────
  strongText(page, quantityLines ? "Basis" : "How this is built up", { x: margin, y, size: 10, font: bold, color: NAVY });
  y -= 16;
  const notes = quantityLines
    ? [
        "Quantities from the ESTIMO-GH-QTY-v1.0 rule set for the spaces in this estimate.",
        "Prices are catalogue prices at the time of issue; lines marked Pending are excluded",
        "from the total until a price is published.",
      ]
    : [
        "Cables and conduit, sockets and switches, light fittings, distribution board and breakers",
        "and earthing are allowance groups from the ESTIMO staging model. Labour is quoted separately.",
        "Prices are planning assumptions and are not verified supplier prices.",
      ];
  notes.forEach((line) => {
    page.drawText(line, { x: margin, y, size: 8.5, font, color: MUTED });
    y -= 12;
  });

  // ── footer ────────────────────────────────────────────────────────────────
  const footerY = 54;
  page.drawLine({ start: { x: margin, y: footerY + 16 }, end: { x: tableRight, y: footerY + 16 }, thickness: 0.7, color: LINE });

  const footerMarkHeight = 10;
  const footerMarkWidth = (footerMark.width / footerMark.height) * footerMarkHeight;
  page.drawImage(footerMark, { x: margin, y: footerY - 1, width: footerMarkWidth, height: footerMarkHeight });
  strongText(page, "Ghana electrical estimates", { x: margin + footerMarkWidth + 10, y: footerY, size: 8, font: bold, color: NAVY });
  rightText(page, "estimo.app", tableRight, footerY, 8, font, MUTED);
  page.drawText(`Issued ${dateLabel} · Reference ${type.code}-${quality.slice(0, 3).toUpperCase()}`, {
    x: margin,
    y: footerY - 12,
    size: 7.5,
    font,
    color: MUTED,
  });

  return pdf.save();
}
