import {ipcRenderer} from "electron"
import React, {useContext, useEffect, useRef, useState} from "react"
import Slider from "rc-slider"
import "../styles/audioeffects.less"

const AudioEffects: React.FunctionComponent = (props) => {
    const [visible, setVisible] = useState(false)
    const [hover, setHover] = useState(false)

    const initialState = {
        reverbMix: 0,
        reverbDecay: 1.5,
        delayMix: 0,
        delayTime: 0.25,
        delayFeedback: 0.3
    }

    const [state, setState] = useState(initialState)

    const reset = () => {
        setState(initialState)
        ipcRenderer.invoke("reverb", initialState)
        ipcRenderer.invoke("delay", initialState)
    }

    useEffect(() => {
        const showeffectsDialog = (event: any, update: any) => {
            setVisible((prev) => !prev)
        }
        const closeAllDialogs = (event: any, ignore: any) => {
            if (ignore !== "effects") setVisible(false)
        }
        ipcRenderer.on("show-effects-dialog", showeffectsDialog)
        ipcRenderer.on("close-all-dialogs", closeAllDialogs)
        ipcRenderer.on("reset-effects", reset)

        return () => {
            ipcRenderer.removeListener("show-effects-dialog", showeffectsDialog)
            ipcRenderer.removeListener("close-all-dialogs", closeAllDialogs)
            ipcRenderer.removeListener("reset-effects", reset)
        }
    }, [])

    const changeState = (type: string, value: number) => {
        switch(type) {
            case "reverbMix":
                setState((prev) => {
                    return {...prev, reverbMix: value}
                })
                ipcRenderer.invoke("reverb", {...state, reverbMix: value})
                break
            case "reverbDecay":
                setState((prev) => {
                    return {...prev, reverbDecay: value}
                })
                ipcRenderer.invoke("reverb", {...state, reverbDecay: value})
                break
            case "delayMix":
                setState((prev) => {
                    return {...prev, delayMix: value}
                })
                ipcRenderer.invoke("delay", {...state, delayMix: value})
                break
            case "delayTime":
                setState((prev) => {
                    return {...prev, delayTime: value}
                })
                ipcRenderer.invoke("delay", {...state, delayTime: value})
                break
            case "delayFeedback":
                setState((prev) => {
                    return {...prev, delayFeedback: value}
                })
                ipcRenderer.invoke("delay", {...state, delayFeedback: value})
                break
        }
    }

    const close = () => {
        if (!hover) setVisible(false)
    }

    if (visible) {
        return (
            <section className="effects-dialog" onMouseDown={close}>
                <div className="effects-dialog-box" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="effects-container">
                        <div className="effects-title-container">
                            <p className="effects-title">Audio Effects</p>
                        </div>
                        <div className="effects-row-container">
                            <div className="effects-row">
                                <p className="effects-text">Reverb Mix: </p>
                                <Slider className="fx-slider" onChange={(value) => {changeState("reverbMix", value)}} min={0} max={1} step={0.1} value={state.reverbMix}/>
                            </div>
                            <div className="effects-row">
                                <p className="effects-text">Reverb Decay: </p>
                                <Slider className="fx-slider" onChange={(value) => {changeState("reverbDecay", value)}} min={0.1} max={5} step={0.5} value={state.reverbDecay}/>
                            </div>
                            <div className="effects-row">
                                <p className="effects-text">Delay Mix: </p>
                                <Slider className="fx-slider" onChange={(value) => {changeState("delayMix", value)}} min={0} max={1} step={0.1} value={state.delayMix}/>
                            </div>
                            <div className="effects-row">
                                <p className="effects-text">Delay Time: </p>
                                <Slider className="fx-slider" onChange={(value) => {changeState("delayTime", value)}} min={0.1} max={1} step={0.1} value={state.delayTime}/>
                            </div>
                            <div className="effects-row">
                                <p className="effects-text">Delay Feedback: </p>
                                <Slider className="fx-slider" onChange={(value) => {changeState("delayFeedback", value)}} min={0.1} max={1} step={0.1} value={state.delayFeedback}/>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
    return null
}

export default AudioEffects