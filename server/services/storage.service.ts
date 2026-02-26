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
