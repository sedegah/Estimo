// electron-builder's NSIS templates ship a "close the running app" check that
// false-positives on some machines (the setup window's own title matches the
// product name), so an earlier version of this project deleted it. That made an
// upgrade fail with "Error opening file for writing" when the app was open.
//
// This script puts the check back; build/installer.nsh overrides the check itself
// with a deterministic write test on the exe. It runs before every package build.
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "node_modules", "app-builder-lib", "templates", "nsis");
const files = ["installSection.nsh"];
const patched = /^(\s*);\s*!insertmacro CHECK_APP_RUNNING \(patched:[^)]*\)\s*$/gm;

for (const name of files) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) {
    console.warn(`patch-nsis: ${name} not found, skipping`);
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(patched, "$1!insertmacro CHECK_APP_RUNNING");
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    console.log(`patch-nsis: ${name} restored the running-app check`);
  } else {
    console.log(`patch-nsis: ${name} already has the check`);
  }
}
