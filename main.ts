import {app, BrowserWindow, dialog, globalShortcut, ipcMain} from "electron"
import {autoUpdater} from "electron-updater"
import Store from "electron-store"
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
const store = new Store()

const youtube = new Youtube()
const soundcloud = new Soundcloud()

ipcMain.handle("get-theme", () => {
  return store.get("theme", "light")
})

ipcMain.handle("save-theme", (event, theme: string) => {
  store.set("theme", theme)
})

ipcMain.handle("get-state", () => {
  return store.get("state", {})
})

ipcMain.handle("save-state", (event, newState: any) => {
  let state = store.get("state", {}) as object
  state = {...state, ...newState}
  store.set("state", state)
})

ipcMain.handle("reset-effects", () => {
  window?.webContents.send("reset-effects")
})

ipcMain.handle("lowshelf", (event, state: any) => {
  window?.webContents.send("lowshelf", state)
})

ipcMain.handle("highshelf", (event, state: any) => {
  window?.webContents.send("highshelf", state)
})

ipcMain.handle("highpass", (event, state: any) => {
  window?.webContents.send("highpass", state)
})

ipcMain.handle("lowpass", (event, state: any) => {
  window?.webContents.send("lowpass", state)
})

ipcMain.handle("audio-filters", () => {
  window?.webContents.send("close-all-dialogs", "filters")
  window?.webContents.send("show-filters-dialog")
})

ipcMain.handle("delay", (event, state: any) => {
  window?.webContents.send("delay", state)
})

ipcMain.handle("reverb", (event, state: any) => {
  window?.webContents.send("reverb", state)
})

ipcMain.handle("audio-effects", () => {
  window?.webContents.send("close-all-dialogs", "effects")
  window?.webContents.send("show-effects-dialog")
})

ipcMain.handle("get-previous", async (event, info: any) => {
  if (info.song.startsWith("file:///")) {
    const song = info.song.replace("file:///", "")
    const directory = path.dirname(song)
    const files = await functions.getSortedFiles(directory)
    const index = files.findIndex((f) => f === path.basename(song))
    if (index !== -1) {
      if (files[index - 1]) {
        const info = {song: `file:///${directory}/${files[index - 1]}`}
        window?.webContents.send("invoke-play", info)
      }
    }
  }
})

ipcMain.handle("get-next", async (event, info: any) => {
  if (info.song.startsWith("file:///")) {
    const song = info.song.replace("file:///", "")
    const directory = path.dirname(song)
    const files = await functions.getSortedFiles(directory)
    const index = files.findIndex((f) => f === path.basename(song))
    if (index !== -1) {
      if (files[index + 1]) {
        const info = {song: `file:///${directory}/${files[index + 1]}`}
        window?.webContents.send("invoke-play", info)
      }
    }
  }
})

ipcMain.handle("get-recent", () => {
  return store.get("recent", [])
})

ipcMain.handle("update-recent", (event, info: any) => {
  let recent = store.get("recent", []) as any[]
  if (recent.length > 8) recent.pop()
  const dupe = functions.findDupe(recent, info)
  if (dupe !== -1) recent.splice(dupe, 1)
  recent.unshift(info)
  store.set("recent", recent)
  window?.webContents.send("update-recent-gui")
})

ipcMain.handle("invoke-play", (event, info: any) => {
  window?.webContents.send("invoke-play", info)
})

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

ipcMain.handle("change-play-state", () => {
  window?.webContents.send("change-play-state")
})

ipcMain.handle("play-state-changed", () => {
  window?.webContents.send("play-state-changed")
})

ipcMain.handle("select-file", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "Audio", extensions: ["mp3", "wav", "ogg", "flac", "aac"]}
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
