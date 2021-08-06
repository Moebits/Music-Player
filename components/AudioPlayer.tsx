import React, {useEffect, useRef} from "react"
import {ipcRenderer} from "electron" 
import path from "path"
import Slider from "rc-slider"
import * as Tone from "tone"
import jsmediatags from "jsmediatags"
import encodeWAV from "audiobuffer-to-wav"
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
import RecentPlays from "./RecentPlays"
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
                submit(info.songUrl, info.skip)
            } else {
                upload(info.song, info.skip)
            }
        }
        const changePlayState = () => {
            play()
        }
        ipcRenderer.on("open-file", openFile)
        ipcRenderer.on("invoke-play", invokePlay)
        ipcRenderer.on("change-play-state", changePlayState)
        return () => {
            ipcRenderer.removeListener("open-file", openFile)
            ipcRenderer.removeListener("invoke-play", invokePlay)
            ipcRenderer.removeListener("change-play-state", changePlayState)
        }
    }, [])

    let state = {
        reverse: false,
        pitch: 0,
        speed: 1,
        volume: 1,
        muted: false,
        speedBox: true,
        loop: false,
        abloop: false,
        loopStart: 0,
        loopEnd: 0,
        grainPlayer: false,
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
        volumeHover: false
    }

    const initialState = {...state}

    let player: Tone.Player
    let source: Tone.GrainPlayer
    if (typeof window !== "undefined") {
        player = new Tone.Player().sync().start().toDestination()
        source = new Tone.GrainPlayer().sync().start()
        source.grainSize = 0.1
        source.overlap = 0.1
    }
    
    const applyEffects = (applyState?: any) => {
        let currentSource = source
        let currentPlayer = player 
        if (applyState) {
            currentSource = applyState.source 
            currentPlayer = applyState.player
        }
        currentPlayer.disconnect()
        currentSource.disconnect()
        const nodes = state.effects.map((e) => e.node)
        currentSource.chain(...nodes)
        currentPlayer.chain(...nodes)
        const current = state.grainPlayer ? currentSource : currentPlayer
        if (state.effects[0]) {
            nodes[nodes.length - 1].toDestination()
        } else {
            current.toDestination()
        }
    }

    const duration = () => {
        const current = state.grainPlayer ? source : player
        state.duration = current.buffer.duration / current.playbackRate
        secondsTotal.current!.innerText = functions.formatSeconds(state.duration)
    }

    const checkBuffer = () => {
        const current = state.grainPlayer ? source : player
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
            Tone.Transport.pause()
        } else {
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

    const speed = async (event?: React.ChangeEvent<HTMLInputElement>, applyState?: any) => {
        if (event) state.speed = Number(event.target.value)
        if (state.speed === 1) {
            speedImg.current!.src = speedIcon
        } else {
            speedImg.current!.src = speedActiveIcon
        }
        let currentSource = source
        let currentPlayer = player
        if (applyState) {
            currentSource = applyState.source
            currentPlayer = applyState.player
        }
        if (state.speedBox) {
            state.grainPlayer = false
            currentPlayer.playbackRate = state.speed
            applyEffects()
        } else {
            state.grainPlayer = true
            currentSource.playbackRate = state.speed
            applyEffects()
        }
        let percent = Tone.Transport.seconds / state.duration
        state.duration  = (source.buffer.duration / state.speed)
        let value = percent * state.duration
        if (value < 0) value = 0
        if (value > state.duration - 1) value = state.duration - 1
        Tone.Transport.seconds = value 
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
    }

    const speedBox = () => {
        state.speedBox = !state.speedBox
        speedCheckbox.current!.checked = state.speedBox
        return speed()
    }

    const updateSliderPos = (value: number) => {
        progressBar.current.sliderRef.childNodes[3].ariaValueNow = `${value}`
        progressBar.current.sliderRef.childNodes[3].style = `left: ${value}%; right: auto; transform: translateX(-50%);`
        progressBar.current.sliderRef.childNodes[1].style = `left: 0%; right: auto; width: ${value}%; background-color: ${state.reverse ? "black" : "#991fbe"};`
    }

    const updateVolumePos = (value: number) => {
        volumeBar.current.sliderRef.childNodes[3].ariaValueNow = `${value}`
        volumeBar.current.sliderRef.childNodes[3].style = `left: ${value*100}%; right: auto; transform: translateX(-50%);`
        volumeBar.current.sliderRef.childNodes[1].style = `left: 0%; right: auto; width: ${value*100}%; background-color: #ff3298;`
    }

    const reset = () => {
        const duration = state.duration
        const song = state.song
        const songName = state.songName
        const songCover = state.songCover
        state = {...initialState}
        state.duration = duration
        state.song = song
        state.songName = songName
        state.songCover = songCover
        source.playbackRate = state.speed
        player.playbackRate = state.speed
        speedBar.current!.value = String(state.speed)
        speedCheckbox.current!.checked = state.speedBox
        source.detune = state.pitch
        pitchBar.current!.value = String(state.pitch)
        source.reverse = state.reverse
        player.reverse = state.reverse
        Tone.Transport.loop = state.loop
        abSlider.current.sliderRef.childNodes[1].style = "left: 0%; right: auto; width: 100%;"
        abSlider.current.sliderRef.childNodes[3].ariaValueNow = "0"
        abSlider.current.sliderRef.childNodes[3].style = "left: 0%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.childNodes[4].ariaValueNow = "100"
        abSlider.current.sliderRef.childNodes[4].style = "left: 100%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.style.display = "none";
        (document.querySelector(".progress-slider > .rc-slider-track") as any).style.backgroundColor = "#991fbe";
        (document.querySelector(".progress-slider > .rc-slider-rail") as any).style.backgroundColor = "black"
        speedImg.current!.src = speedIcon
        loopImg.current!.src = loopIcon
        reverseImg.current!.src = reverseIcon
        pitchImg.current!.src = pitchIcon
        abLoopImg.current!.src = abLoopIcon
        updateSliderPos(0)
        source.disconnect()
        player.disconnect().toDestination()
        updateMetadata()
        stop()
        play()
    }

    const loop = async () => {
        await Tone.loaded()
        if (state.loop === true) {
            state.loop = false
            Tone.Transport.loop = false
            if (state.abloop) toggleAB()
            loopImg.current!.src = loopIcon
        } else {
            state.loop = true
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.abloop ? state.loopStart : 0
            Tone.Transport.loopEnd = state.abloop ? state.loopEnd : state.duration
            loopImg.current!.src = loopActiveIcon
        }
        updateMetadata()
    }

    const reverse = async (applyState?: any) => {
        let currentSource = source
        let currentPlayer = player
        let skip = false
        if (applyState) {
            currentSource = applyState.source
            currentPlayer = applyState.player
            skip = true
        }
        let percent = Tone.Transport.seconds / state.duration
        let value = (1-percent) * state.duration
        if (value < 0) value = 0
        if (value > state.duration - 1) value = state.duration - 1
        if (state.reverse === true && !skip) {
            if (!applyState) Tone.Transport.seconds = value
            state.reverse = false
            currentSource.reverse = false
            currentPlayer.reverse = false
            reverseImg.current!.src = reverseIcon
        } else {
            if (!applyState) Tone.Transport.seconds = value
            state.reverse = true
            currentSource.reverse = true
            currentPlayer.reverse = true
            reverseImg.current!.src = reverseActiveIcon
        }
        applyAB(state.duration)
        if (!applyState) updateMetadata()
        reverseStyle()
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
                    Tone.Transport.pause()
                    Tone.Transport.seconds = Math.round(state.duration) - 1
                }
                if (Tone.Transport.seconds === Math.round(state.duration) - 1) Tone.Transport.seconds = Math.round(state.duration)
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
            //secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
        } else {
            let value = percent * state.duration
            if (value < 0) value = 0
            if (value > state.duration - 1) value = state.duration - 1
            Tone.Transport.seconds = value
            //secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
        }
        if (Tone.Transport.state === "paused") play()
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

    const pitch = async (event?: React.ChangeEvent<HTMLInputElement>) => {
        if (event) state.pitch = Number(event.target.value) 
        if (state.pitch === 0) {
            pitchImg.current!.src = pitchIcon
        } else {
            pitchImg.current!.src = pitchActiveIcon
        }
        source.detune = state.pitch * 100
    }

    const updateMetadata = () => {
        songTitle.current!.innerText = state.songName
        songCover.current!.src = state.songCover
    }

    const upload = async (file?: string, skip?: boolean) => {
        if (!file) file = await ipcRenderer.invoke("select-file")
        if (!file) return
        if (!file.startsWith("file:///")) file = `file:///${file}`
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
        await source.buffer.load(state.song)
        await player.load(state.song)
        await Tone.loaded()
        duration()
        updateMetadata()
        updateRecentFiles(skip)
        if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
            stop()
        }
        if (Tone.Transport.state === "stopped") {
            play()
        }
    }

    const applyAB = (duration: number) => {
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
        state.dragging = false
        Tone.Transport.loop = true
        if (Tone.Transport.state === "paused") Tone.Transport.start()
        state.loopStart = value[0]
        state.loopEnd = value[1]
        applyAB(state.duration)
        if (Tone.Transport.loopStart === Tone.Transport.loopEnd) Tone.Transport.loopStart = (Tone.Transport.loopEnd as number) - 1
        if ((Tone.Transport.seconds >= Tone.Transport.loopStart) && (Tone.Transport.seconds <= Tone.Transport.loopEnd)) return
        let val = Number(Tone.Transport.loopStart)
        if (val < 0) val = 0
        if (val > state.duration - 1) val = state.duration - 1
        Tone.Transport.seconds = val
    }

    const toggleAB = () => {
        if (abSlider.current.sliderRef.style.display === "none") {
            abSlider.current.sliderRef.style.display = "flex"
            state.abloop = true
            state.loop = true
            if (!state.loopEnd) state.loopEnd = state.duration
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.loopStart
            Tone.Transport.loopEnd = state.loopEnd
            loopImg.current!.src = loopActiveIcon
            abLoopImg.current!.src = abLoopActiveIcon
        } else {
            abSlider.current.sliderRef.style.display = "none"
            Tone.Transport.loop = false
            state.abloop = false
            state.loop = false
            loopImg.current!.src = loopIcon
            abLoopImg.current!.src = abLoopIcon
        }
        updateMetadata()
    }

    const applyState = async (state: any, source: Tone.GrainPlayer, player: Tone.Player, reload?: boolean) => {
        const apply = {state, source, player}
        if (reload && state.song) {
            await source.buffer.load(state.song)
            await player.load(state.song)
            await Tone.loaded()
        }
        let editCode = ""
        if (state.speed !== 1) {
            speed(undefined, apply)
            editCode += "-speed"
        }
        if (state.reverse !== false) {
            reverse(apply)
            editCode += "-reverse"
        } 
        if (state.pitch !== 0) {
            pitch()
            editCode += "-pitch"
        }
        if (state.abloop !== false) {
            editCode += "-loop"
        }
        state.editCode = editCode
        return state.grainPlayer ? source : player
    }

     /** Renders the same as online */
     const render = async (start: number, duration: number) => {
        return Tone.Offline(async ({transport}) => {
            let source = new Tone.GrainPlayer().sync()
            let player = new Tone.Player().sync()
            source.grainSize = 0.1
            const current = await applyState(state, source, player, true)
            current.start().toDestination()
            transport.start(start)
        }, duration)
    }

    const download = async () => {
        if (!checkBuffer()) return
        await Tone.loaded()
        window.URL.revokeObjectURL(state.download)
        let duration = state.duration
        let start = 0
        if (state.abloop) {
            start = state.loopStart
            duration = state.loopEnd - state.loopStart
        }
        const buffer = await render(start, duration)
        const wav = encodeWAV(buffer)
        console.error(wav)
        const blob = new Blob([new DataView(wav)], {type: "audio/wav"})
        state.download = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        document.body.appendChild(a)
        a.style.display = "none"
        a.href = state.download
        a.download = `${functions.decodeEntities(state.songName)}${state.editCode}.wav`
        a.click()
        document.body.removeChild(a)
    }

    const submit = async (value?: string, skip?: boolean) => {
        if (!value) value = searchBox.current?.value
        if (!value) return
        searchBox.current!.value = ""
        const songBuffer = await ipcRenderer.invoke("get-song", value)
        if (songBuffer) {
            const songName = await ipcRenderer.invoke("get-song-name", value)
            const artwork = await ipcRenderer.invoke("get-art", value)
            window.URL.revokeObjectURL(state.song)
            const blob = new Blob([new DataView(songBuffer)], {type: "audio/mpeg"})
            state.songName = songName
            state.song = window.URL.createObjectURL(blob)
            state.songCover = artwork
            state.songUrl = value
            await source.buffer.load(state.song)
            await player.load(state.song)
            await Tone.loaded()
            duration()
            updateMetadata()
            updateRecentFiles(skip)
            if (Tone.Transport.state === "started" || Tone.Transport.state === "paused") {
                stop()
            }
            if (Tone.Transport.state === "stopped") {
                play()
            }
        }
    }

    const updateRecentFiles = (skip?: boolean) => {
        const current = state.grainPlayer ? source : player
        ipcRenderer.invoke("update-recent", {
            songName: state.songName, 
            song: state.song,
            songCover: state.songCover,
            songUrl: state.songUrl,
            duration: current.buffer.duration,
            skip
        })
    }

    const previous = () => {
        const current = state.grainPlayer ? source : player
        ipcRenderer.invoke("get-previous", {
            songName: state.songName, 
            song: state.song,
            songCover: state.songCover,
            songUrl: state.songUrl,
            duration: current.buffer.duration
        })
    }

    const next = () => {const current = state.grainPlayer ? source : player
        ipcRenderer.invoke("get-next", {
            songName: state.songName, 
            song: state.song,
            songCover: state.songCover,
            songUrl: state.songUrl,
            duration: current.buffer.duration
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
                if (state.volume === 0) {
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
                if (state.volume === 0) {
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
                                <input type="range" ref={speedBar} onChange={(event) => speed(event)} min="0.5" max="4" step="0.5" defaultValue="1" className="speed-bar"/>
                                <div className="speed-checkbox-container">
                                <p className="speed-text">Pitch?</p><input type="checkbox" ref={speedCheckbox} defaultChecked onChange={() => speedBox()} className="speed-checkbox"/>
                                </div>       
                            </div>
                        </div>
                        <img className="player-button" src={speedIcon} ref={speedImg} onClick={() => speedPopup.current!.style.display === "flex" ? speedPopup.current!.style.display = "none" : speedPopup.current!.style.display = "flex"} width="30" height="30" onMouseEnter={() => toggleHover("speed", true)} onMouseLeave={() => toggleHover("speed")}/>
                        <div className="pitch-popup" ref={pitchPopup} style={({display: "none"})}>
                            <input type="range" ref={pitchBar} onChange={(event) => pitch(event)} min="-24" max="24" step="12" defaultValue="0" className="pitch-bar"/>
                        </div>
                        <img className="player-button" src={pitchIcon} ref={pitchImg} onClick={() => pitchPopup.current!.style.display === "flex" ? pitchPopup.current!.style.display = "none" : pitchPopup.current!.style.display = "flex"} width="30" height="30" onMouseEnter={() => toggleHover("pitch", true)} onMouseLeave={() => toggleHover("pitch")}/>
                        <div className="progress-container">
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