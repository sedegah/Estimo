// Keeps the desktop app's interface current without a new installer.
//
// Every push that touches the admin console builds a new bundle and publishes it
// on the repository's releases page (tag: admin-bundle). On launch the app checks
// that release, downloads the bundle when it is newer than the one it is running,
// and unpacks it into the user's profile. The Next server then starts from that
// folder, so the window shows the latest shipped interface while nothing is served
// from the internet.

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { app } = require("electron");

const OWNER = "sedegah";
const REPO = "Estimo";
const TAG_PREFIX = "admin-bundle";
const ASSET = "admin-bundle.zip";

function bundlesRoot() {
  return path.join(app.getPath("userData"), "admin-bundles");
}

function statePath() {
  return path.join(app.getPath("userData"), "admin-state.json");
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), "utf8"));
  } catch {
    return {};
  }
}

function writeState(next) {
  try {
    fs.mkdirSync(path.dirname(statePath()), { recursive: true });
    fs.writeFileSync(statePath(), JSON.stringify(next, null, 2));
  } catch {}
}

function readBundleVersion(root) {
  try {
    const info = JSON.parse(fs.readFileSync(path.join(root, "bundle.json"), "utf8"));
    return typeof info.version === "string" ? info.version : "";
  } catch {
    return "";
  }
}

/** The bundle the app should run: the newest downloaded one, else the packaged copy. */
function activeBundleRoot() {
  const state = readState();
  if (typeof state.active === "string" && state.active) {
    const candidate = path.join(bundlesRoot(), state.active);
    if (fs.existsSync(path.join(candidate, "server.js"))) return candidate;
  }

  const packaged = app.isPackaged
    ? path.join(process.resourcesPath, "admin")
    : path.join(__dirname, "..", "admin", ".next", "standalone");
  return packaged;
}

async function releaseInfo() {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=30`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "estimo-admin-desktop" },
  });
  if (!response.ok) return null;
  const releases = await response.json();
  const release = (releases || []).find((entry) => String(entry.tag_name || "").startsWith(TAG_PREFIX));
  if (!release) return null;
  const asset = (release.assets || []).find((entry) => entry.name === ASSET);
  if (!asset) return null;
  return { release, asset, version: resolveVersion(release) };
}

function resolveVersion(release) {
  const tag = String(release.tag_name || "").replace(`${TAG_PREFIX}-`, "").replace(TAG_PREFIX, "");
  return tag || String(release.published_at || "");
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const follow = (target) => {
      fetch(target, { headers: { "User-Agent": "estimo-admin-desktop" } })
        .then((response) => {
          if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
            follow(response.headers.get("location"));
            return null;
          }
          if (!response.ok || !response.body) throw new Error(`Download failed (${response.status})`);
          const file = fs.createWriteStream(destination);
          return response.arrayBuffer().then((buffer) => {
            file.write(Buffer.from(buffer));
            file.end();
            file.on("finish", () => file.close(() => resolve(destination)));
          });
        })
        .catch(reject);
    };
    follow(url);
  });
}

function unzip(archive, destination) {
  fs.mkdirSync(destination, { recursive: true });
  const result = spawn(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `Expand-Archive -LiteralPath '${archive}' -DestinationPath '${destination}' -Force`],
    { stdio: "ignore", windowsHide: true },
  );
  return new Promise((resolve, reject) => {
    result.on("exit", (code) => (code === 0 ? resolve(destination) : reject(new Error(`Unzip failed (${code})`))));
    result.on("error", reject);
  });
}

/**
 * Checks the releases page and installs a newer bundle when there is one.
 * Returns { status: "current" | "updated" | "no-releases" | "error", version }.
 */
async function checkForInterfaceUpdate({ silent = true } = {}) {
  try {
    const info = await releaseInfo();
    if (!info) return { status: "no-releases" };

    const current = readBundleVersion(activeBundleRoot());
    if (info.version && current && info.version === current) return { status: "current", version: current };

    const work = fs.mkdtempSync(path.join(os.tmpdir(), "estimo-bundle-"));
    const archive = path.join(work, ASSET);
    await download(info.asset.browser_download_url, archive);
    const target = path.join(bundlesRoot(), info.version || String(Date.now()));
    fs.rmSync(target, { recursive: true, force: true });
    await unzip(archive, target);
    fs.rmSync(work, { recursive: true, force: true });

    if (!fs.existsSync(path.join(target, "server.js"))) {
      return { status: "error", error: "The downloaded bundle has no server.js" };
    }

    const state = readState();
    writeState({ ...state, active: path.basename(target), version: info.version });
    return { status: "updated", version: info.version };
  } catch (error) {
    return { status: "error", error: String(error) };
  }
}

module.exports = { activeBundleRoot, checkForInterfaceUpdate, readBundleVersion };
