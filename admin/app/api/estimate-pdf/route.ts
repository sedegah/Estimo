import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

export const runtime = "nodejs";

type Plan = { id: string; type: "light" | "socket" | "board" | "run"; x: number; y: number };
type Body = { name?: string; preset?: string; rates?: Record<string, number>; plan?: Plan[] };

const NAVY = rgb(0x0b / 255, 0x1f / 255, 0x3f / 255);
const AMBER = rgb(0xf5 / 255, 0xb3 / 255, 0x01 / 255);
const MUTED = rgb(0x5f / 255, 0x6b / 255, 0x7a / 255);
const LINE = rgb(0xe2 / 255, 0xe4 / 255, 0xdc / 255);

const money = (value: number) => `GHS ${value.toLocaleString("en-GH")}`;

/** Brand and typeface files are read from the admin app's own public folder. */
const asset = (...parts: string[]) => new Uint8Array(fs.readFileSync(path.join(process.cwd(), "public", ...parts)));

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const plan = Array.isArray(body.plan) ? body.plan : [];
  const rates = body.rates ?? {};

  const counts = {
    light: plan.filter((item) => item.type === "light").length,
    socket: plan.filter((item) => item.type === "socket").length,
    board: plan.filter((item) => item.type === "board").length,
    run: plan.filter((item) => item.type === "run").length,
  };

  const total =
    (counts.light * (rates.light ?? 180)) +
    (counts.socket * (rates.socket ?? 95)) +
    (counts.board * (rates.board ?? 850)) +
    (counts.run * (rates.run ?? 320));

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(asset("fonts", "bricolage-regular.ttf"), { subset: false });
  const bold = await pdf.embedFont(asset("fonts", "bricolage-bold.ttf"), { subset: false });
  const wordmark = await pdf.embedPng(asset("brand", "estimo-logo-horizontal-dark.png"));
  const footerMark = await pdf.embedPng(asset("brand", "estimo-logo-horizontal-mono-navy.png"));

  pdf.setTitle(`${body.name ?? "ESTIMO estimate"} - ESTIMO`);
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 48;

  page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: NAVY });
  page.drawRectangle({ x: 0, y: height - 150, width, height: 4, color: AMBER });

  const wordmarkHeight = 25;
  const wordmarkWidth = (wordmark.width / wordmark.height) * wordmarkHeight;
  page.drawImage(wordmark, { x: margin, y: height - 66, width: wordmarkWidth, height: wordmarkHeight });

  page.drawText("ELECTRICAL ESTIMATE", { x: margin, y: height - 92, size: 9, font: bold, color: AMBER });

  const title = body.name ?? "Family house";
  let titleSize = 22;
  while (titleSize > 12 && bold.widthOfTextAtSize(title, titleSize) > width - margin * 2) titleSize -= 1;
  page.drawText(title, { x: margin, y: height - 122, size: titleSize, font: bold, color: rgb(1, 1, 1) });
  page.drawText(body.preset ?? "", { x: margin, y: height - 140, size: 10, font: regular, color: rgb(0.76, 0.81, 0.89) });

  let y = height - 200;
  page.drawText("Your estimate", { x: margin, y, size: 14, font: bold, color: NAVY });
  y -= 24;

  const rows: Array<[string, string]> = [
    ["Light points", String(counts.light)],
    ["Sockets", String(counts.socket)],
    ["Distribution board", String(counts.board)],
    ["Circuit runs", `${counts.run * 6} m`],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: margin, y, size: 11, font: regular, color: MUTED });
    const valueWidth = bold.widthOfTextAtSize(value, 11);
    page.drawText(value, { x: width - margin - valueWidth, y, size: 11, font: bold, color: NAVY });
    page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: width - margin, y: y - 8 }, thickness: 0.6, color: LINE });
    y -= 28;
  }

  y -= 16;
  page.drawText("First estimate", { x: margin, y, size: 10, font: regular, color: MUTED });
  page.drawText(money(total), { x: margin, y: y - 30, size: 26, font: bold, color: NAVY });

  page.drawText("Planning figure based on current rate assumptions, not a quotation.", {
    x: margin, y: 80, size: 8.5, font: regular, color: MUTED,
  });
  const footerMarkHeight = 10;
  const footerMarkWidth = (footerMark.width / footerMark.height) * footerMarkHeight;
  page.drawImage(footerMark, { x: margin, y: 55, width: footerMarkWidth, height: footerMarkHeight });
  page.drawText("Ghana electrical estimates", { x: margin + footerMarkWidth + 10, y: 57, size: 8, font: bold, color: NAVY });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="estimo-estimate.pdf"`,
    },
  });
}
