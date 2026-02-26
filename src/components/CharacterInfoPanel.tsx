import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Quest, NPC } from '../types/game'

// ── 이미지 확대 모달 ───────────────────────────────────────
function ImageModal({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="fantasy-panel rounded-sm overflow-hidden">
          <img src={src} alt={name}
            className="w-full object-contain"
            style={{ maxHeight: '70vh' }} />
          <div className="px-3 py-2 text-center">
            <span className="font-cinzel text-xs" style={{ color: 'rgba(212,175,55,0.8)' }}>{name}</span>
          </div>
        </div>
        <button
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'rgba(212,175,55,0.8)' }}
          onClick={onClose}>✕</button>
      </div>
    </div>
  )
}

// ── 텍스트 확장 모달 ──────────────────────────────────────
function TextModal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="fantasy-panel rounded-sm overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
            <span className="font-cinzel text-xs tracking-wider" style={{ color: 'rgba(212,175,55,0.8)' }}>{title}</span>
          </div>
          <div className="px-4 py-4">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,185,155,0.85)', whiteSpace: 'pre-wrap' }}>
              {content}
            </p>
          </div>
        </div>
        <button
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs"
          style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'rgba(212,175,55,0.8)' }}
          onClick={onClose}>✕</button>
      </div>
    </div>
  )
}

const CLASS_EMOJI: Record<string, string> = {
  '전사': '⚔', '마법사': '🔮', '도적': '🗡', '성직자': '✝',
  '사냥꾼': '🏹', '연금술사': '⚗', '음유시인': '🎵', '팔라딘': '🛡',
}

const STATUS_COLOR: Record<Quest['status'], string> = {
  active:    '#D4AF37',
  completed: '#4ade80',
  failed:    '#f87171',
}
const STATUS_LABEL: Record<Quest['status'], string> = {
  active: '진행중', completed: '완료', failed: '실패',
}

interface Props {
  onClose: () => void
  /** 'sidebar' = inline static panel (desktop), 'overlay' = full-screen slide-out (mobile) */
  variant?: 'overlay' | 'sidebar'
}

// ── 공통 패널 콘텐츠 ──────────────────────────────────────
function PanelContent() {
  const { character, currentLocation, quests, messages, npcs, mapImageUrl, world } = useGameStore()
  const [mapExpanded, setMapExpanded] = useState(false)
  const [backstoryOpen, setBackstoryOpen] = useState(false)
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null)
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  if (!character) return null

  const s = character.stats
  const hpPct  = Math.round((s.hp / s.maxHp) * 100)
  const manaPct = s.maxMana > 0 ? Math.round((s.mana / s.maxMana) * 100) : 0
  const expPct  = Math.min(100, Math.round((s.experience / (s.level * 100)) * 100))

  const appearedNpcIds = [...new Set(messages.filter(m => m.npcId).map(m => m.npcId!))]
  const appearedNpcs = appearedNpcIds.map(id => npcs.find(n => n.id === id)).filter(Boolean)
  const activeQuests  = quests.filter(q => q.status === 'active')
  const doneQuests    = quests.filter(q => q.status !== 'active')

  return (
    <div className="flex flex-col gap-3 p-3">

      {/* ── 세계 지도 ── */}
      {mapImageUrl && (
        <div className="fantasy-panel rounded-sm overflow-hidden">
          <button className="w-full text-left relative block" onClick={() => setMapExpanded(v => !v)}>
            <img
              src={mapImageUrl}
              alt={`${world?.name ?? ''} 지도`}
              className="w-full object-cover"
              style={{ height: mapExpanded ? '180px' : '72px', transition: 'height 0.3s ease', objectPosition: 'center' }}
            />
            <div className="absolute inset-0 flex items-end p-1.5"
              style={{ background: 'linear-gradient(to top, rgba(5,5,10,0.85) 0%, transparent 55%)' }}>
              <span className="font-cinzel" style={{ fontSize: '10px', color: 'rgba(212,175,55,0.8)' }}>
                🗺 {world?.name ?? '세계 지도'} {mapExpanded ? '▲' : '▼'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── 캐릭터 기본 정보 ── */}
      <div className="fantasy-panel rounded-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center rounded-full text-2xl flex-shrink-0"
            style={{
              width: '48px', height: '48px',
              background: 'rgba(212,175,55,0.08)',
              border: '1.5px solid rgba(212,175,55,0.3)',
            }}>
            {CLASS_EMOJI[character.characterClass] ?? '⚔'}
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-sm font-bold truncate" style={{ color: '#D4AF37' }}>
              {character.name}
            </p>
            <p className="text-xs" style={{ color: 'rgba(160,144,112,0.7)' }}>
              Lv.{s.level} {character.characterClass}
            </p>
            {currentLocation && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(160,144,112,0.5)' }}>
                📍 {currentLocation}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <StatBar label="HP" value={s.hp} max={s.maxHp} pct={hpPct}
            color={hpPct > 50 ? '#e74c3c' : hpPct > 25 ? '#e67e22' : '#c0392b'} />
          {s.maxMana > 0 && (
            <StatBar label="MP" value={s.mana} max={s.maxMana} pct={manaPct} color="#5b9cf6" />
          )}
          <StatBar label="EXP" value={s.experience} max={s.level * 100} pct={expPct}
            color="rgba(212,175,55,0.6)" />
          <div className="flex items-center justify-between text-xs mt-1"
            style={{ color: 'rgba(160,144,112,0.6)' }}>
            <span>💰 {s.gold}G</span>
            <span style={{ color: 'rgba(160,144,112,0.4)' }}>
              {character.gender} · {character.age}세
            </span>
          </div>
        </div>
      </div>

      {/* ── 배경 이야기 (클릭하면 전체 보기) ── */}
      <button
        className="w-full text-left fantasy-panel rounded-sm p-3 transition-colors"
        style={{ cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.06)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
        onClick={() => setBackstoryOpen(true)}
      >
        <h3 className="font-cinzel text-xs mb-1.5 tracking-wider flex items-center gap-1" style={{ color: 'rgba(212,175,55,0.7)' }}>
          📖 배경
          <span style={{ fontSize: '9px', color: 'rgba(212,175,55,0.4)', marginLeft: 'auto' }}>클릭하여 전체 보기 ▶</span>
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(200,185,155,0.75)' }}>
          {character.backstory.length > 140
            ? character.backstory.slice(0, 140) + '...'
            : character.backstory}
        </p>
      </button>

      {/* 배경 스토리 전체 모달 */}
      {backstoryOpen && (
        <TextModal
          title={`📖 ${character.name}의 배경 이야기`}
          content={character.backstory}
          onClose={() => setBackstoryOpen(false)}
        />
      )}

      {/* ── 활성 퀘스트 ── */}
      <div className="fantasy-panel rounded-sm p-3">
        <h3 className="font-cinzel text-xs mb-2 tracking-wider" style={{ color: 'rgba(212,175,55,0.7)' }}>
          ⚡ 퀘스트 {quests.length > 0 && `(${activeQuests.length}/${quests.length})`}
        </h3>
        {quests.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(160,144,112,0.4)' }}>퀘스트 생성 중...</p>
        ) : (
          <div className="space-y-3">
            {activeQuests.map(q => <QuestCard key={q.id} quest={q} onClick={() => setSelectedQuest(q)} />)}
            {doneQuests.length > 0 && (
              <>
                <div className="h-px" style={{ background: 'rgba(212,175,55,0.1)' }} />
                {doneQuests.map(q => <QuestCard key={q.id} quest={q} onClick={() => setSelectedQuest(q)} />)}
              </>
            )}
          </div>
        )}
      </div>

      {/* 퀘스트 상세 모달 */}
      {selectedQuest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSelectedQuest(null)}
        >
          <div
            className="relative max-w-md w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="fantasy-panel rounded-sm overflow-hidden">
              {/* 모달 헤더 */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                <span style={{ color: STATUS_COLOR[selectedQuest.status], fontSize: '10px' }}>◆</span>
                <span className="font-cinzel text-xs tracking-wider flex-1" style={{ color: 'rgba(212,175,55,0.8)' }}>
                  {selectedQuest.title}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                  background: 'rgba(0,0,0,0.4)',
                  color: STATUS_COLOR[selectedQuest.status],
                  fontSize: '9px',
                  border: `1px solid ${STATUS_COLOR[selectedQuest.status]}40`,
                }}>
                  {STATUS_LABEL[selectedQuest.status]}
                </span>
              </div>

              {/* 설명 */}
              {selectedQuest.description && (
                <div className="px-4 py-3" style={{ borderBottom: selectedQuest.objectives.length > 0 ? '1px solid rgba(212,175,55,0.08)' : 'none' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,185,155,0.85)', whiteSpace: 'pre-wrap' }}>
                    {selectedQuest.description}
                  </p>
                </div>
              )}

              {/* 목표 목록 */}
              {selectedQuest.objectives.length > 0 && (
                <div className="px-4 py-3">
                  <p className="font-cinzel text-xs mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>목표</p>
                  <ul className="space-y-1.5">
                    {selectedQuest.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(160,144,112,0.75)' }}>
                        <span style={{ fontSize: '8px', marginTop: '5px', color: STATUS_COLOR[selectedQuest.status], flexShrink: 0 }}>
                          {selectedQuest.status === 'completed' ? '✓' : '○'}
                        </span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'rgba(212,175,55,0.8)' }}
              onClick={() => setSelectedQuest(null)}>✕</button>
          </div>
        </div>
      )}

      {/* ── 인물 관계 ── */}
      <div className="fantasy-panel rounded-sm p-3">
        <h3 className="font-cinzel text-xs mb-2 tracking-wider" style={{ color: 'rgba(212,175,55,0.7)' }}>
          👥 인물 관계
        </h3>
        {appearedNpcs.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(160,144,112,0.4)' }}>아직 만난 인물이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {appearedNpcs.map(npc => npc && (
              <div key={npc.id} className="flex items-start gap-2">
                <button
                  className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm transition-opacity"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', cursor: npc.portraitUrl ? 'pointer' : 'default' }}
                  onClick={() => npc.portraitUrl && setSelectedNpc(npc)}
                  title={npc.portraitUrl ? '클릭하여 사진 확대' : undefined}
                >
                  {npc.portraitUrl
                    ? <img src={npc.portraitUrl} alt={npc.name}
                        className="w-full h-full object-cover" style={{ objectPosition: 'top' }} />
                    : <span>👤</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: 'rgba(232,213,176,0.9)' }}>{npc.name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(160,144,112,0.6)' }}>{npc.title}{npc.age ? ` · ${npc.age}세` : ''}</p>
                  {npc.relationshipToPlayer && (
                    <p className="mt-0.5" style={{ color: 'rgba(160,144,112,0.5)', fontSize: '10px' }}>
                      {npc.relationshipToPlayer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* NPC 초상화 확대 모달 */}
      {selectedNpc?.portraitUrl && (
        <ImageModal
          src={selectedNpc.portraitUrl}
          name={`${selectedNpc.title} ${selectedNpc.name}`}
          onClose={() => setSelectedNpc(null)}
        />
      )}
      </div>

    </div>
  )
}

export default function CharacterInfoPanel({ onClose, variant = 'overlay' }: Props) {
  const { character } = useGameStore()
  if (!character) return null

  if (variant === 'sidebar') {
    return (
      <div className="h-full overflow-y-auto flex flex-col" style={{ background: '#07070c' }}>
        <div className="px-3 py-2 sticky top-0 z-10"
          style={{ background: '#07070c', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <span className="font-cinzel text-xs tracking-widest" style={{ color: 'rgba(212,175,55,0.45)' }}>
            CHARACTER
          </span>
        </div>
        <PanelContent />
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 overflow-y-auto flex flex-col"
        style={{
          width: '300px',
          background: '#0a0a0f',
          borderLeft: '1px solid rgba(212,175,55,0.2)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
          style={{ background: '#0a0a0f', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <span className="font-cinzel text-xs tracking-widest" style={{ color: 'rgba(212,175,55,0.7)' }}>
            CHARACTER INFO
          </span>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded"
            style={{ color: 'rgba(160,144,112,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#D4AF37')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(160,144,112,0.6)')}
          >
            ✕
          </button>
        </div>

        <PanelContent />
      </div>
    </>
  )
}

// ── 스탯 바 서브컴포넌트 ──────────────────────────────────
function StatBar({ label, value, max, pct, color }: {
  label: string; value: number; max: number; pct: number; color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-7 flex-shrink-0" style={{ color: 'rgba(160,144,112,0.6)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs flex-shrink-0" style={{ color: 'rgba(160,144,112,0.55)', fontSize: '10px' }}>
        {value}/{max}
      </span>
    </div>
  )
}

// ── 퀘스트 카드 서브컴포넌트 ─────────────────────────────
function QuestCard({ quest, onClick }: { quest: Quest; onClick: () => void }) {
  return (
    <button
      className="w-full text-left text-xs rounded transition-colors"
      style={{ cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: STATUS_COLOR[quest.status], fontSize: '8px' }}>◆</span>
        <span className="font-bold truncate" style={{
          color: quest.status === 'active' ? 'rgba(232,213,176,0.9)' : 'rgba(160,144,112,0.5)',
          textDecoration: quest.status === 'failed' ? 'line-through' : 'none',
        }}>
          {quest.title}
        </span>
        <span className="ml-auto flex-shrink-0 px-1 rounded" style={{
          background: 'rgba(0,0,0,0.3)',
          color: STATUS_COLOR[quest.status],
          fontSize: '9px',
        }}>
          {STATUS_LABEL[quest.status]}
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(160,144,112,0.35)', flexShrink: 0 }}>▶</span>
      </div>
      {quest.status === 'active' && quest.objectives.length > 0 && (
        <ul className="ml-3 space-y-0.5">
          {quest.objectives.slice(0, 2).map((obj, i) => (
            <li key={i} className="flex items-center gap-1" style={{ color: 'rgba(160,144,112,0.6)' }}>
              <span style={{ fontSize: '8px' }}>○</span>
              <span className="truncate">{obj}</span>
            </li>
          ))}
          {quest.objectives.length > 2 && (
            <li style={{ color: 'rgba(160,144,112,0.35)', fontSize: '9px', marginLeft: '12px' }}>
              +{quest.objectives.length - 2}개 더...
            </li>
          )}
        </ul>
      )}
    </button>
  )
}
