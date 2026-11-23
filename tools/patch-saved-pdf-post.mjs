import fs from "node:fs";

const path = "app/(app)/projects/[id]/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldLink = `            <a
              className="btn-outline"
              href={\`/api/estimates/pdf?template=\${encodeURIComponent(project.template ?? "HOME-2B")}&quality=\${takeOff.specLevel}&loads=\${(takeOff.specialLoads ?? []).join(",")}\`}
            >
              Download PDF
            </a>`;

const newLink = `            <button className="btn-outline" type="button" onClick={downloadPdf}>
              Download PDF
            </button>`;

if (!text.includes(oldLink)) throw new Error("pdf link not found");
text = text.replace(oldLink, newLink);

// the same lines, total and loads the screen shows are what the document receives
const resumeBlock = `    const resume = () => {`;
const downloadBlock = `    /** The PDF is generated from this estimate's own lines, so the two always agree. */
    const downloadPdf = async () => {
      const items = project.items ?? [];
      const known = items.reduce((sum, line) => (line.priceGhs == null ? sum : sum + line.priceGhs * line.quantity), 0);
      const response = await fetch("/api/estimates/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          template: project.template ?? "HOME-2B",
          specLevel: takeOff.specLevel,
          subtitle: \`\${takeOff.spaces.length} spaces · \${takeOff.specLevel} · \${Math.round(area * 10) / 10} m²\`,
          items,
          total: project.totalGhs ?? Math.round(known * 100) / 100,
          specialLoads: takeOff.specialLoads ?? [],
        }),
      });
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = \`\${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf\`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const resume = () => {`;

if (!text.includes(resumeBlock)) throw new Error("resume block not found");
text = text.replace(resumeBlock, downloadBlock);

fs.writeFileSync(path, text);
console.log("saved estimate: PDF generated from its own lines");
