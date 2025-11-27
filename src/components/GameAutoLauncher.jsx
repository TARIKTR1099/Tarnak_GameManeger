import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Plus, Save, Trash2, Settings, Zap, MousePointer2, Network, Cpu, Keyboard } from 'lucide-react'

export function GameAutoLauncher() {
    const [config, setConfig] = useState([])
    const [scannedGames, setScannedGames] = useState([])
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingGame, setEditingGame] = useState(null)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:5000/autolaunch/config')
            const data = await res.json()
            setConfig(data)
        } catch (e) {
            console.error("Failed to load config", e)
        }
    }

    const saveConfig = async (newConfig) => {
        try {
            await fetch('http://localhost:5000/autolaunch/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            })
            setConfig(newConfig)
        } catch (e) {
            console.error("Failed to save config", e)
        }
    }

    const scanGames = async () => {
        setLoading(true)
        try {
            const res = await fetch('http://localhost:5000/scan-games')
            const data = await res.json()
            setScannedGames(data)
        } catch (e) {
            console.error("Failed to scan games", e)
        } finally {
            setLoading(false)
        }
    }

    const addGame = (game) => {
        const newEntry = {
            id: Date.now(),
            name: game.name,
            exe_path: game.path,
            platform: game.platform,
            actions: []
        }
        const newConfig = [...config, newEntry]
        saveConfig(newConfig)
        setShowAddModal(false)
    }

    const removeGame = (id) => {
        const newConfig = config.filter(g => g.id !== id)
        saveConfig(newConfig)
    }

    const updateGameActions = (id, actions) => {
        const newConfig = config.map(g => {
            if (g.id === id) {
                return { ...g, actions: actions }
            }
            return g
        })
        saveConfig(newConfig)
        setEditingGame(null)
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-6 overflow-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Zap className="text-primary" />
                            Game Auto-Launcher
                        </h1>
                    </div>
                    <button
                        onClick={() => { setShowAddModal(true); scanGames(); }}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Game
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    {config.map(game => (
                        <div key={game.id} className="glass p-6 rounded-xl flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                                    {game.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{game.name}</h3>
                                    <p className="text-sm text-text-muted">{game.exe_path}</p>
                                    <div className="flex gap-2 mt-2">
                                        {game.actions.map((action, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded bg-white/10 text-xs text-text-muted border border-white/5">
                                                {action.type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditingGame(game)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                                >
                                    <Settings size={20} />
                                </button>
                                <button
                                    onClick={() => removeGame(game.id)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-text-muted transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {config.length === 0 && (
                        <div className="text-center py-20 text-text-muted">
                            <Zap size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No games configured for auto-launch.</p>
                            <p className="text-sm">Add a game to automate actions when it starts.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Game Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass w-full max-w-2xl rounded-2xl p-6 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Add Game</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 overflow-auto space-y-2">
                            {loading ? (
                                <div className="text-center py-10">Scanning...</div>
                            ) : (
                                scannedGames.map((game, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 flex justify-between items-center cursor-pointer" onClick={() => addGame(game)}>
                                        <div>
                                            <div className="font-bold text-white">{game.name}</div>
                                            <div className="text-xs text-text-muted">{game.path}</div>
                                        </div>
                                        <Plus size={20} className="text-primary" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Actions Modal */}
            {editingGame && (
                <EditActionsModal
                    game={editingGame}
                    onSave={(actions) => updateGameActions(editingGame.id, actions)}
                    onClose={() => setEditingGame(null)}
                />
            )}
        </div>
    )
}

function EditActionsModal({ game, onSave, onClose }) {
    const [actions, setActions] = useState(game.actions || [])

    const toggleAction = (type, defaultParams = {}) => {
        if (actions.find(a => a.type === type)) {
            setActions(actions.filter(a => a.type !== type))
        } else {
            setActions([...actions, { type, ...defaultParams }])
        }
    }

    const updateActionParams = (type, params) => {
        setActions(actions.map(a => a.type === type ? { ...a, ...params } : a))
    }

    const hasAction = (type) => !!actions.find(a => a.type === type)
    const getAction = (type) => actions.find(a => a.type === type)

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass w-full max-w-2xl rounded-2xl p-6 flex flex-col max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Configure: {game.name}</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-white">✕</button>
                </div>

                <div className="space-y-4">
                    {/* Ultra Mode */}
                    <div className={`p-4 rounded-xl border transition-colors ${hasAction('ultra_mode') ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Zap className={hasAction('ultra_mode') ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-bold text-white">Ultra Mode</span>
                            </div>
                            <button
                                onClick={() => toggleAction('ultra_mode')}
                                className={`px-3 py-1 rounded-lg text-sm font-bold ${hasAction('ultra_mode') ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'}`}
                            >
                                {hasAction('ultra_mode') ? 'Enabled' : 'Enable'}
                            </button>
                        </div>
                        <p className="text-sm text-text-muted">Boosts game priority and reduces background processes.</p>
                    </div>

                    {/* Key Remapper */}
                    <div className={`p-4 rounded-xl border transition-colors ${hasAction('remap_profile') ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Keyboard className={hasAction('remap_profile') ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-bold text-white">Key Remapper</span>
                            </div>
                            <button
                                onClick={() => toggleAction('remap_profile', { profile: 'classic' })}
                                className={`px-3 py-1 rounded-lg text-sm font-bold ${hasAction('remap_profile') ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'}`}
                            >
                                {hasAction('remap_profile') ? 'Enabled' : 'Enable'}
                            </button>
                        </div>
                        {hasAction('remap_profile') && (
                            <div className="mt-3">
                                <label className="text-xs text-text-muted block mb-1">Profile</label>
                                <select
                                    value={getAction('remap_profile').profile}
                                    onChange={(e) => updateActionParams('remap_profile', { profile: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                >
                                    <option value="classic">Classic (Arrows to WASD)</option>
                                    <option value="numpad">Numpad Warrior</option>
                                    <option value="mirror">Mirror Mode</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Clean RAM */}
                    <div className={`p-4 rounded-xl border transition-colors ${hasAction('clean_ram') ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Cpu className={hasAction('clean_ram') ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-bold text-white">Clean RAM</span>
                            </div>
                            <button
                                onClick={() => toggleAction('clean_ram')}
                                className={`px-3 py-1 rounded-lg text-sm font-bold ${hasAction('clean_ram') ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'}`}
                            >
                                {hasAction('clean_ram') ? 'Enabled' : 'Enable'}
                            </button>
                        </div>
                        <p className="text-sm text-text-muted">Closes unnecessary apps (Chrome, Discord, etc.) when game starts.</p>
                    </div>

                    {/* DNS Switcher */}
                    <div className={`p-4 rounded-xl border transition-colors ${hasAction('set_dns') ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Network className={hasAction('set_dns') ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-bold text-white">DNS Switcher</span>
                            </div>
                            <button
                                onClick={() => toggleAction('set_dns', { provider: 'Google' })}
                                className={`px-3 py-1 rounded-lg text-sm font-bold ${hasAction('set_dns') ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'}`}
                            >
                                {hasAction('set_dns') ? 'Enabled' : 'Enable'}
                            </button>
                        </div>
                        {hasAction('set_dns') && (
                            <div className="mt-3">
                                <label className="text-xs text-text-muted block mb-1">Provider</label>
                                <select
                                    value={getAction('set_dns').provider}
                                    onChange={(e) => updateActionParams('set_dns', { provider: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                >
                                    <option value="Google">Google (8.8.8.8)</option>
                                    <option value="Cloudflare">Cloudflare (1.1.1.1)</option>
                                    <option value="OpenDNS">OpenDNS</option>
                                    <option value="Quad9">Quad9</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Background Clicker */}
                    <div className={`p-4 rounded-xl border transition-colors ${hasAction('background_clicker') ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <MousePointer2 className={hasAction('background_clicker') ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-bold text-white">Background Clicker</span>
                            </div>
                            <button
                                onClick={() => toggleAction('background_clicker', { interval: 1000 })}
                                className={`px-3 py-1 rounded-lg text-sm font-bold ${hasAction('background_clicker') ? 'bg-primary text-white' : 'bg-white/10 text-text-muted'}`}
                            >
                                {hasAction('background_clicker') ? 'Enabled' : 'Enable'}
                            </button>
                        </div>
                        {hasAction('background_clicker') && (
                            <div className="mt-3">
                                <p className="text-xs text-yellow-500 mb-2">Note: Requires Window HWND. Will try to find game window automatically.</p>
                                <label className="text-xs text-text-muted block mb-1">Interval (ms)</label>
                                <input
                                    type="number"
                                    value={getAction('background_clicker').interval}
                                    onChange={(e) => updateActionParams('background_clicker', { interval: parseInt(e.target.value) })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/10 text-white transition-colors">Cancel</button>
                    <button onClick={() => onSave(actions)} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-colors flex items-center gap-2">
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    )
}
