// Copies the built admin server and its static assets into vendor/admin so
// electron-builder can ship them as resources.
import fs from "node:fs";
import path from "node:path";

const desktop = process.cwd();
const admin = path.resolve(desktop, "..", "admin");
const standalone = path.join(admin, ".next", "standalone");
const target = path.join(desktop, "vendor", "admin");

if (!fs.existsSync(path.join(standalone, "server.js"))) {
  console.error("Run `npm run build` in admin first (standalone output missing).");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(standalone, target, { recursive: true });

const staticSource = path.join(admin, ".next", "static");
const staticTarget = path.join(target, ".next", "static");
fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
fs.cpSync(staticSource, staticTarget, { recursive: true });

const publicSource = path.join(admin, "public");
if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, path.join(target, "public"), { recursive: true });
}

console.log(`vendored admin server -> ${target}`);
