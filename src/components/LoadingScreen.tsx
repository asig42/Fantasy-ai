import { useEffect, useState } from 'react'

const STEPS = [
  { icon: '🌍', label: '세계를 창조하는 중...' },
  { icon: '🏰', label: '도시와 왕국을 건설하는 중...' },
  { icon: '👑', label: 'NPC를 소환하는 중...' },
  { icon: '🎨', label: '초상화를 그리는 중...' },
  { icon: '📜', label: '운명의 서사를 쓰는 중...' },
  { icon: '✨', label: '세계에 마법을 불어넣는 중...' },
]

const RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ']

export default function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex(i => (i + 1) % STEPS.length)
    }, 2500)
    return () => clearInterval(stepTimer)
  }, [])

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    return () => clearInterval(dotTimer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 70%, #050508 100%)' }}>

      {/* Rune ring animation */}
      <div className="relative w-48 h-48 mb-12">
        {/* Outer ring */}
        <svg className="absolute inset-0 w-full h-full" style={{ animation: 'spin 20s linear infinite' }}
          viewBox="0 0 192 192">
          <circle cx="96" cy="96" r="90" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" strokeDasharray="4 4" />
          {RUNES.map((rune, i) => {
            const angle = (i / RUNES.length) * 360
            const rad = ((angle - 90) * Math.PI) / 180
            const x = 96 + 82 * Math.cos(rad)
            const y = 96 + 82 * Math.sin(rad)
            return (
              <text key={i} x={x} y={y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="14" fill="rgba(212,175,55,0.5)"
                style={{ fontFamily: 'serif' }}>
                {rune}
              </text>
            )
          })}
        </svg>

        {/* Middle ring */}
        <svg className="absolute inset-4 w-full h-full" style={{ animation: 'spin 8s linear infinite reverse' }}
          viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="1" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = ((angle - 90) * Math.PI) / 180
            const x = 80 + 70 * Math.cos(rad)
            const y = 80 + 70 * Math.sin(rad)
            return <circle key={angle} cx={x} cy={y} r="3" fill="rgba(212,175,55,0.4)" />
          })}
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-float" style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.8))' }}>
            {STEPS[stepIndex].icon}
          </div>
        </div>

        {/* Spinning loader ring */}
        <div className="absolute inset-8 border-2 border-transparent rounded-full"
          style={{
            borderTopColor: 'rgba(212,175,55,0.6)',
            animation: 'spin 1.5s linear infinite',
          }} />
      </div>

      {/* Step text */}
      <div className="text-center animate-fade-in" key={stepIndex}>
        <p className="font-cinzel text-lg tracking-widest mb-2"
          style={{ color: '#D4AF37', textShadow: '0 0 10px rgba(212,175,55,0.4)' }}>
          {STEPS[stepIndex].label.replace('...', '')}{dots}
        </p>
        <p className="text-xs tracking-widest" style={{ color: 'rgba(160,144,112,0.5)' }}>
          AI가 세계를 창조하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {STEPS.map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-500"
            style={{
              background: i === stepIndex ? '#D4AF37' : 'rgba(212,175,55,0.2)',
              boxShadow: i === stepIndex ? '0 0 6px rgba(212,175,55,0.8)' : 'none',
            }} />
        ))}
      </div>

      {/* Tip text */}
      <div className="mt-16 max-w-sm text-center">
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(160,144,112,0.4)' }}>
          세계 생성, NPC 생성, 서사 작성이 순서대로 진행됩니다.<br />
          이미지는 백그라운드에서 생성됩니다.
        </p>
      </div>
    </div>
  )
}
