import React, {useEffect, useRef} from "react"
import {ipcRenderer, clipboard} from "electron" 
import path from "path"
import Slider from "react-slider"
import * as Tone from "tone"
import {Midi} from '@tonejs/midi'
import jsmediatags from "jsmediatags"
import functions from "../structures/functions"
import searchIcon from "../assets/icons/search-icon.png"
import playIcon from "../assets/icons/play.png"
import playHoverIcon from "../assets/icons/play-hover.png"
import pauseIcon from "../assets/icons/pause.png"
import pauseHoverIcon from "../assets/icons/pause-hover.png"
import reverseIcon from "../assets/icons/reverse.png"
import reverseHoverIcon from "../assets/icons/reverse-hover.png"
import reverseActiveIcon from "../assets/icons/reverse-active.png"
import speedIcon from "../assets/icons/speed.png"
import speedHoverIcon from "../assets/icons/speed-hover.png"
import speedActiveIcon from "../assets/icons/speed-active.png"
import pitchIcon from "../assets/icons/pitch.png"
import pitchHoverIcon from "../assets/icons/pitch-hover.png"
import pitchActiveIcon from "../assets/icons/pitch-active.png"
import loopIcon from "../assets/icons/loop.png"
import loopHoverIcon from "../assets/icons/loop-hover.png"
import loopActiveIcon from "../assets/icons/loop-active.png"
import abLoopIcon from "../assets/icons/abloop.png"
import abLoopHoverIcon from "../assets/icons/abloop-hover.png"
import abLoopActiveIcon from "../assets/icons/abloop-active.png"
import resetIcon from "../assets/icons/clear.png"
import resetHoverIcon from "../assets/icons/clear-hover.png"
import volumeIcon from "../assets/icons/volume.png"
import volumeHoverIcon from "../assets/icons/volume-hover.png"
import volumeLowIcon from "../assets/icons/volume-low.png"
import volumeLowHoverIcon from "../assets/icons/volume-low-hover.png"
import muteIcon from "../assets/icons/mute.png"
import muteHoverIcon from "../assets/icons/mute-hover.png"
import previousIcon from "../assets/icons/previous.png"
import previousHoverIcon from "../assets/icons/previous-hover.png"
import nextIcon from "../assets/icons/next.png"
import nextHoverIcon from "../assets/icons/next-hover.png"
import placeholder from "../assets/images/placeholder.png"
import midiPlaceholder from "../assets/images/midi-placeholder.png"
import RecentPlays from "./RecentPlays"
import silence from "../assets/silence.mp3"
import audioEncoder from "audio-encoder"
import fs from "fs"
import "../styles/audioplayer.less"

const AudioPlayer: React.FunctionComponent = (props) => {
    const progressBar = useRef(null) as any
    const volumeBar = useRef(null) as any
    const speedBar = useRef(null) as React.RefObject<HTMLInputElement>
    const speedCheckbox = useRef(null) as React.RefObject<HTMLInputElement>
    const pitchCheckbox = useRef(null) as React.RefObject<HTMLInputElement>
    const pitchBar = useRef(null) as React.RefObject<HTMLInputElement>
    const secondsProgress = useRef(null) as React.RefObject<HTMLSpanElement>
    const secondsTotal = useRef(null) as React.RefObject<HTMLSpanElement>
    const abSlider = useRef(null) as React.RefObject<any>
    const searchBox = useRef(null) as React.RefObject<HTMLInputElement>
    const playButton = useRef(null) as React.RefObject<HTMLImageElement>
    const previousButton = useRef(null) as React.RefObject<HTMLImageElement>
    const nextButton = useRef(null) as React.RefObject<HTMLImageElement>
    const volumeRef = useRef(null) as React.RefObject<HTMLImageElement>
    const speedPopup = useRef(null) as React.RefObject<HTMLDivElement>
    const pitchPopup = useRef(null) as React.RefObject<HTMLDivElement>
    const speedImg = useRef(null) as React.RefObject<HTMLImageElement>
    const pitchImg = useRef(null) as React.RefObject<HTMLImageElement>
    const reverseImg = useRef(null) as React.RefObject<HTMLImageElement>
    const resetImg = useRef(null) as React.RefObject<HTMLImageElement>
    const loopImg = useRef(null) as React.RefObject<HTMLImageElement>
    const abLoopImg = useRef(null) as React.RefObject<HTMLImageElement>
    const songCover = useRef(null) as React.RefObject<HTMLImageElement>
    const songTitle = useRef(null) as React.RefObject<HTMLHeadingElement>

    useEffect(() => {
        const getOpenedFile = async () => {
            const file = await ipcRenderer.invoke("get-opened-file")
            if (file) upload(file)
        }
        getOpenedFile()
        const openFile = (event: any, file: string) => {
            if (file) upload(file)
        }
        const invokePlay = (event: any, info: any) => {
            if (info.songUrl) {
                submit(info.songUrl)
            } else {
                upload(info.song)
            }
        }
        const changePlayState = () => {
            play()
        }
        const triggerPaste = () => {
            const text = clipboard.readText()
            if (text) searchBox.current!.value += text
        }
        const copyLoop = () => {
            if (state.abloop && state.loopEnd) {
                state.savedLoop[0] = state.loopStart
                state.savedLoop[1] = state.loopEnd
            }
        }
        const pasteLoop = () => {
            if (!state.abloop) toggleAB(true)
            abloop(state.savedLoop)
            updateABSliderPos(state.savedLoop)
        }
        const triggerOpen = () => {
            upload()
        }
        const triggerSave = () => {
            download()
        }
        initState()
        abSlider.current.slider.style.display = "none"
        ipcRenderer.on("open-file", openFile)
        ipcRenderer.on("invoke-play", invokePlay)
        ipcRenderer.on("change-play-state", changePlayState)
        ipcRenderer.on("reverb", reverb)
        ipcRenderer.on("phaser", phaser)
        ipcRenderer.on("delay", delay)
        ipcRenderer.on("lowpass", lowpass)
        ipcRenderer.on("highpass", highpass)
        ipcRenderer.on("highshelf", highshelf)
        ipcRenderer.on("lowshelf", lowshelf)
        ipcRenderer.on("trigger-paste", triggerPaste)
        ipcRenderer.on("copy-loop", copyLoop)
        ipcRenderer.on("paste-loop", pasteLoop)
        ipcRenderer.on("synth", updateSynth)
        ipcRenderer.on("trigger-open", triggerOpen)
        ipcRenderer.on("trigger-save", triggerSave)
        return () => {
            ipcRenderer.removeListener("open-file", openFile)
            ipcRenderer.removeListener("invoke-play", invokePlay)
            ipcRenderer.removeListener("change-play-state", changePlayState)
            ipcRenderer.removeListener("reverb", reverb)
            ipcRenderer.removeListener("phaser", phaser)
            ipcRenderer.removeListener("delay", delay)
            ipcRenderer.removeListener("lowpass", lowpass)
            ipcRenderer.removeListener("highpass", highpass)
            ipcRenderer.removeListener("highshelf", highshelf)
            ipcRenderer.removeListener("lowshelf", lowshelf)
            ipcRenderer.removeListener("trigger-paste", triggerPaste)
            ipcRenderer.removeListener("copy-loop", copyLoop)
            ipcRenderer.removeListener("paste-loop", pasteLoop)
            ipcRenderer.removeListener("synth", updateSynth)
            ipcRenderer.removeListener("trigger-open", triggerOpen)
            ipcRenderer.removeListener("trigger-save", triggerSave)
        }
    }, [])

    let state = {
        reverse: false,
        pitch: 0,
        speed: 1,
        volume: 1,
        muted: false,
        loop: false,
        abloop: false,
        loopStart: 0,
        loopEnd: 1000,
        preservesPitch: false,
        duration: 0,
        song: "",
        songName: "No title",
        songCover: placeholder,
        songUrl: "",
        editCode: "",
        download: "",
        effects: [] as {type: string, node: Tone.ToneAudioNode}[],
        dragging: false,
        playHover: false,
        volumeHover: false,
        reverbMix: 0,
        reverbDecay: 1.5,
        delayMix: 0,
        delayTime: 0.25,
        delayFeedback: 0.5,
        phaserMix: 0,
        phaserFrequency: 1,
        lowpassCutoff: 100,
        highpassCutoff: 0,
        highshelfCutoff: 70,
        highshelfGain: 0,
        lowshelfCutoff: 30,
        lowshelfGain: 0,
        midi: false,
        midiFile: null as unknown as Midi,
        midiDuration: 0,
        bpm: 0,
        wave: "square",
        attack: 0.02,
        decay: 0.5,
        sustain: 0.3,
        release: 0.5,
        poly: true,
        portamento: 0,
        resizeFlag: false,
        mouseFlag: false,
        savedLoop: [0, 1000],
        pitchRealtime: false,
        pitchedSong: "",
        stepFlag: false
    }

    const initialState = {...state}

    const initState = async () => {
        const saved = await ipcRenderer.invoke("get-state")
        const synthSaved = await ipcRenderer.invoke("get-synth-state")
        if (saved.preservesPitch !== undefined) {
            state.preservesPitch = saved.preservesPitch
            speedCheckbox.current!.checked = !state.preservesPitch
        }
        if (saved.pitchRealtime !== undefined) {
            state.pitchRealtime = saved.pitchRealtime
            pitchCheckbox.current!.checked = state.pitchRealtime
        }
        if (saved.speed !== undefined) {
            state.speed = saved.speed
            if (state.speed === 1) {
                speedImg.current!.src = speedIcon
            } else {
                speedImg.current!.src = speedActiveIcon
            }
        }
        if (saved.pitch !== undefined) {
            state.pitch = saved.pitch
            if (state.pitch === 0) {
                pitchImg.current!.src = pitchIcon
            } else {
                pitchImg.current!.src = pitchActiveIcon
            }
        }
        if (saved.reverse !== undefined) {
            state.reverse = saved.reverse
            if (state.reverse === false) {
                reverseImg.current!.src = reverseIcon
            } else {
                reverseImg.current!.src = reverseActiveIcon
            }
        }
        if (saved.loop !== undefined) {
            state.loop = saved.loop
            if (state.loop === false) {
                loopImg.current!.src = loopIcon
            } else {
                loopImg.current!.src = loopActiveIcon
            }
        }
        if (synthSaved.wave !== undefined) state.wave = synthSaved.wave
        if (synthSaved.attack !== undefined) state.attack = synthSaved.attack 
        if (synthSaved.decay !== undefined) state.decay = synthSaved.decay
        if (synthSaved.sustain !== undefined) state.sustain = synthSaved.sustain 
        if (synthSaved.release !== undefined) state.release = synthSaved.release 
        if (synthSaved.poly !== undefined) state.poly = synthSaved.poly 
        if (synthSaved.portamento !== undefined) state.portamento = synthSaved.portamento
        updateBarPos()
        updateVolumePos(1)
    }

    const refreshState = () => {
        const apply = {grain, player}
        preservesPitch(state.preservesPitch)
        pitchRealtime(state.pitchRealtime)
        speed(state.speed)
        pitch(state.pitch)
        reverse(state.reverse, apply)
        loop(state.loop)
        if (state.abloop) abloop([state.loopStart, state.loopEnd])
    }

    const saveState = () => {
        ipcRenderer.invoke("save-state", {reverse: state.reverse, pitch: state.pitch, speed: state.speed, preservesPitch: state.preservesPitch, pitchRealtime: state.pitchRealtime, loop: state.loop, abloop: state.abloop, loopStart: state.loopStart, loopEnd: state.loopEnd})
    }

    let player: Tone.Player
    let grain: Tone.GrainPlayer
    let synths = [] as Tone.PolySynth[]
    if (typeof window !== "undefined") {
        player = new Tone.Player(silence).sync().start().toDestination()
        grain = new Tone.GrainPlayer(silence).sync().start()
        grain.grainSize = 0.1
        grain.overlap = 0.1
    }

    const removeEffect = (type: string) => {
        const index = state.effects.findIndex((e) => e?.type === type)
        if (index !== -1) {
            state.effects[index] = null as any
            state.effects = state.effects.filter(Boolean)
        }
    }

    const pushEffect = (type: string, node: Tone.ToneAudioNode) => {
        const obj = {type, node}
        const index = state.effects.findIndex((e) => e?.type === type)
        if (index !== -1) {
            state.effects[index] = obj
        } else {
            state.effects.push(obj)
        }
    }
    
    const applyEffects = () => {
        player.disconnect()
        grain.disconnect()
        if (synths.length) synths.forEach((s) => s.disconnect())
        const nodes = state.effects.map((e) => e?.node).filter(Boolean)
        const current = state.preservesPitch ? grain : player
        if (nodes[0]) {
            nodes.forEach((n) => n.disconnect())
            if (state.midi) {
                if (synths.length) synths.forEach((s) => s.chain(...[...nodes, Tone.Destination]))
            } else {
                current.chain(...[...nodes, Tone.Destination])
            }
        } else {
            if (state.midi) {
                if (synths.length) synths.forEach((s) => s.toDestination())
            } else {
                current.toDestination()
            }
        }
    }

    const disposeSynths = (synthArray?: any[]) => {
        let array = synthArray ? synthArray : synths
        while (array.length) {
            const synth = array.shift()
            synth?.dispose()
        }
    }

    const switchState = () => {
        if (state.midi) {
            grain.disconnect()
            player.disconnect()
        } else {
            if (synths.length) disposeSynths()
        }
    }

    const duration = (value?: number) => {
        if (value) {
            state.duration = value
        } else {
            if (!state.midi) {
                const current = state.preservesPitch ? grain : player
                state.duration = current.buffer.duration / current.playbackRate
            }
        }
        secondsTotal.current!.innerText = functions.formatSeconds(state.duration)
    }

    const checkBuffer = () => {
        if (state.midi) return true
        const current = state.preservesPitch ? grain : player
        return current.buffer.loaded
    }

    const getProgress = () => {
        if (!(progressBar.current)) return 0
        return Math.round(Number(progressBar.current.slider.childNodes[2].ariaValueNow) / 10)
    }

    const play = async (alwaysPlay?: boolean) => {
        if (!checkBuffer()) return
        await Tone.start()
        duration()
        const progress = getProgress()
        if (state.reverse === true) {
            if (progress === 0) stop()
        } else {
            if (progress === 100) stop()
        }
        if (Tone.Transport.state === "started" && !alwaysPlay) {
            if (state.midi) disposeSynths()
            Tone.Transport.pause()
        } else {
            if (state.midi) await playMIDI()
            Tone.Transport.start()
        }
        functions.flipPlayTitle()
        ipcRenderer.invoke("play-state-changed")
    }

    const stop = () => {
        if (!checkBuffer()) return
        Tone.Transport.stop()
        functions.flipPlayTitle()
        ipcRenderer.invoke("play-state-changed")
    }

    const mute = () => {
        if (state.muted === true) {
            state.muted = false
            Tone.Destination.mute = false
            if (state.volume === 0) state.volume = 1
            updateVolumePos(state.volume)
            Tone.Destination.volume.value = functions.logSlider(state.volume)
            if (state.volume <= 0.5) {
                if (state.volumeHover) {
                    volumeRef.current!.src = volumeLowHoverIcon
                } else {
                    volumeRef.current!.src = volumeLowIcon
                }
            } else {
                if (state.volumeHover) {
                    volumeRef.current!.src = volumeHoverIcon
                } else {
                    volumeRef.current!.src = volumeIcon
                }
            }
        } else {
            state.muted = true
            Tone.Destination.mute = true
            updateVolumePos(0)
            if (state.volumeHover) {
                volumeRef.current!.src = muteHoverIcon
            } else {
                volumeRef.current!.src = muteIcon
            }
        }
    }

    const volume = (value: number) => {
        if (value > 1) value = 1
        if (value < 0) value = 0
        state.volume = value
        Tone.Destination.volume.value = functions.logSlider(state.volume)
        if (state.volume === 0) {
            Tone.Destination.mute = true
            state.muted = true
            if (state.volumeHover) {
                volumeRef.current!.src = muteHoverIcon
            } else {
                volumeRef.current!.src = muteIcon
            }
        } else {
            Tone.Destination.mute = false
            state.muted = false
            if (state.volume <= 0.5) {
                if (state.volumeHover) {
                    volumeRef.current!.src = volumeLowHoverIcon
                } else {
                    volumeRef.current!.src = volumeLowIcon
                }
            } else {
                if (state.volumeHover) {
                    volumeRef.current!.src = volumeHoverIcon
                } else {
                    volumeRef.current!.src = volumeIcon
                }
            }
        }
        updateVolumePos(state.volume)
    }

    const speed = async (value?: number | string, applyState?: any) => {
        if (value) state.speed = Number(value)
        if (state.speed === 1) {
            speedImg.current!.src = speedIcon
        } else {
            speedImg.current!.src = speedActiveIcon
        }
        if (state.midi) {
            await playMIDI()
        } else {
            let currentGrain = grain
            let currentPlayer = player
            if (applyState) {
                currentGrain = applyState.grain
                currentPlayer = applyState.player
            }
            if (state.preservesPitch) {
                currentGrain.playbackRate = state.speed
                applyEffects()
            } else {
                currentPlayer.playbackRate = state.speed
                applyEffects()
            }
            let percent = Tone.Transport.seconds / state.duration
            state.duration  = (grain.buffer.duration / state.speed)
            let val = percent * state.duration
            if (val < 0) val = 0
            if (val > state.duration - 1) val = state.duration - 1
            Tone.Transport.seconds = val
        }
        if (state.abloop) {
            applyAB(state.duration)
        } else {
            Tone.Transport.loopEnd = state.duration
        }   
        secondsTotal.current!.innerText = functions.formatSeconds(state.duration)
        if (state.reverse === true) {
            secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
        } else {
            secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
        }
        saveState()
    }

    const preservesPitch = (value?: boolean) => {
        state.preservesPitch = value !== undefined ? value : !state.preservesPitch
        speedCheckbox.current!.checked = !state.preservesPitch
        saveState()
        speed()
    }

    const pitchRealtime = (value?: boolean) => {
        state.pitchRealtime = value !== undefined ? value : !state.pitchRealtime
        pitchCheckbox.current!.checked = state.pitchRealtime
        if (state.pitchRealtime) {
            unrealtimePitch(true)
        }
        saveState()
        pitch()
    }

    const updateSliderPos = (value: number) => {
        if (!progressBar.current) return
        const width = progressBar.current.slider.clientWidth - 15
        const valuePx = (value / 100) * width
        progressBar.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        progressBar.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: 0px`
        progressBar.current.slider.childNodes[2].ariaValueNow = `${value * 10}`
        progressBar.current.slider.childNodes[2].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
    }

    const updateVolumePos = (value: number) => {
        value *= 100
        if (!volumeBar.current) return
        const width = volumeBar.current.slider.clientWidth
        const valuePx = (value / 100) * width
        volumeBar.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        volumeBar.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: 0px`
        volumeBar.current.slider.childNodes[2].ariaValueNow = `${value * 10}`
        volumeBar.current.slider.childNodes[2].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
    }

    const updateABSliderPos = (value: number[]) => {
        value = value.map((v) => v / 10)
        if (!abSlider.current) return
        const width = abSlider.current.slider.clientWidth - 20
        const valuePx = (value[0] / 100) * width
        const valuePx2 = (value[1] / 100) * width
        abSlider.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        abSlider.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: ${width - valuePx2}px`
        abSlider.current.slider.childNodes[2].style = `position: absolute; left: ${valuePx2}px; right: 0px`
        abSlider.current.slider.childNodes[3].ariaValueNow = `${value[0] * 10}`
        abSlider.current.slider.childNodes[3].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
        abSlider.current.slider.childNodes[4].ariaValueNow = `${value[1] * 10}`
        abSlider.current.slider.childNodes[4].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx2}px`
    }

    const updateBarPos = () => {
        speedBar.current!.value = String(state.speed)
        pitchBar.current!.value = String(state.pitch)
    }

    const reset = async () => {
        const {song, songName, songCover, songUrl, midi, midiDuration, midiFile, bpm, loop} = state
        state = {...initialState, song, songName, songCover, songUrl, midi, midiDuration, midiFile, bpm, loop}
        grain.playbackRate = state.speed
        player.playbackRate = state.speed
        grain.detune = state.pitch * 100
        speedBar.current!.value = String(state.speed)
        speedCheckbox.current!.checked = !state.preservesPitch
        pitchCheckbox.current!.checked = state.pitchRealtime
        pitchBar.current!.value = String(state.pitch)
        grain.reverse = state.reverse
        player.reverse = state.reverse
        Tone.Transport.loop = state.loop
        updateABSliderPos([0, 1000])
        abSlider.current.slider.style.display = "none";
        speedImg.current!.src = speedIcon
        loopImg.current!.src = state.loop ? loopActiveIcon : loopIcon
        reverseImg.current!.src = reverseIcon
        pitchImg.current!.src = pitchIcon
        abLoopImg.current!.src = abLoopIcon
        duration()
        updateMetadata()
        unrealtimePitch()
        stop()
        play()
        ipcRenderer.invoke("reset-effects")
        setTimeout(() => {
            applyEffects()
        }, 100)
        saveState()
    }

    const loop = async (value?: boolean) => {
        let condition = value !== undefined ? value === false : state.loop === true
        if (condition) {
            loopImg.current!.src = loopIcon
            state.loop = false
            Tone.Transport.loop = false
            if (state.abloop) toggleAB()
        } else {
            loopImg.current!.src = loopActiveIcon
            state.loop = true
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.abloop ? (state.loopStart / 1000) * state.duration : 0
            Tone.Transport.loopEnd = state.abloop ? (state.loopEnd / 1000) * state.duration : state.duration
        }
        updateMetadata()
        saveState()
    }

    const reverse = async (value?: boolean, applyState?: any) => {
        let percent = Tone.Transport.seconds / state.duration
        let val = (1-percent) * state.duration
        if (val < 0) val = 0
        if (val > state.duration - 1) val = state.duration - 1
        if (state.midi) {
            if (value === false || (state.reverse === true)) {
                Tone.Transport.seconds = val
                state.reverse = false
                reverseImg.current!.src = reverseIcon
            } else {
                Tone.Transport.seconds = val
                state.reverse = true
                reverseImg.current!.src = reverseActiveIcon
            }
            await playMIDI()
        } else {
            let currentGrain = grain
            let currentPlayer = player
            let skip = false
            if (applyState) {
                currentGrain = applyState.grain
                currentPlayer = applyState.player
                skip = true
            }
            if (value === false || (state.reverse === true && !skip)) {
                if (!applyState) Tone.Transport.seconds = val
                state.reverse = false
                currentGrain.reverse = false
                currentPlayer.reverse = false
                reverseImg.current!.src = reverseIcon
            } else {
                if (!applyState) Tone.Transport.seconds = val
                state.reverse = true
                currentGrain.reverse = true
                currentPlayer.reverse = true
                reverseImg.current!.src = reverseActiveIcon
            }
        }
        applyAB(state.duration)
        if (!applyState) updateMetadata()
        // reverseStyle()
        saveState()
    }

    const reverseStyle = () => {
        if (state.reverse) {
            (document.querySelector(".progress-slider > .rc-slider-track") as any).style.backgroundColor = "black";
            (document.querySelector(".progress-slider > .rc-slider-rail") as any).style.backgroundColor = "#991fbe"
        } else {
            (document.querySelector(".progress-slider > .rc-slider-track") as any).style.backgroundColor = "#991fbe";
            (document.querySelector(".progress-slider > .rc-slider-rail") as any).style.backgroundColor = "black"
        }
    }

    useEffect(() => {
        /*Update Progress*/
        window.setInterval(() => {
            let percent = (Tone.Transport.seconds / state.duration)
            if (!Number.isFinite(percent)) return
            if (!state.dragging) {
                if (state.reverse === true) {
                    updateSliderPos((1-percent) * 100)
                    secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
                } else {
                    updateSliderPos(percent * 100)
                    secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
                }
            }
            if (!state.loop) {
                if (Tone.Transport.seconds > state.duration - 1) {
                    disposeSynths()
                    Tone.Transport.pause()
                    Tone.Transport.seconds = Math.round(state.duration) - 1
                }
                if (Tone.Transport.seconds === Math.round(state.duration) - 1) Tone.Transport.seconds = Math.round(state.duration)
            } else {
                if (state.midi && Math.floor(Tone.Transport.seconds) === 0) playMIDI()
                if (Tone.Transport.seconds > state.duration) {
                    Tone.Transport.seconds = 0
                    if (state.midi) playMIDI()
                }
            }
        }, 1000)

        /*Change play button image*/
        Tone.Transport.on("pause", () => {
            if (state.playHover) {
                if (playButton.current?.src !== playHoverIcon) playButton.current!.src = playHoverIcon
            } else {
                if (playButton.current?.src !== playIcon) playButton.current!.src = playIcon
            }
        })
        Tone.Transport.on("stop", () => {
            if (state.playHover) {
                if (playButton.current?.src !== playHoverIcon) playButton.current!.src = playHoverIcon
            } else {
                if (playButton.current?.src !== playIcon) playButton.current!.src = playIcon
            }
        })
        Tone.Transport.on("start", () => {
            if (state.playHover) {
                if (playButton.current?.src !== pauseHoverIcon) playButton.current!.src = pauseHoverIcon
            } else {
                if (playButton.current?.src !== pauseIcon) playButton.current!.src = pauseIcon
            }
        })

        /* Close speed and pitch boxes */
        window.onclick = (event: any) => {
            if (speedPopup.current?.style.display === "flex") {
                if (!(speedPopup.current?.contains(event.target) || speedImg.current?.contains(event.target))) {
                    if (event.target !== speedPopup.current) speedPopup.current!.style.display = "none"
                }
            }
            if (pitchPopup.current?.style.display === "flex") {
                if (!(pitchPopup.current?.contains(event.target) || pitchImg.current?.contains(event.target))) {
                    if (event.target !== pitchPopup.current) pitchPopup.current!.style.display = "none"
                }
            }
        }

        /* Precision on shift click */
        window.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.shiftKey) {
                event.preventDefault()
                speedBar.current!.step = "0.01"
                pitchBar.current!.step = "1"
                state.stepFlag = false
            }
            /* Play on Spacebar */
            if (event.code === "Space") {
                event.preventDefault()
                play()
            }
            /* Search on Enter */
            if (event.key === "Enter") {
                event.preventDefault()
                submit()
            }
            /* Arrow Key Shortcuts */
            if (event.key === "ArrowLeft") {
                event.preventDefault()
                rewind(1)
            }
            if (event.key === "ArrowRight") {
                event.preventDefault()
                fastforward(1)
            }
            if (event.key === "ArrowUp") {
                event.preventDefault()
                volume(state.volume + 0.05)
            }
            if (event.key === "ArrowDown") {
                event.preventDefault()
                volume(state.volume - 0.05)
            }
        }, {passive: false})
        window.onkeyup = (event: KeyboardEvent) => {
            if (!event.shiftKey) {
                state.stepFlag = true
            }
        }
        window.addEventListener("wheel", (event: WheelEvent) => {
            event.preventDefault()
            const delta = Math.sign(event.deltaY)
            volume(state.volume - delta * 0.05)
        }, {passive: false})
        window.onmousedown = () => {
            if (state.stepFlag) {
                speedBar.current!.step = "0.5"
                pitchBar.current!.step = "12"
                state.stepFlag = false
            }
            state.mouseFlag = true
        }
        window.onmouseup = () => {
            state.mouseFlag = false
            state.resizeFlag = false
        }
        window.onmousemove = (event: MouseEvent) => {
            if (state.resizeFlag && state.mouseFlag) {
                const element = document.querySelector(".player") as HTMLElement
                let newHeight = window.innerHeight - event.pageY
                if (newHeight < 100) newHeight = 100
                if (newHeight > 200) return
                element.style.height = `${newHeight}px`
            }
        }
        // @ts-ignore
        return window.clearInterval()
    }, [])

    const seek = (value: number) => {
        state.dragging = false
        let percent = value / 100     
        if (state.reverse === true) {
            updateSliderPos((percent) * 100)
            secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
            let value = (1-percent) * state.duration
            if (value < 0) value = 0
            if (value > state.duration - 1) value = state.duration - 1
            Tone.Transport.seconds = value
        } else {
            updateSliderPos(percent * 100)
            secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
            let value = percent * state.duration
            if (value < 0) value = 0
            if (value > state.duration - 1) value = state.duration - 1
            Tone.Transport.seconds = value
        }
        if (state.midi) playMIDI()
        if (Tone.Transport.state === "paused" || Tone.Transport.state === "stopped") play(true)
    }

    const rewind = (value: number) => {
        const current = state.reverse ? state.duration - Tone.Transport.seconds : Tone.Transport.seconds
        const seconds = current - value
        const percent = seconds / state.duration * 100
        seek(percent)
    }

    const fastforward = (value: number) => {
        const current = state.reverse ? state.duration - Tone.Transport.seconds : Tone.Transport.seconds
        const seconds = current + value
        const percent = seconds / state.duration * 100
        seek(percent)
    }

    const updateProgressText = (value: number) => {
        value = value / 10
        let percent = value / 100
        if (state.reverse === true) {
            secondsProgress.current!.innerText = functions.formatSeconds(state.duration - ((1-percent) * state.duration))
        } else {
            secondsProgress.current!.innerText = functions.formatSeconds(percent * state.duration)
        }
    }

    const updateProgressTextAB = (value: number[]) => {
        if (state.loopStart === value[0]) {
            updateProgressText(value[1])
        } else {
            updateProgressText(value[0])
        }
    }

    const unrealtimePitch = async (reset?: boolean) => {
        const paused = Tone.Transport.state === "paused" || Tone.Transport.state === "stopped"
        if (state.pitch === 0 || reset) {
            grain.buffer.load(state.song)
            player.load(state.song)
        } else {
            const pitchedSong = await ipcRenderer.invoke("pitch-song", state.song, state.pitch)
            state.pitchedSong = pitchedSong
            grain.buffer.load(pitchedSong)
            player.load(pitchedSong)
        }
        await Tone.loaded()
        duration()
        const seconds = Tone.Transport.seconds
        stop()
        play(true)
        Tone.Transport.seconds = seconds
        if (paused) Tone.Transport.pause()
    }

    const pitch = async (value?: number | string, applyState?: any) => {
        if (value !== undefined) state.pitch = Number(value) 
        if (state.pitch === 0) {
            pitchImg.current!.src = pitchIcon
        } else {
            pitchImg.current!.src = pitchActiveIcon
        }
        if (state.midi) {
            if (!applyState) await playMIDI()
        } else {
            let currentGrain = applyState ? applyState.grain : grain
            if (state.pitchRealtime) {
                currentGrain.detune = state.pitch * 100
            } else {
                currentGrain.detune = 0
                if (!applyState) unrealtimePitch()
            }
        }
        saveState()
    }

    const updateMetadata = () => {
        songTitle.current!.innerText = state.songName
        songCover.current!.src = state.songCover
    }

    
    const updateSynth = (event: any, newState: any) => {
        state = {...state, ...newState}
        if (state.midi) playMIDI()
    }

    const playMIDI = async (applyState?: any) => {
        const localState = applyState ? applyState.state : state
        const synthArray = applyState ? applyState.synths : synths
        if (!localState.midiFile) return
        const midi = localState.midiFile as Midi
        disposeSynths(synthArray)
        midi.tracks.forEach((track: any) => {
            let synth = null as any
            if (state.poly) {
                synth = new Tone.PolySynth(Tone.Synth, {oscillator: {type: state.wave as any}, envelope: {attack: state.attack, decay: state.decay, sustain: state.sustain, release: state.release}, portamento: state.portamento, volume: -6}).sync()
            } else {
                synth = new Tone.Synth({oscillator: {type: state.wave as any}, envelope: {attack: state.attack, decay: state.decay, sustain: state.sustain, release: state.release}, portamento: state.portamento, volume: -6}).sync()
            }
            if (!applyState) synth.toDestination()
            synthArray.push(synth)
            if (localState.reverse) {
                const reverseNotes = track.notes.slice().reverse()
                const initialTime = reverseNotes[0].time
                reverseNotes.forEach((reverseNote: any) => {
                    let transposed = reverseNote.name
                    if (localState.preservesPitch) {
                        transposed = functions.transposeNote(reverseNote.name, localState.pitch)
                    } else {
                        transposed = functions.transposeNote(reverseNote.name, localState.pitch + functions.noteFactor(localState.speed))
                    }
                    synth.triggerAttackRelease(transposed, reverseNote.duration / localState.speed, Math.abs(reverseNote.time - initialTime) / localState.speed, reverseNote.velocity)
                })
            } else {
                track.notes.forEach((note: any) => {
                    let transposed = note.name
                    if (localState.preservesPitch) {
                        transposed = functions.transposeNote(note.name, localState.pitch)
                    } else {
                        transposed = functions.transposeNote(note.name, localState.pitch + functions.noteFactor(localState.speed))
                    }
                    synth.triggerAttackRelease(transposed, note.duration / localState.speed, note.time / localState.speed, note.velocity)
                })
            }
        })
        let totalDuration = midi.duration
        if (!applyState && state.speed !== 1) {
            let percent = Tone.Transport.seconds / totalDuration
            totalDuration = (localState.midiDuration / localState.speed)
            let val = percent * totalDuration
            if (val < 0) val = 0
            if (val > totalDuration - 1) val = totalDuration - 1
            Tone.Transport.seconds = val
        }
        duration(totalDuration)
        updateMetadata()
        applyEffects()
    }

    const uploadMIDI = async (file: string) => {
        state.midi = true
        const midi = await Midi.fromUrl(file)
        let totalDuration = 0
        midi.tracks.forEach(track => {
            track.notes.forEach(note => {
                if (note.time + note.duration > totalDuration) totalDuration = note.time + note.duration
            })
        })
        state.midiDuration = totalDuration
        state.bpm = midi.header.tempos[0].bpm
        state.songCover = midiPlaceholder
        state.songName = path.basename(file).replace(".mid", "")
        state.song = file
        state.songUrl = ""
        state.midiFile = midi
        updateRecentFiles()
        switchState()
        stop()
        play(true)
    }

    const upload = async (file?: string) => {
        if (!file) file = await ipcRenderer.invoke("select-file")
        if (!file) return
        if (path.extname(file) === ".mid") return uploadMIDI(file)
        if (process.platform === "win32") if (!file.startsWith("file:///")) file = `file:///${file}`
        state.midi = false
        const fileObject = await functions.getFile(file)
        const tagInfo = await new Promise((resolve, reject) => {
            new jsmediatags.Reader(fileObject).read({onSuccess: (tagInfo: any) => resolve(tagInfo), onError: (error: any) => reject(error)})   
        }).catch(() => null) as any
        const picture = tagInfo?.tags.picture
        if (picture) {
            let b64 = ""
            for (let i = 0; i < picture.data.length; i++) {
                b64 += String.fromCharCode(picture.data[i])
            }
            state.songCover = `data:${picture.format};base64,${btoa(b64)}`
        } else {
            state.songCover = placeholder
        }
        state.songName = path.basename(file).replace(".mp3", "").replace(".wav", "").replace(".flac", "").replace(".ogg", "")
        state.song = file
        state.songUrl = ""
        grain.buffer.load(state.song)
        player.load(state.song)
        await Tone.loaded()
        duration()
        updateMetadata()
        updateRecentFiles()
        switchState()
        stop()
        play(true)
        refreshState()
    }

    const applyAB = (duration: number) => {
        if (!state.abloop) return
        let percent = duration / 100.0
        if (state.reverse) {
            Tone.Transport.loopStart = (100 - (state.loopEnd / 10)) * percent
            Tone.Transport.loopEnd = (100 - (state.loopStart / 10)) * percent
        } else {
            Tone.Transport.loopStart = (state.loopStart / 10) * percent
            Tone.Transport.loopEnd = (state.loopEnd / 10) * percent
        }
    }

    const abloop = (value: number[]) => {
        state.loopStart = value[0]
        state.loopEnd = value[1]
        state.dragging = false
        Tone.Transport.loop = true
        if (Tone.Transport.state === "paused") Tone.Transport.start()
        applyAB(state.duration)
        if (Tone.Transport.loopStart === Tone.Transport.loopEnd) Tone.Transport.loopStart = (Tone.Transport.loopEnd as number) - 1
        if ((Tone.Transport.seconds >= Number(Tone.Transport.loopStart)) && (Tone.Transport.seconds <= Number(Tone.Transport.loopEnd))) return
        let val = Number(Tone.Transport.loopStart)
        if (val < 0) val = 0
        if (val > state.duration - 1) val = state.duration - 1
        Tone.Transport.seconds = val
        if (state.midi) playMIDI()
        saveState()
    }

    const toggleAB = (value?: boolean) => {
        let condition = value !== undefined ? value === true : abSlider.current.slider.style.display === "none"
        if (condition) {
            abSlider.current.slider.style.display = "flex"
            state.abloop = true
            state.loop = true
            if (!state.loopEnd) state.loopEnd = 1000
            loopImg.current!.src = loopActiveIcon
            abLoopImg.current!.src = abLoopActiveIcon
            Tone.Transport.loop = true
            Tone.Transport.loopStart = (state.loopStart / 1000) * state.duration
            Tone.Transport.loopEnd = (state.loopEnd / 1000) * state.duration
            updateABSliderPos([state.loopStart, state.loopEnd])
        } else {
            abSlider.current.slider.style.display = "none"
            state.abloop = false
            abLoopImg.current!.src = abLoopIcon
            Tone.Transport.loopStart = 0
            Tone.Transport.loopEnd = state.duration
        }
        updateMetadata()
        saveState()
    }

    const applyState = async (localState: any, grain: Tone.GrainPlayer, player: Tone.Player) => {
        const apply = {state: localState, grain, player}
        if (localState.song) {
            if (localState.pitchRealtime || localState.pitch === 0 || !localState.pitchedSong) {
                grain.buffer.load(localState.song)
                player.load(localState.song)
            } else {
                grain.buffer.load(localState.pitchedSong)
                player.load(localState.pitchedSong)
            }
            await Tone.loaded()
        }
        let editCode = ""
        if (localState.speed !== 1) {
            speed(undefined, apply)
            editCode += "-speed"
        }
        if (localState.reverse !== false) {
            reverse(undefined, apply)
            editCode += "-reverse"
        } 
        if (localState.pitch !== 0) {
            pitch(undefined, apply)
            editCode += "-pitch"
        }
        if (localState.abloop !== false) {
            editCode += "-loop"
        }
        let effectNodes = []
        if (localState.reverbMix !== 0) {
            const verb = await reverb(null, localState, true) as Tone.Reverb
            effectNodes.push(verb)
            editCode += "-reverb"
        }
        if (localState.delayMix !== 0) {
            const del = await delay(null, localState, true) as Tone.PingPongDelay
            effectNodes.push(del)
            editCode += "-delay"
        }
        if (localState.lowpassCutoff !== 100) {
            const low = await lowpass(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(low)
            editCode += "-lowpass"
        }
        if (localState.highpassCutoff !== 0) {
            const high = await highpass(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(high)
            editCode += "-highpass"
        }
        if (localState.highshelfGain !== 0) {
            const high = await highshelf(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(high)
            editCode += "-highshelf"
        }
        if (localState.lowshelfGain !== 0) {
            const low = await lowshelf(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(low)
            editCode += "-lowshelf"
        }
        state.editCode = editCode
        const current = localState.preservesPitch ? grain : player
        return {current, effectNodes}
    }

    const applyMIDIState = async (localState: any, synths: Tone.PolySynth[]) => {
        const apply = {state: localState, synths}
        await playMIDI(apply)
        let editCode = ""
        if (localState.speed !== 1) {
            editCode += "-speed"
        }
        if (localState.reverse !== false) {
            editCode += "-reverse"
        } 
        if (localState.pitch !== 0) {
            editCode += "-pitch"
        }
        if (localState.abloop !== false) {
            editCode += "-loop"
        }
        let effectNodes = []
        if (localState.reverbMix !== 0) {
            const verb = await reverb(null, localState, true) as Tone.Reverb
            effectNodes.push(verb)
            editCode += "-reverb"
        }
        if (localState.delayMix !== 0) {
            const del = await delay(null, localState, true) as Tone.PingPongDelay
            effectNodes.push(del)
            editCode += "-delay"
        }
        if (localState.lowpassCutoff !== 100) {
            const low = await lowpass(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(low)
            editCode += "-lowpass"
        }
        if (localState.highpassCutoff !== 0) {
            const high = await highpass(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(high)
            editCode += "-highpass"
        }
        if (localState.highshelfGain !== 0) {
            const high = await highshelf(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(high)
            editCode += "-highshelf"
        }
        if (localState.lowshelfGain !== 0) {
            const low = await lowshelf(null, localState, true) as Tone.BiquadFilter
            effectNodes.push(low)
            editCode += "-lowshelf"
        }
        state.editCode = editCode
        return {synthArray: synths, effectNodes}
    }

     /** Renders the same as online */
     const render = async (start: number, duration: number) => {
        return Tone.Offline(async ({transport, destination}) => {
            let grain = new Tone.GrainPlayer().sync()
            let player = new Tone.Player().sync()
            let synths = [] as Tone.PolySynth[]
            grain.grainSize = 0.1
            if (state.midi) {
                const {synthArray, effectNodes} = await applyMIDIState(state, synths)
                synthArray.forEach((s) => s.chain(...[...effectNodes, destination]))
            } else {
                const {current, effectNodes} = await applyState(state, grain, player)
                current.chain(...[...effectNodes, destination]).start()
            }
            transport.start(start)
        }, duration, 2, 44100)
    }

    const download = async () => {
        if (!checkBuffer()) return
        const defaultPath = `${functions.decodeEntities(state.songName)}${state.editCode}`
        const savePath = await ipcRenderer.invoke("save-dialog", defaultPath)
        if (!savePath) return
        if (path.extname(savePath) === ".mid") {
            if (!state.midi) return
            const midi = new Midi()
            midi.header = state.midiFile.header
            state.midiFile.tracks.forEach((track: any) => {
                const newTrack = midi.addTrack()
                if (state.reverse) {
                    const reverseNotes = track.notes.slice().reverse()
                    const initialTime = reverseNotes[0].time
                    reverseNotes.forEach((reverseNote: any) => {
                        let transposed = reverseNote.name
                        if (state.preservesPitch) {
                            transposed = functions.transposeNote(reverseNote.name, state.pitch)
                        } else {
                            transposed = functions.transposeNote(reverseNote.name, state.pitch + functions.noteFactor(state.speed))
                        }
                        reverseNote.name = transposed
                        reverseNote.duration = reverseNote.duration / state.speed
                        reverseNote.time = Math.abs(reverseNote.time - initialTime) / state.speed
                        newTrack.addNote(reverseNote)
                    })
                } else {
                    const notes = track.notes.slice()
                    notes.forEach((note: any) => {
                        let transposed = note.name
                        if (state.preservesPitch) {
                            transposed = functions.transposeNote(note.name, state.pitch)
                        } else {
                            transposed = functions.transposeNote(note.name, state.pitch + functions.noteFactor(state.speed))
                        }
                        note.name = transposed
                        note.duration = note.duration / state.speed
                        note.time = note.time / state.speed
                        newTrack.addNote(note)
                    })
                }
            })
            fs.writeFileSync(savePath, Buffer.from(midi.toArray()))
        } else {
            let duration = state.duration
            let start = 0
            if (state.abloop) {
                start = state.loopStart
                duration = ((state.loopEnd / 1000) * state.duration) - ((state.loopStart / 1000) * state.duration)
            }
            const audioBuffer = await render(start, duration)
            if (path.extname(savePath) === ".mp3") {
                audioEncoder(audioBuffer.get(), 320, null, async (blob: Blob) => {
                    const mp3 = await blob.arrayBuffer() as any
                    fs.writeFileSync(savePath, Buffer.from(mp3, "binary"))
                })
            } else {
                audioEncoder(audioBuffer.get(), null, null, async (blob: Blob) => {
                    const wav = await blob.arrayBuffer() as any
                    fs.writeFileSync(savePath, Buffer.from(wav, "binary"))
                })
            }
        }
    }

    const submit = async (value?: string) => {
        if (!value) value = searchBox.current?.value
        if (!value) return
        searchBox.current!.value = ""
        const songBuffer = await ipcRenderer.invoke("get-song", value)
        if (songBuffer) {
            state.midi = false
            const songName = await ipcRenderer.invoke("get-song-name", value)
            const artwork = await ipcRenderer.invoke("get-art", value)
            window.URL.revokeObjectURL(state.song)
            const blob = new Blob([new DataView(songBuffer)], {type: "audio/mpeg"})
            state.songName = songName
            state.song = window.URL.createObjectURL(blob)
            state.songCover = artwork
            state.songUrl = value
            grain.buffer.load(state.song)
            player.load(state.song)
            await Tone.loaded()
            duration()
            updateMetadata()
            updateRecentFiles()
            switchState()
            stop()
            play(true)
            refreshState()
        }
    }

    const updateRecentFiles = () => {
        const current = state.preservesPitch ? grain : player
        ipcRenderer.invoke("update-recent", {
            songName: state.songName, 
            song: state.song,
            songCover: state.songCover,
            songUrl: state.songUrl,
            duration: state.midi ? state.midiDuration : current.buffer.duration,
            midi: state.midi,
            bpm: state.bpm
        })
    }

    const previous = () => {
        const current = state.preservesPitch ? grain : player
        ipcRenderer.invoke("get-previous", {
            songName: state.songName, 
            song: state.song,
            songCover: state.songCover,
            songUrl: state.songUrl,
            duration: state.midi ? state.duration : current.buffer.duration
        })
    }

    const next = () => {
        const current = state.preservesPitch ? grain : player
        ipcRenderer.invoke("get-next", {
            songName: state.songName, 
            song: state.song,
            songCover: state.songCover,
            songUrl: state.songUrl,
            duration: state.midi ? state.duration : current.buffer.duration
        })
    }

    /* JS Media Queries */
    useEffect(() => {
        const phoneMediaQuery = (query: MediaQueryListEvent | MediaQueryList) => {
            if (query.matches) {
                searchBox.current!.placeholder = "YT or SC link..."
            } else {
                searchBox.current!.placeholder = "Youtube or Soundcloud link..."
            }
        }
        const media = window.matchMedia("(max-width: 65rem)")
        media.addListener(phoneMediaQuery)
        phoneMediaQuery(media)
    }, [])

    const toggleHover = (query: string, hover?: boolean) => {
        if (query === "reverse") {
            if (hover) {
                reverseImg.current!.src = reverseHoverIcon
            } else {
                if (state.reverse) {
                    reverseImg.current!.src = reverseActiveIcon
                } else {
                    reverseImg.current!.src = reverseIcon
                }
            }
        } else if (query === "speed") {
            if (hover) {
                speedImg.current!.src = speedHoverIcon
            } else {
                if (state.speed === 1) {
                    speedImg.current!.src = speedIcon
                } else {
                    speedImg.current!.src = speedActiveIcon
                }
            }
        } else if (query === "pitch") {
            if (hover) {
                pitchImg.current!.src = pitchHoverIcon
            } else {
                if (state.pitch === 0) {
                    pitchImg.current!.src = pitchIcon
                } else {
                    pitchImg.current!.src = pitchActiveIcon
                }
            }
        } else if (query === "loop") {
            if (hover) {
                loopImg.current!.src = loopHoverIcon
            } else {
                if (state.loop) {
                    loopImg.current!.src = loopActiveIcon
                } else {
                    loopImg.current!.src = loopIcon
                }
            }
        } else if (query === "abloop") {
            if (hover) {
                abLoopImg.current!.src = abLoopHoverIcon
            } else {
                if (state.abloop) {
                    abLoopImg.current!.src = abLoopActiveIcon
                } else {
                    abLoopImg.current!.src = abLoopIcon
                }
            }
        } else if (query === "reset") {
            if (hover) {
                resetImg.current!.src = resetHoverIcon
            } else {
                resetImg.current!.src = resetIcon
            }
        } else if (query === "play") {
            if (hover) {
                state.playHover = true
                if (Tone.Transport.state === "started") {
                    playButton.current!.src = pauseHoverIcon
                } else {
                    playButton.current!.src = playHoverIcon
                }
            } else {
                state.playHover = false
                if (Tone.Transport.state === "started") {
                    playButton.current!.src = pauseIcon
                } else {
                    playButton.current!.src = playIcon
                }
            }
        } else if (query === "previous") {
            if (hover) {
                previousButton.current!.src = previousHoverIcon
            } else {
                previousButton.current!.src = previousIcon
            }
        } else if (query === "next") {
            if (hover) {
                nextButton.current!.src = nextHoverIcon
            } else {
                nextButton.current!.src = nextIcon
            }
        } else if (query === "volume") {
            if (hover) {
                state.volumeHover = true
                if (state.volume === 0 || state.muted) {
                    volumeRef.current!.src = muteHoverIcon
                } else {
                    if (state.volume <= 0.5) {
                        volumeRef.current!.src = volumeLowHoverIcon
                    } else {
                        volumeRef.current!.src = volumeHoverIcon
                    }
                }
            } else {
                state.volumeHover = false
                if (state.volume === 0 || state.muted) {
                    volumeRef.current!.src = muteIcon
                } else {
                    if (state.volume <= 0.5) {
                        volumeRef.current!.src = volumeLowIcon
                    } else {
                        volumeRef.current!.src = volumeIcon
                    }
                }
            }
        }
    }

    const reverb = async (event: any, effect?: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.reverbMix === 0) {
            removeEffect("reverb")
        } else {
            const reverb = new Tone.Reverb({wet: state.reverbMix, decay: state.reverbDecay})
            if (noApply) return reverb
            pushEffect("reverb", reverb)
            applyEffects()
        }
    }

    const delay = async (event: any, effect: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.delayMix === 0) {
            removeEffect("delay")
        } else {
            const delay = new Tone.PingPongDelay({wet: state.delayMix, delayTime: state.delayTime, feedback: state.delayFeedback})
            if (noApply) return delay
            pushEffect("delay", delay)
            applyEffects()
        }
    }

    const phaser = async (event: any, effect?: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.phaserMix === 0) {
            removeEffect("phaser")
        } else {
            const phaser = new Tone.Phaser({wet: state.phaserMix, frequency: state.phaserFrequency})
            if (noApply) return phaser
            pushEffect("phaser", phaser)
            applyEffects()
        }
    }

    const lowpass = async (event: any, effect: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.lowpassCutoff === 100) {
            removeEffect("lowpass")
        } else {
            const low = new Tone.BiquadFilter({type: "lowpass", frequency: functions.logSlider2(state.lowpassCutoff, 1, 20000)})
            if (noApply) return low
            pushEffect("lowpass", low)
            applyEffects()
        }
    }

    const highpass = async (event: any, effect: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.highpassCutoff === 0) {
            removeEffect("highpass")
        } else {
            const high = new Tone.BiquadFilter({type: "highpass", frequency: functions.logSlider2(state.highpassCutoff, 1, 20000)})
            if (noApply) return high
            pushEffect("highpass", high)
            applyEffects()
        }
    }

    const highshelf = async (event: any, effect: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.highshelfGain === 0) {
            removeEffect("highshelf")
        } else {
            const high = new Tone.BiquadFilter({type: "highshelf", frequency: functions.logSlider2(state.highshelfCutoff, 1, 20000), gain: state.highshelfGain})
            if (noApply) return high
            pushEffect("highshelf", high)
            applyEffects()
        }
    }

    const lowshelf = async (event: any, effect: any, noApply?: boolean) => {
        state = {...state, ...effect}
        if (state.lowshelfGain === 0) {
            removeEffect("lowshelf")
        } else {
            const low = new Tone.BiquadFilter({type: "lowshelf", frequency: functions.logSlider2(state.lowshelfCutoff, 1, 20000), gain: state.lowshelfGain})
            if (noApply) return low
            pushEffect("lowshelf", low)
            applyEffects()
        }
    }

    const resizeOn = () => {
        document.documentElement.style.cursor = "ns-resize"
        state.resizeFlag = true
    }

    const resizeOff = () => {
        document.documentElement.style.cursor = "default"
    }

    const resetResize = () => {
        const element = document.querySelector(".player") as HTMLElement
        element.style.height = `150px`
    }

    return (
        <main className="audio-player">
            {/* Top Buttons */}
            <section className="player-top-buttons">
                <button onClick={() => upload()} className="upload-button"><span>Upload</span></button>
                <button onClick={() => download()} className="download-button"><span>Download</span></button>
                <form className="search-bar">
                    <input type="text" ref={searchBox} placeholder="Youtube or Soundcloud link..." className="search-box" spellCheck="false"/>
                    <button onClick={(event) => {event.preventDefault(); submit()}} className="search-button"><img src={searchIcon} width="30" height="30" className="search-icon"/></button>
                </form>
            </section>

            {/* Recent Plays */}
            <RecentPlays/>

            {/* Player */}
            <section className="player" onDoubleClick={resetResize}>
                <div className="player-resize" onMouseEnter={() => resizeOn()} onMouseLeave={() => resizeOff()}></div>
                <img ref={songCover} className="player-img" src={state.songCover}/>
                <div className="player-container">
                    <div className="player-row">
                        <div className="player-text-container">
                            <h2 ref={songTitle} className="player-text">{state.songName}</h2>
                        </div>
                        <div className="play-button-container"> 
                            <img className="player-button" src={previousIcon} ref={previousButton} onClick={() => previous()} width="25" height="25" onMouseEnter={() => toggleHover("previous", true)} onMouseLeave={() => toggleHover("previous")}/>
                            <img className="player-button play-button" src={playIcon} ref={playButton} onClick={() => play()} width="45" height="45" onMouseEnter={() => toggleHover("play", true)} onMouseLeave={() => toggleHover("play")}/>
                            <img className="player-button" src={nextIcon} ref={nextButton} onClick={() => next()} width="25" height="25" onMouseEnter={() => toggleHover("next", true)} onMouseLeave={() => toggleHover("next")}/>
                        </div>
                        <div className="progress-text-container">
                            <p className="player-text"><span ref={secondsProgress}>0:00</span> <span>/</span> <span ref={secondsTotal}>0:00</span></p>
                        </div>
                        <div className="volume-container">
                            <img className="player-button" src={volumeIcon} ref={volumeRef} onClick={() => mute()} onMouseEnter={() => toggleHover("volume", true)} onMouseLeave={() => toggleHover("volume")} width="30" height="30"/>
                            <Slider className="volume-slider" trackClassName="volume-slider-track" thumbClassName="volume-slider-handle" ref={volumeBar} onChange={(value) => {updateVolumePos(value); volume(value)}} min={0} max={1} step={0.05} defaultValue={1}/>
                        </div>
                    </div>
                    <div className="player-row">
                    <img className="player-button" ref={reverseImg} src={reverseIcon} onClick={() => reverse()} width="30" height="30" onMouseEnter={() => toggleHover("reverse", true)} onMouseLeave={() => toggleHover("reverse")}/>
                        <div className="speed-popup-container" ref={speedPopup} style={({display: "none"})}>
                            <div className="speed-popup">
                                <input type="range" ref={speedBar} onChange={(event) => speed(event.target.value)} min="0.5" max="4" step="0.5" defaultValue="1" className="speed-bar"/>
                                <div className="speed-checkbox-container">
                                    <p className="speed-text">Pitch?</p><input type="checkbox" ref={speedCheckbox} defaultChecked onChange={() => preservesPitch()} className="speed-checkbox"/>
                                </div>       
                            </div>
                        </div>
                        <img className="player-button" src={speedIcon} ref={speedImg} onClick={() => speedPopup.current!.style.display === "flex" ? speedPopup.current!.style.display = "none" : speedPopup.current!.style.display = "flex"} width="30" height="30" onMouseEnter={() => toggleHover("speed", true)} onMouseLeave={() => toggleHover("speed")}/>
                        <div className="pitch-popup-container" ref={pitchPopup} style={({display: "none"})}>
                            <div className="pitch-popup">
                                <input type="range" ref={pitchBar} onChange={(event) => pitch(event.target.value)} min="-24" max="24" step="12" defaultValue="0" className="pitch-bar"/>
                                <div className="pitch-checkbox-container">
                                    <p className="speed-text">Realtime?</p><input type="checkbox" ref={pitchCheckbox} onChange={() => pitchRealtime()} className="pitch-checkbox"/>
                                </div>
                            </div>
                        </div>
                        <img className="player-button" src={pitchIcon} ref={pitchImg} onClick={() => pitchPopup.current!.style.display === "flex" ? pitchPopup.current!.style.display = "none" : pitchPopup.current!.style.display = "flex"} width="30" height="30" onMouseEnter={() => toggleHover("pitch", true)} onMouseLeave={() => toggleHover("pitch")}/>
                        <div className="progress-container" onMouseUp={() => state.dragging = false}>
                            <Slider className="progress-slider" trackClassName="progress-slider-track" thumbClassName="progress-slider-handle" ref={progressBar} min={0} max={1000} onBeforeChange={() => state.dragging = true} onChange={(value) => {updateSliderPos(value / 10); updateProgressText(value)}} onAfterChange={(value) => seek(value / 10)} defaultValue={0}/>
                            <Slider className="ab-slider" trackClassName="ab-slider-track" thumbClassName="ab-slider-thumb" ref={abSlider} min={0} max={1000} defaultValue={[0, 1000]} onBeforeChange={() => state.dragging = true} onChange={(value) => {updateABSliderPos(value); updateProgressTextAB(value)}} onAfterChange={(value) => abloop(value)} pearling minDistance={1}/>
                        </div>
                        <img className="player-button" ref={loopImg} src={loopIcon} onClick={() => loop()} width="30" height="30" onMouseEnter={() => toggleHover("loop", true)} onMouseLeave={() => toggleHover("loop")}/>
                        <img className="player-button" ref={abLoopImg} src={abLoopIcon} onClick={() => toggleAB()} width="30" height="30" onMouseEnter={() => toggleHover("abloop", true)} onMouseLeave={() => toggleHover("abloop")}/>
                        <img className="player-button" ref={resetImg} src={resetIcon} onClick={() => reset()} width="30" height="30" onMouseEnter={() => toggleHover("reset", true)} onMouseLeave={() => toggleHover("reset")}/>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default AudioPlayer