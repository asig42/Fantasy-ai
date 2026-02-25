import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${8 + Math.random() * 12}s`,
  size: `${2 + Math.random() * 4}px`,
}))

export default function StartScreen() {
  const {
    initGame, isLoading, error, loadGameData,
    hasApiKey, world, savedSessions, saveApiKey, resumeSession,
  } = useGameStore()

  const [showError, setShowError] = useState(false)
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [showSaveList, setShowSaveList] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [falKeyInput, setFalKeyInput] = useState('')
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [keyMessage, setKeyMessage] = useState('')

  useEffect(() => {
    loadGameData()
  }, [loadGameData])

  useEffect(() => {
    if (error) {
      setShowError(true)
      const t = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return
    setIsSavingKey(true)
    setKeyMessage('')
    try {
      await saveApiKey(apiKeyInput.trim(), falKeyInput.trim() || undefined)
      setKeyMessage('✓ API 키가 저장되었습니다!')
      setApiKeyInput('')
      setFalKeyInput('')
      setTimeout(() => {
        setShowApiSetup(false)
        setKeyMessage('')
      }, 1500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'API 키 저장 실패'
      setKeyMessage(msg)
    }
    setIsSavingKey(false)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const classEmoji: Record<string, string> = {
    '전사': '⚔', '마법사': '🔮', '도적': '🗡', '성직자': '✝',
    '사냥꾼': '🏹', '연금술사': '⚗', '음유시인': '🎵', '팔라딘': '🛡',
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 60%, #050508 100%)' }}>

      {/* Particles */}
      {PARTICLES.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left,
          bottom: '-10px',
          width: p.size,
          height: p.size,
          animationDelay: p.delay,
          animationDuration: p.duration,
        }} />
      ))}

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1/3"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.15), transparent)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-1/3"
          style={{ background: 'linear-gradient(to top, transparent, rgba(212,175,55,0.15), transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
            animation: 'glow 3s ease-in-out infinite alternate',
          }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center animate-fade-in w-full max-w-lg">

        {/* Rune circle decoration */}
        <div className="relative w-28 h-28 animate-float">
          <svg viewBox="0 0 128 128" className="w-full h-full">
            <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
            <circle cx="64" cy="64" r="48" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="1" />
            <circle cx="64" cy="64" r="35" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="1" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180
              const x = 64 + 60 * Math.cos(rad)
              const y = 64 + 60 * Math.sin(rad)
              return <circle key={angle} cx={x} cy={y} r="2" fill="rgba(212,175,55,0.6)" />
            })}
            <line x1="64" y1="30" x2="64" y2="98" stroke="rgba(212,175,55,0.7)" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="50" x2="78" y2="50" stroke="rgba(212,175,55,0.7)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 60 94 Q 64 98 68 94" fill="rgba(212,175,55,0.4)" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-cinzel text-5xl md:text-6xl tracking-widest mb-2"
            style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.2)' }}>
            FANTASY AI
          </h1>
          <div className="divider-gold w-64 mx-auto" />
          <p className="font-cinzel text-xs tracking-[0.3em] mt-2"
            style={{ color: 'rgba(212,175,55,0.6)' }}>
            A I &nbsp;&nbsp; T R P G &nbsp;&nbsp; A D V E N T U R E
          </p>
        </div>

        {/* API Key Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className={hasApiKey ? 'text-green-400' : 'text-red-400'}>
            {hasApiKey ? '● API 연결됨' : '● API 키 필요'}
          </span>
          <button
            onClick={() => { setShowApiSetup(!showApiSetup); setShowSaveList(false) }}
            className="text-xs px-2 py-1 rounded border"
            style={{ borderColor: 'rgba(212,175,55,0.3)', color: 'rgba(212,175,55,0.8)', background: 'rgba(212,175,55,0.05)' }}
          >
            {showApiSetup ? '닫기' : '⚙ 설정'}
          </button>
        </div>

        {/* API Key Setup Panel */}
        {showApiSetup && (
          <div className="fantasy-panel p-4 w-full text-left" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
            <h3 className="font-cinzel text-sm mb-3" style={{ color: '#D4AF37' }}>API 키 설정</h3>

            <div className="mb-3">
              <label className="block text-xs mb-1" style={{ color: 'rgba(212,175,55,0.7)' }}>
                Anthropic API 키 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 rounded text-sm bg-transparent border outline-none"
                style={{
                  borderColor: 'rgba(212,175,55,0.3)',
                  color: 'rgba(232,213,176,0.9)',
                  background: 'rgba(0,0,0,0.3)',
                }}
              />
              <p className="text-xs mt-1" style={{ color: 'rgba(160,144,112,0.6)' }}>
                console.anthropic.com에서 발급
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs mb-1" style={{ color: 'rgba(212,175,55,0.7)' }}>
                fal.ai API 키 <span style={{ color: 'rgba(160,144,112,0.6)' }}>(선택 - 이미지 생성용)</span>
              </label>
              <input
                type="password"
                value={falKeyInput}
                onChange={e => setFalKeyInput(e.target.value)}
                placeholder="fal.ai 키 (없으면 기본 이미지 사용)"
                className="w-full px-3 py-2 rounded text-sm bg-transparent border outline-none"
                style={{
                  borderColor: 'rgba(212,175,55,0.3)',
                  color: 'rgba(232,213,176,0.9)',
                  background: 'rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {keyMessage && (
              <p className={`text-xs mb-2 ${keyMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                {keyMessage}
              </p>
            )}

            <button
              onClick={handleSaveApiKey}
              disabled={isSavingKey || !apiKeyInput.trim()}
              className="btn-fantasy text-sm px-4 py-2 w-full"
            >
              {isSavingKey ? '검증 중...' : '저장 및 테스트'}
            </button>
          </div>
        )}

        {/* Error message */}
        {showError && (
          <div className="fantasy-panel p-3 w-full border-red-900/50" style={{ borderColor: '#8b0000' }}>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Start button */}
        <button
          className="btn-fantasy text-lg px-10 py-4 w-full"
          onClick={initGame}
          disabled={isLoading || !hasApiKey}
          title={!hasApiKey ? 'API 키를 먼저 설정해주세요' : ''}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="loading-rune w-5 h-5" />
              세계 창조 중...
            </span>
          ) : !hasApiKey ? '⚙ API 키 설정 후 시작 가능'
            : world ? '⚔ 새 캐릭터 시작 (기존 세계)'
            : '⚔ 새 게임 시작'}
        </button>

        {/* Regenerate world button (only when world exists) */}
        {world && hasApiKey && (
          <button
            className="w-full py-2 rounded border text-xs font-cinzel tracking-wider"
            style={{
              borderColor: 'rgba(212,175,55,0.2)',
              color: 'rgba(160,144,112,0.6)',
              background: 'transparent',
            }}
            disabled={isLoading}
            onClick={() => {
              if (confirm('새 세계를 창조하시겠습니까? 현재 세계 데이터가 사라집니다.')) {
                localStorage.removeItem('fantasy-ai-world')
                localStorage.removeItem('fantasy-ai-npcs')
                localStorage.removeItem('fantasy-ai-narrative')
                initGame()
              }
            }}
          >
            ↺ 새 세계 창조
          </button>
        )}

        {/* Load saved game button */}
        {savedSessions.length > 0 && (
          <button
            className="w-full py-3 rounded border text-sm font-cinzel tracking-wider"
            style={{
              borderColor: 'rgba(212,175,55,0.4)',
              color: 'rgba(212,175,55,0.8)',
              background: 'rgba(212,175,55,0.05)',
            }}
            onClick={() => { setShowSaveList(!showSaveList); setShowApiSetup(false) }}
          >
            {showSaveList ? '▲ 닫기' : `📖 저장된 게임 불러오기 (${savedSessions.length})`}
          </button>
        )}

        {/* Saved Sessions List */}
        {showSaveList && savedSessions.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {savedSessions.map(s => (
              <button
                key={s.id}
                onClick={() => resumeSession(s.id)}
                disabled={isLoading}
                className="w-full p-3 rounded border text-left transition-all"
                style={{
                  borderColor: 'rgba(212,175,55,0.25)',
                  background: 'rgba(212,175,55,0.03)',
                  color: 'rgba(232,213,176,0.9)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.03)'
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>
                      {classEmoji[s.characterClass] ?? '⚔'} {s.characterName}
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'rgba(160,144,112,0.7)' }}>
                      Lv.{s.level} {s.characterClass}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(160,144,112,0.6)' }}>
                    {formatDate(s.updatedAt)}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'rgba(160,144,112,0.7)' }}>
                  📍 {s.currentLocation}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Features */}
        <div className="flex gap-4 mt-2 text-xs flex-wrap justify-center" style={{ color: 'rgba(160,144,112,0.7)' }}>
          <span>🗺 AI 세계 생성</span>
          <span>👥 20명 NPC</span>
          <span>🎨 애니 일러스트</span>
          <span>📖 몰입형 서사</span>
          <span>💾 자동 저장</span>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />
    </div>
  )
}
