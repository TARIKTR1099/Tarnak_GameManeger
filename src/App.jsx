import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SetupModal } from './components/SetupModal'
import { Dashboard } from './components/Dashboard'
import { AIChat } from './components/AIChat'
import { ResearchPanel } from './components/ResearchPanel'
import { AdvancedSearch } from './components/AdvancedSearch'
import { AutoClicker } from './components/AutoClicker'
import { Library } from './components/Library'
import { KeyMapper } from './components/KeyMapper'
import { Booster } from './components/Booster'
import { NetworkPanel } from './components/NetworkPanel'
import { Settings } from './components/Settings'
import { GameAutoLauncher } from './components/GameAutoLauncher'

function App() {
    const [apiKeys, setApiKeys] = useState({
        gemini: localStorage.getItem('gemini_key') || '',
        games: localStorage.getItem('games_key') || '',
        research: localStorage.getItem('research_key') || '',
        openai: localStorage.getItem('openai_key') || ''
    })

    const [showSetup, setShowSetup] = useState(false)

    useEffect(() => {
        if (!apiKeys.gemini || !apiKeys.research) {
            setShowSetup(true)
        }
    }, [apiKeys])

    const handleSaveKeys = (keys) => {
        localStorage.setItem('gemini_key', keys.gemini)
        localStorage.setItem('games_key', keys.games)
        localStorage.setItem('research_key', keys.research)
        localStorage.setItem('openai_key', keys.openai)
        setApiKeys(keys)
        setShowSetup(false)
    }

    return (
        <Router>
            <div className="app-container">
                {showSetup && <SetupModal onSave={handleSaveKeys} initialKeys={apiKeys} />}

                <Routes>
                    <Route path="/" element={<Dashboard apiKeys={apiKeys} />} />
                    <Route path="/chat" element={<AIChat apiKeys={apiKeys} />} />
                    <Route path="/research" element={<ResearchPanel apiKeys={apiKeys} />} />
                    <Route path="/advanced" element={<AdvancedSearch apiKeys={apiKeys} />} />
                    <Route path="/autoclicker" element={<AutoClicker />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/keymapper" element={<KeyMapper />} />
                    <Route path="/booster" element={<Booster />} />
                    <Route path="/network" element={<NetworkPanel />} />
                    <Route path="/automation" element={<GameAutoLauncher />} />
                    <Route path="/settings" element={<Settings apiKeys={apiKeys} onUpdate={handleSaveKeys} />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
