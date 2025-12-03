import { app, BrowserWindow, shell } from "electron"
import fs from "node:fs"
import path from "node:path"

const resolveWebEntry = () => {
  // const localHtml = path.resolve(__dirname, "..", "..", "web", "res", "index.html")
  // if (fs.existsSync(localHtml)) return {
  //   type: "file", value: localHtml
  // }
  const domain = true ? "https://localhost:8000" : "https://piggo.gg"
  return { type: "url", domain }
}

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      // backgroundThrottling: false
    },
    title: "Piggo"
  })

  console.log(process.versions);
  app.getGPUInfo('complete').then((info) => {
    console.log("GPU Info:", info);
  });

  const entry = resolveWebEntry()
  if (entry.type === "file") window.loadFile(entry.domain)
  else window.loadURL(entry.domain)

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })

  return window
}

app.commandLine.appendSwitch('use-angle', 'metal'); // macOS best
// app.commandLine.appendSwitch('use-angle', 'd3d11'); // Windows best
app.commandLine.appendSwitch('enable-webgl2-compute-context');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  // if (process.platform !== "darwin") app.quit()
  app.quit()
})
