import { create } from 'zustand'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type {
  GamePhase,
  WorldData,
  NPC,
  PlayerCharacter,
  GameMessage,
  SceneData,
  CharacterClass,
  BackgroundOption,
  GameSession,
} from '../types/game'

// ─── localStorage helpers ─────────────────────────────────────
const LS_WORLD = 'fantasy-ai-world'
const LS_NPCS = 'fantasy-ai-npcs'
const LS_NARRATIVE = 'fantasy-ai-narrative'
const LS_SESSIONS = 'fantasy-ai-sessions'
const LS_LAST_SESSION = 'fantasy-ai-last-session'

function lsGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

function lsDel(key: string) {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

export interface SessionSummary {
  id: string
  characterName: string
  characterClass: string
  currentLocation: string
  level: number
  updatedAt: number
  createdAt: number
}

interface GameStore {
  phase: GamePhase
  setPhase: (phase: GamePhase) => void

  world: WorldData | null
  npcs: NPC[]
  narrative: string
  mapImageUrl: string | null

  character: PlayerCharacter | null
  backgroundOptions: BackgroundOption[]

  sessionId: string | null
  messages: GameMessage[]
  currentLocation: string
  currentScene: SceneData | null

  isLoading: boolean
  isProcessing: boolean
  error: string | null

  hasApiKey: boolean
  savedSessions: SessionSummary[]

  initGame: () => Promise<void>
  loadGameData: () => Promise<void>
  fetchBackgrounds: (cls: CharacterClass) => Promise<void>
  createSession: (data: {
    name: string; age: number; gender: string
    characterClass: CharacterClass; backstory: string
  }) => Promise<void>
  sendAction: (input: string) => Promise<void>
  resetGame: () => Promise<void>
  setError: (err: string | null) => void
  saveApiKey: (anthropicKey: string, falKey?: string) => Promise<void>
  loadSessions: () => void
  resumeSession: (sessionId: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'start',
  setPhase: (phase) => set({ phase }),

  world: null,
  npcs: [],
  narrative: '',
  mapImageUrl: null,

  character: null,
  backgroundOptions: [],

  sessionId: null,
  messages: [],
  currentLocation: '',
  currentScene: null,
  isLoading: false,
  isProcessing: false,
  error: null,

  hasApiKey: false,
  savedSessions: [],

  setError: (error) => set({ error }),

  // ── Save API key ────────────────────────────────────────────
  saveApiKey: async (anthropicKey: string, falKey?: string) => {
    set({ isLoading: true, error: null })
    try {
      await axios.post('/api/config', { anthropicApiKey: anthropicKey, falKey })
      set({ hasApiKey: true, isLoading: false })
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : String(err)
      set({ error: message, isLoading: false })
    }
  },

  // ── Load sessions from localStorage ────────────────────────
  loadSessions: () => {
    const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
    const summaries: SessionSummary[] = Object.values(sessions).map(s => ({
      id: s.id,
      characterName: s.character.name,
      characterClass: s.character.characterClass,
      currentLocation: s.currentLocation,
      level: s.character.stats.level,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    }))
    summaries.sort((a, b) => b.updatedAt - a.updatedAt)
    set({ savedSessions: summaries })
  },

  // ── Resume a saved session from localStorage ─────────────
  resumeSession: (sessionId: string) => {
    const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
    const session = sessions[sessionId]
    if (!session) {
      set({ error: '저장된 게임을 찾을 수 없습니다.' })
      return
    }

    const world = lsGet<WorldData>(LS_WORLD)
    const npcs = lsGet<NPC[]>(LS_NPCS) ?? []
    const narrative = lsGet<string>(LS_NARRATIVE) ?? ''

    lsSet(LS_LAST_SESSION, sessionId)

    set({
      sessionId: session.id,
      character: session.character,
      messages: session.messages,
      currentLocation: session.currentLocation,
      currentScene: session.currentScene ?? null,
      world,
      npcs,
      narrative,
      mapImageUrl: world?.mapImageUrl ?? null,
      phase: 'game',
      error: null,
    })
  },

  // ── Init game ─────────────────────────────────────────────
  initGame: async () => {
    set({ isLoading: true, error: null, phase: 'generating' })
    try {
      const res = await axios.post('/api/game/init')
      const { world, npcs, narrative } = res.data

      lsSet(LS_WORLD, world)
      lsSet(LS_NPCS, npcs)
      lsSet(LS_NARRATIVE, narrative)

      set({
        world,
        npcs,
        narrative,
        mapImageUrl: world.mapImageUrl ?? null,
        isLoading: false,
        phase: 'worldmap',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      set({ error: `게임 초기화 실패: ${message}`, isLoading: false, phase: 'start' })
    }
  },

  // ── Load existing data from localStorage ──────────────────
  loadGameData: async () => {
    try {
      const configRes = await axios.get('/api/config')
      set({ hasApiKey: configRes.data.hasApiKey })
    } catch {
      // server might not be up yet
    }

    get().loadSessions()

    const world = lsGet<WorldData>(LS_WORLD)
    const npcs = lsGet<NPC[]>(LS_NPCS)
    const narrative = lsGet<string>(LS_NARRATIVE)

    if (world) {
      set({
        world,
        npcs: npcs ?? [],
        narrative: narrative ?? '',
        mapImageUrl: world.mapImageUrl ?? null,
      })
    }
  },

  // ── Fetch backgrounds ─────────────────────────────────────
  fetchBackgrounds: async (cls: CharacterClass) => {
    set({ isLoading: true, error: null })
    const { world } = get()
    try {
      const res = await axios.post('/api/character/backgrounds', {
        characterClass: cls,
        worldName: world?.name ?? '',
        worldLore: world?.lore ?? '',
      })
      set({ backgroundOptions: res.data.backgrounds, isLoading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      set({ error: `배경 생성 실패: ${message}`, isLoading: false })
    }
  },

  // ── Create session ────────────────────────────────────────
  createSession: async (data) => {
    set({ isLoading: true, error: null })
    const { world, narrative } = get()

    try {
      const res = await axios.post('/api/session/create', {
        ...data,
        worldData: world,
        narrative,
      })
      const { initialNarration, sceneImageUrl, currentLocation } = res.data

      const character: PlayerCharacter = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        characterClass: data.characterClass,
        background: data.backstory,
        backstory: data.backstory,
        stats: {
          hp: 100, maxHp: 100, level: 1, experience: 0, gold: 50,
          strength: 10, dexterity: 10, intelligence: 10,
          charisma: 10, wisdom: 10, constitution: 10,
        },
      }

      const sessionId = uuidv4()

      const firstMessage: GameMessage = {
        id: 'msg_initial',
        role: 'narrator',
        content: initialNarration,
        timestamp: Date.now(),
        sceneImageUrl: sceneImageUrl ?? undefined,
      }

      const session: GameSession = {
        id: sessionId,
        character,
        messages: [firstMessage],
        currentLocation,
        currentScene: sceneImageUrl ? {
          description: '',
          imageUrl: sceneImageUrl,
          currentLocation,
          npcsPresent: [],
        } : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
      sessions[sessionId] = session
      lsSet(LS_SESSIONS, sessions)
      lsSet(LS_LAST_SESSION, sessionId)

      set({
        sessionId,
        character,
        messages: [firstMessage],
        currentLocation,
        currentScene: session.currentScene ?? null,
        isLoading: false,
        phase: 'game',
      })

      get().loadSessions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      set({ error: `세션 생성 실패: ${message}`, isLoading: false })
    }
  },

  // ── Send action ───────────────────────────────────────────
  sendAction: async (input: string) => {
    const { sessionId, world, npcs, narrative, character, messages, currentLocation } = get()
    if (!world || !character) return

    set({ isProcessing: true, error: null })

    const playerMsg: GameMessage = {
      id: `msg_${Date.now()}_player`,
      role: 'player',
      content: input,
      timestamp: Date.now(),
    }
    set(state => ({ messages: [...state.messages, playerMsg] }))

    try {
      const res = await axios.post('/api/game/action', {
        worldData: world,
        npcs,
        narrative,
        character,
        history: messages.slice(-15),
        input,
        currentLocation,
      })

      const { narration, sceneImageUrl, currentLocation: newLoc, npcSpeaking, gameOver } = res.data

      const responseMsg: GameMessage = {
        id: `msg_${Date.now()}_response`,
        role: npcSpeaking ? 'npc' : 'narrator',
        content: narration,
        npcId: npcSpeaking?.id,
        npcName: npcSpeaking?.name,
        npcEmotion: npcSpeaking?.emotion,
        timestamp: Date.now(),
        sceneImageUrl: sceneImageUrl ?? undefined,
      }

      const newMessages = [...get().messages, responseMsg]
      const updatedLocation = newLoc ?? currentLocation
      const newScene: SceneData = {
        description: '',
        imageUrl: sceneImageUrl ?? get().currentScene?.imageUrl,
        currentLocation: updatedLocation,
        npcsPresent: [],
      }

      set({
        messages: newMessages,
        currentLocation: updatedLocation,
        currentScene: newScene,
        isProcessing: false,
        ...(gameOver ? { phase: 'start' } : {}),
      })

      if (npcSpeaking?.portraitUrl) {
        set(state => ({
          npcs: state.npcs.map(n =>
            n.id === npcSpeaking.id ? { ...n, portraitUrl: npcSpeaking.portraitUrl } : n
          ),
        }))
      }

      // Auto-save to localStorage
      if (sessionId) {
        const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
        const existing = sessions[sessionId]
        if (existing) {
          sessions[sessionId] = {
            ...existing,
            messages: newMessages,
            currentLocation: updatedLocation,
            currentScene: newScene,
            updatedAt: Date.now(),
          }
          lsSet(LS_SESSIONS, sessions)
          get().loadSessions()
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      set({ error: `행동 처리 실패: ${message}`, isProcessing: false })
    }
  },

  // ── Reset game ────────────────────────────────────────────
  resetGame: async () => {
    lsDel(LS_LAST_SESSION)
    set({
      phase: 'start',
      world: null, npcs: [], narrative: '', mapImageUrl: null,
      character: null, backgroundOptions: [],
      sessionId: null, messages: [], currentLocation: '',
      currentScene: null, error: null,
    })
  },
}))
