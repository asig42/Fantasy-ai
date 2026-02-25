import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { GameMessage, NPC } from '../types/game'

// ── Scene image display ──────────────────────────────
function SceneImage({ url, alt, pending }: { url?: string; alt: string; pending?: boolean }) {
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
            <p className="text-xs" style={{ color: 'rgba(212,175,55,0.4)' }}>
              {pending ? '장면 이미지 생성 중...' : '장면 묘사 중...'}
            </p>
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


// ── Chat Avatar ───────────────────────────────────────
function ChatAvatar({ npc }: { npc: NPC | null }) {
  const [loaded, setLoaded] = useState(false)

  if (npc?.portraitUrl) {
    return (
      <div className="relative" style={{ width: '52px', height: '52px', flexShrink: 0 }}>
        <img
          src={npc.portraitUrl}
          alt={npc.name}
          className="w-full h-full rounded-full object-cover"
          style={{
            objectPosition: 'top',
            border: '1.5px solid rgba(212,175,55,0.45)',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s',
          }}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(15,10,25,0.9)', border: '1.5px solid rgba(212,175,55,0.2)' }}>
            <div className="loading-rune w-4 h-4" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center rounded-full text-2xl"
      style={{
        width: '52px', height: '52px', flexShrink: 0,
        background: 'rgba(15,10,25,0.9)',
        border: '1.5px solid rgba(212,175,55,0.2)',
      }}>
      {npc ? '👤' : '📜'}
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
        <div className="max-w-xs sm:max-w-lg px-4 py-3 rounded-sm"
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
    <div className="animate-fade-in flex items-start gap-3">

      {/* ── Left: avatar (sticky) ── */}
      <div className="flex-shrink-0 self-start flex flex-col items-center gap-1"
        style={{ position: 'sticky', top: '16px' }}>
        <ChatAvatar npc={npc ?? null} />
        <p className="font-cinzel text-center leading-tight"
          style={{
            fontSize: '10px',
            color: npc ? 'rgba(212,175,55,0.7)' : 'rgba(160,144,112,0.5)',
            maxWidth: '56px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
          {npc?.name ?? 'GM'}
        </p>
        {npc && msg.npcEmotion && msg.npcEmotion !== 'neutral' && (
          <p style={{ fontSize: '9px', color: 'rgba(160,144,112,0.45)', maxWidth: '56px', textAlign: 'center' }}>
            [{msg.npcEmotion}]
          </p>
        )}
      </div>

      {/* ── Right: message bubble ── */}
      <div className="flex-1 min-w-0 fantasy-panel rounded-sm">
        <div className="p-4">
          <p className="text-xs mb-2 font-cinzel tracking-widest"
            style={{ color: npc ? 'rgba(212,175,55,0.55)' : 'rgba(160,144,112,0.4)' }}>
            {npc ? `◆ ${npc.title} ${npc.name}` : '◆ 나레이터'}
          </p>
          <div className="narrative-text text-sm">{formattedContent}</div>
        </div>

        {/* ── Scene image: show loading box if pending, show image when ready ── */}
        {(msg.sceneImageUrl || msg.sceneImagePending) && (
          <div style={{ borderTop: '1px solid rgba(31,22,44,0.6)', overflow: 'hidden' }}>
            <SceneImage url={msg.sceneImageUrl} alt="Scene" pending={msg.sceneImagePending} />
          </div>
        )}
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs"
      style={{ background: 'rgba(5,5,10,0.95)' }}>

      {/* Row 1: Name + HP + Gold (always together) */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: 'rgba(212,175,55,0.6)' }}>⚔</span>
          <span className="font-cinzel" style={{ color: '#D4AF37' }}>
            {character.name}
          </span>
          <span style={{ color: 'rgba(160,144,112,0.5)' }}>
            Lv.{character.stats.level} {character.characterClass}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span style={{ color: '#e74c3c' }}>♥</span>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,0,0,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#c0392b' }} />
          </div>
          <span style={{ color: 'rgba(232,213,176,0.6)' }}>{character.stats.hp}/{character.stats.maxHp}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0" style={{ color: 'rgba(212,175,55,0.6)' }}>
          <span>💰</span>
          <span style={{ color: 'rgba(232,213,176,0.6)' }}>{character.stats.gold}G</span>
        </div>
      </div>

      {/* Row 2 on mobile / inline on desktop: Location */}
      <div className="w-full sm:w-auto sm:ml-auto sm:text-right truncate"
        style={{ color: 'rgba(232,213,176,0.7)' }}>
        <span style={{ color: 'rgba(160,144,112,0.5)' }}>📍 </span>
        <span>{currentLocation}</span>
      </div>
    </div>
  )
}

// ── Main GameScreen ───────────────────────────────────
export default function GameScreen() {
  const { messages, npcs, sendAction, isProcessing, streamingContent, suggestedActions, error, resetGame } = useGameStore()
  const [input, setInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when new content arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

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

  const DEFAULT_ACTIONS = ['주변을 살펴본다', '앞으로 나아간다', '누군가에게 말을 건다', '현재 상황을 파악한다']
  const quickActions = suggestedActions.length > 0 ? suggestedActions : DEFAULT_ACTIONS

  return (
    <div className="flex flex-col h-screen" style={{ background: '#05050a' }}>

      {/* Top bar: Stats + Menu */}
      <div className="flex items-stretch" style={{ background: 'rgba(5,5,10,0.95)', borderBottom: '1px solid #1a1020' }}>
        <div className="flex-1 min-w-0">
          <StatsBar />
        </div>

        {/* Hamburger menu — top right */}
        <div className="relative flex-shrink-0 flex items-center px-2" ref={menuRef}>
          <button
            className="px-2 py-1 rounded-sm transition-colors"
            style={{ color: 'rgba(160,144,112,0.6)', fontSize: '18px', lineHeight: 1 }}
            onClick={() => setShowMenu(v => !v)}
            aria-label="메뉴">
            ≡
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-1 w-36 fantasy-panel rounded-sm overflow-hidden"
              style={{ zIndex: 50 }}>
              <button className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: 'rgba(232,213,176,0.8)', borderBottom: '1px solid #1a1020' }}
                onClick={() => setShowMenu(false)}>
                📜 대화 기록
              </button>
              <button className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                style={{ color: 'rgba(232,213,176,0.8)', borderBottom: '1px solid #1a1020' }}
                onClick={() => setShowMenu(false)}>
                👑 NPC 목록
              </button>
              <button className="w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-red-900/20"
                style={{ color: '#e74c3c' }}
                onClick={() => {
                  setShowMenu(false)
                  if (confirm('게임을 초기화하시겠습니까? 모든 진행 상황이 사라집니다.')) resetGame()
                }}>
                🔄 처음부터
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Messages column */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

          {messages.map(msg => (
            <MessageBlock key={msg.id} msg={msg} npcs={npcs} />
          ))}

          {/* Streaming block — shows narration as it arrives */}
          {isProcessing && streamingContent && (
            <div className="animate-fade-in">
              <div className="fantasy-panel rounded-sm p-5">
                <p className="text-xs mb-3 font-cinzel tracking-widest"
                  style={{ color: 'rgba(160,144,112,0.4)' }}>◆ 나레이터</p>
                <div className="narrative-text text-sm" style={{ color: 'rgba(232,213,176,0.85)' }}>
                  {streamingContent.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} className="mb-4 last:mb-0">{para}</p>
                  ))}
                  <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                    style={{ background: 'rgba(212,175,55,0.7)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Spinner — shows before first chunk arrives */}
          {isProcessing && !streamingContent && (
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
      </div>

      {/* Input area */}
      <div style={{ borderTop: '1px solid #1a1020', background: 'rgba(5,5,10,0.98)' }}>

        {/* Quick actions */}
        <div className="px-3 pt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickActions.map(action => (
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
            style={{ minHeight: '60px', maxHeight: '120px', fontSize: '16px' }}
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
        </div>
      </div>
    </div>
  )
}
