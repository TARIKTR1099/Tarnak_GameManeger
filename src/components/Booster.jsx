import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Cpu, HardDrive, Trash2, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

const API_URL = 'http://localhost:5000'

export function Booster() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 2000)
        return () => clearInterval(interval)
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/boost/stats`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
                setConnected(true)
            } else {
                setConnected(false)
            }
        } catch (e) {
            setConnected(false)
        }
    }

    const handleBoost = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/boost/clean-ram`, { method: 'POST' })
            const data = await res.json()
            setResult(data)
            setTimeout(() => setResult(null), 5000)
        } catch (e) {
            alert("Failed to boost")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="text-secondary" />
                        Game Booster
                    </h1>
                </header>

                {!connected && (
                    <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" />
                        <div>
                            <h3 className="font-bold text-red-500">Backend Disconnected</h3>
                            <p className="text-sm text-text-muted mt-1">
                                Run <code>python automation_server.py</code> to use the booster.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* RAM Stats */}
                    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
                        <HardDrive size={48} className="text-secondary mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">RAM Usage</h3>
                        <div className="text-4xl font-bold text-white mb-2">
                            {stats ? `${stats.ram_percent}%` : '--%'}
                        </div>
                        <p className="text-text-muted text-sm">
                            {stats ? `${(stats.ram_available / 1024 / 1024 / 1024).toFixed(1)} GB Free` : 'Loading...'}
                        </p>
                    </div>

                    {/* CPU Stats */}
                    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
                        <Cpu size={48} className="text-blue-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">CPU Usage</h3>
                        <div className="text-4xl font-bold text-white mb-2">
                            {stats ? `${stats.cpu_percent}%` : '--%'}
                        </div>
                        <p className="text-text-muted text-sm">System Load</p>
                    </div>
                </div>

                <div className="glass rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Optimize Performance</h2>
                    <p className="text-text-muted mb-8 max-w-lg mx-auto">
                        Close unnecessary background applications (Chrome, Discord, Spotify) to free up RAM and CPU resources for your game.
                    </p>

                    <button
                        onClick={handleBoost}
                        disabled={!connected || loading}
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto ${loading ? 'bg-white/10 text-text-muted' : 'bg-secondary hover:bg-secondary/80 text-white shadow-lg shadow-secondary/20'
                            }`}
                    >
                        {loading ? (
                            'Optimizing...'
                        ) : (
                            <>
                                <Zap fill="currentColor" /> BOOST NOW
                            </>
                        )}
                    </button>

                    {result && (
                        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 animate-fade-in">
                            <div className="flex items-center justify-center gap-2 font-bold mb-2">
                                <CheckCircle size={20} /> Optimization Complete
                            </div>
                            <p className="text-sm">
                                Freed {(result.freed_bytes / 1024 / 1024).toFixed(1)} MB of RAM.
                            </p>
                            {result.killed.length > 0 && (
                                <p className="text-xs mt-1 opacity-80">
                                    Closed: {result.killed.join(', ')}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Ultra Mode & DNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="text-purple-500" /> Ultra Game Mode
                        </h3>
                        <p className="text-text-muted text-sm mb-6">
                            Prioritizes your game above all else. Forces background apps to Idle priority.
                        </p>
                        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                            <p className="text-purple-400 font-bold mb-2">Status: Ready</p>
                            <p className="text-xs text-text-muted">Launch a game from Library to enable.</p>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Activity className="text-blue-500" /> DNS Optimizer
                        </h3>
                        <p className="text-text-muted text-sm mb-6">
                            Finds the fastest route to game servers by benchmarking DNS providers.
                        </p>
                        <DNSOptimizer />
                    </div>
                </div>
            </div>
        </div>
    )
}

function DNSOptimizer() {
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)

    const runBenchmark = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/dns/benchmark`)
            const data = await res.json()
            setResults(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const applyDNS = async (ip) => {
        try {
            await fetch(`${API_URL}/dns/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            })
            alert(`DNS set to ${ip}`)
        } catch (e) {
            alert("Failed to set DNS")
        }
    }

    return (
        <div>
            <button
                onClick={runBenchmark}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors mb-4"
            >
                {loading ? 'Benchmarking...' : 'Run Benchmark'}
            </button>

            <div className="space-y-2">
                {results.map((dns, i) => (
                    <div key={dns.ip} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div>
                            <div className="font-bold text-white">{dns.name}</div>
                            <div className="text-xs text-text-muted">{dns.ip}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-mono ${i === 0 ? 'text-green-400' : 'text-text-muted'}`}>
                                {dns.latency}ms
                            </span>
                            {i === 0 && (
                                <button
                                    onClick={() => applyDNS(dns.ip)}
                                    className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30"
                                >
                                    APPLY
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
