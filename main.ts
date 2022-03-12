import {app, BrowserWindow, dialog, globalShortcut, ipcMain, shell} from "electron"
import {autoUpdater} from "electron-updater"
import * as localShortcut from "electron-shortcuts"
import Store from "electron-store"
import path from "path"
import process from "process"
import "./dev-app-update.yml"
import pack from "./package.json"
import Youtube from "youtube.ts"
import Soundcloud from "soundcloud.ts"
import functions from "./structures/functions"
import util from "util"
import child_process from "child_process"
import fs from "fs"

const exec = util.promisify(child_process.exec)
require("@electron/remote/main").initialize()
process.setMaxListeners(0)
let window: Electron.BrowserWindow | null
autoUpdater.autoDownload = false
const store = new Store()
let filePath = ""

const youtube = new Youtube()
const soundcloud = new Soundcloud()

let soxPath = undefined as any
if (process.platform === "darwin" || process.platform === "linux") soxPath = path.join(app.getAppPath(), "../../sox/sox")
if (process.platform === "win32") soxPath = path.join(app.getAppPath(), "../../sox/sox.exe")
if (!fs.existsSync(soxPath)) soxPath = path.join(__dirname, "../sox/sox")

let lastPitchedFile = ""

ipcMain.handle("pitch-song", async (event, song: string, pitch: number) => {
  if (song.startsWith("file:///")) song = song.replace("file:///", "")
  const ext = path.extname(song)
  const name = path.basename(song, ext)
  const songDest = path.join(app.getAppPath(), `../assets/audio/`)
  if (!fs.existsSync(songDest)) fs.mkdirSync(songDest, {recursive: true})
  const output = path.join(songDest, `./${name}_pitched${ext}`)
  if (output !== lastPitchedFile && fs.existsSync(lastPitchedFile)) fs.unlinkSync(lastPitchedFile)
  let command = `"${soxPath ? soxPath : "sox"}" "${song}" "${output}" pitch ${pitch * 100}`
  await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
  lastPitchedFile = output
  return output
})

ipcMain.handle("get-synth-state", () => {
  return store.get("synth", {})
})

ipcMain.handle("synth", (event, state: any) => {
  window?.webContents.send("synth", state)
  store.set("synth", state)
})

ipcMain.handle("midi-synth", () => {
  window?.webContents.send("close-all-dialogs", "synth")
  window?.webContents.send("show-synth-dialog")
})

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

ipcMain.handle("phaser", (event, state: any) => {
  window?.webContents.send("phaser", state)
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
  const song = info.song?.replace("file:///", "")
  if (fs.existsSync(song)) {
    const directory = path.dirname(song)
    const files = await functions.getSortedFiles(directory)
    const index = files.findIndex((f) => f === path.basename(song))
    if (index !== -1) {
      if (files[index - 1]) {
        const info = {song: `${process.platform === "win32" ? "file:///" : ""}${directory}/${files[index - 1]}`}
        window?.webContents.send("invoke-play", info)
      }
    }
  }
})

ipcMain.handle("get-next", async (event, info: any) => {
  const song = info.song?.replace("file:///", "")
  if (fs.existsSync(song)) {
    const directory = path.dirname(song)
    const files = await functions.getSortedFiles(directory)
    const index = files.findIndex((f) => f === path.basename(song))
    if (index !== -1) {
      if (files[index + 1]) {
        const info = {song: `${process.platform === "win32" ? "file:///" : ""}${directory}/${files[index + 1]}`}
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
  while (recent.length > 80) recent.pop()
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

ipcMain.handle("paste-loop", async (event) => {
  window?.webContents.send("paste-loop")
})


ipcMain.handle("copy-loop", async (event) => {
  window?.webContents.send("copy-loop")
})


ipcMain.handle("trigger-paste", async (event) => {
  window?.webContents.send("trigger-paste")
})

ipcMain.handle("change-play-state", () => {
  window?.webContents.send("change-play-state")
})

ipcMain.handle("play-state-changed", () => {
  window?.webContents.send("play-state-changed")
})

ipcMain.handle("save-dialog", async (event, defaultPath: string) => {
  if (!window) return
  const save = await dialog.showSaveDialog(window, {
    defaultPath,
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "MP3", extensions: ["mp3"]},
      {name: "WAV", extensions: ["wav"]},
      {name: "MIDI", extensions: ["mid"]}
    ],
    properties: ["createDirectory"]
  })
  return save.filePath ? save.filePath : null
})

ipcMain.handle("select-file", async () => {
  if (!window) return
  const files = await dialog.showOpenDialog(window, {
    filters: [
      {name: "All Files", extensions: ["*"]},
      {name: "Audio", extensions: ["mp3", "wav", "ogg", "flac", "aac"]},
      {name: "MIDI", extensions: ["mid"]}
    ],
    properties: ["openFile"]
  })
  return files.filePaths[0] ? files.filePaths[0] : null
})

ipcMain.handle("install-update", async (event) => {
  if (process.platform === "darwin") {
    const update = await autoUpdater.checkForUpdates()
    const url = `${pack.repository.url}/releases/download/v${update.updateInfo.version}/${update.updateInfo.files[0].url}`
    await shell.openExternal(url)
    app.quit()
  } else {
    await autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall()
  }
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

ipcMain.handle("upload-file", (event, file) => {
  window?.webContents.send("open-file", file)
})

ipcMain.handle("get-opened-file", () => {
  if (process.platform !== "darwin") {
    return process.argv[1]
  } else {
    return filePath
  }
})

const openFile = (argv?: any) => {
  if (process.platform !== "darwin") {
    let file = argv ? argv[2] : process.argv[1]
    window?.webContents.send("open-file", file)
  }
}

app.on("open-file", (event, file) => {
  filePath = file
  event.preventDefault()
  window?.webContents.send("open-file", file)
})

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
    window = new BrowserWindow({width: 900, height: 630, minWidth: 720, minHeight: 450, frame: false, backgroundColor: "#f53171", center: true, webPreferences: {nodeIntegration: true, contextIsolation: false, enableRemoteModule: true, webSecurity: false}})
    window.loadFile(path.join(__dirname, "index.html"))
    window.removeMenu()
    require("@electron/remote/main").enable(window.webContents)
    openFile()
    window.on("closed", () => {
      window = null
    })
    localShortcut.register("Ctrl+S", () => {
      window?.webContents.send("trigger-save")
    }, window, {strict: true})
    localShortcut.register("Ctrl+O", () => {
      window?.webContents.send("trigger-open")
    }, window, {strict: true})
    globalShortcut.register("Control+Shift+I", () => {
      window?.webContents.toggleDevTools()
    })
    if (process.env.DEVELOPMENT === "true") {
    }
  })
}

app.allowRendererProcessReuse = false
