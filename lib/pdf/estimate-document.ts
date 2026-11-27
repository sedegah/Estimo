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

const money = (value: number, digits = Number.isInteger(value) ? 0 : 2) =>
  `GHS ${value.toLocaleString("en-GH", { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

type Input = {
  /** Display currency for the document; amounts stay in cedis internally. */
  currency?: string;
  rate?: number;
  template: string;
  quality: FittingQuality;
  counts: Counts;
  name?: string;
  issuedAt?: Date;
  /** Load keys confirmed outside the estimate, listed but not priced. */
  specialLoads?: string[];
  /** Configured loads as "Water heater · 4.5 kW · 18 m". Printed when present. */
  specialLoadSummaries?: string[];
  /** Configured loads with their sizing, state and cost, printed as a table. */
  specialLoadsDetail?: {
    name: string;
    sizing: string;
    status: string;
    costGhs?: number | null;
  }[];
  /** Materials the configured loads add, and how many of those lines have no price yet. */
  specialLoadsSubtotal?: number | null;
  specialLoadsPending?: number;
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

export async function buildEstimatePdf({ template, quality, counts, name, issuedAt = new Date(), specialLoads = [], specialLoadSummaries = [], specialLoadsDetail = [], specialLoadsSubtotal = null, specialLoadsPending = 0, items, totalOverride, subtitle, currency = "GHS", rate = 1 }: Input): Promise<Uint8Array> {
  // The PDF's built-in fonts have no cedi glyph, so the document prints an ASCII-safe
  // symbol (GHS, $, £, €) instead of the locale's GH₵.
  const symbol = currency === "USD" ? "USD" : currency === "GBP" ? "GBP" : currency === "EUR" ? "EUR" : "GHS";
  const fmt = (value: number, digits = Number.isInteger(value) ? 0 : 2) => {
    const converted = value * (rate > 0 ? rate : 1);
    const places = currency === "GHS" ? digits : Math.max(2, digits);
    const number = new Intl.NumberFormat("en-GH", {
      maximumFractionDigits: places,
      minimumFractionDigits: places,
    }).format(converted);
    return `${symbol} ${number}`;
  };
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

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const height = pageHeight;
  const margin = 48;
  const tableRight = pageWidth - margin;
  const columns = { item: margin + 14, qty: 330, unit: 430, amount: tableRight - 14 };
  const footerY = 54;
  const bottomLimit = 112;
  const rowHeight = 26;
  const documentTitle = name ?? type.label;
  const dateLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(issuedAt);

  const drawFooter = (target: PDFPage) => {
    target.drawLine({ start: { x: margin, y: footerY + 16 }, end: { x: tableRight, y: footerY + 16 }, thickness: 0.7, color: LINE });
    const markHeight = 10;
    const markWidth = (footerMark.width / footerMark.height) * markHeight;
    target.drawImage(footerMark, { x: margin, y: footerY - 1, width: markWidth, height: markHeight });
    strongText(target, "Ghana electrical estimates", { x: margin + markWidth + 10, y: footerY, size: 8, font: bold, color: NAVY });
    rightText(target, "estimo.live", tableRight, footerY, 8, font, MUTED);
    target.drawText(`Issued ${dateLabel} · Reference ${type.code}-${quality.slice(0, 3).toUpperCase()}`, {
      x: margin,
      y: footerY - 12,
      size: 7.5,
      font,
      color: MUTED,
    });
  };

  const drawTableHead = (target: PDFPage, top: number) => {
    target.drawRectangle({ x: margin, y: top - 26, width: tableRight - margin, height: 26, color: NAVY });
    strongText(target, "Item", { x: columns.item, y: top - 17, size: 9, font: bold, color: WHITE });
    strongText(target, "Qty", { x: columns.qty, y: top - 17, size: 9, font: bold, color: WHITE });
    rightStrong(target, "Unit price", columns.unit, top - 17, 9, bold, WHITE);
    rightStrong(target, "Amount", columns.amount, top - 17, 9, bold, WHITE);
    return top - 26;
  };

  let page = pdf.addPage([pageWidth, pageHeight]);

  // ── header (first page) ───────────────────────────────────────────────────
  const title = fitTitle(documentTitle, bold, pageWidth - margin * 2);
  const titleLead = 26;
  const headerHeight = 168 + (title.lines.length - 1) * titleLead;
  page.drawRectangle({ x: 0, y: height - headerHeight, width: pageWidth, height: headerHeight, color: NAVY });
  page.drawRectangle({ x: 0, y: height - headerHeight, width: pageWidth, height: 4, color: AMBER });

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
  rightText(page, dateLabel, pageWidth - margin, subtitleY, 10, font, PALE);

  // ── total card ────────────────────────────────────────────────────────────
  let y = height - headerHeight - 36;
  page.drawRectangle({ x: margin, y: y - 74, width: pageWidth - margin * 2, height: 74, color: PLASTER });
  page.drawRectangle({ x: margin, y: y - 74, width: 4, height: 74, color: AMBER });
  strongText(page, "ESTIMATED TOTAL", { x: margin + 20, y: y - 24, size: 8, font: bold, color: MUTED });
  strongText(page, fmt(total), { x: margin + 20, y: y - 58, size: 28, font: bold, color: NAVY });

  const cardRight = pageWidth - margin - 20;
  rightText(page, quantityLines ? "Materials only, at catalogue prices." : "Materials only.", cardRight, y - 30, 8.5, font, MUTED);
  rightText(page, quantityLines ? "Preliminary take-off, not a quotation." : "Illustrative planning figure, not a quotation.", cardRight, y - 43, 8.5, font, MUTED);

  // ── table, paginated ──────────────────────────────────────────────────────
  y -= 110;
  y = drawTableHead(page, y);

  const newPage = () => {
    drawFooter(page);
    page = pdf.addPage([pageWidth, pageHeight]);

    // slim continuation header so every page is identifiable
    const band = 96;
    page.drawRectangle({ x: 0, y: pageHeight - band, width: pageWidth, height: band, color: NAVY });
    page.drawRectangle({ x: 0, y: pageHeight - band, width: pageWidth, height: 4, color: AMBER });
    const markHeight = 20;
    const markWidth = (wordmark.width / wordmark.height) * markHeight;
    page.drawImage(wordmark, { x: margin, y: pageHeight - 58, width: markWidth, height: markHeight });
    const label = ellipsize(`${documentTitle} (continued)`, bold, 11, pageWidth - margin * 2 - markWidth - 16);
    strongText(page, label, { x: margin + markWidth + 12, y: pageHeight - 53, size: 11, font: bold, color: WHITE });
    rightText(page, dateLabel, pageWidth - margin, pageHeight - 53, 9, font, PALE);

    return drawTableHead(page, pageHeight - band - 18);
  };

  lines.forEach((line, index) => {
    if (y - rowHeight < bottomLimit) y = newPage();
    if (index % 2 === 1) {
      page.drawRectangle({ x: margin, y: y - rowHeight, width: tableRight - margin, height: rowHeight, color: PLASTER });
    }
    page.drawText(ellipsize(line.label, font, 9.5, columns.qty - columns.item - 12), { x: columns.item, y: y - 17, size: 9.5, font, color: NAVY });
    page.drawText(line.quantity, { x: columns.qty, y: y - 17, size: 9.5, font, color: MUTED });
    if ("pending" in line && line.pending) {
      rightText(page, "Pending", columns.unit, y - 17, 9.5, font, MUTED);
      rightText(page, "—", columns.amount, y - 17, 9.5, font, MUTED);
    } else {
      rightText(page, fmt(line.unitPrice), columns.unit, y - 17, 9.5, font, MUTED);
      rightStrong(page, fmt(line.amount), columns.amount, y - 17, 9.5, bold, NAVY);
    }
    page.drawLine({ start: { x: margin, y: y - rowHeight }, end: { x: tableRight, y: y - rowHeight }, thickness: 0.6, color: LINE });
    y -= rowHeight;
  });

  // total row, with room to breathe above the footer
  if (y - 52 < bottomLimit) y = newPage();
  page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: 2, color: NAVY });
  strongText(page, "Total", { x: columns.item, y: y - 20, size: 10.5, font: bold, color: NAVY });
  rightStrong(page, fmt(total), columns.amount, y - 20, 11, bold, NAVY);
  y -= 46;

  /** Starts a page when a block would otherwise cross into the footer. */
  const ensureRoom = (needed: number) => {
    if (y - needed < bottomLimit) y = newPage();
  };

  if (specialLoadsDetail.length) {
    // a section of its own: what each load is, how it was sized, whether it is confirmed
    // and what its materials add. It reads like the configurator, not a shopping note.
    ensureRoom(96);
    strongText(page, "Special loads", { x: margin, y, size: 10, font: bold, color: NAVY });
    rightText(
      page,
      `${specialLoadsDetail.length} load${specialLoadsDetail.length === 1 ? "" : "s"} beyond the general points`,
      tableRight,
      y,
      8,
      font,
      MUTED,
    );
    y -= 14;

    const loadColumn = margin + 12;
    const sizingColumn = 196;
    const stateColumn = 356;
    const costColumn = tableRight - 12;

    page.drawRectangle({ x: margin, y: y - 20, width: tableRight - margin, height: 20, color: NAVY });
    strongText(page, "Load", { x: loadColumn, y: y - 14, size: 8.5, font: bold, color: WHITE });
    strongText(page, "Sizing", { x: sizingColumn, y: y - 14, size: 8.5, font: bold, color: WHITE });
    strongText(page, "State", { x: stateColumn, y: y - 14, size: 8.5, font: bold, color: WHITE });
    rightStrong(page, "Cost", costColumn, y - 14, 8.5, bold, WHITE);
    y -= 20;

    specialLoadsDetail.forEach((entry, index) => {
      if (y - 24 < bottomLimit) {
        y = newPage();
        page.drawRectangle({ x: margin, y: y - 20, width: tableRight - margin, height: 20, color: NAVY });
        strongText(page, "Load", { x: loadColumn, y: y - 14, size: 8.5, font: bold, color: WHITE });
        strongText(page, "Sizing", { x: sizingColumn, y: y - 14, size: 8.5, font: bold, color: WHITE });
        strongText(page, "State", { x: stateColumn, y: y - 14, size: 8.5, font: bold, color: WHITE });
        rightStrong(page, "Cost", costColumn, y - 14, 8.5, bold, WHITE);
        y -= 20;
      }
      if (index % 2 === 1) {
        page.drawRectangle({ x: margin, y: y - 24, width: tableRight - margin, height: 24, color: PLASTER });
      }
      const unconfirmed = /configuration required/i.test(entry.status);
      page.drawText(ellipsize(entry.name, font, 9.5, sizingColumn - loadColumn - 10), {
        x: loadColumn,
        y: y - 16,
        size: 9.5,
        font: bold,
        color: NAVY,
      });
      page.drawText(ellipsize(entry.sizing, font, 8.5, stateColumn - sizingColumn - 12), {
        x: sizingColumn,
        y: y - 16,
        size: 8.5,
        font,
        color: unconfirmed ? MUTED : NAVY,
      });
      page.drawText(ellipsize(entry.status, font, 7.5, costColumn - stateColumn - 80), {
        x: stateColumn,
        y: y - 16,
        size: 7.5,
        font: bold,
        color: unconfirmed ? MUTED : MUTED,
      });
      if (entry.costGhs == null) {
        rightText(page, unconfirmed ? "—" : "included", costColumn, y - 16, 8.5, font, MUTED);
      } else {
        rightStrong(page, fmt(entry.costGhs, 2), costColumn, y - 16, 9, bold, NAVY);
      }
      page.drawLine({ start: { x: margin, y: y - 24 }, end: { x: tableRight, y: y - 24 }, thickness: 0.6, color: LINE });
      y -= 24;
    });

    if (specialLoadsSubtotal != null) {
      if (y - 34 < bottomLimit) y = newPage();
      page.drawLine({ start: { x: margin, y }, end: { x: tableRight, y }, thickness: 1.4, color: NAVY });
      strongText(page, "Special loads, materials", { x: loadColumn, y: y - 16, size: 9, font: bold, color: NAVY });
      rightStrong(page, fmt(specialLoadsSubtotal, 2), costColumn, y - 16, 9.5, bold, NAVY);
      y -= 26;
    }

    const cautions: string[] = [];
    if (specialLoadsPending) {
      cautions.push(
        `${specialLoadsPending} special-load line${specialLoadsPending === 1 ? " has" : "s have"} no published price yet and ${specialLoadsPending === 1 ? "is" : "are"} excluded from the total.`,
      );
    }
    if (specialLoadsDetail.some((entry) => /configuration required/i.test(entry.status))) {
      cautions.push(
        "Loads marked Configuration required are not costed until their details are entered in the configurator.",
      );
    }
    cautions.push(
      "Sizing is ESTIMO's provisional allowance. Confirm the final cable, protective device and RCD against the manufacturer's instructions.",
    );

    ensureRoom(cautions.length * 11 + 8);
    cautions.forEach((line) => {
      page.drawText(ellipsize(line, font, 7.5, tableRight - margin - 8), {
        x: loadColumn,
        y,
        size: 7.5,
        font,
        color: MUTED,
      });
      y -= 11;
    });
    y -= 14;
  } else if (specialLoadSummaries.length || specialLoads.length) {
    const loadLines = specialLoadSummaries.length ? specialLoadSummaries : specialLoads.map(loadLabel);
    ensureRoom(24 + loadLines.length * 12 + 18);
    strongText(page, "Special loads", { x: margin, y, size: 10, font: bold, color: NAVY });
    y -= 15;
    loadLines.forEach((line) => {
      page.drawText(`• ${line}`, { x: margin, y, size: 9, font, color: MUTED });
      y -= 12;
    });
    page.drawText("Concluded by phone call or WhatsApp.", { x: margin, y: y - 2, size: 8.5, font, color: MUTED });
    y -= 24;
  }

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

  ensureRoom(18 + notes.length * 12);
  strongText(page, quantityLines ? "Basis" : "How this is built up", { x: margin, y, size: 10, font: bold, color: NAVY });
  y -= 16;
  notes.forEach((line) => {
    page.drawText(line, { x: margin, y, size: 8.5, font, color: MUTED });
    y -= 12;
  });

  drawFooter(page);
  return pdf.save();
}

