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

export type LoadingStepStatus = 'pending' | 'loading' | 'done' | 'error'

export interface LoadingStep {
  id: string
  icon: string
  label: string
  detail: string
  status: LoadingStepStatus
}

const INIT_STEPS: LoadingStep[] = [
  { id: 'world',     icon: '🌍', label: '세계 창조',    detail: '세계 이름, 대륙, 도시, 배경 설정',    status: 'pending' },
  { id: 'npcs',      icon: '👑', label: 'NPC 소환',    detail: '핵심 NPC 10명 생성 (나머지는 게임 중 등장)',  status: 'pending' },
  { id: 'narrative', icon: '📜', label: '운명의 서사',  detail: '세계 배경 서사 및 예언 작성',          status: 'pending' },
  { id: 'map',       icon: '🗺', label: '세계 지도',    detail: '지도 이미지 생성 (fal.ai)',           status: 'pending' },
]

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
  loadingSteps: LoadingStep[]

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
  loadingSteps: INIT_STEPS.map(s => ({ ...s })),

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

  // ── Init game (step-by-step) ──────────────────────────────
  initGame: async () => {
    // Reset steps to initial state
    const steps = INIT_STEPS.map(s => ({ ...s }))
    set({ isLoading: true, error: null, phase: 'generating', loadingSteps: steps })

    const setStep = (id: string, status: LoadingStepStatus) =>
      set(state => ({
        loadingSteps: state.loadingSteps.map(s => s.id === id ? { ...s, status } : s),
      }))

    try {
      // Step 1: World
      setStep('world', 'loading')
      const worldRes = await axios.post('/api/world/generate')
      const world: WorldData = worldRes.data.world
      lsSet(LS_WORLD, world)
      set({ world, mapImageUrl: world.mapImageUrl ?? null })
      setStep('world', 'done')

      // Step 2: NPCs
      setStep('npcs', 'loading')
      const npcsRes = await axios.post('/api/npcs/generate', { world })
      const npcs: NPC[] = npcsRes.data.npcs
      lsSet(LS_NPCS, npcs)
      set({ npcs })
      setStep('npcs', 'done')

      // Step 3: Narrative
      setStep('narrative', 'loading')
      const narrativeRes = await axios.post('/api/narrative/generate', { world })
      const narrative: string = narrativeRes.data.narrative
      lsSet(LS_NARRATIVE, narrative)
      set({ narrative })
      setStep('narrative', 'done')

      // Step 4: Map image (optional, fire-and-forget if fal.ai available)
      setStep('map', 'loading')
      axios.post('/api/map/generate', { world })
        .then(res => {
          const mapImageUrl: string = res.data.mapImageUrl
          const updatedWorld = { ...world, mapImageUrl }
          lsSet(LS_WORLD, updatedWorld)
          set({ world: updatedWorld, mapImageUrl })
          setStep('map', 'done')
        })
        .catch(() => setStep('map', 'error'))

      set({ isLoading: false, phase: 'worldmap' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      // Mark the currently loading step as error
      set(state => ({
        loadingSteps: state.loadingSteps.map(s =>
          s.status === 'loading' ? { ...s, status: 'error' } : s
        ),
        error: `게임 초기화 실패: ${message}`,
        isLoading: false,
        phase: 'start',
      }))
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

      const { narration, sceneImageUrl, currentLocation: newLoc, npcSpeaking, gameOver, newNpc } = res.data

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

      // 새로 즉석 생성된 NPC를 목록에 추가 (중복 방지)
      if (newNpc) {
        set(state => {
          const exists = state.npcs.some(n => n.id === newNpc.id)
          if (exists) return {}
          const updatedNpcs = [...state.npcs, newNpc]
          lsSet(LS_NPCS, updatedNpcs)
          return { npcs: updatedNpcs }
        })
      }

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
