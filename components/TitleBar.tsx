import {ipcRenderer, remote} from "electron"
import React, {useEffect, useState, useReducer, useRef} from "react"
import closeButtonHover from "../assets/icons/close-hover.png"
import closeButton from "../assets/icons/close.png"
import appIcon from "../assets/icons/logo.gif"
import maximizeButtonHover from "../assets/icons/maximize-hover.png"
import maximizeButton from "../assets/icons/maximize.png"
import minimizeButtonHover from "../assets/icons/minimize-hover.png"
import minimizeButton from "../assets/icons/minimize.png"
import starButtonHover from "../assets/icons/star-hover.png"
import starButton from "../assets/icons/star.png"
import updateButtonHover from "../assets/icons/updates-hover.png"
import updateButton from "../assets/icons/updates.png"
import playTiny from "../assets/icons/playTiny.png"
import playTinyHover from "../assets/icons/playTiny-hover.png"
import pauseTiny from "../assets/icons/pauseTiny.png"
import pauseTinyHover from "../assets/icons/pauseTiny-hover.png"
import fxButton from "../assets/icons/fx.png"
import fxButtonHover from "../assets/icons/fx-hover.png"
import eqButton from "../assets/icons/eq.png"
import eqButtonHover from "../assets/icons/eq-hover.png"
import darkButton from "../assets/icons/dark.png"
import darkButtonHover from "../assets/icons/dark-hover.png"
import lightButton from "../assets/icons/light.png"
import lightButtonHover from "../assets/icons/light-hover.png"
import pack from "../package.json"
import path from "path"
import "../styles/titlebar.less"

const TitleBar: React.FunctionComponent = (props) => {
    const [hoverClose, setHoverClose] = useState(false)
    const [hoverMin, setHoverMin] = useState(false)
    const [hoverMax, setHoverMax] = useState(false)
    const [hoverReload, setHoverReload] = useState(false)
    const [hoverStar, setHoverStar] = useState(false)
    const [hoverPlay, setHoverPlay] = useState(false)
    const [hoverFX, setHoverFX] = useState(false)
    const [hoverEQ, setHoverEQ] = useState(false)
    const [hoverTheme, setHoverTheme] = useState(false)
    const [theme, setTheme] = useState("light")
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const playRef = useRef(null) as any

    useEffect(() => {
        const playStateChanged = () => {
            setTimeout(() => {
                forceUpdate()
            }, 200)
        }
        const initTheme = async () => {
            const saved = await ipcRenderer.invoke("get-theme")
            changeTheme(saved)
        }
        forceUpdate()
        initTheme()
        ipcRenderer.invoke("check-for-updates", true)
        ipcRenderer.on("play-state-changed", playStateChanged)
        return () => {
            ipcRenderer.removeListener("play-state-changed", playStateChanged)
        }
    }, [])

    const minimize = () => {
        remote.getCurrentWindow().minimize()
    }

    const maximize = () => {
        const window = remote.getCurrentWindow()
        if (window.isMaximized()) {
            window.unmaximize()
        } else {
            window.maximize()
        }
    }
    const close = () => {
        remote.getCurrentWindow().close()
    }
    const star = () => {
        remote.shell.openExternal(pack.repository.url)
    }
    const update = () => {
        ipcRenderer.invoke("check-for-updates", false)
    }

    const play = () => {
        ipcRenderer.invoke("change-play-state")
    }

    const getPlayState = () => {
        const button = document.querySelector(".player-button.play-button") as HTMLImageElement
        const name = path.basename(button?.src ?? "")
        if (name.includes("play")) {
            return "paused"
        } else {
            return "started"
        }
    }

    const fx = () => {
        ipcRenderer.invoke("audio-effects")
    }

    const eq = () => {
        ipcRenderer.invoke("audio-filters")
    }

    const changeTheme = (value?: string) => {
        let condition = value !== undefined ? value === "dark" : theme === "light"
        if (condition) {
            document.documentElement.style.setProperty("--title-color", "#090409")
            document.documentElement.style.setProperty("--text-color", "#f53171")
            document.documentElement.style.setProperty("--player-color", "#090409")
            setTheme("dark")
            ipcRenderer.invoke("save-theme", "dark")
        } else {
            document.documentElement.style.setProperty("--title-color", "#f53171")
            document.documentElement.style.setProperty("--text-color", "black")
            document.documentElement.style.setProperty("--player-color", "#ea224b")
            setTheme("light")
            ipcRenderer.invoke("save-theme", "light")
        }
    }

    return (
        <section className="title-bar">
                <div className="title-bar-drag-area">
                    <div className="title-container">
                        <img className="app-icon" height="22" width="22" src={appIcon}/>
                        <p><span className="title">Music Player v{pack.version}</span></p>
                    </div>
                    <div className="title-bar-buttons">
                        <img src={hoverTheme ? (theme === "light" ? darkButtonHover : lightButtonHover) : (theme === "light" ? darkButton : lightButton)} height="20" width="20" className="title-bar-button theme-button" onClick={() => changeTheme()} onMouseEnter={() => setHoverTheme(true)} onMouseLeave={() => setHoverTheme(false)}/>
                        <img src={hoverEQ ? eqButtonHover : eqButton} height="20" width="20" className="title-bar-button eq-button" onClick={eq} onMouseEnter={() => setHoverEQ(true)} onMouseLeave={() => setHoverEQ(false)}/>
                        <img src={hoverFX ? fxButtonHover : fxButton} height="20" width="20" className="title-bar-button fx-button" onClick={fx} onMouseEnter={() => setHoverFX(true)} onMouseLeave={() => setHoverFX(false)}/>
                        <img ref={playRef} src={hoverPlay ? (getPlayState() === "started" ? pauseTinyHover : playTinyHover) : (getPlayState() === "started" ? pauseTiny : playTiny)} height="20" width="20" className="title-bar-button play-title-button" onClick={play} onMouseEnter={() => setHoverPlay(true)} onMouseLeave={() => setHoverPlay(false)}/>
                        <img src={hoverStar ? starButtonHover : starButton} height="20" width="20" className="title-bar-button star-button" onClick={star} onMouseEnter={() => setHoverStar(true)} onMouseLeave={() => setHoverStar(false)}/>
                        <img src={hoverReload ? updateButtonHover : updateButton} height="20" width="20" className="title-bar-button update-button" onClick={update} onMouseEnter={() => setHoverReload(true)} onMouseLeave={() => setHoverReload(false)}/>
                        <img src={hoverMin ? minimizeButtonHover : minimizeButton} height="20" width="20" className="title-bar-button" onClick={minimize} onMouseEnter={() => setHoverMin(true)} onMouseLeave={() => setHoverMin(false)}/>
                        <img src={hoverMax ? maximizeButtonHover : maximizeButton} height="20" width="20" className="title-bar-button" onClick={maximize} onMouseEnter={() => setHoverMax(true)} onMouseLeave={() => setHoverMax(false)}/>
                        <img src={hoverClose ? closeButtonHover : closeButton} height="20" width="20" className="title-bar-button" onClick={close} onMouseEnter={() => setHoverClose(true)} onMouseLeave={() => setHoverClose(false)}/>
                    </div>
                </div>
        </section>
    )
}

export default TitleBar