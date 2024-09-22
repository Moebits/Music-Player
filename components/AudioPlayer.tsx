import React, {useEffect, useState, useRef} from "react"
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
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import RecentPlays from "./RecentPlays"
import silence from "../assets/silence.mp3"
import audioEncoder from "audio-encoder"
import fs from "fs"
import "./styles/audioplayer.less"

let timeout = null as any
let player: Tone.Player
let synths = [] as Tone.PolySynth[]
let audioNode: any
let effectNode: any
let gainNode: any
let soundtouchNode: any
let staticSoundtouchNode: any
let soundtouchURL = ""
let lfoNode: any
let lfoURL = ""
let bitcrusherNode: any

const initialize = async () => {
    player = new Tone.Player(silence).sync().start()
    
    const context = Tone.getContext()
    const soundtouchSource = await ipcRenderer.invoke("get-soundtouch-source")
    const soundtouchBlob = new Blob([soundtouchSource], {type: "text/javascript"})
    soundtouchURL = window.URL.createObjectURL(soundtouchBlob)
    await context.addAudioWorkletModule(soundtouchURL, "soundtouch")
    soundtouchNode = context.createAudioWorkletNode("soundtouch-processor")
    staticSoundtouchNode = context.createAudioWorkletNode("soundtouch-processor")
    const lfoSource = await ipcRenderer.invoke("get-lfo-source")
    const lfoBlob = new Blob([lfoSource], {type: "text/javascript"})
    lfoURL = window.URL.createObjectURL(lfoBlob)
    await context.addAudioWorkletModule(lfoURL, "lfo")
    lfoNode = context.createAudioWorkletNode("lfo-processor", {numberOfInputs: 2, outputChannelCount: [2]})
    gainNode = new Tone.Gain(1)

    // @ts-expect-error
    audioNode = new Tone.ToneAudioNode()
    audioNode.input = player
    audioNode.output = gainNode.input
    audioNode.input.chain(soundtouchNode, audioNode.output)
    // @ts-expect-error
    effectNode = new Tone.ToneAudioNode()
    effectNode.input = player
    effectNode.output = gainNode.input
    effectNode.input.chain(effectNode.output)
    audioNode.toDestination()
}
if (typeof window !== "undefined") initialize()

const AudioPlayer: React.FunctionComponent = (props) => {
    const [reverse, setReverse] = useState(false)
    const [pitch, setPitch] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [volume, setVolume] = useState(1)
    const [muted, setMuted] = useState(false)
    const [loop, setLoop] = useState(false)
    const [abloop, setABLoop] = useState(false)
    const [loopStart, setLoopStart] = useState(0)
    const [loopEnd, setLoopEnd] = useState(1000)
    const [preservesPitch, setPreservesPitch] = useState(false)
    const [duration, setDuration] = useState(0)
    const [song, setSong] = useState("")
    const [songName, setSongName] = useState("No title")
    const [songCover, setSongCover] = useState(placeholder)
    const [songUrl, setSongUrl] = useState("")
    const [editCode, setEditCode] = useState("")
    const [effects, setEffects] = useState([] as { type: string, node: Tone.ToneAudioNode }[])
    const [dragging, setDragging] = useState(false)
    const [playHover, setPlayHover] = useState(false)
    const [volumeHover, setVolumeHover] = useState(false)
    const [sampleRate, setSampleRate] = useState(44100)
    const [reverbMix, setReverbMix] = useState(0)
    const [reverbDecay, setReverbDecay] = useState(1.5)
    const [delayMix, setDelayMix] = useState(0)
    const [delayTime, setDelayTime] = useState(0.25)
    const [delayFeedback, setDelayFeedback] = useState(0.5)
    const [phaserMix, setPhaserMix] = useState(0)
    const [phaserFrequency, setPhaserFrequency] = useState(1)
    const [lowpassCutoff, setLowpassCutoff] = useState(100)
    const [highpassCutoff, setHighpassCutoff] = useState(0)
    const [highshelfCutoff, setHighshelfCutoff] = useState(70)
    const [highshelfGain, setHighshelfGain] = useState(0)
    const [lowshelfCutoff, setLowshelfCutoff] = useState(30)
    const [lowshelfGain, setLowshelfGain] = useState(0)
    const [midi, setMidi] = useState(false)
    const [midiFile, setMidiFile] = useState(null as unknown as Midi)
    const [midiDuration, setMidiDuration] = useState(0)
    const [bpm, setBpm] = useState(0)
    const [wave, setWave] = useState("square")
    const [attack, setAttack] = useState(0.02)
    const [decay, setDecay] = useState(0.5)
    const [sustain, setSustain] = useState(0.3)
    const [release, setRelease] = useState(0.5)
    const [poly, setPoly] = useState(true)
    const [portamento, setPortamento] = useState(0)
    const [resizeFlag, setResizeFlag] = useState(false)
    const [mouseFlag, setMouseFlag] = useState(false)
    const [savedLoop, setSavedLoop] = useState([0, 1000])
    const [pitchLFO, setPitchLFO] = useState(false)
    const [pitchLFORate, setPitchLFORate] = useState(1)
    const [stepFlag, setStepFlag] = useState(false)
    const [speedStep, setSpeedStep] = useState(0.5)
    const [pitchStep, setPitchStep] = useState(12)
    const progressBar = useRef(null) as any
    const volumeBar = useRef(null) as any
    const speedBar = useRef(null) as any
    const speedCheckbox = useRef(null) as React.RefObject<HTMLImageElement>
    const pitchCheckbox = useRef(null) as React.RefObject<HTMLImageElement>
    const pitchBar = useRef(null) as any
    const pitchLFOBar = useRef(null) as any
    const secondsProgress = useRef(null) as React.RefObject<HTMLSpanElement>
    const pitchSlider = useRef(null) as React.RefObject<HTMLDivElement>
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
    const songCoverRef = useRef(null) as React.RefObject<HTMLImageElement>
    const songNameRef = useRef(null) as React.RefObject<HTMLHeadingElement>


    useEffect(() => {
        progressBar.current?.resize()
        abSlider.current?.resize()
        volumeBar.current?.resize()
        speedBar.current?.resize()
        pitchBar.current?.resize()
    })

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
            if (abloop && loopEnd) {
                setSavedLoop([loopStart, loopEnd])
            }
        }
        const pasteLoop = () => {
            if (!abloop) toggleAB(true)
            updateABLoop(savedLoop)
            updateABSliderPos(savedLoop)
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
        ipcRenderer.on("bitcrush", bitcrush)
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
            ipcRenderer.removeListener("bitcrush", bitcrush)
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

    
    useEffect(() => {
        /*Update Progress*/
        const updateProgress = () => {
            let percent = (Tone.Transport.seconds / duration)
            if (!Number.isFinite(percent)) return
            if (!dragging) {
                if (reverse) {
                    updateSliderPos((1-percent) * 100)
                    secondsProgress.current!.innerText = functions.formatSeconds(duration - Tone.Transport.seconds)
                } else {
                    updateSliderPos(percent * 100)
                    secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
                }
            }
            if (!loop) {
                if (Tone.Transport.seconds > duration - 1) {
                    disposeSynths()
                    Tone.Transport.pause()
                    Tone.Transport.seconds = Math.round(duration) - 1
                }
                if (Tone.Transport.seconds === Math.round(duration) - 1) Tone.Transport.seconds = Math.round(duration)
            } else {
                if (midi && Math.floor(Tone.Transport.seconds) === 0) playMIDI()
                if (Tone.Transport.seconds > duration) {
                    Tone.Transport.seconds = 0
                    if (midi) playMIDI()
                }
            }
        }
        /*
        const progressLoop = async () => {
            updateProgress()
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    resolve()
                }, 1000)
            }).then(progressLoop)
        }
        progressLoop()*/
        window.setInterval(updateProgress, 1000)

        /*Change play button image*/
        const onPause = () => {
            if (playHover) {
                if (playButton.current?.src !== playHoverIcon) playButton.current!.src = playHoverIcon
            } else {
                if (playButton.current?.src !== playIcon) playButton.current!.src = playIcon
            }
        }

        const onStop = () => {
            if (playHover) {
                if (playButton.current?.src !== playHoverIcon) playButton.current!.src = playHoverIcon
            } else {
                if (playButton.current?.src !== playIcon) playButton.current!.src = playIcon
            }
        }

        const onStart = () => {
            if (playHover) {
                if (playButton.current?.src !== pauseHoverIcon) playButton.current!.src = pauseHoverIcon
            } else {
                if (playButton.current?.src !== pauseIcon) playButton.current!.src = pauseIcon
            }
        }

        /* Close speed and pitch boxes */
        const onWindowClick = (event: any) => {
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

        Tone.Transport.on("pause", onPause)
        Tone.Transport.on("stop", onStop)
        Tone.Transport.on("start", onStart)
        window.addEventListener("click", onWindowClick)
        return () => {
            window.clearInterval(undefined)
            //window.clearTimeout(timeout)
            Tone.Transport.off("pause", onPause)
            Tone.Transport.off("stop", onStop)
            Tone.Transport.off("start", onStart)
            window.removeEventListener("click", onWindowClick)
        }
    }, [duration, reverse, dragging, midi, loop, playHover])

    useEffect(() => {
        /* Precision on shift click */
        const keyDown = (event: KeyboardEvent) => {
            if (event.shiftKey) {
                event.preventDefault()
                setSpeedStep(0.01)
                setPitchStep(1)
                setStepFlag(false)
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
                updateVolume(volume + 0.05)
            }
            if (event.key === "ArrowDown") {
                event.preventDefault()
                updateVolume(volume - 0.05)
            }
        }

        const keyUp = (event: KeyboardEvent) => {
            if (!event.shiftKey) {
                setStepFlag(true)
            }
        }

        const wheel = (event: WheelEvent) => {
            event.preventDefault()
            const delta = Math.sign(event.deltaY)
            updateVolume(volume - delta * 0.05)
        }

        const mouseDown = () => {
            if (stepFlag) {
                setSpeedStep(0.5)
                setPitchStep(12)
                setStepFlag(false)
            }
            setMouseFlag(true)
        }

        const mouseUp = () => {
            setMouseFlag(false)
            setResizeFlag(false)
        }

        const mouseMove = (event: MouseEvent) => {
            if (resizeFlag && mouseFlag) {
                const element = document.querySelector(".player") as HTMLElement
                let newHeight = window.innerHeight - event.pageY
                if (newHeight < 100) newHeight = 100
                if (newHeight > 200) return
                element.style.height = `${newHeight}px`
            }
        }

        window.addEventListener("keydown", keyDown, {passive: false})
        window.addEventListener("keyup", keyUp)
        window.addEventListener("wheel", wheel, {passive: false})
        window.addEventListener("mousedown", mouseDown)
        window.addEventListener("mouseup", mouseUp)
        window.addEventListener("mousemove", mouseMove)
        return () => {
            window.clearInterval(undefined)
            window.removeEventListener("keydown", keyDown)
            window.removeEventListener("keyup", keyUp)
            window.removeEventListener("wheel", wheel)
            window.removeEventListener("mousedown", mouseDown)
            window.removeEventListener("mouseup", mouseUp)
            window.removeEventListener("mousemove", mouseMove)
        }
    }, [speedStep, pitchStep, volume, stepFlag, resizeFlag, mouseFlag])

    useEffect(() => {
        /* JS Media Queries */
        const phoneMediaQuery = (query: MediaQueryListEvent | MediaQueryList) => {
            if (query.matches) {
                searchBox.current!.placeholder = "YT, SC, or BC link..."
            } else {
                searchBox.current!.placeholder = "Youtube, Soundcloud, or Bandcamp link..."
            }
        }
        const media = window.matchMedia("(max-width: 65rem)")
        media.addEventListener("change", phoneMediaQuery)
        phoneMediaQuery(media)
        return () => {
            media.removeEventListener("change", phoneMediaQuery)
        }
    }, [])

    const initState = async () => {
        const saved = await ipcRenderer.invoke("get-state")
        const synthSaved = await ipcRenderer.invoke("get-synth-state")
        if (saved.preservesPitch !== undefined) {
            setPreservesPitch(saved.preservesPitch)
            speedCheckbox.current!.src = !preservesPitch ? checkboxChecked : checkbox
        }
        if (saved.pitchLFO !== undefined) {
            setPitchLFO(saved.pitchLFO)
            pitchCheckbox.current!.src = pitchLFO ? checkboxChecked : checkbox
        }
        if (saved.pitchLFORate !== undefined) {
            setPitchLFORate(saved.pitchLFORate)
        }
        if (saved.speed !== undefined) {
            setSpeed(saved.speed)
            if (saved.speed === 1) {
                speedImg.current!.src = speedIcon
            } else {
                speedImg.current!.src = speedActiveIcon
            }
        }
        if (saved.pitch !== undefined) {
            setPitch(saved.pitch)
            if (saved.pitch === 0) {
                pitchImg.current!.src = pitchIcon
            } else {
                pitchImg.current!.src = pitchActiveIcon
            }
        }
        if (saved.reverse !== undefined) {
            setReverse(saved.reverse)
            if (saved.reverse === false) {
                reverseImg.current!.src = reverseIcon
            } else {
                reverseImg.current!.src = reverseActiveIcon
            }
        }
        if (saved.loop !== undefined) {
            setLoop(saved.loop)
            if (saved.loop === false) {
                loopImg.current!.src = loopIcon
            } else {
                loopImg.current!.src = loopActiveIcon
            }
        }
        if (synthSaved.wave !== undefined) setWave(synthSaved.wave)
        if (synthSaved.attack !== undefined) setAttack(synthSaved.attack)
        if (synthSaved.decay !== undefined) setDecay(synthSaved.decay)
        if (synthSaved.sustain !== undefined) setSustain(synthSaved.sustain)
        if (synthSaved.release !== undefined) setRelease(synthSaved.release) 
        if (synthSaved.poly !== undefined) setPoly(synthSaved.poly)
        if (synthSaved.portamento !== undefined) setPortamento(synthSaved.portamento)
        pitchLFOStyle()
        updateVolumePos(1)
        updateBarPos()
    }

    const refreshState = () => {
        const apply = {player}
        updatePreservesPitch(preservesPitch)
        updateSpeed(speed)
        updatePitch(pitch)
        updatePitchLFO(pitchLFO)
        updateReverse(reverse, apply)
        updateLoop(loop)
        if (abloop) updateABLoop([loopStart, loopEnd])
    }

    useEffect(() => {
        ipcRenderer.invoke("save-state", {reverse, pitch, speed, preservesPitch, pitchLFO, pitchLFORate, loop, abloop, loopStart, loopEnd})
    }, [reverse, pitch, speed, preservesPitch, pitchLFO, pitchLFORate, loop, abloop, loopStart, loopEnd])

    const removeEffect = (type: string) => {
        const index = effects.findIndex((e) => e?.type === type)
        if (index !== -1) {
            effects[index] = null as any
            setEffects(effects.filter(Boolean))
        }
    }

    const pushEffect = (type: string, node: Tone.ToneAudioNode) => {
        const obj = {type, node}
        const index = effects.findIndex((e) => e?.type === type)
        if (index !== -1) {
            effects[index] = obj
        } else {
            effects.push(obj)
        }
        setEffects(effects)
    }
    
    const applyEffects = () => {
        player.disconnect()
        soundtouchNode.disconnect()
        staticSoundtouchNode.disconnect()
        lfoNode.disconnect()
        if (synths.length) synths.forEach((s) => s.disconnect())
        const nodes = effects.map((e) => e?.node).filter(Boolean)
        if (nodes[0]) nodes.forEach((n) => n.disconnect())
        if (midi) {
            if (synths.length) synths.forEach((s) => s.chain(...[...nodes, Tone.Destination]))
        } else {
            if (pitchLFO) {
                audioNode.input = player
                effectNode.input = player
                audioNode.input.connect(staticSoundtouchNode)
                effectNode.input.connect(soundtouchNode)
                staticSoundtouchNode.connect(lfoNode, 0, 0)
                soundtouchNode.connect(lfoNode, 0, 1)
                let currentNode = lfoNode
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i] instanceof Tone.ToneAudioNode ? nodes[i].input : nodes[i]
                    currentNode.connect(node)
                    currentNode = nodes[i]
                }
                currentNode.connect(audioNode.output)
            } else {
                audioNode.input = player
                audioNode.input.chain(...[soundtouchNode, ...nodes, audioNode.output])
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
        if (midi) {
            player.disconnect()
        } else {
            if (synths.length) disposeSynths()
        }
    }

    const updateDuration = (value?: number) => {
        if (value) {
            setDuration(value)
        } else {
            if (!midi) {
                setDuration(player.buffer.duration / player.playbackRate)
                functions.getBPM(player.buffer.get()!).then(({bpm}) => {
                    setBpm(bpm)
                    lfoNode.parameters.get("bpm").value = bpm
                })
            }
        }
        secondsTotal.current!.innerText = functions.formatSeconds(duration)
    }

    const checkBuffer = () => {
        if (midi) return true
        return player.buffer.loaded
    }

    const getProgress = () => {
        if (!(progressBar.current)) return 0
        return Math.round(Number(progressBar.current.slider.childNodes[2].ariaValueNow) / 10)
    }

    const play = async (alwaysPlay?: boolean) => {
        if (!checkBuffer()) return
        await Tone.start()
        updateDuration()
        const progress = getProgress()
        if (reverse) {
            if (progress === 0) stop()
        } else {
            if (progress === 100) stop()
        }
        if (Tone.Transport.state === "started" && !alwaysPlay) {
            if (midi) disposeSynths()
            Tone.Transport.pause()
        } else {
            if (midi) await playMIDI()
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
        if (muted) {
            setMuted(false)
            Tone.Destination.mute = false
            let newVolume = volume
            if (volume === 0) newVolume = 1
            updateVolumePos(newVolume)
            Tone.Destination.volume.value = functions.logSlider(newVolume)
            if (newVolume <= 0.5) {
                if (volumeHover) {
                    volumeRef.current!.src = volumeLowHoverIcon
                } else {
                    volumeRef.current!.src = volumeLowIcon
                }
            } else {
                if (volumeHover) {
                    volumeRef.current!.src = volumeHoverIcon
                } else {
                    volumeRef.current!.src = volumeIcon
                }
            }
        } else {
            setMuted(true)
            Tone.Destination.mute = true
            updateVolumePos(0)
            if (volumeHover) {
                volumeRef.current!.src = muteHoverIcon
            } else {
                volumeRef.current!.src = muteIcon
            }
        }
    }

    const updateVolume = (value: number) => {
        if (value > 1) value = 1
        if (value < 0) value = 0
        let newVolume = value
        setVolume(newVolume)
        Tone.Destination.volume.value = functions.logSlider(newVolume)
        if (newVolume === 0) {
            Tone.Destination.mute = true
            setMuted(true)
            if (volumeHover) {
                volumeRef.current!.src = muteHoverIcon
            } else {
                volumeRef.current!.src = muteIcon
            }
        } else {
            Tone.Destination.mute = false
            setMuted(false)
            if (newVolume <= 0.5) {
                if (volumeHover) {
                    volumeRef.current!.src = volumeLowHoverIcon
                } else {
                    volumeRef.current!.src = volumeLowIcon
                }
            } else {
                if (volumeHover) {
                    volumeRef.current!.src = volumeHoverIcon
                } else {
                    volumeRef.current!.src = volumeIcon
                }
            }
        }
        updateVolumePos(newVolume)
    }

    const updateSpeed = async (value?: number | string, applyState?: any) => {
        let newSpeed = speed
        if (value) newSpeed = Number(value)
        setSpeed(newSpeed)
        if (newSpeed === 1) {
            speedImg.current!.src = speedIcon
        } else {
            speedImg.current!.src = speedActiveIcon
        }
        let newDuration = duration
        if (midi) {
            await playMIDI()
        } else {
            let currentPlayer = player
            if (applyState) {
                currentPlayer = applyState.player
            }
            currentPlayer.playbackRate = newSpeed
            const pitchCorrect = preservesPitch ? 1 / newSpeed : 1
            soundtouchNode.parameters.get("pitch").value = functions.semitonesToScale(pitch) * pitchCorrect
            applyEffects()
            let percent = Tone.Transport.seconds / duration
            newDuration = player.buffer.duration / newSpeed
            setDuration(newDuration)
            let val = percent * newDuration
            if (val < 0) val = 0
            if (val > newDuration - 1) val = newDuration - 1
            Tone.Transport.seconds = val
        }
        if (abloop) {
            applyAB(newDuration)
        } else {
            Tone.Transport.loopEnd = newDuration
        }   
        secondsTotal.current!.innerText = functions.formatSeconds(newDuration)
        if (reverse) {
            secondsProgress.current!.innerText = functions.formatSeconds(newDuration - Tone.Transport.seconds)
        } else {
            secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
        }
    }

    const updatePreservesPitch = (value?: boolean) => {
        let currPreservesPitch = value !== undefined ? value : !preservesPitch
        setPreservesPitch(currPreservesPitch)
        speedCheckbox.current!.src = !currPreservesPitch ? checkboxChecked : checkbox
        updateSpeed()
    }

    const updatePitch = async (value?: number | string, applyState?: any) => {
        let newPitch = pitch
        if (value !== undefined) newPitch = Number(value) 
        setPitch(newPitch)
        if (newPitch === 0) {
            pitchImg.current!.src = pitchIcon
        } else {
            pitchImg.current!.src = pitchActiveIcon
        }
        if (midi) {
            if (!applyState) await playMIDI()
        } else {
            const pitchCorrect = preservesPitch ? 1 / speed : 1
            soundtouchNode.parameters.get("pitch").value = functions.semitonesToScale(newPitch) * pitchCorrect
        }
    }

    const pitchLFOStyle = () => {
        if (!pitchSlider.current) return
        pitchSlider.current.style.width = "100%"
        if (pitchLFO) {
            pitchSlider.current.style.display = "flex"
        } else {
            pitchSlider.current.style.display = "none"
        }
    }

    const updatePitchLFO = (value?: boolean) => {
        const newPitchLFO = value !== undefined ? value : !pitchLFO
        setPitchLFO(newPitchLFO)
        pitchCheckbox.current!.src = newPitchLFO ? checkboxChecked : checkbox
        pitchLFOStyle()
        applyEffects()
    }

    const updatePitchLFORate = async (value?: number | string) => {
        let newPitchLFORate = pitchLFORate
        if (value !== undefined) newPitchLFORate = Number(value)
        lfoNode.parameters.get("lfoRate").value = newPitchLFORate
        lfoNode.port.postMessage({lfoShape: wave})
    }

    const updateReverse = async (value?: boolean, applyState?: any) => {
        let newReverse = reverse
        let percent = Tone.Transport.seconds / duration
        let val = (1-percent) * duration
        if (val < 0) val = 0
        if (val > duration - 1) val = duration - 1
        if (midi) {
            if (value === false || newReverse) {
                Tone.Transport.seconds = val
                newReverse = false
                reverseImg.current!.src = reverseIcon
            } else {
                Tone.Transport.seconds = val
                newReverse = true
                reverseImg.current!.src = reverseActiveIcon
            }
            await playMIDI()
        } else {
            let currentPlayer = player
            let skip = false
            if (applyState) {
                currentPlayer = applyState.player
                skip = true
            }
            if (value === false || (newReverse && !skip)) {
                if (!applyState) Tone.Transport.seconds = val
                newReverse = false
                currentPlayer.reverse = false
                reverseImg.current!.src = reverseIcon
            } else {
                if (!applyState) Tone.Transport.seconds = val
                newReverse = true
                currentPlayer.reverse = true
                reverseImg.current!.src = reverseActiveIcon
            }
        }
        setReverse(newReverse)
        applyAB(duration)
        if (!applyState) updateMetadata()
    }

    const reverseStyle = () => {
        if (reverse) {
            (document.querySelector(".progress-slider > .rc-slider-track") as any).style.backgroundColor = "black";
            (document.querySelector(".progress-slider > .rc-slider-rail") as any).style.backgroundColor = "#991fbe"
        } else {
            (document.querySelector(".progress-slider > .rc-slider-track") as any).style.backgroundColor = "#991fbe";
            (document.querySelector(".progress-slider > .rc-slider-rail") as any).style.backgroundColor = "black"
        }
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

    const updateSpeedPos = (value: number) => {
        if (!speedBar.current) return
        value = ((value - 0.25) / (4 - 0.25)) * 100
        const width = 92
        const valuePx = (value / 100) * width
        speedBar.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        speedBar.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: 0px`
        speedBar.current.slider.childNodes[2].ariaValueNow = `${value * 10}`
        speedBar.current.slider.childNodes[2].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
    }

    const updatePitchPos = (value: number) => {
        if (!pitchBar.current) return
        value = Math.abs((value - -24) / (24 - -24)) * 100
        const width = 94
        const valuePx = (value / 100) * width
        pitchBar.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        pitchBar.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: 0px`
        pitchBar.current.slider.childNodes[2].ariaValueNow = `${value * 10}`
        pitchBar.current.slider.childNodes[2].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
    }

    const updatePitchLFOPos = (value: number) => {
        if (!pitchLFOBar.current) return
        value = ((value - 0) / (5 - 0)) * 100
        const width = 88
        const valuePx = (value / 100) * width
        pitchLFOBar.current.slider.childNodes[0].style = `position: absolute; left: 0px; right: ${width - valuePx}px`
        pitchLFOBar.current.slider.childNodes[1].style = `position: absolute; left: ${valuePx}px; right: 0px`
        pitchLFOBar.current.slider.childNodes[2].ariaValueNow = `${value * 10}`
        pitchLFOBar.current.slider.childNodes[2].style = `position: absolute; touch-action: none; z-index: 1; left: ${valuePx}px`
    }

    const updateBarPos = () => {
        updateSpeedPos(speed)
        updatePitchPos(pitch)
        if (pitchLFO) updatePitchLFOPos(pitchLFORate)
    }

    const reset = async () => {
        setSpeed(1)
        player.playbackRate = 1
        updateSpeedPos(1)
        setPitch(0)
        soundtouchNode.parameters.get("pitch").value = functions.semitonesToScale(0)
        updatePitchPos(0)
        setPitchLFORate(1)
        lfoNode.parameters.get("lfoRate").value = 1
        updatePitchLFOPos(1)
        setWave("square")
        lfoNode.port.postMessage({lfoShape: "square"})
        setPreservesPitch(false)
        speedCheckbox.current!.src = !preservesPitch ? checkboxChecked : checkbox
        setPitchLFO(false)
        pitchCheckbox.current!.src = pitchLFO ? checkboxChecked : checkbox
        setReverse(false)
        player.reverse = false
        setABLoop(false)
        updateABSliderPos([0, 1000])
        abSlider.current.slider.style.display = "none";
        speedImg.current!.src = speedIcon
        reverseImg.current!.src = reverseIcon
        pitchImg.current!.src = pitchIcon
        abLoopImg.current!.src = abLoopIcon
        pitchLFOStyle()
        updateDuration()
        updateMetadata()
        stop()
        play()
        ipcRenderer.invoke("reset-effects")
        setTimeout(() => {
            applyEffects()
        }, 100)
    }

    const updateLoop = async (value?: boolean) => {
        let newLoop = loop
        let condition = value !== undefined ? value === false : newLoop === true
        if (condition) {
            loopImg.current!.src = loopIcon
            newLoop = false
            Tone.Transport.loop = false
            if (abloop) toggleAB()
        } else {
            loopImg.current!.src = loopActiveIcon
            newLoop = true
            Tone.Transport.loop = true
            Tone.Transport.loopStart = abloop ? (loopStart / 1000) * duration : 0
            Tone.Transport.loopEnd = abloop ? (loopEnd / 1000) * duration : duration
        }
        setLoop(newLoop)
        updateMetadata()
    }

    const seek = (value: number) => {
        setDragging(false)
        let percent = value / 100     
        if (reverse) {
            updateSliderPos((percent) * 100)
            secondsProgress.current!.innerText = functions.formatSeconds(duration - Tone.Transport.seconds)
            let value = (1-percent) * duration
            if (value < 0) value = 0
            if (value > duration - 1) value = duration - 1
            Tone.Transport.seconds = value
        } else {
            updateSliderPos(percent * 100)
            secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
            let value = percent * duration
            if (value < 0) value = 0
            if (value > duration - 1) value = duration - 1
            Tone.Transport.seconds = value
        }
        if (midi) playMIDI()
        if (Tone.Transport.state === "paused" || Tone.Transport.state === "stopped") play(true)
    }

    const rewind = (value: number) => {
        const current = reverse ? duration - Tone.Transport.seconds : Tone.Transport.seconds
        const seconds = current - value
        const percent = seconds / duration * 100
        seek(percent)
    }

    const fastforward = (value: number) => {
        const current = reverse ? duration - Tone.Transport.seconds : Tone.Transport.seconds
        const seconds = current + value
        const percent = seconds / duration * 100
        seek(percent)
    }

    const updateProgressText = (value: number) => {
        value = value / 10
        let percent = value / 100
        if (reverse) {
            secondsProgress.current!.innerText = functions.formatSeconds(duration - ((1-percent) * duration))
        } else {
            secondsProgress.current!.innerText = functions.formatSeconds(percent * duration)
        }
    }

    const updateProgressTextAB = (value: number[]) => {
        if (loopStart === value[0]) {
            updateProgressText(value[1])
        } else {
            updateProgressText(value[0])
        }
    }

    const updateMetadata = () => {
        songNameRef.current!.innerText = songName
        songCoverRef.current!.src = songCover
    }

    
    const updateSynth = (event: any, newState: any) => {
        let newAttack = newState?.attack ? newState.attack : attack
        let newDecay = newState?.decay ? newState.decay : decay
        let newSustain = newState?.sustain ? newState.sustain : sustain
        let newRelease = newState?.release ? newState.release : release
        let newPoly = newState?.poly ? newState.poly : poly
        let newPortamento = newState?.portamento ? newState.portamento : portamento
        let newWave = newState?.wave ? newState.wave : wave
        setAttack(newAttack)
        setDecay(newDecay)
        setSustain(newSustain)
        setRelease(newRelease)
        setPoly(newPoly)
        setPortamento(newPortamento)
        if (midi) playMIDI()
        lfoNode.port.postMessage({lfoShape: newWave})
    }

    const playMIDI = async (applyState?: any) => {
        let state = {speed, pitch, reverse, preservesPitch, midiFile, midiDuration}
        const localState = applyState ? applyState.state : state
        const synthArray = applyState ? applyState.synths : synths
        if (!localState.midiFile) return
        const midi = localState.midiFile as Midi
        disposeSynths(synthArray)
        midi.tracks.forEach((track: any) => {
            let synth = null as any
            if (poly) {
                synth = new Tone.PolySynth(Tone.Synth, {oscillator: {type: wave as any}, envelope: {attack, decay, sustain, release}, portamento, volume: -6}).sync()
            } else {
                synth = new Tone.Synth({oscillator: {type: wave as any}, envelope: {attack, decay, sustain, release}, portamento, volume: -6}).sync()
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
        updateDuration(totalDuration)
        updateMetadata()
        applyEffects()
    }

    const uploadMIDI = async (file: string) => {
        setMidi(true)
        const midi = await Midi.fromUrl(file)
        let totalDuration = 0
        midi.tracks.forEach(track => {
            track.notes.forEach(note => {
                if (note.time + note.duration > totalDuration) totalDuration = note.time + note.duration
            })
        })
        setMidiDuration(totalDuration)
        setBpm(midi.header.tempos[0].bpm)
        setSongCover(midiPlaceholder)
        setSongName(path.basename(file).replace(".mid", ""))
        setSong(file)
        setSongUrl("")
        setMidiFile(midi)
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
        setMidi(false)
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
            setSongCover(`data:${picture.format};base64,${btoa(b64)}`)
        } else {
            setSongCover(placeholder)
        }
        setSongName(path.basename(file).replace(".mp3", "").replace(".wav", "").replace(".flac", "").replace(".ogg", ""))
        setSong(file)
        setSongUrl("")
        player.load(file)
        await Tone.loaded()
        updateDuration()
        updateMetadata()
        updateRecentFiles()
        switchState()
        stop()
        play(true)
        refreshState()
    }

    const applyAB = (duration: number) => {
        if (!abloop) return
        let percent = duration / 100.0
        if (reverse) {
            Tone.Transport.loopStart = (100 - (loopEnd / 10)) * percent
            Tone.Transport.loopEnd = (100 - (loopStart / 10)) * percent
        } else {
            Tone.Transport.loopStart = (loopStart / 10) * percent
            Tone.Transport.loopEnd = (loopEnd / 10) * percent
        }
    }

    const updateABLoop = (value: number[]) => {
        setLoopStart(value[0])
        setLoopEnd(value[1])
        setDragging(false)
        Tone.Transport.loop = true
        if (Tone.Transport.state === "paused") Tone.Transport.start()
        applyAB(duration)
        if (Tone.Transport.loopStart === Tone.Transport.loopEnd) Tone.Transport.loopStart = (Tone.Transport.loopEnd as number) - 1
        if ((Tone.Transport.seconds >= Number(Tone.Transport.loopStart)) && (Tone.Transport.seconds <= Number(Tone.Transport.loopEnd))) return
        let val = Number(Tone.Transport.loopStart)
        if (val < 0) val = 0
        if (val > duration - 1) val = duration - 1
        Tone.Transport.seconds = val
        if (midi) playMIDI()
    }

    const toggleAB = (value?: boolean) => {
        let condition = value !== undefined ? value === true : abSlider.current.slider.style.display === "none"
        if (condition) {
            abSlider.current.slider.style.display = "flex"
            setABLoop(true)
            setLoop(true)
            if (!loopEnd) setLoopEnd(1000)
            loopImg.current!.src = loopActiveIcon
            abLoopImg.current!.src = abLoopActiveIcon
            Tone.Transport.loop = true
            Tone.Transport.loopStart = (loopStart / 1000) * duration
            Tone.Transport.loopEnd = ((loopEnd || 1000) / 1000) * duration
            updateABSliderPos([loopStart, (loopEnd || 1000)])
        } else {
            abSlider.current.slider.style.display = "none"
            setABLoop(false)
            abLoopImg.current!.src = abLoopIcon
            Tone.Transport.loopStart = 0
            Tone.Transport.loopEnd = duration
        }
        updateMetadata()
    }

    const applyState = async (localState: any, player: Tone.Player) => {
        const apply = {state: localState, player}
        player.load(localState.song)
        await Tone.loaded()
        let editCode = ""
        if (localState.speed !== 1) {
            updateSpeed(undefined, apply)
            editCode += "-speed"
        }
        if (localState.reverse !== false) {
            updateReverse(undefined, apply)
            editCode += "-reverse"
        } 
        if (localState.pitch !== 0) {
            updatePitch(undefined, apply)
            editCode += "-pitch"
        }
        if (localState.abloop !== false) {
            editCode += "-loop"
        }
        let effectNodes = [] as any
        if (localState.sampleRate !== 44100) {
            const bit = await bitcrush(null, localState, true) as any
            effectNodes.push(bit)
            editCode += "-bitcrush"
        }
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
        if (localState.phaserMix !== 0) {
            const phas = await phaser(null, localState, true) as Tone.Phaser
            effectNodes.push(phas)
            editCode += "-phaser"
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
        setEditCode(editCode)
        const current = player
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
        let effectNodes = [] as any
        if (localState.sampleRate !== 44100) {
            const bit = await bitcrush(null, localState, true) as any
            effectNodes.push(bit)
            editCode += "-bitcrush"
        }
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
        if (localState.phaserMix !== 0) {
            const phas = await phaser(null, localState, true) as Tone.Phaser
            effectNodes.push(phas)
            editCode += "-phaser"
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
        setEditCode(editCode)
        return {synthArray: synths, effectNodes}
    }

     /** Renders the same as online */
     const render = async (start: number, duration: number) => {
        return Tone.Offline(async (offlineContext) => {
            let player = new Tone.Player().sync()
            let synths = [] as Tone.PolySynth[]
            let state = {speed, pitch, reverse, preservesPitch, abloop, sampleRate, reverbMix, reverbDecay, delayMix, 
            delayTime, delayFeedback, phaserMix, phaserFrequency, highpassCutoff, lowpassCutoff, highshelfGain, highshelfCutoff, 
            lowshelfGain, lowshelfCutoff, midiFile, pitchLFO, pitchLFORate, bpm, wave, midiDuration}
            if (midi) {
                const {synthArray, effectNodes} = await applyMIDIState(state, synths)
                synthArray.forEach((s) => s.chain(...[...effectNodes, offlineContext.destination]))
            } else {
                const {current, effectNodes} = await applyState(state, player)
                // @ts-expect-error
                const audioNode = new Tone.ToneAudioNode()
                gainNode = new Tone.Gain(1)
                audioNode.input = current
                audioNode.output = gainNode.input
                await offlineContext.addAudioWorkletModule(soundtouchURL, "soundtouch")
                const soundtouchNode = offlineContext.createAudioWorkletNode("soundtouch-processor") as any
                const staticSoundtouchNode = offlineContext.createAudioWorkletNode("soundtouch-processor") as any
                const pitchCorrect = state.preservesPitch ? 1 / state.speed : 1
                soundtouchNode.parameters.get("pitch").value = functions.semitonesToScale(state.pitch) * pitchCorrect
                
                if (state.pitchLFO) {
                    // @ts-expect-error
                    const effectNode = new Tone.ToneAudioNode()
                    effectNode.input = current
                    effectNode.output = gainNode.input
                    await offlineContext.addAudioWorkletModule(lfoURL, "lfo")
                    const lfoNode = offlineContext.createAudioWorkletNode("lfo-processor", {numberOfInputs: 2, outputChannelCount: [2]}) as any
                    lfoNode.parameters.get("bpm").value = state.bpm
                    lfoNode.parameters.get("lfoRate").value = state.pitchLFORate
                    lfoNode.port.postMessage({lfoShape: state.wave})
                    audioNode.input.connect(staticSoundtouchNode)
                    effectNode.input.connect(soundtouchNode)
                    staticSoundtouchNode.connect(lfoNode, 0, 0)
                    soundtouchNode.connect(lfoNode, 0, 1)
                    let currentNode = lfoNode
                    for (let i = 0; i < effectNodes.length; i++) {
                        const node = effectNodes[i] instanceof Tone.ToneAudioNode ? effectNodes[i].input : effectNodes[i]
                        currentNode.connect(node)
                        currentNode = effectNodes[i]
                    }
                    currentNode.connect(audioNode.output)
                    audioNode.connect(offlineContext.destination)
                    audioNode.input.start()
                } else {
                    audioNode.input.chain(...[soundtouchNode, ...effectNodes, audioNode.output, offlineContext.destination]).start()
                }
            }
            offlineContext.transport.start(start)
        }, duration, 2, 44100)
    }

    const download = async () => {
        if (!checkBuffer()) return
        const defaultPath = `${functions.decodeEntities(songName)}${editCode}`
        const savePath = await ipcRenderer.invoke("save-dialog", defaultPath)
        if (!savePath) return
        if (path.extname(savePath) === ".mid") {
            if (!midi) return
            const newMidi = new Midi()
            newMidi.header = midiFile.header
            midiFile.tracks.forEach((track: any) => {
                const newTrack = newMidi.addTrack()
                if (reverse) {
                    const reverseNotes = track.notes.slice().reverse()
                    const initialTime = reverseNotes[0].time
                    reverseNotes.forEach((reverseNote: any) => {
                        let transposed = reverseNote.name
                        if (preservesPitch) {
                            transposed = functions.transposeNote(reverseNote.name, pitch)
                        } else {
                            transposed = functions.transposeNote(reverseNote.name, pitch + functions.noteFactor(speed))
                        }
                        reverseNote.name = transposed
                        reverseNote.duration = reverseNote.duration / speed
                        reverseNote.time = Math.abs(reverseNote.time - initialTime) / speed
                        newTrack.addNote(reverseNote)
                    })
                } else {
                    const notes = track.notes.slice()
                    notes.forEach((note: any) => {
                        let transposed = note.name
                        if (preservesPitch) {
                            transposed = functions.transposeNote(note.name, pitch)
                        } else {
                            transposed = functions.transposeNote(note.name, pitch + functions.noteFactor(speed))
                        }
                        note.name = transposed
                        note.duration = note.duration / speed
                        note.time = note.time / speed
                        newTrack.addNote(note)
                    })
                }
            })
            fs.writeFileSync(savePath, Buffer.from(newMidi.toArray()))
        } else {
            let newDuration = duration
            let start = 0
            if (abloop) {
                start = loopStart
                newDuration = ((loopEnd / 1000) * duration) - ((loopStart / 1000) * duration)
            }
            const audioBuffer = await render(start, newDuration)
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
            setMidi(false)
            const songName = await ipcRenderer.invoke("get-song-name", value)
            let artwork = await ipcRenderer.invoke("get-art", value)
            if (artwork.includes("ytimg")) artwork = await functions.cropToCenterSquare(artwork)
            window.URL.revokeObjectURL(song)
            const blob = new Blob([new DataView(songBuffer)], {type: "audio/mpeg"})
            const file = window.URL.createObjectURL(blob)
            setSongName(songName)
            setSong(file)
            setSongCover(artwork)
            setSongUrl(value)
            player.load(file)
            await Tone.loaded()
            updateDuration()
            updateMetadata()
            updateRecentFiles()
            switchState()
            stop()
            play(true)
            refreshState()
        }
    }

    const updateRecentFiles = () => {
        ipcRenderer.invoke("update-recent", {
            songName, song, songCover, songUrl, midi, bpm,
            duration: midi ? midiDuration : player.buffer.duration
        })
    }

    const previous = () => {
        ipcRenderer.invoke("get-previous", {
            songName, song, songCover, songUrl,
            duration: midi ? duration : player.buffer.duration
        })
    }

    const next = () => {
        ipcRenderer.invoke("get-next", {
            songName, song, songCover, songUrl,
            duration: midi ? duration : player.buffer.duration
        })
    }

    const toggleHover = (query: string, hover?: boolean) => {
        if (query === "reverse") {
            if (hover) {
                reverseImg.current!.src = reverseHoverIcon
            } else {
                if (reverse) {
                    reverseImg.current!.src = reverseActiveIcon
                } else {
                    reverseImg.current!.src = reverseIcon
                }
            }
        } else if (query === "speed") {
            if (hover) {
                speedImg.current!.src = speedHoverIcon
            } else {
                if (speed === 1) {
                    speedImg.current!.src = speedIcon
                } else {
                    speedImg.current!.src = speedActiveIcon
                }
            }
        } else if (query === "pitch") {
            if (hover) {
                pitchImg.current!.src = pitchHoverIcon
            } else {
                if (pitch === 0) {
                    pitchImg.current!.src = pitchIcon
                } else {
                    pitchImg.current!.src = pitchActiveIcon
                }
            }
        } else if (query === "loop") {
            if (hover) {
                loopImg.current!.src = loopHoverIcon
            } else {
                if (loop) {
                    loopImg.current!.src = loopActiveIcon
                } else {
                    loopImg.current!.src = loopIcon
                }
            }
        } else if (query === "abloop") {
            if (hover) {
                abLoopImg.current!.src = abLoopHoverIcon
            } else {
                if (abloop) {
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
                setPlayHover(true)
                if (Tone.Transport.state === "started") {
                    playButton.current!.src = pauseHoverIcon
                } else {
                    playButton.current!.src = playHoverIcon
                }
            } else {
                setPlayHover(false)
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
                setVolumeHover(true)
                if (volume === 0 || muted) {
                    volumeRef.current!.src = muteHoverIcon
                } else {
                    if (volume <= 0.5) {
                        volumeRef.current!.src = volumeLowHoverIcon
                    } else {
                        volumeRef.current!.src = volumeHoverIcon
                    }
                }
            } else {
                setVolumeHover(false)
                if (volume === 0 || muted) {
                    volumeRef.current!.src = muteIcon
                } else {
                    if (volume <= 0.5) {
                        volumeRef.current!.src = volumeLowIcon
                    } else {
                        volumeRef.current!.src = volumeIcon
                    }
                }
            }
        }
    }

    const bitcrush = async (event: any, effect?: any, noApply?: boolean) => {
        let newSampleRate = effect?.sampleRate ? effect.sampleRate : sampleRate
        if (newSampleRate === 100) {
            removeEffect("bitcrush")
        } else {
            if (!bitcrusherNode) {
                const context = Tone.getContext()
                const bitcrusherSource = await ipcRenderer.invoke("get-bitcrusher-source")
                const bitcrusherBlob = new Blob([bitcrusherSource], {type: "text/javascript"})
                const bitcrusherURL = window.URL.createObjectURL(bitcrusherBlob)
                await context.addAudioWorkletModule(bitcrusherURL, "bitcrusher")
                bitcrusherNode = context.createAudioWorkletNode("bitcrush-processor")
            }
            bitcrusherNode.parameters.get("sampleRate").value = functions.logSlider2(newSampleRate, 100, 44100)
            if (noApply) return bitcrusherNode
            pushEffect("bitcrush", bitcrusherNode)
            applyEffects()
        }
    }

    const reverb = async (event: any, effect?: any, noApply?: boolean) => {
        let newReverbMix = effect?.reverbMix ? effect.reverbMix : reverbMix
        let newReverbDecay = effect?.reverbDecay ? effect.reverbDecay : reverbDecay
        if (newReverbMix === 0) {
            removeEffect("reverb")
        } else {
            const reverb = new Tone.Reverb({wet: newReverbMix, decay: newReverbDecay})
            if (noApply) return reverb
            pushEffect("reverb", reverb)
            applyEffects()
        }
    }

    const delay = async (event: any, effect: any, noApply?: boolean) => {
        let newDelayMix = effect?.delayMix ? effect.delayMix : delayMix
        let newDelayTime = effect?.delayTime ? effect.delayTime : delayTime
        let newDelayFeedback = effect?.delayFeedback ? effect.delayFeedback : delayFeedback
        if (newDelayMix === 0) {
            removeEffect("delay")
        } else {
            const delay = new Tone.PingPongDelay({wet: newDelayMix, delayTime: newDelayTime, feedback: newDelayFeedback})
            if (noApply) return delay
            pushEffect("delay", delay)
            applyEffects()
        }
    }

    const phaser = async (event: any, effect?: any, noApply?: boolean) => {
        let newPhaserMix = effect?.phaserMix ? effect.phaserMix : phaserMix
        let newPhaserFrequency = effect?.phaserFrequency ? effect.phaserFrequency : phaserFrequency
        if (newPhaserMix === 0) {
            removeEffect("phaser")
        } else {
            const phaser = new Tone.Phaser({wet: newPhaserMix, frequency: newPhaserFrequency})
            if (noApply) return phaser
            pushEffect("phaser", phaser)
            applyEffects()
        }
    }

    const lowpass = async (event: any, effect: any, noApply?: boolean) => {
        let newLowpassCutoff = effect?.lowpassCutoff ? effect.lowpassCutoff : lowpassCutoff
        if (newLowpassCutoff === 100) {
            removeEffect("lowpass")
        } else {
            const low = new Tone.BiquadFilter({type: "lowpass", frequency: functions.logSlider2(newLowpassCutoff, 1, 20000)})
            if (noApply) return low
            pushEffect("lowpass", low)
            applyEffects()
        }
    }

    const highpass = async (event: any, effect: any, noApply?: boolean) => {
        let newHighpassCutoff = effect?.highpassCutoff ? effect.highpassCutoff : highpassCutoff
        if (newHighpassCutoff === 0) {
            removeEffect("highpass")
        } else {
            const high = new Tone.BiquadFilter({type: "highpass", frequency: functions.logSlider2(newHighpassCutoff, 1, 20000)})
            if (noApply) return high
            pushEffect("highpass", high)
            applyEffects()
        }
    }

    const highshelf = async (event: any, effect: any, noApply?: boolean) => {
        let newHighshelfGain = effect?.highshelfGain ? effect.highshelfGain : highshelfGain
        let newHighshelfCutoff = effect?.highshelfCutoff ? effect.highshelfCutoff : highshelfCutoff
        if (newHighshelfGain === 0) {
            removeEffect("highshelf")
        } else {
            const high = new Tone.BiquadFilter({type: "highshelf", frequency: functions.logSlider2(newHighshelfCutoff, 1, 20000), gain: newHighshelfGain})
            if (noApply) return high
            pushEffect("highshelf", high)
            applyEffects()
        }
    }

    const lowshelf = async (event: any, effect: any, noApply?: boolean) => {
        let newLowshelfGain = effect?.lowshelfGain ? effect.lowshelfGain : lowshelfGain
        let newLowshelfCutoff = effect?.lowshelfCutoff ? effect.lowshelfCutoff : lowshelfCutoff
        if (newLowshelfGain === 0) {
            removeEffect("lowshelf")
        } else {
            const low = new Tone.BiquadFilter({type: "lowshelf", frequency: functions.logSlider2(newLowshelfCutoff, 1, 20000), gain: newLowshelfGain})
            if (noApply) return low
            pushEffect("lowshelf", low)
            applyEffects()
        }
    }

    const resizeOn = () => {
        document.documentElement.style.cursor = "ns-resize"
        setResizeFlag(true)
    }

    const resizeOff = () => {
        document.documentElement.style.cursor = "default"
    }

    const resetResize = () => {
        const element = document.querySelector(".player") as HTMLElement
        element.style.height = `150px`
    }

    const showSpeedPopup = () => {
        if (speedPopup.current!.style.display === "flex") {
            speedPopup.current!.style.display = "none"
        } else {
            speedPopup.current!.style.display = "flex"
        }
        setTimeout(() => {
            updateSpeedPos(speed)
        }, 100)
    }

    const showPitchPopup = () => {
        if (pitchPopup.current!.style.display === "flex") {
            pitchPopup.current!.style.display = "none"
        } else {
            pitchPopup.current!.style.display = "flex"
        }
        setTimeout(() => {
            updatePitchPos(pitch)
            updatePitchLFOPos(pitchLFORate)
        }, 100)
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
                <img ref={songCoverRef} className="player-img" src={songCover}/>
                <div className="player-container">
                    <div className="player-row">
                        <div className="player-text-container">
                            <h2 ref={songNameRef} className="player-text">{songName}</h2>
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
                            <Slider className="volume-slider" trackClassName="volume-slider-track" thumbClassName="volume-slider-handle" ref={volumeBar} onChange={(value) => {updateVolumePos(value); updateVolume(value)}} min={0} max={1} step={0.05} defaultValue={1}/>
                        </div>
                    </div>
                    <div className="player-row">
                    <img className="player-button" ref={reverseImg} src={reverseIcon} onClick={() => updateReverse()} width="30" height="30" onMouseEnter={() => toggleHover("reverse", true)} onMouseLeave={() => toggleHover("reverse")}/>
                        <div className="speed-popup-container" ref={speedPopup} style={({display: "none"})}>
                            <div className="speed-popup">
                                <Slider className="speed-slider" trackClassName="speed-slider-track" thumbClassName="speed-slider-handle" ref={speedBar} onChange={(value) => updateSpeed(value)} min={0.5} max={4} step={speedStep} defaultValue={1}/>
                                <div className="speed-checkbox-container">
                                    <p className="speed-text">Pitch?</p>
                                    <img className="speed-checkbox" ref={speedCheckbox} src={!preservesPitch ? checkboxChecked : checkbox} onClick={() => updatePreservesPitch()}/>
                                </div>       
                            </div>
                        </div>
                        <img className="player-button" src={speedIcon} ref={speedImg} onClick={() => showSpeedPopup()} width="30" height="30" onMouseEnter={() => toggleHover("speed", true)} onMouseLeave={() => toggleHover("speed")}/>
                        <div className="pitch-popup-container" ref={pitchPopup} style={({display: "none"})}>
                            <div className="pitch-popup">
                                <Slider className="pitch-slider" trackClassName="pitch-slider-track" thumbClassName="pitch-slider-handle" ref={pitchBar} onChange={(value) => updatePitch(value)} min={-24} max={24} step={pitchStep} defaultValue={0}/>
                                <div className="pitch-checkbox-container">
                                    <p className="speed-text">LFO?</p>
                                    <img className="pitch-checkbox" ref={pitchCheckbox} src={pitchLFO ? checkboxChecked : checkbox} onClick={() => updatePitchLFO()}/>
                                </div>
                                <div ref={pitchSlider}><Slider className="pitch-slider" trackClassName="pitch-slider-track" thumbClassName="pitch-slider-handle" ref={pitchLFOBar} onChange={(value) => updatePitchLFORate(value)} min={0} max={5} step={1} defaultValue={1}/></div>
                            </div>
                        </div>
                        <img className="player-button" src={pitchIcon} ref={pitchImg} onClick={() => showPitchPopup()} width="30" height="30" onMouseEnter={() => toggleHover("pitch", true)} onMouseLeave={() => toggleHover("pitch")}/>
                        <div className="progress-container" onMouseUp={() => setDragging(false)}>
                            <Slider className="progress-slider" trackClassName="progress-slider-track" thumbClassName="progress-slider-handle" ref={progressBar} min={0} max={1000} onBeforeChange={() => setDragging(true)} onChange={(value) => {updateSliderPos(value / 10); updateProgressText(value)}} onAfterChange={(value) => seek(value / 10)} defaultValue={0}/>
                            <Slider className="ab-slider" trackClassName="ab-slider-track" thumbClassName="ab-slider-thumb" ref={abSlider} min={0} max={1000} defaultValue={[0, 1000]} onBeforeChange={() => setDragging(true)} onChange={(value) => {updateABSliderPos(value); updateProgressTextAB(value)}} onAfterChange={(value) => updateABLoop(value)} pearling minDistance={1}/>
                        </div>
                        <img className="player-button" ref={loopImg} src={loopIcon} onClick={() => updateLoop()} width="30" height="30" onMouseEnter={() => toggleHover("loop", true)} onMouseLeave={() => toggleHover("loop")}/>
                        <img className="player-button" ref={abLoopImg} src={abLoopIcon} onClick={() => toggleAB()} width="30" height="30" onMouseEnter={() => toggleHover("abloop", true)} onMouseLeave={() => toggleHover("abloop")}/>
                        <img className="player-button" ref={resetImg} src={resetIcon} onClick={() => reset()} width="30" height="30" onMouseEnter={() => toggleHover("reset", true)} onMouseLeave={() => toggleHover("reset")}/>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default AudioPlayer