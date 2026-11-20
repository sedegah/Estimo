// Lightweight updater.
//
// Looks for a newer release on GitHub, downloads the installer asset and runs it
// silently in place (/S). The wizard does not appear, shortcuts stay, and user data
// is untouched. A release is published simply by attaching the installer to a
// GitHub release whose tag matches the app version (e.g. v1.1.0).

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const https = require("node:https");
const http = require("node:http");
const { spawn } = require("node:child_process");
const { app, dialog, shell } = require("electron");

const OWNER = process.env.ESTIMO_UPDATE_OWNER || "sedegah";
const REPO = process.env.ESTIMO_UPDATE_REPO || "Estimo";

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "ESTIMO-Admin-Updater", Accept: "application/vnd.github+json" } }, (response) => {
        if (response.statusCode === 404) {
          response.resume();
          resolve(null);
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Update check failed (${response.statusCode})`));
          return;
        }
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function compareVersions(a, b) {
  const parse = (value) => value.replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Update feed. By default the latest GitHub release is used. Set
 * ESTIMO_UPDATE_FEED to a JSON file/URL like { "version": "1.2.0", "url": "https://…/Setup.exe" }
 * to test the updater without publishing anything.
 */
async function latestRelease() {
  const feed = process.env.ESTIMO_UPDATE_FEED;
  if (feed) {
    if (feed.startsWith("file:")) {
      const file = new URL(feed);
      return { tag_name: "", assets: [], localFeed: JSON.parse(fs.readFileSync(file, "utf8")) };
    }
    const response = await fetch(feed);
    if (!response.ok) throw new Error(`Feed responded ${response.status}`);
    return { tag_name: "", assets: [], localFeed: await response.json() };
  }
  // Interface bundles share the releases page, so find the newest release that
  // actually carries an installer instead of trusting "latest".
  const releases = await requestJson(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=30`);
  const installer = (releases || []).find((release) =>
    (release.assets || []).some((asset) => /ESTIMO-Admin-Setup-.*\.exe$/i.test(asset.name)));
  return installer ?? null;
}

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const follow = (target) => {
      const client = target.startsWith("http://") ? http : https;
      client
        .get(target, { headers: { "User-Agent": "ESTIMO-Admin-Updater" } }, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            response.resume();
            follow(response.headers.location);
            return;
          }
          if (response.statusCode !== 200) {
            response.resume();
            reject(new Error(`Download failed (${response.statusCode})`));
            return;
          }
          const file = fs.createWriteStream(destination);
          response.pipe(file);
          file.on("finish", () => file.close(() => resolve(destination)));
          file.on("error", reject);
        })
        .on("error", reject);
    };
    follow(url);
  });
}

async function checkForUpdates({ silent = true } = {}) {
  try {
    const release = await latestRelease();
    if (!release) return { status: "no-releases" };

    const feedInfo = release.localFeed;
    const asset = feedInfo
      ? { name: `ESTIMO-Admin-Setup-${feedInfo.version}.exe`, browser_download_url: feedInfo.url }
      : (release.assets || []).find((entry) => /ESTIMO-Admin-Setup-.*\.exe$/i.test(entry.name));
    if (!asset) return { status: "no-asset" };

    const latest = feedInfo?.version || release.tag_name || release.name || "";
    if (compareVersions(latest, app.getVersion()) <= 0) {
      if (!silent) dialog.showMessageBox({ type: "info", message: "ESTIMO Admin is up to date", detail: `Version ${app.getVersion()} is the latest.` });
      return { status: "current" };
    }

    const confirm = process.env.ESTIMO_UPDATE_AUTO === "1"
      ? { response: 0 }
      : await dialog.showMessageBox({
      type: "question",
      buttons: ["Install update", "Later"],
      defaultId: 0,
      cancelId: 1,
      message: `ESTIMO Admin ${latest} is available`,
      detail: `You have ${app.getVersion()}. The update installs in place — no wizard, no re-setup — and your data stays.`,
      });
    if (confirm.response !== 0) return { status: "declined" };

    const target = path.join(os.tmpdir(), asset.name);
    await download(asset.browser_download_url, target);

    const installer = spawn(target, ["/S"], { detached: true, stdio: "ignore" });
    installer.unref();
    setTimeout(() => app.quit(), 800);
    return { status: "installing", version: latest };
  } catch (error) {
    if (!silent) {
      dialog.showMessageBox({ type: "warning", message: "Could not check for updates", detail: String(error) });
    }
    return { status: "error", error: String(error) };
  }
}

module.exports = { checkForUpdates };
