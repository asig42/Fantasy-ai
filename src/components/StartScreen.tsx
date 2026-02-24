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
  const { initGame, isLoading, error, loadGameData } = useGameStore()
  const [showError, setShowError] = useState(false)

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

        {/* Circular glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
            animation: 'glow 3s ease-in-out infinite alternate',
          }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center animate-fade-in">

        {/* Rune circle decoration */}
        <div className="relative w-32 h-32 animate-float">
          <svg viewBox="0 0 128 128" className="w-full h-full">
            <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1" />
            <circle cx="64" cy="64" r="48" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="1" />
            <circle cx="64" cy="64" r="35" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="1" />
            {/* Rune marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180
              const x = 64 + 60 * Math.cos(rad)
              const y = 64 + 60 * Math.sin(rad)
              return <circle key={angle} cx={x} cy={y} r="2" fill="rgba(212,175,55,0.6)" />
            })}
            {/* Sword icon */}
            <line x1="64" y1="30" x2="64" y2="98" stroke="rgba(212,175,55,0.7)" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="50" x2="78" y2="50" stroke="rgba(212,175,55,0.7)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 60 94 Q 64 98 68 94" fill="rgba(212,175,55,0.4)" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-cinzel text-5xl md:text-7xl tracking-widest mb-3"
            style={{ color: '#D4AF37', textShadow: '0 0 30px rgba(212,175,55,0.5), 0 0 60px rgba(212,175,55,0.2)' }}>
            FANTASY AI
          </h1>
          <div className="divider-gold w-64 mx-auto" />
          <p className="font-cinzel text-sm tracking-[0.3em] mt-3"
            style={{ color: 'rgba(212,175,55,0.6)' }}>
            A I &nbsp;&nbsp; T R P G &nbsp;&nbsp; A D V E N T U R E
          </p>
        </div>

        {/* Description */}
        <p className="max-w-md text-sm leading-relaxed" style={{ color: 'rgba(232,213,176,0.6)' }}>
          AI가 생성하는 살아있는 판타지 세계에서<br />
          당신만의 이야기를 써내려가세요.
        </p>

        {/* Error message */}
        {showError && (
          <div className="fantasy-panel p-4 max-w-md border-red-900/50" style={{ borderColor: '#8b0000' }}>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Start button */}
        <button
          className="btn-fantasy text-lg px-12 py-4 mt-4"
          onClick={initGame}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <div className="loading-rune w-5 h-5" />
              세계 창조 중...
            </span>
          ) : '⚔ 게임 시작'}
        </button>

        {/* Features */}
        <div className="flex gap-8 mt-4 text-xs" style={{ color: 'rgba(160,144,112,0.7)' }}>
          <span>🗺 AI 세계 생성</span>
          <span>👥 20명 NPC</span>
          <span>🎨 애니 일러스트</span>
          <span>📖 몰입형 서사</span>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />
    </div>
  )
}
