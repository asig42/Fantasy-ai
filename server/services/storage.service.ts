import fs from 'fs-extra'
import path from 'path'
import type { WorldData, NPC, GameSession, PlayerCharacter } from '../../src/types/game'

const DATA_DIR = path.join(process.cwd(), 'data')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

export async function ensureDirs() {
  await fs.ensureDir(DATA_DIR)
  await fs.ensureDir(path.join(PUBLIC_DIR, 'images', 'map'))
  await fs.ensureDir(path.join(PUBLIC_DIR, 'images', 'npcs'))
  await fs.ensureDir(path.join(PUBLIC_DIR, 'images', 'scenes'))
}

// ---------- World ----------
export async function saveWorld(world: WorldData): Promise<void> {
  await fs.writeJson(path.join(DATA_DIR, 'world.json'), world, { spaces: 2 })
}

export async function loadWorld(): Promise<WorldData | null> {
  const filePath = path.join(DATA_DIR, 'world.json')
  if (!(await fs.pathExists(filePath))) return null
  return fs.readJson(filePath)
}

// ---------- NPCs ----------
export async function saveNPCs(npcs: NPC[]): Promise<void> {
  await fs.writeJson(path.join(DATA_DIR, 'npcs.json'), npcs, { spaces: 2 })
}

export async function loadNPCs(): Promise<NPC[]> {
  const filePath = path.join(DATA_DIR, 'npcs.json')
  if (!(await fs.pathExists(filePath))) return []
  return fs.readJson(filePath)
}

export async function loadNPC(id: string): Promise<NPC | null> {
  const npcs = await loadNPCs()
  return npcs.find(n => n.id === id) ?? null
}

export async function updateNPC(id: string, updates: Partial<NPC>): Promise<void> {
  const npcs = await loadNPCs()
  const idx = npcs.findIndex(n => n.id === id)
  if (idx === -1) return
  npcs[idx] = { ...npcs[idx], ...updates }
  await saveNPCs(npcs)
}

// ---------- Narrative ----------
export async function saveNarrative(narrative: string): Promise<void> {
  await fs.writeJson(path.join(DATA_DIR, 'narrative.json'), { narrative }, { spaces: 2 })
}

export async function loadNarrative(): Promise<string | null> {
  const filePath = path.join(DATA_DIR, 'narrative.json')
  if (!(await fs.pathExists(filePath))) return null
  const data = await fs.readJson(filePath)
  return data.narrative
}

// ---------- Game Sessions ----------
export async function saveSession(session: GameSession): Promise<void> {
  const sessionsDir = path.join(DATA_DIR, 'sessions')
  await fs.ensureDir(sessionsDir)
  await fs.writeJson(path.join(sessionsDir, `${session.id}.json`), session, { spaces: 2 })
}

export async function loadSession(sessionId: string): Promise<GameSession | null> {
  const filePath = path.join(DATA_DIR, 'sessions', `${sessionId}.json`)
  if (!(await fs.pathExists(filePath))) return null
  return fs.readJson(filePath)
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const filePath = path.join(DATA_DIR, 'sessions', `${sessionId}.json`)
  if (!(await fs.pathExists(filePath))) return false
  await fs.remove(filePath)
  return true
}

// ---------- Image Paths ----------
export function getMapImagePath(): string {
  return path.join(PUBLIC_DIR, 'images', 'map', 'world-map.png')
}

export function getNpcPortraitPath(npcId: string): string {
  return path.join(PUBLIC_DIR, 'images', 'npcs', `${npcId}-portrait.png`)
}

export function getNpcEmotionPath(npcId: string, emotion: string): string {
  return path.join(PUBLIC_DIR, 'images', 'npcs', `${npcId}-${emotion}.png`)
}

export function getSceneImagePath(sceneId: string): string {
  return path.join(PUBLIC_DIR, 'images', 'scenes', `${sceneId}.png`)
}

// ---------- Public URL Helpers ----------
export function imagePathToUrl(filePath: string): string {
  // Convert absolute path to /images/... URL
  const relativePath = filePath.replace(PUBLIC_DIR, '').replace(/\\/g, '/')
  return relativePath
}

export async function imageExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath)
}

// ---------- Config ----------
export interface AppConfig {
  anthropicApiKey?: string
  falKey?: string
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await fs.ensureDir(DATA_DIR)
  await fs.writeJson(path.join(DATA_DIR, 'config.json'), config, { spaces: 2 })
}

export async function loadConfig(): Promise<AppConfig> {
  const filePath = path.join(DATA_DIR, 'config.json')
  if (!(await fs.pathExists(filePath))) return {}
  return fs.readJson(filePath)
}

// ---------- Session List ----------
export interface SessionSummary {
  id: string
  characterName: string
  characterClass: string
  currentLocation: string
  level: number
  updatedAt: number
  createdAt: number
}

export async function listSessions(): Promise<SessionSummary[]> {
  const sessionsDir = path.join(DATA_DIR, 'sessions')
  if (!(await fs.pathExists(sessionsDir))) return []

  const files = await fs.readdir(sessionsDir)
  const summaries: SessionSummary[] = []

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const session: GameSession = await fs.readJson(path.join(sessionsDir, file))
      summaries.push({
        id: session.id,
        characterName: session.character.name,
        characterClass: session.character.characterClass,
        currentLocation: session.currentLocation,
        level: session.character.stats.level,
        updatedAt: session.updatedAt,
        createdAt: session.createdAt,
      })
    } catch {
      // skip corrupt files
    }
  }

  return summaries.sort((a, b) => b.updatedAt - a.updatedAt)
}

// ---------- Init Status ----------
export async function isWorldInitialized(): Promise<boolean> {
  return fs.pathExists(path.join(DATA_DIR, 'world.json'))
}

export async function clearGameData(): Promise<void> {
  await fs.emptyDir(DATA_DIR)
  await fs.emptyDir(path.join(PUBLIC_DIR, 'images', 'map'))
  await fs.emptyDir(path.join(PUBLIC_DIR, 'images', 'npcs'))
  await fs.emptyDir(path.join(PUBLIC_DIR, 'images', 'scenes'))
}

// ================================================================
// SAVE SLOTS (브랜칭 저장)
// 같은 세션에서 여러 분기점을 저장/불러올 수 있게 함
// ================================================================

export interface SaveSlot {
  slotId: string          // "slot_1", "slot_2", ...
  sessionId: string
  label: string           // 사용자 지정 이름 (예: "마을에서 마법사를 만나기 전")
  turnCount: number
  currentLocation: string
  snapshotAt: number      // timestamp
  sessionSnapshot: GameSession
}

const MAX_SLOTS_PER_SESSION = 5

function getSlotsDir(sessionId: string): string {
  return path.join(DATA_DIR, 'sessions', `${sessionId}_slots`)
}

export async function saveSlot(
  sessionId: string,
  session: GameSession,
  label: string,
  currentLocation: string,
  turnCount: number
): Promise<SaveSlot> {
  const slotsDir = getSlotsDir(sessionId)
  await fs.ensureDir(slotsDir)

  const existingSlots = await listSaveSlots(sessionId)

  // 슬롯 번호 결정 (최대 5개, 초과 시 가장 오래된 것 덮어씀)
  let slotNumber: number
  if (existingSlots.length < MAX_SLOTS_PER_SESSION) {
    slotNumber = existingSlots.length + 1
  } else {
    // 가장 오래된 슬롯 재사용
    const oldest = existingSlots.sort((a, b) => a.snapshotAt - b.snapshotAt)[0]
    slotNumber = parseInt(oldest.slotId.replace('slot_', ''), 10)
  }

  const slot: SaveSlot = {
    slotId: `slot_${slotNumber}`,
    sessionId,
    label,
    turnCount,
    currentLocation,
    snapshotAt: Date.now(),
    sessionSnapshot: session,
  }

  await fs.writeJson(path.join(slotsDir, `${slot.slotId}.json`), slot, { spaces: 2 })
  return slot
}

export async function loadSaveSlot(sessionId: string, slotId: string): Promise<SaveSlot | null> {
  const filePath = path.join(getSlotsDir(sessionId), `${slotId}.json`)
  if (!(await fs.pathExists(filePath))) return null
  return fs.readJson(filePath)
}

export async function listSaveSlots(sessionId: string): Promise<Omit<SaveSlot, 'sessionSnapshot'>[]> {
  const slotsDir = getSlotsDir(sessionId)
  if (!(await fs.pathExists(slotsDir))) return []

  const files = await fs.readdir(slotsDir)
  const slots: Omit<SaveSlot, 'sessionSnapshot'>[] = []

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const slot: SaveSlot = await fs.readJson(path.join(slotsDir, file))
      // 스냅샷 제외하고 메타데이터만 반환 (목록 표시용)
      const { sessionSnapshot: _, ...meta } = slot
      slots.push(meta)
    } catch {
      // skip corrupt files
    }
  }

  return slots.sort((a, b) => b.snapshotAt - a.snapshotAt)
}

export async function deleteSaveSlot(sessionId: string, slotId: string): Promise<boolean> {
  const filePath = path.join(getSlotsDir(sessionId), `${slotId}.json`)
  if (!(await fs.pathExists(filePath))) return false
  await fs.remove(filePath)
  return true
}
