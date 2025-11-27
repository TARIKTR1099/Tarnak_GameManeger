import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Keyboard, Power, CheckCircle, AlertTriangle } from 'lucide-react'

const API_URL = 'http://localhost:5000'

export function KeyMapper() {
    const [active, setActive] = useState(false)
    const [profile, setProfile] = useState('classic')
    const [error, setError] = useState(null)

    const toggleRemap = async () => {
        setError(null)
        try {
            if (active) {
                await fetch(`${API_URL}/remap/stop`, { method: 'POST' })
                setActive(false)
            } else {
                const res = await fetch(`${API_URL}/remap/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profile })
                })
                if (res.ok) {
                    setActive(true)
                } else {
                    throw new Error("Failed to start remapper")
                }
            }
        } catch (e) {
            setError("Backend not connected. Run 'python automation_server.py'")
        }
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Keyboard className="text-secondary" />
                        Left-Handed Key Remapper
                    </h1>
                </header>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors ${active ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-text-muted'}`}>
                            <Power size={48} />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {active ? 'Remapper Active' : 'Remapper Inactive'}
                        </h2>
                        <p className="text-text-muted mb-8">
                            {active ? 'Keys are currently being remapped.' : 'Start the remapper to enable left-handed controls.'}
                        </p>

                        <button
                            onClick={toggleRemap}
                            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${active
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                                }`}
                        >
                            {active ? 'Stop Remapping' : 'Start Remapping'}
                        </button>
                    </div>

                    {/* Profile Selection */}
                    <div className="space-y-6">
                        <div
                            onClick={() => !active && setProfile('classic')}
                            className={`glass rounded-2xl p-6 cursor-pointer transition-all border-2 ${profile === 'classic' ? 'border-secondary bg-secondary/5' : 'border-transparent hover:bg-white/5'} ${active ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-white text-lg">Classic Profile</h3>
                                {profile === 'classic' && <CheckCircle className="text-secondary" />}
                            </div>
                            <ul className="space-y-2 text-sm text-text-muted">
                                <li className="flex justify-between"><span>Up Arrow</span> <span className="text-white">W</span></li>
                                <li className="flex justify-between"><span>Down Arrow</span> <span className="text-white">S</span></li>
                                <li className="flex justify-between"><span>Left Arrow</span> <span className="text-white">A</span></li>
                                <li className="flex justify-between"><span>Right Arrow</span> <span className="text-white">D</span></li>
                                <li className="flex justify-between"><span>Space</span> <span className="text-white">1</span></li>
                            </ul>
                        </div>

                        <div
                            onClick={() => !active && setProfile('option2')}
                            className={`glass rounded-2xl p-6 cursor-pointer transition-all border-2 ${profile === 'option2' ? 'border-secondary bg-secondary/5' : 'border-transparent hover:bg-white/5'} ${active ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-white text-lg">Option 2 Profile</h3>
                                {profile === 'option2' && <CheckCircle className="text-secondary" />}
                            </div>
                            <ul className="space-y-2 text-sm text-text-muted">
                                <li className="flex justify-between"><span>Enter</span> <span className="text-white">W</span></li>
                                <li className="flex justify-between"><span>Up Arrow</span> <span className="text-white">S</span></li>
                                <li className="flex justify-between"><span>Right Shift</span> <span className="text-white">A</span></li>
                                <li className="flex justify-between"><span>1</span> <span className="text-white">D</span></li>
                            </ul>
                        </div>

                        <div
                            onClick={() => !active && setProfile('mirror')}
                            className={`glass rounded-2xl p-6 cursor-pointer transition-all border-2 ${profile === 'mirror' ? 'border-secondary bg-secondary/5' : 'border-transparent hover:bg-white/5'} ${active ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-white text-lg">Mirror Mode</h3>
                                {profile === 'mirror' && <CheckCircle className="text-secondary" />}
                            </div>
                            <p className="text-xs text-text-muted mb-2">Mirrors keyboard for left-handed use.</p>
                            <ul className="space-y-2 text-sm text-text-muted">
                                <li className="flex justify-between"><span>P</span> <span className="text-white">Q</span></li>
                                <li className="flex justify-between"><span>O</span> <span className="text-white">W</span></li>
                                <li className="flex justify-between"><span>I</span> <span className="text-white">E</span></li>
                                <li className="flex justify-between"><span>L</span> <span className="text-white">S</span></li>
                            </ul>
                        </div>

                        <div
                            onClick={() => !active && setProfile('numpad')}
                            className={`glass rounded-2xl p-6 cursor-pointer transition-all border-2 ${profile === 'numpad' ? 'border-secondary bg-secondary/5' : 'border-transparent hover:bg-white/5'} ${active ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-white text-lg">Numpad Warrior</h3>
                                {profile === 'numpad' && <CheckCircle className="text-secondary" />}
                            </div>
                            <p className="text-xs text-text-muted mb-2">Maps Numpad keys to WASD.</p>
                            <ul className="space-y-2 text-sm text-text-muted">
                                <li className="flex justify-between"><span>Numpad 8</span> <span className="text-white">W</span></li>
                                <li className="flex justify-between"><span>Numpad 5</span> <span className="text-white">S</span></li>
                                <li className="flex justify-between"><span>Numpad 4</span> <span className="text-white">A</span></li>
                                <li className="flex justify-between"><span>Numpad 6</span> <span className="text-white">D</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
