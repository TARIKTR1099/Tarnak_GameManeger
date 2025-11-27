import { useState, useEffect } from 'react'
import { LayoutGrid, MessageSquare, Search, Filter, ExternalLink, Sparkles, MousePointer2, FolderOpen, Keyboard, Zap, Wifi, Gamepad2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFreeGames } from '../services/api'

export function Dashboard({ apiKeys }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await getFreeGames()
        setGames(data.slice(0, 50))
      } catch (err) {
        setError("Failed to load games. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  const filteredGames = filter === 'all'
    ? games
    : games.filter(game => game.genre.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="flex h-screen bg-bg-dark text-text-main">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-glass-border flex flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold gradient-text">GameManager</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
            <LayoutGrid size={20} />
            Discover
          </Link>
          <Link to="/library" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <FolderOpen size={20} />
            Library
          </Link>
          <Link to="/booster" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Zap size={20} />
            Booster
          </Link>
          <Link to="/network" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Wifi size={20} />
            Network
          </Link>
          <Link to="/keymapper" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Keyboard size={20} />
            Key Remapper
          </Link>
          <Link to="/automation" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Gamepad2 size={20} />
            Game Automation
          </Link>
          <Link to="/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <MessageSquare size={20} />
            AI Assistant
          </Link>
          <Link to="/research" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Search size={20} />
            Research
          </Link>
          <Link to="/advanced" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <Sparkles size={20} />
            Smart Discovery
          </Link>
          <Link to="/autoclicker" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-text-muted hover:text-white transition-colors">
            <MousePointer2 size={20} />
            Auto Clicker
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Discover Games</h2>
            <p className="text-text-muted">Find the best free-to-play games</p>
          </div>

          <div className="flex gap-2">
            {['All', 'Shooter', 'MMORPG', 'Strategy'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === cat.toLowerCase()
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-text-muted hover:bg-white/10'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <div key={game.id} className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group flex flex-col h-full">
                <div className="h-48 bg-gray-800 relative overflow-hidden">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4">
                    <a
                      href={game.game_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 text-white truncate">{game.title}</h3>
                  <p className="text-sm text-text-muted mb-4 line-clamp-2 flex-1">{game.short_description}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-text-muted border border-white/5">{game.genre}</span>
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-text-muted border border-white/5">{game.platform}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
