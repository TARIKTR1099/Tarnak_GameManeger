import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Save, Trash2, Settings as SettingsIcon } from 'lucide-react'
import { cacheService } from '../services/cache'

export function Settings({ apiKeys, onUpdate }) {
    const [keys, setKeys] = useState(apiKeys)
    const [cacheSize, setCacheSize] = useState(cacheService.getSize())
    const [updateStatus, setUpdateStatus] = useState('')

    const handleSave = (e) => {
        e.preventDefault()
        onUpdate(keys)
        alert("Settings saved!")
    }

    const handleClearCache = () => {
        if (window.confirm("Are you sure you want to clear all cached data? Images and search results will be re-fetched.")) {
            cacheService.clear()
            setCacheSize(cacheService.getSize())
        }
    }

    const handleCheckUpdates = async () => {
        if (!window.electron || !window.electron.checkForUpdates) {
            alert('Update check is only available in the installed desktop app.')
            return
        }

        setUpdateStatus('Checking for updates...')

        try {
            const result = await window.electron.checkForUpdates()
            if (result && result.message) {
                setUpdateStatus(result.message)
            } else {
                setUpdateStatus('Update check triggered.')
            }
        } catch (e) {
            setUpdateStatus('Failed to check for updates.')
        }
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-6">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <SettingsIcon />
                        Settings
                    </h1>
                </header>

                <div className="space-y-8">
                    {/* API Keys Section */}
                    <section className="glass rounded-2xl p-8">
                        <h2 className="text-xl font-bold mb-6 text-white">API Configuration</h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-text-muted">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={keys.gemini}
                                    onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-text-muted">OpenAI API Key</label>
                                <input
                                    type="password"
                                    value={keys.openai}
                                    onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-text-muted">Research API Key (Tavily)</label>
                                <input
                                    type="password"
                                    value={keys.research}
                                    onChange={(e) => setKeys({ ...keys, research: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-text-muted">Free Games API (Optional)</label>
                                <input
                                    type="text"
                                    value={keys.games}
                                    onChange={(e) => setKeys({ ...keys, games: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </form>
                    </section>

                    {/* Cache Management Section */}
                    <section className="glass rounded-2xl p-8">
                        <h2 className="text-xl font-bold mb-6 text-white">Storage & Cache</h2>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                                <h3 className="font-medium text-white">Local Cache</h3>
                                <p className="text-sm text-text-muted">Current size: {cacheSize}</p>
                            </div>
                            <button
                                onClick={handleClearCache}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Clear Cache
                            </button>
                        </div>
                        <p className="mt-4 text-sm text-text-muted">
                            The app automatically caches search results and images to save bandwidth. Cache expires automatically after 24 hours.
                        </p>
                    </section>

                    <section className="glass rounded-2xl p-8">
                        <h2 className="text-xl font-bold mb-6 text-white">Updates</h2>
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-text-muted flex-1">
                                Check for the latest version of GameManager from GitHub.
                            </p>
                            <button
                                onClick={handleCheckUpdates}
                                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors"
                            >
                                Check for Updates
                            </button>
                        </div>
                        {updateStatus && (
                            <p className="mt-3 text-sm text-text-muted">
                                {updateStatus}
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
