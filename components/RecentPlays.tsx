import React, {useEffect, useReducer} from "react"
import {ipcRenderer} from "electron"
import square from "../assets/images/square.png"
import "../styles/recentplays.less"

let recent = [] as any[]

const RecentPlays: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)

    useEffect(() => {
        const updateRecentGUI = async () => {
            recent = await ipcRenderer.invoke("get-recent")
            forceUpdate()
        }
        updateRecentGUI()
        ipcRenderer.on("update-recent-gui", updateRecentGUI)
        return () => {
            ipcRenderer.removeListener("update-recent-gui", updateRecentGUI)
        }
    }, [])

    const invokePlay = (info: any) => {
        ipcRenderer.invoke("invoke-play", info)
    }

    const checkYT = (info: any) => {
        if (info.songUrl?.includes("youtube.com") || info.songUrl?.includes("youtu.be")) return true
        return false
    }

    const generateJSX = () => {
        let row1 = []
        let row2 = []
        for (let i = 0; i < 4; i++) {
            if (!recent[i]) {
                row1.push(<img className="recent-img" src={square}/>)
            } else {
                row1.push(<img className={`${checkYT(recent[i]) ? "recent-img-yt" : "recent-img"}`} onClick={() => invokePlay(recent[i])} src={recent[i].songCover}/>)
            }
        }
        for (let i = 4; i < 8; i++) {
            if (!recent[i]) {
                row2.push(<img className="recent-img" src={square}/>)
            } else {
                row2.push(<img className={`${checkYT(recent[i]) ? "recent-img-yt" : "recent-img"}`} onClick={() => invokePlay(recent[i])} src={recent[i].songCover}/>)
            }
        }
        return (
            <div className="recent-row-container">
                <div className="recent-row">{row1}</div>
                <div className="recent-row">{row2}</div>
            </div>
        )
    }

    return (
        <section className="recent-plays">
            <div className="recent-title-container">
                <p className="recent-title">Recent Plays</p>
            </div>
            {generateJSX()}
        </section>
    )
}

export default RecentPlays