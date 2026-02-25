import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import StartScreen from './components/StartScreen'
import LoadingScreen from './components/LoadingScreen'
import WorldMapScreen from './components/WorldMapScreen'
import NarrativeScreen from './components/NarrativeScreen'
import CharacterCreation from './components/CharacterCreation'
import GameScreen from './components/GameScreen'

function App() {
  const { phase, resumeSessionFromServer } = useGameStore()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session')
    if (sessionId) {
      resumeSessionFromServer(sessionId)
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#05050a' }}>
      {phase === 'start' && <StartScreen />}
      {phase === 'generating' && <LoadingScreen />}
      {phase === 'worldmap' && <WorldMapScreen />}
      {phase === 'narrative' && <NarrativeScreen />}
      {phase === 'character_creation' && <CharacterCreation />}
      {phase === 'game' && <GameScreen />}
    </div>
  )
}

export default App
