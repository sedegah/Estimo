import fs from "node:fs";

const routePath = "app/api/estimates/pdf/route.ts";
let route = fs.readFileSync(routePath, "utf8");
if (!route.includes("specialLoads")) {
  route = route.replace(
    '  const name = url.searchParams.get("name")?.trim().slice(0, 80) || undefined;',
    [
      '  const name = url.searchParams.get("name")?.trim().slice(0, 80) || undefined;',
      '  // load keys confirmed with the customer, listed on the estimate but not priced',
      '  const specialLoads = (url.searchParams.get("loads") ?? "")',
      '    .split(",")',
      '    .map((key) => key.trim())',
      '    .filter(Boolean);',
    ].join("\n"),
  );
  route = route.replace(
    "buildEstimatePdf({ template: type.code, quality, counts, name })",
    "buildEstimatePdf({ template: type.code, quality, counts, name, specialLoads })",
  );
  fs.writeFileSync(routePath, route);
  console.log("route: special loads parsed");
}

const pagePath = "app/(app)/projects/[id]/page.tsx";
let page = fs.readFileSync(pagePath, "utf8");
if (!page.includes("/api/estimates/pdf")) {
  const backLink = '            <Link className="btn-outline" href="/projects">Back</Link>';
  const pdfLink = [
    backLink,
    '            <a',
    '              className="btn-outline"',
    '              href={`/api/estimates/pdf?template=${encodeURIComponent(project.template ?? "HOME-2B")}&quality=${takeOff.specLevel}&loads=${(takeOff.specialLoads ?? []).join(",")}`}',
    "            >",
    "              Download PDF",
    "            </a>",
  ].join("\n");
  if (!page.includes(backLink)) throw new Error("back link not found in saved take-off header");
  page = page.replace(backLink, pdfLink);
  fs.writeFileSync(pagePath, page);
  console.log("saved take-off: PDF link added");
}
