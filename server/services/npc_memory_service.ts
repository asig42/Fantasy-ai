import fs from 'fs-extra'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// ================================================================
// TYPES
// ================================================================

export interface NpcMemoryEvent {
  turn: number
  summary: string          // 이 사건에 대한 한 줄 요약
  affinityDelta: number    // 이 사건으로 인한 호감도 변화
  timestamp: number
}

export interface NpcRelationship {
  npcId: string
  affinity: number                    // -100 (적대) ~ +100 (깊은 유대)
  affinityLabel: string               // 적대 / 경계 / 중립 / 우호 / 친밀 / 연인
  metAt: string                       // 처음 만난 장소
  firstMetTurn: number
  lastInteractedTurn: number
  memories: NpcMemoryEvent[]          // 최대 20개 주요 사건
  secretsShared: string[]             // NPC가 플레이어에게 털어놓은 비밀
  promises: string[]                  // 서로 한 약속 목록
  currentEmotionTowardPlayer: string  // 현재 플레이어를 대하는 감정 (자유 텍스트)
}

export interface SessionMemory {
  sessionId: string
  turnCount: number
  worldJournal: WorldJournalEntry[]   // 10턴마다 압축된 세계 일지
  npcRelationships: Record<string, NpcRelationship>  // npcId → 관계
  importantLocations: string[]        // 방문한 중요 장소
  revealedLore: string[]              // 밝혀진 세계관 비밀
  ongoingPlots: string[]              // 진행 중인 서사 흐름 요약
}

export interface WorldJournalEntry {
  turnRange: string        // "1-10", "11-20" 등
  summary: string          // 이 구간에 일어난 핵심 사건 요약
  createdAt: number
}

// ================================================================
// AFFINITY LABEL HELPER
// ================================================================
export function getAffinityLabel(affinity: number): string {
  if (affinity <= -60) return '적대'
  if (affinity <= -20) return '경계'
  if (affinity <= 20)  return '중립'
  if (affinity <= 50)  return '우호'
  if (affinity <= 80)  return '친밀'
  return '연인'
}

// ================================================================
// STORAGE
// ================================================================
function getMemoryPath(sessionId: string): string {
  return path.join(DATA_DIR, 'sessions', `${sessionId}_memory.json`)
}

export async function loadSessionMemory(sessionId: string): Promise<SessionMemory> {
  const filePath = getMemoryPath(sessionId)
  if (!(await fs.pathExists(filePath))) {
    return {
      sessionId,
      turnCount: 0,
      worldJournal: [],
      npcRelationships: {},
      importantLocations: [],
      revealedLore: [],
      ongoingPlots: [],
    }
  }
  return fs.readJson(filePath)
}

export async function saveSessionMemory(memory: SessionMemory): Promise<void> {
  const sessionsDir = path.join(DATA_DIR, 'sessions')
  await fs.ensureDir(sessionsDir)
  await fs.writeJson(getMemoryPath(memory.sessionId), memory, { spaces: 2 })
}

// ================================================================
// NPC RELATIONSHIP OPS
// ================================================================
export function getOrCreateRelationship(
  memory: SessionMemory,
  npcId: string,
  metAt: string,
  currentTurn: number
): NpcRelationship {
  if (!memory.npcRelationships[npcId]) {
    memory.npcRelationships[npcId] = {
      npcId,
      affinity: 0,
      affinityLabel: '중립',
      metAt,
      firstMetTurn: currentTurn,
      lastInteractedTurn: currentTurn,
      memories: [],
      secretsShared: [],
      promises: [],
      currentEmotionTowardPlayer: '낯선 사람을 대하는 평범한 태도',
    }
  }
  return memory.npcRelationships[npcId]
}

export function updateAffinityFromTurn(
  memory: SessionMemory,
  npcId: string,
  delta: number,
  eventSummary: string,
  currentTurn: number
): void {
  const rel = memory.npcRelationships[npcId]
  if (!rel) return

  rel.affinity = Math.max(-100, Math.min(100, rel.affinity + delta))
  rel.affinityLabel = getAffinityLabel(rel.affinity)
  rel.lastInteractedTurn = currentTurn

  // 최대 20개 사건만 유지 (오래된 것 제거)
  if (rel.memories.length >= 20) rel.memories.shift()
  rel.memories.push({
    turn: currentTurn,
    summary: eventSummary,
    affinityDelta: delta,
    timestamp: Date.now(),
  })
}

// ================================================================
// WORLD JOURNAL (세션 메모리 압축)
// ================================================================

// Claude를 이용해 지난 10턴 요약을 생성 (외부에서 호출)
// 반환값을 worldJournal에 push하면 됨
export function createJournalEntry(
  turnRange: string,
  summary: string
): WorldJournalEntry {
  return { turnRange, summary, createdAt: Date.now() }
}

// ================================================================
// CONTEXT BUILDER
// 시스템 프롬프트에 삽입할 기억 컨텍스트 빌드
// ================================================================
export function buildMemoryContext(memory: SessionMemory): string {
  const lines: string[] = []

  // 세계 일지
  if (memory.worldJournal.length > 0) {
    lines.push('## 📖 세계 일지 (지금까지의 여정)')
    // 최근 3개 항목만 (너무 오래된 건 토큰 낭비)
    memory.worldJournal.slice(-3).forEach(j => {
      lines.push(`  [턴 ${j.turnRange}] ${j.summary}`)
    })
  }

  // NPC 관계 현황
  const activeRels = Object.values(memory.npcRelationships)
    .filter(r => r.memories.length > 0)
    .sort((a, b) => b.lastInteractedTurn - a.lastInteractedTurn)
    .slice(0, 8)  // 최근 상호작용한 8명만

  if (activeRels.length > 0) {
    lines.push('\n## 💞 NPC 관계 현황 (중요: 이 관계를 서술에 반드시 반영하세요)')
    activeRels.forEach(rel => {
      const recentMemory = rel.memories.slice(-3).map(m => m.summary).join(' / ')
      const promises = rel.promises.length > 0 ? ` | 약속: ${rel.promises.slice(-2).join(', ')}` : ''
      const secrets = rel.secretsShared.length > 0 ? ` | 털어놓은 비밀: ${rel.secretsShared.slice(-1)[0]}` : ''
      lines.push(
        `  - ${rel.npcId}: 호감도 ${rel.affinity > 0 ? '+' : ''}${rel.affinity} [${rel.affinityLabel}]` +
        ` | 현재 감정: ${rel.currentEmotionTowardPlayer}` +
        ` | 최근 기억: ${recentMemory}` +
        promises + secrets
      )
    })
    lines.push('  ⚠️ 호감도가 높은 NPC는 따뜻하게, 낮은 NPC는 냉담하거나 적대적으로 대해야 합니다.')
  }

  // 진행 중인 서사
  if (memory.ongoingPlots.length > 0) {
    lines.push('\n## 🧵 진행 중인 서사 흐름')
    memory.ongoingPlots.slice(-3).forEach(p => lines.push(`  - ${p}`))
  }

  // 방문 장소
  if (memory.importantLocations.length > 0) {
    lines.push(`\n## 🗺️ 방문한 주요 장소: ${memory.importantLocations.slice(-5).join(', ')}`)
  }

  return lines.join('\n')
}

// ================================================================
// AFFINITY DELTA PARSER
// Claude 응답의 npc_affinity_changes 필드를 파싱해서 메모리 업데이트
// ================================================================
export interface AffinityChange {
  npcId: string
  delta: number
  reason: string
  newEmotion?: string
  secretRevealed?: string
  promiseMade?: string
}

export function applyAffinityChanges(
  memory: SessionMemory,
  changes: AffinityChange[],
  currentLocation: string,
  currentTurn: number
): void {
  for (const change of changes) {
    // 관계가 없으면 생성
    getOrCreateRelationship(memory, change.npcId, currentLocation, currentTurn)
    updateAffinityFromTurn(memory, change.npcId, change.delta, change.reason, currentTurn)

    const rel = memory.npcRelationships[change.npcId]
    if (change.newEmotion) rel.currentEmotionTowardPlayer = change.newEmotion
    if (change.secretRevealed) rel.secretsShared.push(change.secretRevealed)
    if (change.promiseMade) rel.promises.push(change.promiseMade)
  }
}
