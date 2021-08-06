import "bootstrap/dist/css/bootstrap.min.css"
import React from "react"
import ReactDom from "react-dom"
import TitleBar from "./components/TitleBar"
import VersionDialog from "./components/VersionDialog"
import AudioPlayer from "./components/AudioPlayer"
import "./index.less"

const App = () => {
  return (
    <main className="app">
      <TitleBar/>
      <VersionDialog/>
      <AudioPlayer/>
    </main>
  )
}

ReactDom.render(<App/>, document.getElementById("root"))
