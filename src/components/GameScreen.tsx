import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { GameMessage, NPC } from '../types/game'
import CharacterInfoPanel from './CharacterInfoPanel'

// ── Fullscreen Scene Viewer ──────────────────────────────
function FullscreenViewer({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="scene-fullscreen-overlay" onClick={onClose}>
      <button className="scene-fullscreen-close" onClick={onClose} aria-label="닫기">✕</button>
      <img
        src={url}
        alt="Scene fullscreen"
        onClick={e => e.stopPropagation()}
        style={{ cursor: 'default' }}
      />
    </div>
  )
}

// ── Top Info Panel (Overlaid at top-left) ──────────────
function TopInfoPanel({
  currentLocation, timeOfDay, weather, onMenuClick
}: {
  currentLocation: string; timeOfDay?: string | null; weather?: string | null;
  onMenuClick: () => void;
}) {
  const { character, world } = useGameStore()

  if (!character) return null
  const s = character.stats
  const hpPct = (s.hp / s.maxHp) * 100
  const manaPct = s.maxMana > 0 ? (s.mana / s.maxMana) * 100 : 0
  const expPct = Math.min(100, (s.experience / (s.level * 100)) * 100)

  const TIME_ICON: Record<string, string> = {
    dawn: '🌅', morning: '☀️', afternoon: '🌤', dusk: '🌇', night: '🌙', midnight: '⭐',
  }
  const WEATHER_ICON: Record<string, string> = {
    '맑음': '☀', '흐림': '☁', '비': '🌧', '폭풍': '⛈', '안개': '🌫', '눈': '❄', '뇌우': '⚡', '사막열풍': '🌪',
  }

  return (
    <div className="vn-info-panel flex flex-col gap-2">
      {/* Top row: Name, Level, Menu */}
      <div className="flex justify-between items-start mb-1">
        <div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span style={{ color: 'rgba(212,175,55,0.8)', fontSize: '13px' }}>⚔</span>
            <span className="font-cinzel font-bold text-sm" style={{ color: '#D4AF37' }}>
              {s.level >= 8 ? '★ ' : ''}{character.name}
            </span>
            <span style={{ color: 'rgba(160,144,112,0.7)', fontSize: '11px' }}>
              Lv.{s.level} {character.characterClass}
            </span>
          </div>
          {currentLocation && (
            <div className="text-xs font-cinzel mt-1" style={{ color: 'rgba(232,213,176,0.85)' }}>
              <span style={{ color: 'rgba(212,175,55,0.7)', marginRight: '4px' }}>📍</span>
              {currentLocation}
              {timeOfDay && <span className="ml-1" title={timeOfDay}>{TIME_ICON[timeOfDay] ?? '🕐'}</span>}
              {weather && <span className="ml-1" style={{ color: 'rgba(160,144,112,0.7)' }}>{WEATHER_ICON[weather]}</span>}
            </div>
          )}
        </div>
        <button
          onClick={onMenuClick}
          className="p-1 rounded transition-colors hover:bg-white/10"
          style={{ color: 'rgba(232,213,176,0.8)' }}
        >
          ≡
        </button>
      </div>

      {/* HP Bar */}
      <div className="flex items-center gap-2">
        <span style={{ color: '#e74c3c', fontSize: '11px', width: '14px' }}>♥</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,0,0,0.15)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#c0392b' }} />
        </div>
        <span style={{ color: 'rgba(232,213,176,0.6)', fontSize: '11px', width: '40px', textAlign: 'right' }}>
          {s.hp}/{s.maxHp}
        </span>
      </div>

      {/* Mana Bar */}
      {s.maxMana > 0 && (
        <div className="flex items-center gap-2">
          <span style={{ color: '#5b9cf6', fontSize: '11px', width: '14px' }}>✦</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(91,156,246,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${manaPct}%`, background: manaPct > 50 ? '#5b9cf6' : manaPct > 20 ? '#8b5cf6' : '#4c1d95' }} />
          </div>
          <span style={{ color: 'rgba(200,220,255,0.6)', fontSize: '11px', width: '40px', textAlign: 'right' }}>
            {s.mana}/{s.maxMana}
          </span>
        </div>
      )}

      {/* Gold & EXP */}
      <div className="flex justify-between items-center mt-1">
        <div className="flex items-center gap-1">
          <span style={{ fontSize: '12px' }}>💰</span>
          <span style={{ color: 'rgba(232,213,176,0.8)', fontSize: '12px', fontWeight: 'bold' }}>{s.gold}</span>
        </div>
        <div className="w-16 h-1 rounded-full overflow-hidden flex items-center" title={`경험치 ${s.experience}/${s.level * 100}`}
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${expPct}%`, background: 'rgba(212,175,55,0.8)' }} />
        </div>
      </div>
    </div>
  )
}

// ── Dropdown Menu ──
function DropdownMenu({
  onShowInfoPanel, onResetGame, onClose
}: {
  onShowInfoPanel: () => void; onResetGame: () => void; onClose: () => void
}) {
  return (
    <div className="absolute top-2 left-20 ml-64 z-50 mt-1 w-40 fantasy-panel rounded-sm overflow-hidden shadow-2xl">
      <button className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/10"
        style={{ color: 'rgba(232,213,176,0.9)', borderBottom: '1px solid #1a1020' }}
        onClick={() => { onClose(); onShowInfoPanel() }}>
        📋 캐릭터 정보
      </button>
      <button className="w-full text-left px-4 py-3 text-sm transition-colors hover:bg-red-900/40"
        style={{ color: '#ff6b6b' }}
        onClick={() => {
          onClose()
          if (confirm('게임을 초기화하시겠습니까? 모든 진행 상황이 사라집니다.')) onResetGame()
        }}>
        🔄 처음부터
      </button>
    </div>
  )
}

function TypewriterParagraphs({
  text, speed = 16, jumpToEnd, onComplete
}: {
  text: string; speed?: number; jumpToEnd?: boolean; onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (jumpToEnd) {
      setDisplayed(text)
      if (onComplete) onComplete()
      return
    }

    let index = 0
    setDisplayed('')

    const timer = setInterval(() => {
      index += 3
      if (index >= text.length) {
        setDisplayed(text)
        clearInterval(timer)
        if (onComplete) onComplete()
        return
      }
      setDisplayed(text.slice(0, index))
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, jumpToEnd])

  return (
    <>
      {displayed.split('\n\n').filter(Boolean).map((para, i) => <p key={i} className="mb-2 last:mb-0">{para}</p>)}
      {displayed.length < text.length && !jumpToEnd && (
        <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
          style={{ background: 'rgba(212,175,55,0.7)' }} />
      )}
    </>
  )
}

// ── Bottom Text Overlay (Narration & Dialogue) ──────────────
function PagedTextOverlay({
  msg, npcName, isLatest, isStreaming
}: {
  msg: GameMessage; npcName: string | null; isLatest: boolean; isStreaming?: boolean
}) {
  const isPlayer = msg.role === 'player'
  const paragraphs = msg.content.split('\n\n').filter(Boolean)

  const [visibleCount, setVisibleCount] = useState(1)
  const [typingDone, setTypingDone] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount(1)
    setTypingDone(false)
  }, [msg.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleCount, typingDone, msg.content])

  const handleClick = () => {
    if (isStreaming || isPlayer) return
    if (!isLatest) return // History view doesn't need typing

    if (!typingDone) {
      setTypingDone(true) // Skip typing
    } else if (visibleCount < paragraphs.length) {
      setVisibleCount(v => v + 1)
      setTypingDone(false)
    }
  }

  return (
    <div className="vn-text-overlay shadow-2xl" onClick={handleClick}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-cinzel tracking-widest text-sm font-bold"
          style={{ color: isPlayer ? 'rgba(100,200,255,0.9)' : (npcName ? 'rgba(212,175,55,0.9)' : 'rgba(160,144,112,0.8)') }}>
          {isPlayer ? '▶ 플레이어 행동' : (npcName ? `◆ ${npcName}` : '◆ 나레이터')}
        </span>
      </div>

      <div ref={scrollRef} className="narrative-text text-base md:text-lg no-scrollbar"
        style={{ lineHeight: '1.7', color: 'rgba(240,230,210,0.95)', overflowY: 'auto', maxHeight: '35vh' }}>
        {isPlayer ? (
          <p className="italic" style={{ color: 'rgba(180,220,255,0.9)' }}>{msg.content}</p>
        ) : isStreaming ? (
          <>
            {paragraphs.map((para, i) => <p key={i} className="mb-3 last:mb-0">{para}</p>)}
            <span className="inline-block w-0.5 h-4 ml-1 align-middle animate-pulse" style={{ background: 'rgba(212,175,55,0.7)' }} />
          </>
        ) : !isLatest ? (
          paragraphs.map((para, i) => <p key={i} className="mb-3 last:mb-0">{para}</p>)
        ) : (
          <>
            {paragraphs.slice(0, visibleCount).map((para, i) => {
              const isActive = i === visibleCount - 1
              return (
                <div key={i} className="mb-3 last:mb-0">
                  {isActive ? (
                    <TypewriterParagraphs
                      text={para} speed={12} jumpToEnd={typingDone}
                      onComplete={() => setTypingDone(true)}
                    />
                  ) : (
                    <p>{para}</p>
                  )}
                </div>
              )
            })}
            {typingDone && visibleCount < paragraphs.length && (
              <div className="text-center animate-bounce mt-2" style={{ color: 'rgba(212,175,55,0.6)', cursor: 'pointer' }}>
                ▼ 계속 읽으려면 클릭
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main GameScreen ───────────────────────────────────
export default function GameScreen() {
  const {
    messages, npcs, sendAction, isProcessing, streamingContent,
    suggestedActions, error, resetGame, currentScene, streamStatus,
    responseTruncated, currentLocation, timeOfDay, weather,
  } = useGameStore()

  const [input, setInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [historyIndex, setHistoryIndex] = useState(0) // 0 = latest, 1 = previous, etc.

  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Current scene image — use the latest available
  const sceneImageUrl = currentScene?.imageUrl
    ?? [...messages].reverse().find(m => m.sceneImageUrl)?.sceneImageUrl
  const scenePending = !sceneImageUrl && messages.some(m => m.sceneImagePending)

  // Navigate messages
  const currentMessages = messages.filter(m => m.role !== 'system') // Filter out hidden messages if any
  const maxIndex = Math.max(0, currentMessages.length - 1)

  // When new message arrives, snap to latest
  useEffect(() => {
    setHistoryIndex(0)
  }, [messages.length])

  // Get the message to display
  const displayMessageIndex = currentMessages.length - 1 - historyIndex
  const displayMsg = currentMessages[displayMessageIndex]

  const displayNpc = displayMsg?.npcId ? npcs.find(n => n.id === displayMsg.npcId) : null
  const displayNpcName = displayNpc?.name ?? displayMsg?.npcName ?? null

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isProcessing) return
    setInput('')
    setHistoryIndex(0) // Reset to latest
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
    <div className="vn-root">
      {/* Background Image Layer */}
      {sceneImageUrl ? (
        <img
          src={sceneImageUrl}
          alt="Background"
          className="vn-bg vn-bg-zoom"
          onClick={() => setShowFullscreen(true)}
        />
      ) : (
        <div className="vn-bg flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="loading-rune mx-auto mb-4" />
            <p className="text-sm" style={{ color: 'rgba(212,175,55,0.6)' }}>
              {scenePending ? '장면 이미지 생성 중...' : '장면 묘사 중...'}
            </p>
          </div>
        </div>
      )}

      {/* Gradient to make bottom text readable */}
      <div className="vn-gradient-bottom" />

      {/* Info Panel Overlay (Top Left) */}
      <TopInfoPanel
        currentLocation={currentLocation}
        timeOfDay={timeOfDay}
        weather={weather}
        onMenuClick={() => setShowMenu(v => !v)}
      />

      {/* Menu Overlay */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <DropdownMenu
            onShowInfoPanel={() => setShowInfoPanel(true)}
            onResetGame={resetGame}
            onClose={() => setShowMenu(false)}
          />
        </>
      )}

      {/* Character Info Sidebar/Overlay */}
      {showInfoPanel && (
        <div className="absolute inset-0 z-50">
          <CharacterInfoPanel onClose={() => setShowInfoPanel(false)} variant="overlay" />
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {showFullscreen && sceneImageUrl && (
        <FullscreenViewer url={sceneImageUrl} onClose={() => setShowFullscreen(false)} />
      )}

      {/* ── Text Overlay (Narration/Dialogue) ── */}
      {isProcessing && streamingContent ? (
        <PagedTextOverlay
          msg={{ id: 'streaming', role: 'narrator', content: streamingContent } as unknown as GameMessage}
          npcName={null}
          isLatest={true}
          isStreaming={true}
        />
      ) : displayMsg ? (
        <div className="relative w-full max-w-[800px] mx-auto">
          {/* Navigation Controls - Positioned exactly above the text overlay */}
          {currentMessages.length > 1 && (
            <div className="absolute top-[calc(100vh-96px-45vh-40px)] right-4 flex items-center gap-3 px-3 py-1 rounded-full text-xs font-bold z-30 shadow-lg"
              style={{ background: 'rgba(30,20,40,0.95)', border: '1px solid rgba(212,175,55,0.4)' }}>
              <button
                onClick={() => setHistoryIndex(Math.min(maxIndex, historyIndex + 1))}
                disabled={historyIndex >= maxIndex}
                className="hover:text-gold disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                style={{ cursor: historyIndex >= maxIndex ? 'not-allowed' : 'pointer' }}
              >◀ 이전</button>
              <span style={{ color: 'rgba(232,213,176,0.6)' }}>
                {maxIndex - historyIndex + 1} / {maxIndex + 1}
              </span>
              <button
                onClick={() => setHistoryIndex(Math.max(0, historyIndex - 1))}
                disabled={historyIndex <= 0}
                className="hover:text-gold disabled:opacity-30 disabled:hover:text-inherit transition-colors"
                style={{ cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer' }}
              >다음 ▶</button>
            </div>
          )}

          <PagedTextOverlay
            msg={displayMsg}
            npcName={displayNpcName}
            isLatest={historyIndex === 0 && displayMsg === currentMessages[currentMessages.length - 1]}
            isStreaming={false}
          />
        </div>
      ) : null}

      {/* Extra loading/error status */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 items-end">
        {isProcessing && streamStatus && (
          <div className="fantasy-panel rounded-sm px-3 py-1.5 text-xs shadow-lg" style={{ color: 'rgba(180,166,130,0.8)' }}>
            ⏳ {streamStatus}
          </div>
        )}
        {error && (
          <div className="fantasy-panel rounded-sm px-4 py-2 text-sm shadow-lg max-w-sm"
            style={{ borderColor: '#8b0000', color: '#e74c3c' }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Input Bar (Bottom) ── */}
      <div className="vn-input-bar">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Quick actions row */}
          {!isProcessing && historyIndex === 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar fade-in">
              {quickActions.map((action, i) => {
                const sepIdx = action.indexOf('||')
                const label = sepIdx >= 0 ? action.slice(0, sepIdx) : action
                return (
                  <button key={i}
                    className="flex-shrink-0 text-left px-4 py-2 rounded-full transition-all duration-200 shadow-md"
                    style={{
                      background: 'rgba(20,15,30,0.6)',
                      border: '1px solid rgba(212,175,55,0.4)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.15)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(20,15,30,0.6)'
                    }}
                    onClick={() => {
                      setInput(sepIdx >= 0 ? action.slice(sepIdx + 2) : label)
                      inputRef.current?.focus()
                    }}>
                    <div className="text-sm font-bold whitespace-nowrap" style={{ color: 'rgba(212,175,55,0.9)' }}>
                      {label}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Text input area */}
          <div className="flex gap-3 relative">
            <textarea
              ref={inputRef}
              className="input-fantasy flex-1 rounded-sm resize-none"
              rows={1}
              style={{
                minHeight: '48px', maxHeight: '120px', fontSize: '15px',
                backgroundColor: 'rgba(10,5,15,0.7)',
                borderColor: 'rgba(212,175,55,0.3)'
              }}
              placeholder={historyIndex > 0 ? "최신 대화로 돌아가려면 클릭하세요..." : "행동이나 대화를 입력하세요... (Enter로 전송)"}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                const el = e.target
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
              onFocus={() => {
                if (historyIndex > 0) setHistoryIndex(0) // Reset to latest if typing starts
              }}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
            />
            <button
              className="btn-fantasy flex-shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              style={{ minWidth: '80px' }}>
              {isProcessing ? (
                <div className="loading-rune w-5 h-5 mx-auto" />
              ) : (
                <span className="font-cinzel text-base font-bold">전송</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
