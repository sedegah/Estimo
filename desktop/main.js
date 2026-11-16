// ESTIMO admin desktop shell.
//
// The admin interface is the same web app used in the browser, so there is one
// implementation of the catalogue screens. Electron supplies the window, the
// native menu and the "open in browser" behaviour.
//
// Run:  ESTIMO_ADMIN_URL=http://localhost:3000/admin/prices npm start
// Prod: ESTIMO_ADMIN_URL=https://<your-domain>/admin/prices npm start

const { app, BrowserWindow, Menu, shell } = require("electron");

const ADMIN_URL = process.env.ESTIMO_ADMIN_URL || "http://localhost:3000/admin/prices";

function isInternal(url) {
  return url.startsWith(ADMIN_URL.replace(/\/[^/]*$/, "")) || url.startsWith("http://localhost:3000");
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#0B2142",
    title: "ESTIMO Admin",
    autoHideMenuBar: true,
    webPreferences: {
      preload: `${__dirname}/preload.js`,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.loadURL(ADMIN_URL);

  // Links that leave the admin app open in the default browser instead.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isInternal(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (!isInternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return window;
}

const template = [
  {
    label: "ESTIMO",
    submenu: [
      { role: "reload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "Admin",
    submenu: [
      {
        label: "Prices",
        click: () => BrowserWindow.getAllWindows()[0]?.loadURL(`${ADMIN_URL.replace(/\/[^/]*$/, "")}/prices`),
      },
      {
        label: "Materials",
        click: () => BrowserWindow.getAllWindows()[0]?.loadURL(`${ADMIN_URL.replace(/\/[^/]*$/, "")}/materials`),
      },
      {
        label: "Settings",
        click: () => BrowserWindow.getAllWindows()[0]?.loadURL(`${ADMIN_URL.replace(/\/[^/]*$/, "")}/settings`),
      },
      { type: "separator" },
      {
        label: "Open estimating app",
        click: () => shell.openExternal(ADMIN_URL.replace(/\/admin\/.*$/, "/dashboard")),
      },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
