import "bootstrap/dist/css/bootstrap.min.css"
import React from "react"
import ReactDom from "react-dom"
import TitleBar from "./components/TitleBar"
import VersionDialog from "./components/VersionDialog"
import AudioPlayer from "./components/AudioPlayer"
import AudioEffects from "./components/AudioEffects"
import AudioFilters from "./components/AudioFilters"
import MIDISynth from "./components/MIDISynth"
import ContextMenu from "./components/ContextMenu"
import {ipcRenderer} from "electron"
import "./index.less"

const App = () => {
  const onDrop = (event: React.DragEvent) => {
      console.log(event)
      const file = event.dataTransfer?.files[0]
      if (file) ipcRenderer.invoke("upload-file", file.path)
  }
  const onDragOver = (event: React.DragEvent) => {
    event.stopPropagation()
    event.preventDefault()
  }
  return (
    <main className="app" onDrop={onDrop} onDragOver={onDragOver}>
      <TitleBar/>
      <ContextMenu/>
      <VersionDialog/>
      <AudioEffects/>
      <AudioFilters/>
      <MIDISynth/>
      <AudioPlayer/>
    </main>
  )
}

ReactDom.render(<App/>, document.getElementById("root"))
