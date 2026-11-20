// ESTIMO Admin desktop app.
//
// The console itself lives on a private Cloudflare Worker, so every deploy is
// visible here after a reload (Ctrl+R) - no reinstall for interface changes.
// This shell only provides the window, the menu and an offline retry screen.

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const { checkForUpdates } = require("./updater");

const CONSOLE_URL = process.env.ESTIMO_CONSOLE_URL || "https://estimo-console-k7m2q9.sedegahkimathi.workers.dev";

const OFFLINE_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>ESTIMO Admin - offline</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #0b2142; color: #e8ecf4;
    font-family: -apple-system, "Segoe UI", Arial, sans-serif;
  }
  main { text-align: center; max-width: 30rem; padding: 2rem; }
  .mark { width: 64px; height: 64px; border-radius: 16px; background: #f5b800; color: #0b2142;
    display: grid; place-items: center; font-weight: 800; font-size: 28px; margin: 0 auto 18px; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p { color: #a9b6cc; line-height: 1.6; margin: 0 0 20px; }
  button { font: inherit; font-weight: 700; padding: 11px 22px; border-radius: 10px;
    border: 0; background: #f5b800; color: #0b2142; cursor: pointer; }
  code { background: #12294f; padding: 2px 6px; border-radius: 5px; font-size: 12.5px; }
</style>
</head>
<body>
  <main>
    <div class="mark">E</div>
    <h1>ESTIMO Admin is offline</h1>
    <p>The console runs on the ESTIMO server and could not be reached. Check your connection, then try again.</p>
    <button onclick="location.replace(${JSON.stringify(CONSOLE_URL)})">Try again</button>
    <p style="margin-top:18px;font-size:12.5px">If this keeps happening: <code>${CONSOLE_URL}</code></p>
  </main>
</body>
</html>`)}`;

let mainWindow = null;

function loadConsole(window = mainWindow) {
  if (window) window.loadURL(CONSOLE_URL);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#0B2142",
    title: "ESTIMO Admin",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // A failed load shows the retry screen instead of Chromium's error page.
  mainWindow.webContents.on("did-fail-load", (event, code, description, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3 = aborted (a redirect, not a failure)
    mainWindow.loadURL(OFFLINE_PAGE);
  });

  // External links (docs, mailto) open in the browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(CONSOLE_URL) && !url.startsWith("data:")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  loadConsole();
  return mainWindow;
}

const template = [
  {
    label: "ESTIMO",
    submenu: [
      { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => loadConsole() },
      { label: "Force reload", accelerator: "CmdOrCtrl+Shift+R", click: () => mainWindow?.webContents.reloadIgnoringCache() },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "Console",
    submenu: [
      { label: "Open in browser", click: () => shell.openExternal(CONSOLE_URL) },
      { type: "separator" },
      { label: "Check for desktop update…", click: () => checkForUpdates({ silent: false }) },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();
  setTimeout(() => void checkForUpdates({ silent: true }), 6000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
