// electron-builder's NSIS templates abort installation when they think the app is
// running. On some Windows setups that check false-positives (the setup window's own
// title matches the product name) and the wizard can never finish.
//
// This patch removes the check from the generated installer and uninstaller. It runs
// before every package build, so a fresh `npm install` is patched too.
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "node_modules", "app-builder-lib", "templates", "nsis");

const files = ["installSection.nsh", "uninstaller.nsh"];

for (const name of files) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) {
    console.warn(`patch-nsis: ${name} not found, skipping`);
    continue;
  }
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(/^(\s*)!insertmacro CHECK_APP_RUNNING\s*$/gm, "$1; !insertmacro CHECK_APP_RUNNING (patched: false-positive on some machines)");
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    console.log(`patch-nsis: ${name} patched`);
  } else {
    console.log(`patch-nsis: ${name} already clean`);
  }
}
