import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wifi, Shield, Activity, Ban, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'

const API_URL = 'http://localhost:5000'

export function NetworkPanel() {
    const [processes, setProcesses] = useState([])
    const [connected, setConnected] = useState(false)
    const [mode, setMode] = useState('soft') // soft, hard, pro

    useEffect(() => {
        fetchUsage()
        const interval = setInterval(fetchUsage, 1000)
        return () => clearInterval(interval)
    }, [])

    const fetchUsage = async () => {
        try {
            const res = await fetch(`${API_URL}/network/usage`)
            if (res.ok) {
                const data = await res.json()
                setProcesses(data)
                setConnected(true)
            } else {
                setConnected(false)
            }
        } catch (e) {
            setConnected(false)
        }
    }

    const toggleBlock = async (exe, isBlocked) => {
        const endpoint = isBlocked ? '/network/unblock' : '/network/block'
        try {
            await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exe })
            })
            fetchUsage() // Refresh immediately
        } catch (e) {
            console.error("Failed to toggle block", e)
        }
    }

    const clearRules = async () => {
        try {
            await fetch(`${API_URL}/network/clear`, { method: 'POST' })
            fetchUsage()
        } catch (e) {
            console.error("Failed to clear rules", e)
        }
    }

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i] + '/s'
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wifi className="text-secondary" />
                        Smart Network Optimizer
                    </h1>
                </header>

                {!connected && (
                    <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" />
                        <div>
                            <h3 className="font-bold text-red-500">Backend Disconnected</h3>
                            <p className="text-sm text-text-muted mt-1">
                                Run <code>python automation_server.py</code> as <strong>Administrator</strong> to use network features.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Mode Selection */}
                    <div className="glass rounded-2xl p-6 col-span-1">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-secondary" /> Protection Mode
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setMode('soft')}
                                className={`w-full p-3 rounded-xl text-left transition-all border ${mode === 'soft' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-white/5 border-transparent text-text-muted hover:bg-white/10'}`}
                            >
                                <div className="font-bold">Soft Mode</div>
                                <div className="text-xs opacity-70">Monitor only. Manual blocking.</div>
                            </button>
                            <button
                                onClick={() => setMode('hard')}
                                className={`w-full p-3 rounded-xl text-left transition-all border ${mode === 'hard' ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-white/5 border-transparent text-text-muted hover:bg-white/10'}`}
                            >
                                <div className="font-bold">Hard Mode</div>
                                <div className="text-xs opacity-70">Auto-block high usage apps.</div>
                            </button>
                            <button
                                onClick={() => setMode('pro')}
                                className={`w-full p-3 rounded-xl text-left transition-all border ${mode === 'pro' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-white/5 border-transparent text-text-muted hover:bg-white/10'}`}
                            >
                                <div className="font-bold">Pro Mode</div>
                                <div className="text-xs opacity-70">Block ALL except Whitelist.</div>
                            </button>
                        </div>

                        <button
                            onClick={clearRules}
                            className="mt-6 w-full py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm font-bold"
                        >
                            <Trash2 size={16} /> Reset All Rules
                        </button>
                    </div>

                    {/* Live Traffic */}
                    <div className="glass rounded-2xl p-6 col-span-2 flex flex-col">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-blue-400" /> Live Traffic (I/O Proxy)
                        </h3>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-text-muted text-sm border-b border-white/10">
                                        <th className="p-2">App</th>
                                        <th className="p-2">Usage/s</th>
                                        <th className="p-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processes.map((proc) => (
                                        <tr key={proc.pid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-3">
                                                <div className="font-bold text-white">{proc.name}</div>
                                                <div className="text-xs text-text-muted truncate max-w-[200px]">{proc.exe}</div>
                                            </td>
                                            <td className="p-3 font-mono text-secondary">
                                                {formatBytes(proc.speed)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => toggleBlock(proc.exe, proc.blocked)}
                                                    disabled={!proc.exe}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${proc.blocked
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : 'bg-white/10 text-text-muted hover:bg-white/20'
                                                        }`}
                                                >
                                                    {proc.blocked ? 'BLOCKED' : 'BLOCK'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {processes.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-text-muted">
                                                No active high-usage processes found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
