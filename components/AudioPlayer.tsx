import React, {useEffect, useRef} from "react"
import {ipcRenderer, clipboard} from "electron" 
import path from "path"
import Slider from "rc-slider"
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
        initState()
        ipcRenderer.on("open-file", openFile)
        ipcRenderer.on("invoke-play", invokePlay)
        ipcRenderer.on("change-play-state", changePlayState)
        ipcRenderer.on("reverb", reverb)
        ipcRenderer.on("delay", delay)
        ipcRenderer.on("lowpass", lowpass)
        ipcRenderer.on("highpass", highpass)
        ipcRenderer.on("highshelf", highshelf)
        ipcRenderer.on("lowshelf", lowshelf)
        ipcRenderer.on("trigger-paste", triggerPaste)
        return () => {
            ipcRenderer.removeListener("open-file", openFile)
            ipcRenderer.removeListener("invoke-play", invokePlay)
            ipcRenderer.removeListener("change-play-state", changePlayState)
            ipcRenderer.removeListener("reverb", reverb)
            ipcRenderer.removeListener("delay", delay)
            ipcRenderer.removeListener("lowpass", lowpass)
            ipcRenderer.removeListener("highpass", highpass)
            ipcRenderer.removeListener("highshelf", highshelf)
            ipcRenderer.removeListener("lowshelf", lowshelf)
            ipcRenderer.removeListener("trigger-paste", triggerPaste)
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
        loopEnd: 0,
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
        lowpassCutoff: 100,
        highpassCutoff: 0,
        highshelfCutoff: 70,
        highshelfGain: 0,
        lowshelfCutoff: 30,
        lowshelfGain: 0,
        midi: false,
        midiFile: null as unknown as Midi,
        midiDuration: 0,
        bpm: 0
    }

    const initialState = {...state}

    const initState = async () => {
        const saved = await ipcRenderer.invoke("get-state")
        if (saved.preservesPitch !== undefined) {
            state.preservesPitch = saved.preservesPitch
            speedCheckbox.current!.checked = !state.preservesPitch
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
        updateBarPos()
    }

    const refreshState = () => {
        const apply = {grain, player}
        preservesPitch(state.preservesPitch)
        speed(state.speed)
        pitch(state.pitch)
        reverse(state.reverse, apply)
        loop(state.loop)
        if (state.abloop) abloop([state.loopStart, state.loopEnd])
    }

    const saveState = () => {
        ipcRenderer.invoke("save-state", {reverse: state.reverse, pitch: state.pitch, speed: state.speed, preservesPitch: state.preservesPitch, loop: state.loop, abloop: state.abloop, loopStart: state.loopStart, loopEnd: state.loopEnd})
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

    const play = async () => {
        if (!checkBuffer()) return
        await Tone.start()
        await Tone.loaded()
        duration()
        const progress = Math.round(Number(progressBar.current.sliderRef?.childNodes[3].ariaValueNow))
        if (state.reverse === true) {
            if (progress === 0) stop()
        } else {
            if (progress === 100) stop()
        }
        if (Tone.Transport.state === "started") {
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
        if (Tone.Transport.state === "stopped") return
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

    const updateSliderPos = (value: number) => {
        progressBar.current.sliderRef.childNodes[3].ariaValueNow = `${value}`
        progressBar.current.sliderRef.childNodes[3].style = `left: ${value}%; right: auto; transform: translateX(-50%);`
        progressBar.current.sliderRef.childNodes[1].style = `left: 0%; right: auto; width: ${value}%; background-color: #991fbe;`
    }

    const updateVolumePos = (value: number) => {
        volumeBar.current.sliderRef.childNodes[3].ariaValueNow = `${value}`
        volumeBar.current.sliderRef.childNodes[3].style = `left: ${value*100}%; right: auto; transform: translateX(-50%);`
        volumeBar.current.sliderRef.childNodes[1].style = `left: 0%; right: auto; width: ${value*100}%; background-color: #ff3298;`
    }

    const updateABSliderPos = (value: number[]) => {
        abSlider.current.sliderRef.childNodes[1].style = `left: ${value[0]}%; right: auto; width: ${value[1] - value[0]}%;`
        abSlider.current.sliderRef.childNodes[3].ariaValueNow = `${value[0]}`
        abSlider.current.sliderRef.childNodes[3].style = `left: ${value[0]}%; right: auto; transform: translateX(-50%);`
        abSlider.current.sliderRef.childNodes[4].ariaValueNow = `${value[1]}`
        abSlider.current.sliderRef.childNodes[4].style = `left: ${value[1]}%; right: auto; transform: translateX(-50%);`
    }

    const updateBarPos = () => {
        speedBar.current!.value = String(state.speed)
        pitchBar.current!.value = String(state.pitch)
    }

    const reset = async () => {
        const {song, songName, songCover, songUrl, midi, midiDuration, midiFile, bpm} = state
        state = {...initialState, song, songName, songCover, songUrl, midi, midiDuration, midiFile, bpm}
        grain.playbackRate = state.speed
        player.playbackRate = state.speed
        grain.detune = state.pitch * 100
        speedBar.current!.value = String(state.speed)
        speedCheckbox.current!.checked = !state.preservesPitch
        pitchBar.current!.value = String(state.pitch)
        grain.reverse = state.reverse
        player.reverse = state.reverse
        Tone.Transport.loop = state.loop
        updateABSliderPos([0, 100])
        abSlider.current.sliderRef.style.display = "none";
        (document.querySelector(".progress-slider > .rc-slider-track") as any).style.backgroundColor = "#991fbe";
        (document.querySelector(".progress-slider > .rc-slider-rail") as any).style.backgroundColor = "black"
        speedImg.current!.src = speedIcon
        loopImg.current!.src = loopIcon
        reverseImg.current!.src = reverseIcon
        pitchImg.current!.src = pitchIcon
        abLoopImg.current!.src = abLoopIcon
        updateSliderPos(0)
        duration()
        updateMetadata()
        ipcRenderer.invoke("reset-effects")
        stop()
        play()
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
            Tone.Transport.loopStart = state.abloop ? state.loopStart : 0
            Tone.Transport.loopEnd = state.abloop ? state.loopEnd : state.duration
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
                if (Tone.Transport.seconds > state.duration - 1) {
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
        window.onkeydown = (event: KeyboardEvent) => {
            if (event.shiftKey) {
                event.preventDefault()
                speedBar.current!.step = "0.01"
                pitchBar.current!.step = "1"
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
        }
        window.onkeyup = (event: KeyboardEvent) => {
            if (!event.shiftKey) {
                if (Number(speedBar.current!.value) % 0.5 !== 0) speedBar.current!.value = String(functions.round(Number(speedBar.current!.value), 0.5))
                if (Number(pitchBar.current!.value) % 12 !== 0) pitchBar.current!.value = String(functions.round(Number(pitchBar.current!.value), 12))
                speedBar.current!.step = "0.5"
                pitchBar.current!.step = "12"
            }
        }
        return window.clearInterval()
    }, [])

    const seek = (value: number) => {
        state.dragging = false
        let percent = value / 100     
        if (state.reverse === true) {
            let value = (1-percent) * state.duration
            if (value < 0) value = 0
            if (value > state.duration - 1) value = state.duration - 1
            Tone.Transport.seconds = value
        } else {
            let value = percent * state.duration
            if (value < 0) value = 0
            if (value > state.duration - 1) value = state.duration - 1
            Tone.Transport.seconds = value
        }
        if (state.midi) playMIDI()
        if (Tone.Transport.state === "paused" || Tone.Transport.state === "stopped") play()
    }

    const updateProgressText = (value: number) => {
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

    const pitch = async (value?: number | string) => {
        if (value) state.pitch = Number(value) 
        if (state.pitch === 0) {
            pitchImg.current!.src = pitchIcon
        } else {
            pitchImg.current!.src = pitchActiveIcon
        }
        if (state.midi) {
            await playMIDI()
        } else {
            grain.detune = state.pitch * 100
        }
        saveState()
    }

    const updateMetadata = () => {
        songTitle.current!.innerText = state.songName
        songCover.current!.src = state.songCover
    }

    const playMIDI = async (applyState?: any, options?: {wave?: any, attack?: number, decay?: number, sustain?: number, release?: number, pitch?: number, poly?: boolean, portamento?: number}) => {
        if (!options) options = {}
        if (!options.wave) options.wave = "square"
        if (!options.attack) options.attack = 0.02
        if (!options.decay) options.decay = 0.5
        if (!options.sustain) options.sustain = 0.3
        if (!options.release) options.release = 0.5
        if (!options.poly) options.poly = true
        if (!options.portamento) options.portamento = 0
        if (!options.pitch) options.pitch = 0
        const localState = applyState ? applyState.state : state
        const synthArray = applyState ? applyState.synths : synths
        if (!localState.midiFile) return
        const midi = localState.midiFile as Midi
        disposeSynths(synthArray)
        midi.tracks.forEach((track: any) => {
            let synth = null as any
            if (options?.poly) {
                synth = new Tone.PolySynth(Tone.Synth, {oscillator: {type: options?.wave}, envelope: {attack: options?.attack, decay: options?.decay, sustain: options?.sustain, release: options?.release}, portamento: options?.portamento, detune: options?.pitch, volume: -6}).sync()
            } else {
                synth = new Tone.Synth({oscillator: {type: options?.wave}, envelope: {attack: options?.attack, decay: options?.decay, sustain: options?.sustain, release: options?.release}, portamento: options?.portamento, detune: options?.pitch, volume: -6}).sync()
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
        if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
            stop()
        }
        if (Tone.Transport.state === "stopped") {
            play()
        }
    }

    const upload = async (file?: string) => {
        if (!file) file = await ipcRenderer.invoke("select-file")
        if (!file) return
        if (path.extname(file) === ".mid") return uploadMIDI(file)
        if (!file.startsWith("file:///")) file = `file:///${file}`
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
        await grain.buffer.load(state.song)
        await player.load(state.song)
        await Tone.loaded()
        duration()
        updateMetadata()
        updateRecentFiles()
        switchState()
        if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
            stop()
        }
        if (Tone.Transport.state === "stopped") {
            play()
        }
        refreshState()
    }

    const applyAB = (duration: number) => {
        if (!state.abloop) return
        let percent = duration / 100.0
        if (state.reverse) {
            Tone.Transport.loopStart = (100 - state.loopEnd) * percent
            Tone.Transport.loopEnd = (100 - state.loopStart) * percent
        } else {
            Tone.Transport.loopStart = state.loopStart * percent
            Tone.Transport.loopEnd = state.loopEnd * percent
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
        if ((Tone.Transport.seconds >= Tone.Transport.loopStart) && (Tone.Transport.seconds <= Tone.Transport.loopEnd)) return
        let val = Number(Tone.Transport.loopStart)
        if (val < 0) val = 0
        if (val > state.duration - 1) val = state.duration - 1
        Tone.Transport.seconds = val
        if (state.midi) playMIDI()
        saveState()
    }

    const toggleAB = (value?: boolean) => {
        let condition = value !== undefined ? value === true : abSlider.current.sliderRef.style.display === "none"
        if (condition) {
            abSlider.current.sliderRef.style.display = "flex"
            state.abloop = true
            state.loop = true
            if (!state.loopEnd) state.loopEnd = state.duration
            loopImg.current!.src = loopActiveIcon
            abLoopImg.current!.src = abLoopActiveIcon
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.loopStart
            Tone.Transport.loopEnd = state.loopEnd
        } else {
            abSlider.current.sliderRef.style.display = "none"
            state.abloop = false
            state.loop = false
            loopImg.current!.src = loopIcon
            abLoopImg.current!.src = abLoopIcon
            Tone.Transport.loop = false
        }
        updateMetadata()
        saveState()
    }

    const applyState = async (localState: any, grain: Tone.GrainPlayer, player: Tone.Player) => {
        const apply = {state: localState, grain, player}
        if (localState.song) {
            await grain.buffer.load(localState.song)
            await player.load(localState.song)
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
            pitch()
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
        state.editCode = editCode
        return {synthArray: synths, effectNodes}
    }

     /** Renders the same as online */
     const render = async (start: number, duration: number) => {
        return Tone.Offline(async ({transport}) => {
            let grain = new Tone.GrainPlayer().sync()
            let player = new Tone.Player().sync()
            let synths = [] as Tone.PolySynth[]
            grain.grainSize = 0.1
            if (state.midi) {
                const {synthArray, effectNodes} = await applyMIDIState(state, synths)
                synthArray.forEach((s) => s.chain(...effectNodes).toDestination())
            } else {
                const {current, effectNodes} = await applyState(state, grain, player)
                current.chain(...effectNodes).toDestination().start()
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
                duration = state.loopEnd - state.loopStart
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
            await grain.buffer.load(state.song)
            await player.load(state.song)
            await Tone.loaded()
            duration()
            updateMetadata()
            updateRecentFiles()
            switchState()
            if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
                stop()
            }
            if (Tone.Transport.state === "stopped") {
                play()
            }
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

    const next = () => {const current = state.preservesPitch ? grain : player
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
            <section className="player">
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
                            <Slider className="volume-slider" ref={volumeBar} onChange={(value) => volume(value)} min={0} max={1} step={0.05} defaultValue={1}/>
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
                        <div className="pitch-popup" ref={pitchPopup} style={({display: "none"})}>
                            <input type="range" ref={pitchBar} onChange={(event) => pitch(event.target.value)} min="-24" max="24" step="12" defaultValue="0" className="pitch-bar"/>
                        </div>
                        <img className="player-button" src={pitchIcon} ref={pitchImg} onClick={() => pitchPopup.current!.style.display === "flex" ? pitchPopup.current!.style.display = "none" : pitchPopup.current!.style.display = "flex"} width="30" height="30" onMouseEnter={() => toggleHover("pitch", true)} onMouseLeave={() => toggleHover("pitch")}/>
                        <div className="progress-container" onMouseUp={() => state.dragging = false}>
                            <Slider className="progress-slider" ref={progressBar} onBeforeChange={() => state.dragging = true} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)} defaultValue={0}/>
                            <Slider.Range className="ab-slider" ref={abSlider} min={0} max={100} defaultValue={[0, 100]} onBeforeChange={() => state.dragging = true} onChange={(value) => updateProgressTextAB(value)} onAfterChange={(value) => abloop(value)} style={({display: "none"})}/>
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