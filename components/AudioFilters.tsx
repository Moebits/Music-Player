import {ipcRenderer} from "electron"
import React, {useContext, useEffect, useRef, useState} from "react"
import Slider from "rc-slider"
import functions from "../structures/functions"
import "../styles/audiofilters.less"

const AudioFilters: React.FunctionComponent = (props) => {
    const [visible, setVisible] = useState(false)
    const [hover, setHover] = useState(false)

    const initialState = {
        lowpassCutoff: 100,
        highpassCutoff: 0,
        highshelfCutoff: 70,
        highshelfGain: 0,
        lowshelfCutoff: 30,
        lowshelfGain: 0
    }

    const [state, setState] = useState(initialState)

    const reset = () => {
        setState(initialState)
        ipcRenderer.invoke("lowpass", initialState)
        ipcRenderer.invoke("highpass", initialState)
        ipcRenderer.invoke("highshelf", initialState)
        ipcRenderer.invoke("lowshelf", initialState)
    }

    useEffect(() => {
        const showeffectsDialog = (event: any, update: any) => {
            setVisible((prev) => !prev)
        }
        const closeAllDialogs = (event: any, ignore: any) => {
            if (ignore !== "filters") setVisible(false)
        }
        ipcRenderer.on("show-filters-dialog", showeffectsDialog)
        ipcRenderer.on("close-all-dialogs", closeAllDialogs)
        ipcRenderer.on("reset-effects", reset)

        return () => {
            ipcRenderer.removeListener("show-filters-dialog", showeffectsDialog)
            ipcRenderer.removeListener("close-all-dialogs", closeAllDialogs)
            ipcRenderer.removeListener("reset-effects", reset)
        }
    }, [])

    const changeState = (type: string, value: number) => {
        switch(type) {
            case "lowpassCutoff":
                setState((prev) => {
                    return {...prev, lowpassCutoff: value}
                })
                ipcRenderer.invoke("lowpass", state)
                break
            case "highpassCutoff":
                setState((prev) => {
                    return {...prev, highpassCutoff: value}
                })
                ipcRenderer.invoke("highpass", state)
                break
            case "highshelfCutoff":
                setState((prev) => {
                    return {...prev, highshelfCutoff: value}
                })
                ipcRenderer.invoke("highshelf", state)
                break
            case "highshelfGain":
                setState((prev) => {
                    return {...prev, highshelfGain: value}
                })
                ipcRenderer.invoke("highshelf", state)
                break
            case "lowshelfCutoff":
                setState((prev) => {
                    return {...prev, lowshelfCutoff: value}
                })
                ipcRenderer.invoke("lowshelf", state)
                break
            case "lowshelfGain":
                setState((prev) => {
                    return {...prev, lowshelfGain: value}
                })
                ipcRenderer.invoke("lowshelf", state)
                break
        }
    }

    const close = () => {
        if (!hover) setVisible(false)
    }

    if (visible) {
        return (
            <section className="filters-dialog" onMouseDown={close}>
                <div className="filters-dialog-box" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="filters-container">
                        <div className="filters-title-container">
                            <p className="filters-title">Audio Filters</p>
                        </div>
                        <div className="filters-row-container">
                            <div className="filters-row">
                                <p className="filters-text">Lowpass: </p>
                                <Slider className="eq-slider" onChange={(value) => {changeState("lowpassCutoff", value)}} min={0} max={100} step={1} value={state.lowpassCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Highpass: </p>
                                <Slider className="eq-slider" onChange={(value) => {changeState("highpassCutoff", value)}} min={0} max={100} step={1} value={state.highpassCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Highshelf Freq: </p>
                                <Slider className="eq-slider" onChange={(value) => {changeState("highshelfCutoff", value)}} min={0} max={100} step={1} value={state.highshelfCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Highshelf Gain: </p>
                                <Slider className="eq-slider" onChange={(value) => {changeState("highshelfGain", value)}} min={-12} max={12} step={1} value={state.highshelfGain}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Lowshelf Freq: </p>
                                <Slider className="eq-slider" onChange={(value) => {changeState("lowshelfCutoff", value)}} min={0} max={100} step={1} value={state.lowshelfCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Lowshelf Gain: </p>
                                <Slider className="eq-slider" onChange={(value) => {changeState("lowshelfGain", value)}} min={-12} max={12} step={1} value={state.lowshelfGain}/>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
    return null
}

export default AudioFilters