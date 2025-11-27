import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Library as LibraryIcon, Plus, Play, Trash2, FolderOpen, Settings, Gamepad2 } from 'lucide-react'

export function Library() {
    const [games, setGames] = useState([])
    const [isElectron, setIsElectron] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [manualPath, setManualPath] = useState('')
    const [manualName, setManualName] = useState('')

    useEffect(() => {
        // Check if running in Electron
        if (window.electron) {
            setIsElectron(true)
        }
        // Load games from localStorage
        const savedGames = localStorage.getItem('my_library')
        if (savedGames) {
            setGames(JSON.parse(savedGames))
        }
    }, [])

    const saveGames = (newGames) => {
        setGames(newGames)
        localStorage.setItem('my_library', JSON.stringify(newGames))
    }

    const handleAddGame = async () => {
        if (isElectron) {
            try {
                const path = await window.electron.selectFile()
                if (path) {
                    const name = path.split('\\').pop().replace('.exe', '')
                    const newGame = {
                        id: Date.now(),
                        title: name,
                        path: path,
                        addedAt: new Date().toISOString()
                    }
                    saveGames([...games, newGame])
                }
            } catch (e) {
                console.error("Failed to add game", e)
            }
        } else {
            setShowAddModal(true)
        }
    }

    const handleManualAdd = () => {
        if (!manualName || !manualPath) return

        const newGame = {
            id: Date.now(),
            title: manualName,
            path: manualPath,
            addedAt: new Date().toISOString()
        }
        saveGames([...games, newGame])
        setShowAddModal(false)
        setManualName('')
        setManualPath('')
    }

    const handleRemove = (id) => {
        if (confirm('Are you sure you want to remove this game from your library?')) {
            const newGames = games.filter(g => g.id !== id)
            saveGames(newGames)
        }
    }

    const handleLaunch = async (path) => {
        try {
            const res = await fetch('http://localhost:5000/launch-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            })
            const data = await res.json()
            if (data.error) {
                alert('Failed to launch: ' + data.error)
            }
        } catch (e) {
            alert('Failed to connect to backend. Is automation_server.py running?')
        }
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-6">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <LibraryIcon className="text-secondary" />
                            My Library
                        </h1>
                    </div>

                    <button
                        onClick={handleAddGame}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Game
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-text-muted">
                            <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Your library is empty.</p>
                            <p className="text-sm">Click "Add Game" to import your installed games.</p>
                        </div>
                    ) : (
                        games.map(game => (
                            <div key={game.id} className="glass rounded-2xl p-6 flex flex-col group hover:bg-white/5 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 text-white font-bold text-xl">
                                    {game.title.charAt(0).toUpperCase()}
                                </div>

                                <h3 className="font-bold text-white mb-1 truncate" title={game.title}>{game.title}</h3>
                                <p className="text-xs text-text-muted mb-6 truncate" title={game.path}>{game.path}</p>

                                <div className="mt-auto flex gap-2">
                                    <button
                                        onClick={() => handleLaunch(game.path)}
                                        className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Play size={16} fill="currentColor" /> Play
                                    </button>
                                    <button
                                        onClick={() => handleRemove(game.id)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-text-muted transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Manual Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="glass w-full max-w-md rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Add Game Manually</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-muted mb-1">Game Title</label>
                                <input
                                    type="text"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white"
                                    placeholder="e.g. Valorant"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-muted mb-1">Executable Path</label>
                                <input
                                    type="text"
                                    value={manualPath}
                                    onChange={(e) => setManualPath(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white"
                                    placeholder="C:\Games\Valorant\VALORANT.exe"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualAdd}
                                disabled={!manualName || !manualPath}
                                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-colors"
                            >
                                Add Game
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
