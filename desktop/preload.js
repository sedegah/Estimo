const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("estimoDesktop", {
  platform: process.platform,
  isDesktop: true,
});
