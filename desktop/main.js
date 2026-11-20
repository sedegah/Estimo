// ESTIMO Admin desktop app.
//
// Runs the admin console as a local Next server (127.0.0.1, random port) and opens
// the window on it, so Clerk gets a real http origin. The interface itself is kept
// current from the repository's releases: a push builds a new admin bundle, and the
// app swaps to it on the next launch - no new installer, nothing served online.

const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const { checkForUpdates } = require("./updater");
const { activeBundleRoot, checkForInterfaceUpdate } = require("./admin-bundle");

/** Everything that goes wrong lands in %APPDATA%\estimo-admin-desktop\logs\main.log. */
function logLine(message) {
  try {
    const dir = path.join(app.getPath("userData"), "logs");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "main.log"), `${new Date().toISOString()} ${message}\n`);
  } catch {}
}

process.on("uncaughtException", (error) => {
  logLine(`uncaught: ${error?.stack ?? error}`);
  dialog.showErrorBox("ESTIMO Admin error", String(error?.message ?? error));
});
process.on("unhandledRejection", (error) => logLine(`unhandled: ${error?.stack ?? error}`));

let serverProcess = null;
let serverPort = 0;
let mainWindow = null;

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(port, attempts = 160) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;
    const probe = () => {
      const request = http.get({ host: "127.0.0.1", port, path: "/", timeout: 1000 }, (response) => {
        response.resume();
        resolve(true);
      });
      request.on("error", () => {
        remaining -= 1;
        if (remaining <= 0) reject(new Error("The admin interface did not start"));
        else setTimeout(probe, 250);
      });
      request.on("timeout", () => request.destroy());
    };
    probe();
  });
}

async function startServer() {
  const root = activeBundleRoot();
  const entry = path.join(root, "server.js");
  logLine(`starting server from ${root} (server.js exists: ${fs.existsSync(entry)})`);
  serverPort = await freePort();

  serverProcess = spawn(process.execPath, [entry], {
    cwd: root,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(serverPort),
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_YmVsb3ZlZC1nb3BoZXItNjYzMS5jbGVyay5hY2NvdW50cy5kZXYk",
    },
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.on("exit", () => {
    serverProcess = null;
  });

  await waitForServer(serverPort);
  logLine(`server ready on port ${serverPort}`);
  return `http://127.0.0.1:${serverPort}`;
}

function stopServer() {
  if (!serverProcess) return;
  try {
    serverProcess.kill();
  } catch {}
  serverProcess = null;
}

function createWindow(baseUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#0B2142",
    title: "ESTIMO Admin",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(baseUrl);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${serverPort}`)) shell.openExternal(url);
    return { action: "deny" };
  });

  return mainWindow;
}

/** Downloads a newer interface bundle and, when there is one, restarts on it. */
async function refreshInterface({ silent = true } = {}) {
  const result = await checkForInterfaceUpdate({ silent });
  if (result.status === "updated") {
    stopServer();
    const baseUrl = await startServer();
    mainWindow?.loadURL(baseUrl);
    if (!silent) {
      dialog.showMessageBox({
        type: "info",
        message: "Interface updated",
        detail: `ESTIMO Admin is now running interface ${result.version}.`,
      });
    }
    return result;
  }
  if (!silent) {
    dialog.showMessageBox({
      type: "info",
      message: "Interface is up to date",
      detail: result.status === "no-releases" ? "No interface build has been published yet." : "You are running the newest published interface.",
    });
  }
  return result;
}

const template = [
  {
    label: "ESTIMO",
    submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "quit" }],
  },
  {
    label: "Admin",
    submenu: [
      { label: "Prices and materials", click: () => mainWindow?.loadURL(`http://127.0.0.1:${serverPort}/`) },
      { label: "Estimate builder", click: () => mainWindow?.loadURL(`http://127.0.0.1:${serverPort}/builder`) },
      { type: "separator" },
      { label: "Check for interface update…", click: () => void refreshInterface({ silent: false }) },
      { label: "Check for app update…", click: () => checkForUpdates({ silent: false }) },
    ],
  },
];

app.whenReady().then(async () => {
  logLine(`ready (packaged: ${app.isPackaged}, version ${app.getVersion()})`);
  try {
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    const baseUrl = await startServer();
    createWindow(baseUrl);

    setTimeout(() => {
      void refreshInterface({ silent: true });
      void checkForUpdates({ silent: true });
    }, 5000);
  } catch (error) {
    dialog.showErrorBox("ESTIMO Admin could not start", String(error));
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(`http://127.0.0.1:${serverPort}`);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopServer();
});
