import { create } from 'zustand'
import axios from 'axios'
import type {
  GamePhase,
  WorldData,
  NPC,
  PlayerCharacter,
  GameMessage,
  SceneData,
  CharacterClass,
  BackgroundOption,
} from '../types/game'

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
  // Phase
  phase: GamePhase
  setPhase: (phase: GamePhase) => void

  // World
  world: WorldData | null
  npcs: NPC[]
  narrative: string
  mapImageUrl: string | null

  // Character
  character: PlayerCharacter | null
  backgroundOptions: BackgroundOption[]

  // Session
  sessionId: string | null
  messages: GameMessage[]
  currentLocation: string
  currentScene: SceneData | null
  isLoading: boolean
  isProcessing: boolean
  error: string | null

  // Config
  hasApiKey: boolean
  savedSessions: SessionSummary[]

  // Actions
  initGame: () => Promise<void>
  loadGameData: () => Promise<void>
  fetchBackgrounds: (cls: CharacterClass) => Promise<void>
  createSession: (data: {
    name: string
    age: number
    gender: string
    characterClass: CharacterClass
    backstory: string
  }) => Promise<void>
  sendAction: (input: string) => Promise<void>
  resetGame: () => Promise<void>
  setError: (err: string | null) => void
  saveApiKey: (anthropicKey: string, falKey?: string) => Promise<void>
  loadSessions: () => Promise<void>
  resumeSession: (sessionId: string) => Promise<void>
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

  // ────────────────────────────────────────
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

  // ────────────────────────────────────────
  loadSessions: async () => {
    try {
      const res = await axios.get('/api/sessions')
      set({ savedSessions: res.data })
    } catch {
      // ignore
    }
  },

  // ────────────────────────────────────────
  resumeSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.get(`/api/session/${sessionId}/resume`)
      const { session, world, npcs, narrative } = res.data

      const messages: GameMessage[] = session.messages.map((m: GameMessage) => m)

      set({
        sessionId: session.id,
        character: session.character,
        messages,
        currentLocation: session.currentLocation,
        currentScene: session.currentScene ?? null,
        world,
        npcs,
        narrative: narrative ?? '',
        mapImageUrl: world?.mapImageUrl ?? null,
        isLoading: false,
        phase: 'game',
      })
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.message
        : String(err)
      set({ error: `불러오기 실패: ${message}`, isLoading: false })
    }
  },

  // ────────────────────────────────────────
  initGame: async () => {
    set({ isLoading: true, error: null, phase: 'generating' })
    try {
      const res = await axios.post('/api/game/init')
      const { worldName, narrative, mapImageUrl } = res.data

      // Load full world and NPC data
      const [worldRes, npcsRes] = await Promise.all([
        axios.get('/api/game/world'),
        axios.get('/api/game/npcs'),
      ])

      set({
        world: worldRes.data,
        npcs: npcsRes.data,
        narrative: narrative,
        mapImageUrl: mapImageUrl ?? null,
        isLoading: false,
        phase: 'worldmap',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      set({
        error: `게임 초기화 실패: ${message}`,
        isLoading: false,
        phase: 'start',
      })
    }
  },

  // ────────────────────────────────────────
  loadGameData: async () => {
    try {
      // Check API key config
      const configRes = await axios.get('/api/config')
      set({ hasApiKey: configRes.data.hasApiKey })

      // Load saved sessions list
      await get().loadSessions()

      const statusRes = await axios.get('/api/status')
      if (!statusRes.data.initialized) return

      const [worldRes, npcsRes, narrativeRes] = await Promise.all([
        axios.get('/api/game/world'),
        axios.get('/api/game/npcs'),
        axios.get('/api/game/narrative'),
      ])

      set({
        world: worldRes.data,
        npcs: npcsRes.data,
        narrative: narrativeRes.data.narrative,
        mapImageUrl: worldRes.data.mapImageUrl ?? null,
      })
    } catch {
      // No pre-existing data, that's fine
    }
  },

  // ────────────────────────────────────────
  fetchBackgrounds: async (cls: CharacterClass) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post('/api/character/backgrounds', { characterClass: cls })
      set({ backgroundOptions: res.data.backgrounds, isLoading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      set({ error: `배경 생성 실패: ${message}`, isLoading: false })
    }
  },

  // ────────────────────────────────────────
  createSession: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const res = await axios.post('/api/session/create', data)
      const { sessionId, initialNarration, sceneImageUrl, currentLocation } = res.data

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

      const firstMessage: GameMessage = {
        id: 'msg_initial',
        role: 'narrator',
        content: initialNarration,
        timestamp: Date.now(),
        sceneImageUrl: sceneImageUrl ?? undefined,
      }

      set({
        sessionId,
        character,
        messages: [firstMessage],
        currentLocation,
        currentScene: sceneImageUrl ? {
          description: '',
          imageUrl: sceneImageUrl,
          currentLocation,
          npcsPresent: [],
        } : null,
        isLoading: false,
        phase: 'game',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      set({ error: `세션 생성 실패: ${message}`, isLoading: false })
    }
  },

  // ────────────────────────────────────────
  sendAction: async (input: string) => {
    const { sessionId } = get()
    if (!sessionId) return

    set({ isProcessing: true, error: null })

    // Add player message immediately
    const playerMsg: GameMessage = {
      id: `msg_${Date.now()}_player`,
      role: 'player',
      content: input,
      timestamp: Date.now(),
    }
    set(state => ({ messages: [...state.messages, playerMsg] }))

    try {
      const res = await axios.post('/api/game/action', { sessionId, input })
      const { narration, sceneImageUrl, currentLocation, npcSpeaking, gameOver } = res.data

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

      set(state => ({
        messages: [...state.messages, responseMsg],
        currentLocation: currentLocation ?? state.currentLocation,
        currentScene: {
          description: '',
          imageUrl: sceneImageUrl ?? state.currentScene?.imageUrl,
          currentLocation: currentLocation ?? state.currentLocation,
          npcsPresent: [],
        },
        isProcessing: false,
        ...(gameOver ? { phase: 'start' } : {}),
      }))

      // Update NPC portrait if speaking
      if (npcSpeaking?.portraitUrl) {
        set(state => ({
          npcs: state.npcs.map(n =>
            n.id === npcSpeaking.id ? { ...n, portraitUrl: npcSpeaking.portraitUrl } : n
          ),
        }))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message :
        (axios.isAxiosError(err) ? err.response?.data?.error : String(err))
      set({ error: `행동 처리 실패: ${message}`, isProcessing: false })
    }
  },

  // ────────────────────────────────────────
  resetGame: async () => {
    try {
      await axios.post('/api/game/reset')
    } catch {
      // ignore
    }
    set({
      phase: 'start',
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
      error: null,
    })
  },
}))
