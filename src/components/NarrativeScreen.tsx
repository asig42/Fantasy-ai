import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'

function TypewriterText({ text, speed = 25, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    setDone(false)

    const timer = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(timer)
        setDone(true)
        onDone?.()
        return
      }
      const chunk = text.slice(indexRef.current, indexRef.current + 3)
      setDisplayed(prev => prev + chunk)
      indexRef.current += 3
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onDone])

  return (
    <div className="narrative-text" style={{ minHeight: '2em' }}>
      {displayed.split('\n\n').map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      {!done && <span className="inline-block w-0.5 h-4 ml-0.5 bg-yellow-600 animate-pulse" />}
    </div>
  )
}

export default function NarrativeScreen() {
  const { narrative, world, setPhase } = useGameStore()
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [visibleParagraphs, setVisibleParagraphs] = useState<number>(0)
  const [allDone, setAllDone] = useState(false)
  const [skipped, setSkipped] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!narrative) return
    const paras = narrative
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
    setParagraphs(paras)
    setVisibleParagraphs(1)
    setAllDone(false)
    setSkipped(false)
  }, [narrative])

  const handleParagraphDone = () => {
    setVisibleParagraphs(prev => {
      if (prev >= paragraphs.length) {
        setAllDone(true)
        return prev
      }
      return prev + 1
    })
    // Auto-scroll
    setTimeout(() => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }, 100)
  }

  const handleSkip = () => {
    setVisibleParagraphs(paragraphs.length)
    setAllDone(true)
    setSkipped(true)
  }

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at top, #0f0a1a 0%, #0a0a0f 70%)' }}>

      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <p className="font-cinzel text-xs tracking-[0.4em] mb-3" style={{ color: 'rgba(212,175,55,0.4)' }}>
          P R O L O G U E
        </p>
        <h2 className="font-cinzel text-2xl text-glow-gold" style={{ color: '#D4AF37' }}>
          {world?.name ?? '판타지 세계'}의 이야기
        </h2>
        <div className="divider-gold w-32 mx-auto mt-3" />
      </div>

      {/* Narrative container */}
      <div ref={containerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 max-w-3xl mx-auto w-full">

        <div className="fantasy-panel rounded-sm p-8 md:p-12 relative">
          <div className="corner-ornament top-left" />
          <div className="corner-ornament top-right" />
          <div className="corner-ornament bottom-left" />
          <div className="corner-ornament bottom-right" />

          <div className="space-y-6">
            {paragraphs.slice(0, visibleParagraphs).map((para, i) => (
              <div key={i} className="animate-fade-in">
                {/* Paragraph number decoration */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1" style={{ background: 'rgba(212,175,55,0.15)' }} />
                  <span className="font-cinzel text-xs" style={{ color: 'rgba(212,175,55,0.3)' }}>
                    {['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][i] ?? String(i + 1)}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'rgba(212,175,55,0.15)' }} />
                </div>

                {i === visibleParagraphs - 1 && !skipped ? (
                  <TypewriterText
                    text={para}
                    speed={20}
                    onDone={i === paragraphs.length - 1 ? () => setAllDone(true) : handleParagraphDone}
                  />
                ) : (
                  <div className="narrative-text">
                    {para.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Decorative bottom */}
          {allDone && (
            <div className="mt-8 text-center animate-fade-in">
              <div className="divider-gold" />
              <p className="font-cinzel text-xs tracking-widest mt-4" style={{ color: 'rgba(212,175,55,0.4)' }}>
                — FIN —
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="py-6 px-4 flex justify-center gap-4 sticky bottom-0"
        style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.95), transparent)' }}>
        {!allDone && (
          <button className="btn-fantasy-secondary" onClick={handleSkip}>
            건너뛰기 →→
          </button>
        )}
        {allDone && (
          <button className="btn-fantasy px-16 py-4 text-lg animate-fade-in"
            onClick={() => setPhase('character_creation')}>
            캐릭터 생성 →
          </button>
        )}
      </div>
    </div>
  )
}
