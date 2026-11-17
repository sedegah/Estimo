// ESTIMO Admin desktop app.
//
// Packages the admin console as a standalone Next server and starts it on a free
// loopback port, then opens the window on it. Clerk therefore gets a real http
// origin, which is what its sign-in flow needs.

const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { app, BrowserWindow, Menu, shell } = require("electron");

let serverProcess = null;
let serverPort = 0;

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

function waitForServer(port, attempts = 120) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;
    const probe = () => {
      const request = http.get({ host: "127.0.0.1", port, path: "/", timeout: 1000 }, (response) => {
        response.resume();
        resolve(true);
      });
      request.on("error", () => {
        remaining -= 1;
        if (remaining <= 0) reject(new Error("Admin server did not start"));
        else setTimeout(probe, 250);
      });
      request.on("timeout", () => request.destroy());
    };
    probe();
  });
}

async function startServer() {
  const root = app.isPackaged ? path.join(process.resourcesPath, "admin") : path.join(__dirname, "..", "admin");
  const entry = path.join(root, "server.js");
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
    },
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.on("exit", () => {
    serverProcess = null;
  });

  await waitForServer(serverPort);
  return `http://127.0.0.1:${serverPort}`;
}

function createWindow(baseUrl) {
  const window = new BrowserWindow({
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

  window.loadURL(baseUrl);

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith("http://127.0.0.1")) shell.openExternal(url);
    return { action: "deny" };
  });

  return window;
}

const template = [
  {
    label: "ESTIMO",
    submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "quit" }],
  },
  {
    label: "Admin",
    submenu: [
      { label: "Prices and materials", click: () => BrowserWindow.getAllWindows()[0]?.loadURL(`http://127.0.0.1:${serverPort}/`) },
      { label: "Estimate builder", click: () => BrowserWindow.getAllWindows()[0]?.loadURL(`http://127.0.0.1:${serverPort}/builder`) },
    ],
  },
];

app.whenReady().then(async () => {
  try {
    const baseUrl = await startServer();
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    createWindow(baseUrl);
  } catch (error) {
    const { dialog } = require("electron");
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
  if (serverProcess) serverProcess.kill();
});
