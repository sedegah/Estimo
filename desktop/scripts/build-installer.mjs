// Builds the installer with our own NSIS script (no electron-builder NSIS wrapper,
// and therefore no "close the running app" gate).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const desktop = process.cwd();
const source = path.join(desktop, "release", "win-unpacked");
const version = JSON.parse(fs.readFileSync(path.join(desktop, "package.json"), "utf8")).version;
const outFile = path.join(desktop, "release", `ESTIMO-Admin-Setup-${version}.exe`);
const script = path.join(desktop, "installer", "estimo-admin.nsi");

if (!fs.existsSync(path.join(source, "ESTIMO Admin.exe"))) {
  console.error("release/win-unpacked is missing. Run `npx electron-builder --win --dir` first.");
  process.exit(1);
}

function findMakensis() {
  const roots = [
    path.join(process.env.LOCALAPPDATA ?? "", "electron-builder", "Cache", "nsis"),
    "C:\\Program Files (x86)\\NSIS",
    "C:\\Program Files\\NSIS",
  ];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.toLowerCase() === "makensis.exe") return full;
      }
    }
  }
  return null;
}

const makensis = findMakensis();
if (!makensis) {
  console.error("makensis.exe not found. Install NSIS or run electron-builder once to fetch it.");
  process.exit(1);
}

const defines = {
  APP_VERSION: version,
  SOURCE_DIR: source,
  OUTPUT_FILE: outFile,
  LICENSE_FILE: path.join(desktop, "build", "LICENSE.txt"),
  ICON_FILE: path.join(desktop, "build", "icon.ico"),
  HEADER_BMP: path.join(desktop, "build", "installerHeader.bmp"),
  SIDEBAR_BMP: path.join(desktop, "build", "installerSidebar.bmp"),
};

let text = fs.readFileSync(script, "utf8");
for (const [key, value] of Object.entries(defines)) {
  text = text.replaceAll(`@${key}@`, value.replace(/\\/g, "\\\\"));
}
const generated = path.join(desktop, "installer", "generated.nsi");
fs.writeFileSync(generated, text, "utf8");

console.log(`makensis: ${makensis}`);
const result = spawnSync(makensis, ["/V2", generated], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`installer: ${outFile}`);
