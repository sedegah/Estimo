import fs from "node:fs";

const pagePath = "app/(app)/projects/[id]/page.tsx";
let page = fs.readFileSync(pagePath, "utf8");

const branch = page.indexOf("if (project.quantities) {");
if (branch < 0) throw new Error("take-off branch not found");

const backLink = '            <Link className="btn-outline" href="/projects">Back</Link>';
const at = page.indexOf(backLink, branch);
if (at < 0) throw new Error("back link not found in take-off branch");

if (!page.slice(at, at + 400).includes("/api/estimates/pdf")) {
  const pdfLink = [
    backLink,
    '            <a',
    '              className="btn-outline"',
    '              href={`/api/estimates/pdf?template=${encodeURIComponent(project.template ?? "HOME-2B")}&quality=${takeOff.specLevel}&loads=${(takeOff.specialLoads ?? []).join(",")}`}',
    "            >",
    "              Download PDF",
    "            </a>",
  ].join("\n");
  page = page.slice(0, at) + pdfLink + page.slice(at + backLink.length);
  fs.writeFileSync(pagePath, page);
  console.log("take-off branch: PDF link added");
} else {
  console.log("take-off branch already has a PDF link");
}
