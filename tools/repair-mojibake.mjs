// Repairs cp1252-misdecoded UTF-8 sequences left by earlier file writes.
import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/kimat/Desktop/ESTIMO";

const REPLACEMENTS = [
  ["Ã‚Â·", "·"],
  ["Ãƒâ€”", "×"],
  ["Ã¢â‚¬â„¢", "’"],
  ["Ã¢â‚¬â€œ", "–"],
  ["Ã¢â‚¬â€", "—"],
  ["Ã¢â‚¬Â¦", "…"],
  ["Ã¢Ë†â€™", "−"],
  ["Ã¢â€°Â¥", "≥"],
  ["mÃ‚Â²", "m²"],
  ["Â·", "·"],
  ["â€”", "—"],
  ["â€“", "–"],
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€\u009d", "”"],
  ["â€¦", "…"],
  ["â”€", "─"],
  ["â”‚", "│"],
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return ["node_modules", ".next", ".git", "public", ".open-next", "release"].includes(entry.name) ? [] : walk(full);
    }
    return /\.(ts|tsx|css|md|json)$/.test(entry.name) ? [full] : [];
  });

let fixed = 0;
for (const dir of ["app", "components", "lib", "styles"]) {
  for (const file of walk(path.join(root, dir))) {
    const before = fs.readFileSync(file, "utf8");
    let after = before;
    for (const [from, to] of REPLACEMENTS) after = after.split(from).join(to);
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      fixed += 1;
      console.log("repaired", path.relative(root, file));
    }
  }
}
console.log("files repaired:", fixed);
