import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { GameMessage, NPC } from '../types/game'
import CharacterInfoPanel from './CharacterInfoPanel'

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

  const isSvg = url.startsWith('data:image/svg') || url.endsWith('.svg')

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
      {/* 이미지 로드 실패 시 안내 */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #0a0a0f 100%)' }}>
          <span className="text-2xl">🖼</span>
          <p className="text-xs text-center px-4" style={{ color: 'rgba(212,175,55,0.5)' }}>
            이미지를 불러올 수 없습니다
          </p>
          <p className="text-xs text-center px-4" style={{ color: 'rgba(160,144,112,0.35)' }}>
            (fal.ai 키 미설정 또는 생성 실패)
          </p>
        </div>
      )}
      {/* Gradient overlay at bottom */}
      {!error && (
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.9), transparent)' }} />
      )}
    </div>
  )
}


// ── Chat Avatar ───────────────────────────────────────
// Uses snapshotted portraitUrl from the message — NOT global NPC state,
// so icon never changes when NPC emotion updates in later turns.
function ChatAvatar({ portraitUrl, hasNpc }: { portraitUrl?: string; hasNpc: boolean }) {
  const [loaded, setLoaded] = useState(false)

  if (portraitUrl) {
    return (
      <div className="relative" style={{ width: '52px', height: '52px', flexShrink: 0 }}>
        <img
          src={portraitUrl}
          alt="npc"
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
      {hasNpc ? '👤' : '📜'}
    </div>
  )
}

// ── Message Block ─────────────────────────────────────
function MessageBlock({ msg, npcs }: { msg: GameMessage; npcs: NPC[] }) {
  const npc = msg.npcId ? npcs.find(n => n.id === msg.npcId) : null
  // Fallback to msg.npcName when NPC is not yet loaded in npcs array
  const npcDisplayName = npc?.name ?? msg.npcName ?? null
  const npcDisplayLabel = npcDisplayName
    ? `◆ ${npc?.title ? npc.title + ' ' : ''}${npcDisplayName}`
    : '◆ 나레이터'

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
        <ChatAvatar portraitUrl={msg.npcPortraitUrl} hasNpc={!!msg.npcId} />
        <p className="font-cinzel text-center leading-tight"
          style={{
            fontSize: '10px',
            color: npcDisplayName ? 'rgba(212,175,55,0.7)' : 'rgba(160,144,112,0.5)',
            maxWidth: '56px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
          {npcDisplayName ?? 'GM'}
        </p>
        {npcDisplayName && msg.npcEmotion && msg.npcEmotion !== 'neutral' && (
          <p style={{ fontSize: '9px', color: 'rgba(160,144,112,0.45)', maxWidth: '56px', textAlign: 'center' }}>
            [{msg.npcEmotion}]
          </p>
        )}
      </div>

      {/* ── Right: message bubble ── */}
      <div className="flex-1 min-w-0 fantasy-panel rounded-sm">
        <div className="p-4">
          <p className="text-xs mb-2 font-cinzel tracking-widest"
            style={{ color: npcDisplayName ? 'rgba(212,175,55,0.55)' : 'rgba(160,144,112,0.4)' }}>
            {npcDisplayLabel}
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

// ── Time/weather icons ────────────────────────────────
const TIME_ICON: Record<string, string> = {
  dawn: '🌅', morning: '☀️', afternoon: '🌤', dusk: '🌇', night: '🌙', midnight: '⭐',
}
const WEATHER_ICON: Record<string, string> = {
  '맑음': '☀', '흐림': '☁', '비': '🌧', '폭풍': '⛈', '안개': '🌫', '눈': '❄', '뇌우': '⚡', '사막열풍': '🌪',
}

// ── Stats Bar ─────────────────────────────────────────
function StatsBar() {
  const { character, currentLocation, world, timeOfDay, weather } = useGameStore()
  const prevStats = useRef(character?.stats)
  const [flash, setFlash] = useState<{ hp?: boolean; mana?: boolean; gold?: boolean; xp?: boolean }>({})

  useEffect(() => {
    if (!character || !prevStats.current) { prevStats.current = character?.stats; return }
    const prev = prevStats.current
    const cur = character.stats
    const newFlash: typeof flash = {}
    if (cur.hp !== prev.hp) newFlash.hp = true
    if (cur.mana !== prev.mana) newFlash.mana = true
    if (cur.gold !== prev.gold) newFlash.gold = true
    if (cur.experience !== prev.experience || cur.level !== prev.level) newFlash.xp = true
    if (Object.keys(newFlash).length) {
      setFlash(newFlash)
      const t = setTimeout(() => setFlash({}), 1200)
      prevStats.current = cur
      return () => clearTimeout(t)
    }
    prevStats.current = cur
  }, [character?.stats])

  if (!character) return null

  const s = character.stats
  const hpPct = (s.hp / s.maxHp) * 100
  const manaPct = s.maxMana > 0 ? (s.mana / s.maxMana) * 100 : 0
  const expPct = Math.min(100, (s.experience / (s.level * 100)) * 100)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 text-xs"
      style={{ background: 'rgba(5,5,10,0.95)' }}>

      {/* ── 데스크톱: 세계명 ▸ 위치 + 시간/날씨 표시 ── */}
      <div className="hidden lg:flex items-center gap-2 py-2 min-w-0 flex-1 truncate"
        style={{ color: 'rgba(160,144,112,0.5)' }}>
        {world?.name && (
          <span className="font-cinzel flex-shrink-0" style={{ color: 'rgba(212,175,55,0.5)', fontSize: '11px' }}>
            {world.name}
          </span>
        )}
        {world?.name && currentLocation && (
          <span style={{ fontSize: '10px', flexShrink: 0 }}>▸</span>
        )}
        {currentLocation && (
          <span className="truncate" style={{ color: 'rgba(232,213,176,0.65)', fontSize: '11px' }}>{currentLocation}</span>
        )}
        {(timeOfDay || weather) && (
          <span className="flex-shrink-0 flex items-center gap-1 ml-1"
            style={{ fontSize: '11px', color: 'rgba(160,144,112,0.5)' }}>
            {timeOfDay && <span title={timeOfDay}>{TIME_ICON[timeOfDay] ?? '🕐'}</span>}
            {weather && <span title={weather}>{WEATHER_ICON[weather] ?? '🌤'} {weather}</span>}
          </span>
        )}
      </div>

      {/* ── 모바일: 이름 + 레벨 ── */}
      <div className="flex lg:hidden items-center gap-2 shrink-0 py-2">
        <span style={{ color: 'rgba(212,175,55,0.6)' }}>⚔</span>
        <span className="font-cinzel" style={{ color: '#D4AF37' }}>{s.level >= 8 ? '★ ' : ''}{character.name}</span>
        <span style={{ color: 'rgba(160,144,112,0.5)' }}>Lv.{s.level} {character.characterClass}</span>
        <div className="w-10 h-1 rounded-full overflow-hidden" title={`경험치 ${s.experience}/${s.level * 100}`}
          style={{ background: 'rgba(255,255,255,0.07)', outline: flash.xp ? '1px solid rgba(255,220,100,0.7)' : 'none', transition: 'outline 0.3s' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${expPct}%`, background: 'rgba(212,175,55,0.6)' }} />
        </div>
      </div>

      {/* ── 모바일: HP / Mana / Gold / Location ── */}
      <div className="flex lg:hidden items-center flex-wrap gap-x-3 gap-y-1 py-2">
        <div className="flex items-center gap-1.5 shrink-0"
          style={{ outline: flash.hp ? `1px solid ${s.hp < s.maxHp * 0.3 ? '#e74c3c' : 'rgba(231,76,60,0.5)'}` : 'none', borderRadius: '2px', transition: 'outline 0.3s' }}>
          <span style={{ color: '#e74c3c' }}>♥</span>
          <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,0,0,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#c0392b' }} />
          </div>
          <span style={{ color: 'rgba(232,213,176,0.6)' }}>{s.hp}/{s.maxHp}</span>
        </div>
        {s.maxMana > 0 && (
          <div className="flex items-center gap-1.5 shrink-0"
            style={{ outline: flash.mana ? '1px solid rgba(100,160,255,0.5)' : 'none', borderRadius: '2px', transition: 'outline 0.3s' }}>
            <span style={{ color: '#5b9cf6' }}>✦</span>
            <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(91,156,246,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${manaPct}%`, background: manaPct > 50 ? '#5b9cf6' : manaPct > 20 ? '#8b5cf6' : '#4c1d95' }} />
            </div>
            <span style={{ color: 'rgba(200,220,255,0.6)' }}>{s.mana}/{s.maxMana}</span>
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0"
          style={{ outline: flash.gold ? '1px solid rgba(212,175,55,0.6)' : 'none', borderRadius: '2px', transition: 'outline 0.3s' }}>
          <span>💰</span>
          <span style={{ color: 'rgba(232,213,176,0.6)' }}>{s.gold}G</span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <span className="truncate" style={{ color: 'rgba(232,213,176,0.7)' }}>
            <span style={{ color: 'rgba(160,144,112,0.5)' }}>📍 </span>
            {currentLocation}
          </span>
          {(timeOfDay || weather) && (
            <span className="flex items-center gap-1 flex-shrink-0"
              style={{ fontSize: '11px', color: 'rgba(160,144,112,0.55)' }}>
              {timeOfDay && <span>{TIME_ICON[timeOfDay] ?? '🕐'}</span>}
              {weather && <span>{WEATHER_ICON[weather] ?? ''} {weather}</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main GameScreen ───────────────────────────────────
export default function GameScreen() {
  const { messages, npcs, sendAction, isProcessing, streamingContent, suggestedActions, error, resetGame } = useGameStore()
  const [input, setInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
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
      {/* Mobile overlay (hidden on lg+) */}
      {showInfoPanel && (
        <div className="lg:hidden">
          <CharacterInfoPanel onClose={() => setShowInfoPanel(false)} variant="overlay" />
        </div>
      )}

      {/* Top bar: Stats + Menu */}
      <div style={{ background: 'rgba(5,5,10,0.95)', borderBottom: '1px solid #1a1020' }}>
        <div className="flex items-stretch">
        <div className="flex-1 min-w-0">
          <StatsBar />
        </div>

        {/* Hamburger menu — mobile only (lg: hidden) */}
        <div className="lg:hidden relative flex-shrink-0 flex items-center px-2" ref={menuRef}>
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
                onClick={() => { setShowMenu(false); setShowInfoPanel(true) }}>
                📋 캐릭터 정보
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

        {/* Desktop menu */}
        <div className="hidden lg:flex relative flex-shrink-0 items-center px-2" ref={menuRef}>
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
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Desktop left sidebar — always visible on lg+ */}
        <div className="hidden lg:block flex-shrink-0 overflow-hidden"
          style={{
            width: '240px',
            borderRight: '1px solid rgba(212,175,55,0.12)',
          }}>
          <CharacterInfoPanel onClose={() => {}} variant="sidebar" />
        </div>

        {/* Messages + Input column — flex-col keeps input aligned with messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-6" style={{ maxWidth: '780px', margin: '0 auto' }}>

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
        </div>{/* end max-w */}
        </div>{/* end overflow-y-auto */}

        {/* Input area — inside messages column so it aligns with content */}
        <div style={{ borderTop: '1px solid #1a1020', background: 'rgba(5,5,10,0.98)', flexShrink: 0 }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Quick actions */}
        <div className="px-3 pt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickActions.map(action => {
            const sepIdx = action.indexOf('||')
            const label  = sepIdx >= 0 ? action.slice(0, sepIdx) : action
            const detail = sepIdx >= 0 ? action.slice(sepIdx + 2) : ''
            return (
              <button key={action}
                className="flex-shrink-0 text-left px-3 py-2 rounded-sm transition-all duration-200"
                style={{
                  background: 'rgba(212,175,55,0.05)',
                  border: '1px solid rgba(61,46,26,0.5)',
                  minWidth: detail ? '110px' : undefined,
                  maxWidth: '190px',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.45)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.1)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,46,26,0.5)'
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.05)'
                }}
                onClick={() => {
                  // detail이 있으면 detail 텍스트를, 없으면 label을 입력창에 넣음
                  setInput(detail || label)
                  inputRef.current?.focus()
                }}
                disabled={isProcessing}>
                <div className="text-xs font-bold whitespace-nowrap" style={{ color: 'rgba(212,175,55,0.9)', lineHeight: 1.3 }}>{label}</div>
                {detail && (
                  <div style={{ color: 'rgba(160,144,112,0.65)', fontSize: '10px', lineHeight: 1.35, marginTop: '3px', whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                    {detail}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Text input row — stretch aligns button height with textarea */}
        <div className="flex gap-2 px-3 py-3" style={{ alignItems: 'stretch' }}>
          <textarea
            ref={inputRef}
            className="input-fantasy flex-1 rounded-sm resize-none"
            rows={1}
            style={{ minHeight: '46px', maxHeight: '160px', fontSize: '16px', lineHeight: '1.5', overflowY: 'auto', paddingTop: '12px', paddingBottom: '12px', boxSizing: 'border-box' }}
            placeholder="행동이나 대화를 입력하세요... (Enter로 전송)"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 160) + 'px'
            }}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />

          {/* Send button stretches to match textarea height */}
          <button
            className="btn-fantasy flex-shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            style={{ minWidth: '56px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
            {isProcessing ? (
              <div className="loading-rune w-5 h-5" />
            ) : (
              <span className="font-cinzel text-xs">전송</span>
            )}
          </button>
        </div>
        </div>{/* end input max-w */}
        </div>{/* end input area */}
        </div>{/* end messages+input flex-col */}
      </div>{/* end flex-1 flex overflow-hidden */}
    </div>
  )
}
