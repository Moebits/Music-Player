import {ipcRenderer} from "electron"
import React, {useEffect, useRef, useState} from "react"
import Slider from "rc-slider"
import monoButton from "../assets/icons/mono.png"
import monoButtonHover from "../assets/icons/mono-hover.png"
import polyButton from "../assets/icons/poly.png"
import polyButtonHover from "../assets/icons/poly-hover.png"
import sawtoothWave from "../assets/icons/sawtoothwave.png"
import sawtoothWaveHover from "../assets/icons/sawtoothwave-hover.png"
import squareWave from "../assets/icons/squarewave.png"
import squareWaveHover from "../assets/icons/squarewave-hover.png"
import triangleWave from "../assets/icons/trianglewave.png"
import triangleWaveHover from "../assets/icons/trianglewave-hover.png"
import sineWave from "../assets/icons/sinewave.png"
import sineWaveHover from "../assets/icons/sinewave-hover.png"
import sawtoothWaveSelected from "../assets/icons/sawtoothwave-selected.png"
import sawtoothWaveSelectedHover from "../assets/icons/sawtoothwave-selected-hover.png"
import squareWaveSelected from "../assets/icons/squarewave-selected.png"
import squareWaveSelectedHover from "../assets/icons/squarewave-selected-hover.png"
import triangleWaveSelected from "../assets/icons/trianglewave-selected.png"
import triangleWaveSelectedHover from "../assets/icons/trianglewave-selected-hover.png"
import sineWaveSelected from "../assets/icons/sinewave-selected.png"
import sineWaveSelectedHover from "../assets/icons/sinewave-selected-hover.png"
import basic from "../assets/icons/basic.png"
import basicHover from "../assets/icons/basic-hover.png"
import am from "../assets/icons/am.png"
import amHover from "../assets/icons/am-hover.png"
import fm from "../assets/icons/fm.png"
import fmHover from "../assets/icons/fm-hover.png"
import pulse from "../assets/icons/pulse.png"
import pulseHover from "../assets/icons/pulse-hover.png"
import pwm from "../assets/icons/pwm.png"
import pwmHover from "../assets/icons/pwm-hover.png"
import fat from "../assets/icons/fat.png"
import fatHover from "../assets/icons/fat-hover.png"
import "../styles/midisynth.less"

const MIDISynth: React.FunctionComponent = (props) => {
    const [visible, setVisible] = useState(false)
    const [hover, setHover] = useState(false)
    const [polyHover, setPolyHover] = useState(false)
    const [sawHover, setSawHover] = useState(false)
    const [squareHover, setSquareHover] = useState(false)
    const [triangleHover, setTriangleHover] = useState(false)
    const [sineHover, setSineHover] = useState(false)
    const [basicHoverState, setBasicHoverState] = useState(false)
    const [amHoverState, setAMHoverState] = useState(false)
    const [fmHoverState, setFMHoverState] = useState(false)
    const [pulseHoverState, setPulseHoverState] = useState(false)
    const [pwmHoverState, setPWMHoverState] = useState(false)
    const [fatHoverState, setFatHoverState] = useState(false)

    const initialState = {
        wave: "square",
        basicWave: "square",
        waveType: "basic",
        attack: 0.02,
        decay: 0.5,
        sustain: 0.3,
        release: 0.5,
        poly: true,
        portamento: 0
    }

    const [state, setState] = useState(initialState)

    const reset = () => {
        setState(initialState)
    }

    useEffect(() => {
        const showsynthDialog = (event: any, update: any) => {
            setVisible((prev) => {
                if (prev === true) return false
                if (prev === false) {
                    ipcRenderer.invoke("get-synth-state").then((newState) => {
                        setState((prev) => {
                            return {...prev, ...newState}
                        })
                    })
                }
                return true
            })
        }
        const closeAllDialogs = (event: any, ignore: any) => {
            if (ignore !== "synth") setVisible(false)
        }
        ipcRenderer.on("show-synth-dialog", showsynthDialog)
        ipcRenderer.on("close-all-dialogs", closeAllDialogs)
        ipcRenderer.on("reset-synth", reset)

        return () => {
            ipcRenderer.removeListener("show-synth-dialog", showsynthDialog)
            ipcRenderer.removeListener("close-all-dialogs", closeAllDialogs)
            ipcRenderer.removeListener("reset-synth", reset)
        }
    }, [])

    const changeState = (type: string, value: any) => {
        switch(type) {
            case "attack":
                setState((prev) => {
                    return {...prev, attack: value}
                })
                ipcRenderer.invoke("synth", {...state, attack: value})
                break
            case "decay":
                setState((prev) => {
                    return {...prev, decay: value}
                })
                ipcRenderer.invoke("synth", {...state, decay: value})
                break
            case "sustain":
                setState((prev) => {
                    return {...prev, sustain: value}
                })
                ipcRenderer.invoke("synth", {...state, sustain: value})
                break
            case "release":
                setState((prev) => {
                    return {...prev, release: value}
                })
                ipcRenderer.invoke("synth", {...state, release: value})
                break
            case "portamento":
                setState((prev) => {
                    return {...prev, portamento: value}
                })
                ipcRenderer.invoke("synth", {...state, portamento: value})
                break
            case "poly":
                setState((prev) => {
                    return {...prev, poly: value}
                })
                ipcRenderer.invoke("synth", {...state, poly: value})
                break
            }
    }

    const close = () => {
        if (!hover) setVisible(false)
    }

    const changeWave = (type: string, waveType?: string) => {
        if (!waveType) waveType = state.waveType
        let wave = ""
        if (type === "sawtooth") {
            if (waveType === "basic") {
                wave = "sawtooth"
            } else {
                wave = `${waveType}sawtooth`
            }
        } else if (type === "square") {
            if (waveType === "basic") {
                wave = "square"
            } else {
                wave = `${waveType}square`
            }
        } else if (type === "triangle") {
            if (waveType === "basic") {
                wave = "triangle"
            } else {
                wave = `${waveType}triangle`
            }
        } else if (type === "sine") {
            if (waveType === "basic") {
                wave = "sine"
            } else {
                wave = `${waveType}sine`
            }
        }
        if (waveType === "pulse") wave = "pulse"
        if (waveType === "pwm") wave = "pwm"
        setState((prev) => {
            return {...prev, wave, basicWave: type}
        })
        ipcRenderer.invoke("synth", {...state, wave, waveType, basicWave: type})
    }

    const changeWaveType = (type: string) => {
        setState((prev) => {
            return {...prev, waveType: type}
        })
        changeWave(state.basicWave, type)
    }

    const getWaveImage = (type: string) => {
        if (type === "sawtooth") {
            if (state.basicWave === "sawtooth") {
                if (sawHover) return sawtoothWaveSelectedHover
                return sawtoothWaveSelected
            } else {
                if (sawHover) return sawtoothWaveHover
                return sawtoothWave
            }
        } else if (type === "square") {
            if (state.basicWave === "square") {
                if (squareHover) return squareWaveSelectedHover
                return squareWaveSelected
            } else {
                if (squareHover) return squareWaveHover
                return squareWave
            }
        } else if (type === "triangle") {
            if (state.basicWave === "triangle") {
                if (triangleHover) return triangleWaveSelectedHover
                return triangleWaveSelected
            } else {
                if (triangleHover) return triangleWaveHover
                return triangleWave
            }
        } else if (type === "sine") {
            if (state.basicWave === "sine") {
                if (sineHover) return sineWaveSelectedHover
                return sineWaveSelected
            } else {
                if (sineHover) return sineWaveHover
                return sineWave
            }
        }
    }

    const getWaveTypeImage = (type: string) => {
        if (type === "basic") {
            if (state.waveType === "basic" || basicHoverState) return basicHover
            return basic
        } else if (type === "am") {
            if (state.waveType === "am" || amHoverState) return amHover
            return am
        } else if (type === "fm") {
            if (state.waveType === "fm" || fmHoverState) return fmHover
            return fm
        } else if (type === "fat") {
            if (state.waveType === "fat" || fatHoverState) return fatHover
            return fat
        } else if (type === "pulse") {
            if (state.waveType === "pulse" || pulseHoverState) return pulseHover
            return pulse
        } else if (type === "pwm") {
            if (state.waveType === "pwm" || pwmHoverState) return pwmHover
            return pwm
        }
    }

    if (visible) {
        return (
            <section className="synth-dialog" onMouseDown={close}>
                <div className="synth-dialog-box" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="synth-container">
                        <div className="synth-title-container">
                            <p className="synth-title">MIDI Synth</p>
                        </div>
                        <div className="synth-row-container">
                            <div className="synth-row">
                                <img className="synth-wave" src={getWaveImage("sawtooth")} onClick={() => changeWave("sawtooth")} onMouseEnter={() => setSawHover(true)} onMouseLeave={() => setSawHover(false)}/>
                                <img className="synth-wave" src={getWaveImage("square")} onClick={() => changeWave("square")} onMouseEnter={() => setSquareHover(true)} onMouseLeave={() => setSquareHover(false)}/>
                                <img className="synth-wave" src={getWaveImage("triangle")} onClick={() => changeWave("triangle")} onMouseEnter={() => setTriangleHover(true)} onMouseLeave={() => setTriangleHover(false)}/>
                                <img className="synth-wave" src={getWaveImage("sine")} onClick={() => changeWave("sine")} onMouseEnter={() => setSineHover(true)} onMouseLeave={() => setSineHover(false)}/>
                            </div>
                            <div className="synth-row">
                                <img className="synth-wave-type" src={getWaveTypeImage("basic")} onClick={() => changeWaveType("basic")} onMouseEnter={() => setBasicHoverState(true)} onMouseLeave={() => setBasicHoverState(false)}/>
                                <img className="synth-wave-type" src={getWaveTypeImage("am")} onClick={() => changeWaveType("am")} onMouseEnter={() => setAMHoverState(true)} onMouseLeave={() => setAMHoverState(false)}/>
                                <img className="synth-wave-type" src={getWaveTypeImage("fm")} onClick={() => changeWaveType("fm")} onMouseEnter={() => setFMHoverState(true)} onMouseLeave={() => setFMHoverState(false)}/>
                                <img className="synth-wave-type" src={getWaveTypeImage("fat")} onClick={() => changeWaveType("fat")} onMouseEnter={() => setFatHoverState(true)} onMouseLeave={() => setFatHoverState(false)}/>
                                <img className="synth-wave-type" src={getWaveTypeImage("pulse")} onClick={() => changeWaveType("pulse")} onMouseEnter={() => setPulseHoverState(true)} onMouseLeave={() => setPulseHoverState(false)}/>
                                <img className="synth-wave-type" src={getWaveTypeImage("pwm")} onClick={() => changeWaveType("pwm")} onMouseEnter={() => setPWMHoverState(true)} onMouseLeave={() => setPWMHoverState(false)}/>
                            </div>
                            <div className="synth-row">
                                <img className="synth-poly-button" src={state.poly ? (polyHover ? polyButtonHover : polyButton) : (polyHover ? monoButtonHover : monoButton)} onClick={() => changeState("poly", !state.poly)} onMouseEnter={() => setPolyHover(true)} onMouseLeave={() => setPolyHover(false)}/>
                                <div className="synth-porta-container">
                                    <p className="synth-text">Portamento: </p>
                                    <Slider className="synth-slider porta-slider" onChange={(value) => {changeState("portamento", Number(value))}} min={0} max={0.2} step={0.01} value={state.portamento}/>
                                </div>
                            </div>
                            <div className="synth-row">
                                <p className="synth-text">Attack: </p>
                                <Slider className="synth-slider" onChange={(value) => {changeState("attack", Number(value))}} min={0} max={0.5} step={0.02} value={state.attack}/>
                            </div>
                            <div className="synth-row">
                                <p className="synth-text">Decay: </p>
                                <Slider className="synth-slider" onChange={(value) => {changeState("decay", Number(value))}} min={0} max={2} step={0.05} value={state.decay}/>
                            </div>
                            <div className="synth-row">
                                <p className="synth-text">Sustain: </p>
                                <Slider className="synth-slider" onChange={(value) => {changeState("sustain", Number(value))}} min={0} max={1} step={0.02} value={state.sustain}/>
                            </div>
                            <div className="synth-row">
                                <p className="synth-text">Release: </p>
                                <Slider className="synth-slider" onChange={(value) => {changeState("release", Number(value))}} min={0} max={2} step={0.05} value={state.release}/>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }
    return null
}

export default MIDISynth