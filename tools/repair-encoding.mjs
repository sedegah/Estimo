// One-off repair: undo cp1252-misdecoded UTF-8 in source files.
import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/kimat/Desktop/ESTIMO";

const CP1252 = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a],
  [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92],
  [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c],
  [0x017e, 0x9e], [0x0178, 0x9f],
]);

const suspicious = /[\u00e2\u00c3][\u0080-\u009f\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018\u2019\u201a\u201c\u201d\u201e\u2020\u2021\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]/;

function repair(text) {
  if (!suspicious.test(text)) return text;
  const bytes = [];
  for (const char of text) {
    const code = char.codePointAt(0);
    const mapped = CP1252.get(code);
    if (mapped !== undefined) bytes.push(mapped);
    else if (code < 0x100) bytes.push(code);
    else return text; // not a cp1252 round-trip; leave alone
  }
  const candidate = Buffer.from(bytes).toString("utf8");
  return candidate.includes("\uFFFD") ? text : candidate;
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) {
    return ["node_modules", ".next", ".git", "public"].includes(entry.name) ? [] : walk(full);
  }
  return /\.(ts|tsx|css|md|json)$/.test(entry.name) ? [full] : [];
});

let fixed = 0;
for (const file of walk(root)) {
  const before = fs.readFileSync(file, "utf8");
  const after = repair(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    fixed++;
    console.log("fixed", file.replace(root + "/", ""));
  }
}
console.log("files fixed:", fixed);
