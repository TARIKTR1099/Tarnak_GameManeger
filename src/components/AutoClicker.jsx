import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MousePointer2, Play, Square, Circle, Save, Upload, RefreshCw, Crosshair, AlertTriangle, Layers } from 'lucide-react'
import { checkBackendStatus, startRecording, stopRecording, playMacro, stopPlayback, getCursorInfo, getWindows, startBackgroundClicker } from '../services/automation'

export function AutoClicker() {
    const [status, setStatus] = useState(null) // { recording, playing, macro_length }
    const [connected, setConnected] = useState(false)
    const [macro, setMacro] = useState([])
    const [loop, setLoop] = useState(false)
    const [interval, setIntervalVal] = useState(1000)
    const [triggerColor, setTriggerColor] = useState('')
    const [triggerPos, setTriggerPos] = useState({ x: 0, y: 0 })
    const [pickingColor, setPickingColor] = useState(false)

    // Background Mode
    const [bgMode, setBgMode] = useState(false)
    const [windows, setWindows] = useState([])
    const [selectedWindow, setSelectedWindow] = useState(null)

    const statusInterval = useRef(null)

    useEffect(() => {
        // Poll backend status
        const poll = async () => {
            const s = await checkBackendStatus()
            if (s) {
                setConnected(true)
                setStatus(s)
            } else {
                setConnected(false)
            }
        }

        poll()
        statusInterval.current = setInterval(poll, 1000)
        return () => clearInterval(statusInterval.current)
    }, [])

    useEffect(() => {
        if (bgMode && connected) {
            loadWindows()
        }
    }, [bgMode, connected])

    const loadWindows = async () => {
        const wins = await getWindows()
        setWindows(wins)
    }

    const handleStartRecord = async () => {
        await startRecording()
    }

    const handleStopRecord = async () => {
        const res = await stopRecording()
        if (res.macro) {
            setMacro(res.macro)
        }
    }

    const handlePlay = async () => {
        if (bgMode) {
            if (!selectedWindow) {
                alert("Please select a window first")
                return
            }
            await startBackgroundClicker(selectedWindow, interval)
        } else {
            await playMacro(macro, loop, interval)
        }
    }

    const handleStopPlay = async () => {
        await stopPlayback()
    }

    const handlePickColor = async () => {
        setPickingColor(true)
        setTimeout(async () => {
            const info = await getCursorInfo()
            if (info) {
                setTriggerPos({ x: info.x, y: info.y })
                setTriggerColor(info.color)
                setPickingColor(false)
                alert(`Captured Color: ${info.color} at (${info.x}, ${info.y})`)
            }
        }, 3000)
    }

    const saveMacro = () => {
        const blob = new Blob([JSON.stringify(macro)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'macro.json'
        a.click()
    }

    const loadMacro = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                setMacro(JSON.parse(e.target.result))
            } catch (err) {
                alert("Invalid macro file")
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <MousePointer2 className="text-secondary" />
                            Auto Clicker & Automation
                        </h1>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${connected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {connected ? 'Backend Connected' : 'Backend Disconnected'}
                    </div>
                </header>

                {!connected && (
                    <div className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0" />
                        <div>
                            <h3 className="font-bold text-yellow-500">Backend Required</h3>
                            <p className="text-sm text-text-muted mt-1">
                                To use automation features, you must run the Python backend script.
                                Run <code>python automation_server.py</code> in your terminal.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Mode Switcher */}
                        <div className="flex gap-4 p-1 bg-white/5 rounded-xl">
                            <button
                                onClick={() => setBgMode(false)}
                                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${!bgMode ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}`}
                            >
                                Global Macro
                            </button>
                            <button
                                onClick={() => setBgMode(true)}
                                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${bgMode ? 'bg-secondary text-white' : 'text-text-muted hover:text-white'}`}
                            >
                                Background Mode
                            </button>
                        </div>

                        {/* Recorder (Only for Global) */}
                        {!bgMode && (
                            <section className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                    <Circle size={20} className={status?.recording ? "text-red-500 animate-pulse" : "text-text-muted"} />
                                    Macro Recorder
                                </h2>

                                <div className="flex gap-4 mb-6">
                                    {!status?.recording ? (
                                        <button
                                            onClick={handleStartRecord}
                                            disabled={!connected}
                                            className="flex-1 py-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Circle size={20} fill="currentColor" />
                                            Start Recording
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleStopRecord}
                                            className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Square size={20} fill="currentColor" />
                                            Stop Recording
                                        </button>
                                    )}
                                </div>

                                <p className="text-sm text-text-muted text-center">
                                    Hotkeys: <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">Ctrl + Win + R</span> to Start/Stop
                                </p>
                            </section>
                        )}

                        {/* Playback / Background Config */}
                        <section className="glass rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                {bgMode ? <Layers size={20} className="text-secondary" /> : <Play size={20} className={status?.playing ? "text-green-500 animate-pulse" : "text-text-muted"} />}
                                {bgMode ? 'Background Clicker Config' : 'Playback'}
                            </h2>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                {bgMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-2">Target Window</label>
                                        <div className="flex gap-2">
                                            <select
                                                className="flex-1 px-4 py-2 rounded-lg bg-bg-dark border border-white/10 focus:border-secondary text-white"
                                                onChange={(e) => setSelectedWindow(Number(e.target.value))}
                                                value={selectedWindow || ''}
                                            >
                                                <option value="">Select a window...</option>
                                                {windows.map(w => (
                                                    <option key={w.hwnd} value={w.hwnd}>{w.title}</option>
                                                ))}
                                            </select>
                                            <button onClick={loadWindows} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                                                <RefreshCw size={20} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-text-muted mt-2">
                                            Note: Background clicking may not work on all games (e.g. Valorant, CS2).
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Interval (ms)</label>
                                    <input
                                        type="number"
                                        value={interval}
                                        onChange={(e) => setIntervalVal(Number(e.target.value))}
                                        className="w-full px-4 py-2 rounded-lg bg-bg-dark border border-white/10 focus:border-secondary text-white"
                                    />
                                </div>

                                {!bgMode && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="loop"
                                            checked={loop}
                                            onChange={(e) => setLoop(e.target.checked)}
                                            className="w-5 h-5 rounded bg-bg-dark border-white/10 text-secondary focus:ring-secondary"
                                        />
                                        <label htmlFor="loop" className="text-white">Loop Indefinitely</label>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                {!status?.playing ? (
                                    <button
                                        onClick={handlePlay}
                                        disabled={!connected || (!bgMode && macro.length === 0) || (bgMode && !selectedWindow)}
                                        className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Play size={20} fill="currentColor" />
                                        {bgMode ? 'Start Background Clicker' : 'Play Macro'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStopPlay}
                                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Square size={20} fill="currentColor" />
                                        Stop
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Triggers (Global Only) */}
                        {!bgMode && (
                            <section className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                    <Crosshair size={20} />
                                    Color Trigger
                                </h2>

                                <div className="flex items-center gap-4 mb-4">
                                    <div
                                        className="w-12 h-12 rounded-lg border border-white/20"
                                        style={{ backgroundColor: triggerColor || 'transparent' }}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-text-muted">Target Color: {triggerColor || 'None'}</p>
                                        <p className="text-sm text-text-muted">Position: ({triggerPos.x}, {triggerPos.y})</p>
                                    </div>
                                    <button
                                        onClick={handlePickColor}
                                        disabled={!connected || pickingColor}
                                        className="px-4 py-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors"
                                    >
                                        {pickingColor ? 'Wait 3s...' : 'Pick Color'}
                                    </button>
                                </div>
                                <p className="text-xs text-text-muted">
                                    Click "Pick Color", then move your mouse to the target area. The color will be captured after 3 seconds.
                                </p>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="glass rounded-2xl p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white">Current Macro</h3>
                                <span className="text-xs text-text-muted">{macro.length} steps</span>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-bg-dark/50 rounded-xl p-2 mb-4 max-h-[400px]">
                                {bgMode ? (
                                    <div className="h-full flex items-center justify-center text-text-muted text-sm text-center p-4">
                                        Background mode sends clicks directly to the selected window. No macro recording needed.
                                    </div>
                                ) : macro.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-text-muted text-sm">
                                        No macro recorded
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {macro.map((step, i) => (
                                            <div key={i} className="text-xs text-text-muted p-2 rounded hover:bg-white/5 flex justify-between">
                                                <span className="font-mono text-secondary">{step.type}</span>
                                                <span>{step.time.toFixed(2)}s</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!bgMode && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={saveMacro}
                                        disabled={macro.length === 0}
                                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={16} /> Save
                                    </button>
                                    <label className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                        <Upload size={16} /> Load
                                        <input type="file" accept=".json" onChange={loadMacro} className="hidden" />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
