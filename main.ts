import {app, BrowserWindow, dialog, globalShortcut, ipcMain, shell} from "electron"
import {autoUpdater} from "electron-updater"
import path from "path"
import process from "process"
import "./dev-app-update.yml"
import pack from "./package.json"
import Youtube from "youtube.ts"
import Soundcloud from "soundcloud.ts"
import functions from "./structures/functions"

process.setMaxListeners(0)
let window: Electron.BrowserWindow | null
autoUpdater.autoDownload = false

const youtube = new Youtube()
const soundcloud = new Soundcloud()

ipcMain.handle("get-song", async (event, url: string) => {
  let stream = null as unknown as NodeJS.ReadableStream
  if (url.includes("soundcloud.com")) {
    stream = await soundcloud.util.streamTrack(url)
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    stream = await youtube.util.streamMP3(url)
  }
  return functions.streamToBuffer(stream)
})

ipcMain.handle("get-song-name", async (event, url: string) => {
  let name = null as unknown as string
  if (url.includes("soundcloud.com")) {
    name = await soundcloud.util.getTitle(url)
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    name = await youtube.util.getTitle(url)
  }
  return name
})

ipcMain.handle("get-art", async (event, url: string) => {
  let picture = null as unknown as string
  if (url.includes("soundcloud.com")) {
    picture = await soundcloud.util.downloadSongCover(url, undefined, true)
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    picture = await youtube.util.downloadThumbnail(url, undefined, true)
  }
  return picture
})

ipcMain.handle("select-file", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "Audio", extensions: ["mp3", "wav", "ogg", "flac"]}
    ],
    properties: ["openFile"]
  })
  return files.filePaths[0] ? files.filePaths[0] : null
})

ipcMain.handle("install-update", async (event) => {
  await autoUpdater.downloadUpdate()
  autoUpdater.quitAndInstall()
})

ipcMain.handle("check-for-updates", async (event, startup: boolean) => {
  window?.webContents.send("close-all-dialogs", "version")
  const update = await autoUpdater.checkForUpdates()
  const newVersion = update.updateInfo.version
  if (pack.version === newVersion) {
    if (!startup) window?.webContents.send("show-version-dialog", null)
  } else {
    window?.webContents.send("show-version-dialog", newVersion)
  }
})

ipcMain.handle("get-opened-file", () => {
  return process.argv[1]
})

const openFile = (argv?: any) => {
  window?.webContents.send("debug", argv ? argv : process.argv)
  let file = argv ? argv[2] : process.argv[1]
  window?.webContents.send("open-file", file)
}

const singleLock = app.requestSingleInstanceLock()

if (!singleLock) {
  app.quit()
} else {
  app.on("second-instance", (event, argv) => {
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
    openFile(argv)
  })

  app.on("ready", () => {
    window = new BrowserWindow({width: 900, height: 650, minWidth: 720, minHeight: 450, frame: false, backgroundColor: "#f53171", center: true, webPreferences: {nodeIntegration: true, contextIsolation: false, enableRemoteModule: true, webSecurity: false}})
    window.loadFile(path.join(__dirname, "index.html"))
    window.removeMenu()
    openFile()
    window.on("closed", () => {
      window = null
    })
    globalShortcut.register("Control+Shift+I", () => {
      window?.webContents.toggleDevTools()
    })
  })
}

app.allowRendererProcessReuse = false
