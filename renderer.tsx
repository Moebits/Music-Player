import "bootstrap/dist/css/bootstrap.min.css"
import React, {useEffect, useState} from "react"
import ReactDom from "react-dom"
import TitleBar from "./components/TitleBar"
import AudioPlayer from "./components/AudioPlayer"
import "./index.less"

const App = () => {
  return (
    <main className="app">
      <TitleBar/>
      <AudioPlayer/>
    </main>
  )
}

ReactDom.render(<App/>, document.getElementById("root"))
