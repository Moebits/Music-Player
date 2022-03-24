import {ipcRenderer} from "electron"
import React, {useContext, useEffect, useRef, useState} from "react"
import Slider from "react-slider"
import functions from "../structures/functions"
import "../styles/audiofilters.less"

const AudioFilters: React.FunctionComponent = (props) => {
    const [visible, setVisible] = useState(false)
    const [hover, setHover] = useState(false)
    const ref1 = useRef(null)
    const ref2 = useRef(null)
    const ref3 = useRef(null)
    const ref4 = useRef(null)
    const ref5 = useRef(null)
    const ref6 = useRef(null)

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
                ipcRenderer.invoke("lowpass", {...state, lowpassCutoff: value})
                break
            case "highpassCutoff":
                setState((prev) => {
                    return {...prev, highpassCutoff: value}
                })
                ipcRenderer.invoke("highpass", {...state, highpassCutoff: value})
                break
            case "highshelfCutoff":
                setState((prev) => {
                    return {...prev, highshelfCutoff: value}
                })
                ipcRenderer.invoke("highshelf", {...state, highshelfCutoff: value})
                break
            case "highshelfGain":
                setState((prev) => {
                    return {...prev, highshelfGain: value}
                })
                ipcRenderer.invoke("highshelf", {...state, highshelfGain: value})
                break
            case "lowshelfCutoff":
                setState((prev) => {
                    return {...prev, lowshelfCutoff: value}
                })
                ipcRenderer.invoke("lowshelf", {...state, lowshelfCutoff: value})
                break
            case "lowshelfGain":
                setState((prev) => {
                    return {...prev, lowshelfGain: value}
                })
                ipcRenderer.invoke("lowshelf", {...state, lowshelfGain: value})
                break
        }
    }

    const close = () => {
        if (!hover) setVisible(false)
    }

    const updatePos = (value: number, ref: any, max: number) => {
        value *= (100 / max)
        if (!ref.current) return
        const width = ref.current.slider.clientWidth - 20
        const valuePx = (value / 100) * width
        ref.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        ref.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: 0px`
        ref.current.slider.childNodes[2].ariaValueNow = `${value * 10}`
        ref.current.slider.childNodes[2].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
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
                                <Slider ref={ref1} className="eq-slider" trackClassName="eq-slider-track" thumbClassName="eq-slider-thumb" onChange={(value) => {changeState("lowpassCutoff", value); updatePos(value, ref1, 100)}} min={0} max={100} step={1} value={state.lowpassCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Highpass: </p>
                                <Slider ref={ref2} className="eq-slider" trackClassName="eq-slider-track" thumbClassName="eq-slider-thumb" onChange={(value) => {changeState("highpassCutoff", value); updatePos(value, ref2, 100)}} min={0} max={100} step={1} value={state.highpassCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Highshelf Freq: </p>
                                <Slider ref={ref3} className="eq-slider" trackClassName="eq-slider-track" thumbClassName="eq-slider-thumb" onChange={(value) => {changeState("highshelfCutoff", value); updatePos(value, ref3, 100)}} min={0} max={100} step={1} value={state.highshelfCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Highshelf Gain: </p>
                                <Slider ref={ref4} className="eq-slider" trackClassName="eq-slider-track" thumbClassName="eq-slider-thumb" onChange={(value) => {changeState("highshelfGain", value); updatePos(value + 12, ref4, 24)}} min={-12} max={12} step={1} value={state.highshelfGain}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Lowshelf Freq: </p>
                                <Slider ref={ref5} className="eq-slider" trackClassName="eq-slider-track" thumbClassName="eq-slider-thumb" onChange={(value) => {changeState("lowshelfCutoff", value); updatePos(value, ref5, 100)}} min={0} max={100} step={1} value={state.lowshelfCutoff}/>
                            </div>
                            <div className="filters-row">
                                <p className="filters-text">Lowshelf Gain: </p>
                                <Slider ref={ref6} className="eq-slider" trackClassName="eq-slider-track" thumbClassName="eq-slider-thumb" onChange={(value) => {changeState("lowshelfGain", value); updatePos(value + 12, ref6, 24)}} min={-12} max={12} step={1} value={state.lowshelfGain}/>
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