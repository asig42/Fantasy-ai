import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { GameMessage, NPC } from '../types/game'

// ── Scene image display ──────────────────────────────
function SceneImage({ url, alt }: { url?: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setError(false)
  }, [url])

  if (!url) {
    return (
      <div className="scene-image-container"
        style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #0a0a0f 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="loading-rune mx-auto mb-2" />
            <p className="text-xs" style={{ color: 'rgba(212,175,55,0.4)' }}>장면 묘사 중...</p>
          </div>
        </div>
      </div>
    )
  }

  const isSvg = url.endsWith('.svg')

  return (
    <div className="scene-image-container"
      style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #0a0a0f 100%)' }}>
      {!error && (
        isSvg ? (
          <object data={url} type="image/svg+xml"
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.8s' }}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}>
            <img src={url} alt={alt} onLoad={() => setLoaded(true)} onError={() => setError(true)} />
          </object>
        ) : (
          <img src={url} alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s' }}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )
      )}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #0a0a0f 100%)' }}>
          <div className="loading-rune" />
        </div>
      )}
      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.9), transparent)' }} />
    </div>
  )
}

// ── NPC Portrait ─────────────────────────────────────
function NpcPortrait({ npc, emotion }: { npc: NPC; emotion?: string }) {
  const [loaded, setLoaded] = useState(false)
  const portraitUrl = npc.portraitUrl

  return (
    <div className="relative h-full flex flex-col items-center">
      {/* Portrait */}
      <div className="relative flex-1 flex items-end overflow-hidden"
        style={{ maxHeight: '300px', minWidth: '120px' }}>
        {portraitUrl ? (
          <img src={portraitUrl} alt={npc.name}
            className="npc-portrait"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="w-24 h-32 flex items-center justify-center text-5xl"
            style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.3))' }}>
            👤
          </div>
        )}
        {!loaded && portraitUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="loading-rune w-8 h-8" />
          </div>
        )}

        {/* Glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.95), transparent)' }} />
      </div>

      {/* Name tag */}
      <div className="mt-1 text-center px-2 pb-1">
        <p className="font-cinzel text-xs" style={{ color: '#D4AF37' }}>{npc.title}</p>
        <p className="font-cinzel text-sm" style={{ color: 'rgba(232,213,176,0.9)' }}>{npc.name}</p>
        {emotion && emotion !== 'neutral' && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(160,144,112,0.5)' }}>
            [{emotion}]
          </p>
        )}
      </div>
    </div>
  )
}

// ── Message Block ─────────────────────────────────────
function MessageBlock({ msg, npcs }: { msg: GameMessage; npcs: NPC[] }) {
  const npc = msg.npcId ? npcs.find(n => n.id === msg.npcId) : null

  const formattedContent = msg.content
    .split('\n\n')
    .filter(Boolean)
    .map((para, i) => <p key={i} className="mb-4 last:mb-0">{para}</p>)

  if (msg.role === 'player') {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg px-4 py-3 rounded-sm"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}>
          <p className="text-xs mb-1 font-cinzel" style={{ color: 'rgba(212,175,55,0.5)' }}>
            ▶ 행동
          </p>
          <p className="text-sm" style={{ color: 'rgba(232,213,176,0.8)' }}>{msg.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Scene image for this message */}
      {msg.sceneImageUrl && (
        <div className="mb-4">
          <SceneImage url={msg.sceneImageUrl} alt="Scene" />
        </div>
      )}

      {/* Text + NPC portrait */}
      <div className={`flex gap-4 ${npc ? 'items-end' : ''}`}>
        {npc && (
          <div className="flex-shrink-0" style={{ width: '120px' }}>
            <NpcPortrait npc={npc} emotion={msg.npcEmotion} />
          </div>
        )}

        <div className="flex-1 fantasy-panel rounded-sm p-5 relative">
          {/* Role indicator */}
          <p className="text-xs mb-3 font-cinzel tracking-widest"
            style={{ color: npc ? 'rgba(212,175,55,0.6)' : 'rgba(160,144,112,0.4)' }}>
            {npc ? `◆ ${npc.name}` : '◆ 나레이터'}
          </p>

          <div className="narrative-text text-sm">
            {formattedContent}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stats Bar ─────────────────────────────────────────
function StatsBar() {
  const { character, currentLocation, npcs } = useGameStore()
  if (!character) return null

  const hpPct = (character.stats.hp / character.stats.maxHp) * 100

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-xs"
      style={{ background: 'rgba(5,5,10,0.95)', borderBottom: '1px solid #1a1020' }}>
      <div className="flex items-center gap-2">
        <span style={{ color: 'rgba(212,175,55,0.6)' }}>⚔</span>
        <span className="font-cinzel" style={{ color: '#D4AF37' }}>
          {character.name}
        </span>
        <span style={{ color: 'rgba(160,144,112,0.5)' }}>
          Lv.{character.stats.level} {character.characterClass}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <span style={{ color: '#e74c3c' }}>♥</span>
        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,0,0,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#c0392b' }} />
        </div>
        <span style={{ color: 'rgba(232,213,176,0.6)' }}>{character.stats.hp}/{character.stats.maxHp}</span>
      </div>

      <div className="flex items-center gap-1" style={{ color: 'rgba(212,175,55,0.6)' }}>
        <span>💰</span>
        <span style={{ color: 'rgba(232,213,176,0.6)' }}>{character.stats.gold}G</span>
      </div>

      <div className="flex-1 text-right">
        <span style={{ color: 'rgba(160,144,112,0.5)' }}>📍 </span>
        <span style={{ color: 'rgba(232,213,176,0.7)' }}>{currentLocation}</span>
      </div>
    </div>
  )
}

// ── Main GameScreen ───────────────────────────────────
export default function GameScreen() {
  const { messages, npcs, currentScene, sendAction, isProcessing, error, resetGame } = useGameStore()
  const [input, setInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const latestMsg = messages[messages.length - 1]
  const currentNpc = latestMsg?.npcId ? npcs.find(n => n.id === latestMsg.npcId) : null

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isProcessing) return
    setInput('')
    await sendAction(text)
    inputRef.current?.focus()
  }, [input, isProcessing, sendAction])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const QUICK_ACTIONS = ['주변을 살펴본다', '앞으로 나아간다', '누군가에게 말을 건다', '현재 상황을 파악한다']

  return (
    <div className="flex flex-col h-screen" style={{ background: '#05050a' }}>

      {/* Stats bar */}
      <StatsBar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Messages column */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

          {/* Current scene (latest) at top */}
          {currentScene?.imageUrl && messages.length > 0 && (
            <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-2">
              <SceneImage url={currentScene.imageUrl} alt="Current Scene" />
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <MessageBlock key={msg.id} msg={msg} npcs={npcs} />
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="fantasy-panel rounded-sm px-5 py-3 flex items-center gap-3">
                <div className="loading-rune w-5 h-5" />
                <span className="text-sm" style={{ color: 'rgba(160,144,112,0.7)' }}>
                  게임 마스터가 이야기를 쓰는 중...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="fantasy-panel rounded-sm p-3 text-sm text-center"
              style={{ borderColor: '#8b0000', color: '#e74c3c' }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* NPC side panel (when in dialogue) */}
        {currentNpc && (
          <div className="w-40 flex-shrink-0 flex flex-col items-center justify-end pb-4 px-2"
            style={{ borderLeft: '1px solid #1a1020', background: 'rgba(5,5,10,0.7)' }}>
            <NpcPortrait npc={currentNpc} emotion={latestMsg?.npcEmotion} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ borderTop: '1px solid #1a1020', background: 'rgba(5,5,10,0.98)' }}>

        {/* Quick actions */}
        <div className="px-3 pt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_ACTIONS.map(action => (
            <button key={action}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-sm whitespace-nowrap transition-all duration-200"
              style={{
                background: 'rgba(212,175,55,0.05)',
                border: '1px solid rgba(61,46,26,0.5)',
                color: 'rgba(160,144,112,0.7)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'
                ;(e.target as HTMLElement).style.color = 'rgba(212,175,55,0.8)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = 'rgba(61,46,26,0.5)'
                ;(e.target as HTMLElement).style.color = 'rgba(160,144,112,0.7)'
              }}
              onClick={() => setInput(action)}
              disabled={isProcessing}>
              {action}
            </button>
          ))}
        </div>

        {/* Text input row */}
        <div className="flex items-end gap-2 px-3 py-3">
          <textarea
            ref={inputRef}
            className="input-fantasy flex-1 rounded-sm resize-none text-sm"
            rows={2}
            style={{ minHeight: '60px', maxHeight: '120px' }}
            placeholder="행동이나 대화를 입력하세요... (Enter로 전송)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />

          {/* Send button */}
          <button
            className="btn-fantasy px-4 py-3 flex-shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            style={{ minHeight: '60px' }}>
            {isProcessing ? (
              <div className="loading-rune w-5 h-5" />
            ) : (
              <span className="font-cinzel text-xs">전송</span>
            )}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              className="btn-fantasy-secondary px-3 py-3 flex-shrink-0"
              style={{ minHeight: '60px' }}
              onClick={() => setShowMenu(!showMenu)}>
              <span className="text-lg">≡</span>
            </button>

            {showMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-40 fantasy-panel rounded-sm overflow-hidden"
                style={{ zIndex: 50 }}>
                <button className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5"
                  style={{ color: 'rgba(232,213,176,0.8)', borderBottom: '1px solid #1a1020' }}
                  onClick={() => { setShowMenu(false) }}>
                  📜 대화 기록
                </button>
                <button className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/5"
                  style={{ color: 'rgba(232,213,176,0.8)', borderBottom: '1px solid #1a1020' }}
                  onClick={() => { setShowMenu(false) }}>
                  👑 NPC 목록
                </button>
                <button className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-red-900/20"
                  style={{ color: '#e74c3c' }}
                  onClick={() => {
                    setShowMenu(false)
                    if (confirm('게임을 초기화하시겠습니까? 모든 진행 상황이 사라집니다.')) {
                      resetGame()
                    }
                  }}>
                  🔄 처음부터
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
