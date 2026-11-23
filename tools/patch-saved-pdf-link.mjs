import fs from "node:fs";

const pagePath = "app/(app)/projects/[id]/page.tsx";
let page = fs.readFileSync(pagePath, "utf8");

const downloads = (page.match(/Download PDF/g) ?? []).length;
console.log("download links before:", downloads);

const backLink = '            <Link className="btn-outline" href="/projects">Back</Link>';
const first = page.indexOf(backLink);
console.log("take-off back link index:", first);

if (first >= 0 && downloads < 2) {
  const pdfLink = [
    backLink,
    '            <a',
    '              className="btn-outline"',
    '              href={`/api/estimates/pdf?template=${encodeURIComponent(project.template ?? "HOME-2B")}&quality=${takeOff.specLevel}&loads=${(takeOff.specialLoads ?? []).join(",")}`}',
    "            >",
    "              Download PDF",
    "            </a>",
  ].join("\n");
  page = page.slice(0, first) + pdfLink + page.slice(first + backLink.length);
  fs.writeFileSync(pagePath, page);
  console.log("saved take-off: PDF link added");
}
console.log("download links after:", (page.match(/Download PDF/g) ?? []).length);
