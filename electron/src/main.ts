import { app, BrowserWindow, shell } from "electron"

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minHeight: 612,
    minWidth: 1088,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true
    },
    title: "Piggo"
  })

  app.getGPUInfo('complete').then((info) => {
    // console.log("GPU Info:", info);
  });

  const domain = true ? "https://localhost:8000" : "https://piggo.gg"
  window.loadURL(domain)

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
  app.quit()
})
