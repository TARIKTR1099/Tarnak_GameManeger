
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Globe, Loader2, ExternalLink } from 'lucide-react'
import { searchWeb } from '../services/api'

export function ResearchPanel({ apiKeys }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    try {
      const data = await searchWeb(apiKeys.research, query)
      setResults(data.results || []) // Adjust based on actual API response structure
    } catch (err) {
      setError("Search failed. Please check your API key.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-bg-dark text-text-main">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6">
        <header className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
          <h1 className="text-2xl font-bold">Game Research</h1>
        </header>

        <div className="glass rounded-2xl p-8 text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center mx-auto mb-4">
            <Globe size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Deep Dive Research</h2>
          <p className="text-text-muted max-w-md mx-auto mb-6">
            Use our advanced research tool to find detailed information, reviews, and guides for any game.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter a game topic to research..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-bg-dark border border-white/10 focus:border-secondary focus:outline-none text-white"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-secondary" size={20} />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 mb-6 text-center">
            {error}
          </div>
        )}

        {results && (
          <div className="grid grid-cols-1 gap-4">
            {results.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass p-6 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-secondary group-hover:underline">{result.title}</h3>
                  <ExternalLink size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-text-muted text-sm line-clamp-2">{result.content}</p>
                <div className="mt-3 text-xs text-text-muted opacity-50">{result.url}</div>
              </a>
            ))}
            {results.length === 0 && !loading && !error && (
              <div className="text-center text-text-muted py-8">No results found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

