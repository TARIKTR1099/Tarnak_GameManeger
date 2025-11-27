import { useState } from 'react'
import { Save, Key } from 'lucide-react'

export function SetupModal({ onSave, initialKeys }) {
    const [keys, setKeys] = useState(initialKeys)

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(keys)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 rounded-2xl glass animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-primary/20 text-primary">
                        <Key size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Setup API Keys</h2>
                </div>

                <p className="mb-6 text-text-muted">
                    To use GameManager, please enter your API keys. These are stored locally on your device.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted">Gemini API Key</label>
                        <input
                            type="password"
                            value={keys.gemini}
                            onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                            placeholder="AI Studio Key"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted">Free Games API (Optional)</label>
                        <input
                            type="text"
                            value={keys.games}
                            onChange={(e) => setKeys({ ...keys, games: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                            placeholder="Leave empty for default"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted">OpenAI API Key (Advanced Discovery)</label>
                        <input
                            type="password"
                            value={keys.openai}
                            onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                            placeholder="sk-..."
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-text-muted">Research API Key</label>
                        <input
                            type="password"
                            value={keys.research}
                            onChange={(e) => setKeys({ ...keys, research: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg bg-bg-dark border border-white/10 focus:border-primary focus:outline-none text-white transition-colors"
                            placeholder="Tavily/Serper Key"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 mt-6 font-semibold text-white rounded-lg bg-primary hover:bg-primary-hover transition-colors"
                    >
                        <Save size={18} />
                        Save & Continue
                    </button>
                </form>
            </div >
        </div >
    )
}
