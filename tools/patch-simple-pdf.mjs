import fs from "node:fs";

const path = "app/quick-estimate/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

if (!text.includes("downloadSimplePdf")) {
  text = text.replace(
    "  const changeSpace = (key: string, delta: number) => {",
    `  /** The simple estimate downloads the same document the itemized page produces. */
  const downloadSimplePdf = async () => {
    const body = JSON.stringify({
      name: \`\${type.label} estimate\`,
      template: type.code,
      specLevel,
      subtitle: \`\${planSpaces.length} spaces · \${specLevel}\`,
      items: live.lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),
      total: live.total,
      specialLoads: [],
    });

    const save = async (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = \`\${type.code.toLowerCase()}-estimate.pdf\`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    };

    const direct = await fetch("/api/estimates/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (direct.ok) {
      await save(await direct.blob());
      return;
    }
    if (direct.status !== 401) return;

    const linkResponse = await fetch("/api/estimates/pdf/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!linkResponse.ok) return;
    const signed = (await linkResponse.json()) as { url?: string };
    if (!signed.url) return;
    const linked = await fetch(signed.url);
    if (linked.ok) await save(await linked.blob());
  };

  const changeSpace = (key: string, delta: number) => {`,
  );

  text = text.replace(
    `          <button className="btn-amber side-cta" type="button" onClick={openItemized}>
            Itemized estimate
          </button>`,
    `          <button className="btn-outline side-secondary" type="button" onClick={() => void downloadSimplePdf()}>
            Download PDF
          </button>
          <button className="btn-amber side-cta" type="button" onClick={openItemized}>
            Itemized estimate
          </button>`,
  );
}

fs.writeFileSync(path, text);
console.log("simple estimate downloads a PDF");
