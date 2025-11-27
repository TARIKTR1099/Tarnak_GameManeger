import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles, Filter, Download, RotateCw, Trash2, ExternalLink } from 'lucide-react'
import { getChatGPTRecommendations, getGameImage } from '../services/api'
import { cacheService } from '../services/cache'

export function AdvancedSearch({ apiKeys }) {
    const [criteria, setCriteria] = useState({
        query: '',
        price: 'Any',
        sort: 'Relevance'
    })
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [images, setImages] = useState({})

    const handleSearch = async (isLoadMore = false) => {
        if (!criteria.query.trim()) return

        if (isLoadMore) setLoadingMore(true)
        else {
            setLoading(true)
            setResults([])
        }
        setError(null)

        try {
            const excludeList = isLoadMore ? results.map(r => r.title) : []
            const games = await getChatGPTRecommendations(apiKeys.openai, criteria, excludeList)

            if (games.length === 0 && isLoadMore) {
                setError("No more games found matching your criteria.")
            } else {
                setResults(prev => isLoadMore ? [...prev, ...games] : games)

                // Fetch images in background
                games.forEach(async (game) => {
                    const img = await getGameImage(apiKeys.research, game.title)
                    if (img) {
                        setImages(prev => ({ ...prev, [game.title]: img }))
                    }
                })
            }
        } catch (err) {
            setError("Failed to get recommendations. Check your OpenAI Key.")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    const clearCache = () => {
        cacheService.clear()
        alert("Cache cleared!")
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-6">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="text-secondary" />
                            Smart Discovery
                        </h1>
                    </div>
                    <button onClick={clearCache} className="p-2 text-text-muted hover:text-red-500 transition-colors" title="Clear Cache">
                        <Trash2 size={20} />
                    </button>
                </header>

                {/* Search Controls */}
                <div className="glass rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-muted mb-2">Vibe / Genre / Description</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                                <input
                                    type="text"
                                    value={criteria.query}
                                    onChange={(e) => setCriteria({ ...criteria, query: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="e.g. 'Relaxing farming sim with multiplayer' or 'Fast-paced shooter'"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-bg-dark border border-white/10 focus:border-secondary focus:outline-none text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Price Range</label>
                            <select
                                value={criteria.price}
                                onChange={(e) => setCriteria({ ...criteria, price: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-white/10 focus:border-secondary focus:outline-none text-white"
                            >
                                <option value="Any">Any Price</option>
                                <option value="Free">Free to Play</option>
                                <option value="Under $10">Under $10</option>
                                <option value="Under $30">Under $30</option>
                                <option value="AAA">AAA / Premium</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Sort By</label>
                            <select
                                value={criteria.sort}
                                onChange={(e) => setCriteria({ ...criteria, sort: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-bg-dark border border-white/10 focus:border-secondary focus:outline-none text-white"
                            >
                                <option value="Relevance">Relevance</option>
                                <option value="Popularity">Popularity</option>
                                <option value="Quality">Quality (Metacritic)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSearch(false)}
                        disabled={loading || !criteria.query}
                        className="w-full py-3 rounded-xl bg-secondary hover:bg-pink-600 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <RotateCw className="animate-spin" /> : <Sparkles size={20} />}
                        Find Games
                    </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        {results.map((game, idx) => (
                            <div key={idx} className="glass rounded-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="md:w-64 h-48 md:h-auto bg-gray-800 shrink-0 relative">
                                    {images[game.title] ? (
                                        <img src={images[game.title].url} alt={game.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted bg-white/5">
                                            <span className="text-sm">Loading Image...</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-xs text-white backdrop-blur-sm">
                                        {game.price_category}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-2xl font-bold text-white">{game.title}</h3>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold text-secondary mb-1">Why you should play it:</h4>
                                        <p className="text-text-muted">{game.reason}</p>
                                    </div>

                                    <div className="mt-auto pt-4 flex gap-3">
                                        <a
                                            href={`https://www.google.com/search?q=${encodeURIComponent(game.title + ' download')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Download size={18} />
                                            Download / Buy
                                        </a>
                                        <a
                                            href={`https://www.google.com/search?q=${encodeURIComponent(game.title + ' review')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-2"
                                        >
                                            <ExternalLink size={18} />
                                            Reviews
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {results.length > 0 && (
                        <div className="py-8 text-center">
                            <button
                                onClick={() => handleSearch(true)}
                                disabled={loadingMore}
                                className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-white transition-colors disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More Games'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
