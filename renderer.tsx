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
import "./index.less"

const App = () => {
  return (
    <main className="app">
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
