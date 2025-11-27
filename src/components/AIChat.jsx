import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getGeminiResponse } from '../services/api'

export function AIChat({ apiKeys }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your Gemini-powered gaming assistant. Ask me for game recommendations, tips, or anything gaming related!' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)

        try {
            const response = await getGeminiResponse(apiKeys.gemini, userMsg, messages)
            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error. Please check your API key." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen bg-bg-dark text-text-main">
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6">
                <header className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <Link to="/" className="text-text-muted hover:text-white">← Back</Link>
                    <h1 className="text-2xl font-bold">AI Assistant</h1>
                </header>

                <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-primary/20 text-primary' : 'bg-white/10'}`}>
                                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                            </div>
                            <div className={`p-4 rounded-2xl max-w-[80%] whitespace-pre-wrap ${msg.role === 'assistant' ? 'glass' : 'bg-primary text-white'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                <Bot size={20} />
                            </div>
                            <div className="glass p-4 rounded-2xl flex items-center">
                                <Loader2 className="animate-spin" size={20} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about games, strategies, or recommendations..."
                        disabled={loading}
                        className="w-full px-6 py-4 rounded-xl bg-bg-card border border-white/5 focus:border-primary focus:outline-none text-white pr-12 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
