// Builds the ESTIMO Admin installer with Inno Setup.
//
//   npm run dist            (in desktop/)
//
// Requires the packaged app in release/win-unpacked and Inno Setup 6's ISCC.exe.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const desktop = process.cwd();
const source = path.join(desktop, "release", "win-unpacked");
const version = JSON.parse(fs.readFileSync(path.join(desktop, "package.json"), "utf8")).version;
const outFile = path.join(desktop, "release", `ESTIMO-Admin-Setup-${version}.exe`);
const script = path.join(desktop, "installer", "estimo-admin.iss");

if (!fs.existsSync(path.join(source, "ESTIMO Admin.exe"))) {
  console.error("release/win-unpacked is missing. Run `npx electron-builder --win --dir` first.");
  process.exit(1);
}

function findIscc() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA ?? "", "Programs", "Inno Setup 6", "ISCC.exe"),
    "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
    "C:\\Program Files\\Inno Setup 6\\ISCC.exe",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

const iscc = findIscc();
if (!iscc) {
  console.error("ISCC.exe not found. Install Inno Setup 6 (https://jrsoftware.org/isdl.php).");
  process.exit(1);
}

console.log(`iscc: ${iscc}`);

/** Antivirus can briefly hold the output file; clear it and try again. */
function compile() {
  fs.rmSync(outFile, { force: true });
  return spawnSync(iscc, [`/DAppVersion=${version}`, `/DSourceDir=${source}`, script], { stdio: "inherit" });
}

let result = compile();
if (result.status !== 0) {
  console.warn("retrying after clearing the output file…");
  spawnSync("powershell.exe", ["-NoProfile", "-Command", "Start-Sleep -Seconds 3"], { stdio: "ignore" });
  result = compile();
}
if (result.status !== 0) process.exit(result.status ?? 1);

if (!fs.existsSync(outFile)) {
  console.error(`Expected installer was not produced: ${outFile}`);
  process.exit(1);
}
console.log(`installer: ${outFile}`);
