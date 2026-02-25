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

// ─── Server session helpers ───────────────────────────────────
async function saveSessionToServer(session: GameSession) {
  try {
    await axios.post('/api/session/save', { session }, { timeout: 10000 })
  } catch { /* ignore - local save is primary */ }
}

function updateUrlWithSession(sessionId: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('session', sessionId)
  window.history.replaceState({}, '', url.toString())
}

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

// ─── Safe error message extraction ────────────────────────────
function extractMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') return 'API 요청 시간 초과. 네트워크 연결을 확인해주세요.'
    const d = err.response?.data
    if (typeof d?.error === 'string') return d.error
    if (typeof d?.message === 'string') return d.message
    if (typeof d === 'string' && d.length < 200) return d
    return err.message
  }
  if (err instanceof Error) return err.message
  return String(err)
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

  // Image caches for cost reduction
  sceneImageCache: Record<string, string>   // scene_tag → imageUrl
  npcPortraitCache: Record<string, string>  // "{npcId}_{emotion}" → portraitUrl

  isLoading: boolean
  isProcessing: boolean
  streamingContent: string
  suggestedActions: string[]
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
  resumeSessionFromServer: (sessionId: string) => Promise<void>
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
  sceneImageCache: {},
  npcPortraitCache: {},
  isLoading: false,
  isProcessing: false,
  streamingContent: '',
  suggestedActions: [],
  error: null,

  hasApiKey: false,
  savedSessions: [],
  loadingSteps: INIT_STEPS.map(s => ({ ...s })),

  setError: (error) => set({ error }),

  // ── Save API key ────────────────────────────────────────────
  saveApiKey: async (anthropicKey: string, falKey?: string) => {
    set({ error: null })
    try {
      await axios.post('/api/config', { anthropicApiKey: anthropicKey, falKey }, { timeout: 30000 })
      set({ hasApiKey: true })
    } catch (err: unknown) {
      throw new Error(extractMessage(err))
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
    updateUrlWithSession(sessionId)

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
    // If world already loaded, skip generation and go to worldmap
    const { world: existingWorld } = get()
    if (existingWorld) {
      set({ phase: 'worldmap' })
      return
    }

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
      set(state => ({
        loadingSteps: state.loadingSteps.map(s =>
          s.status === 'loading' ? { ...s, status: 'error' } : s
        ),
        error: `게임 초기화 실패: ${extractMessage(err)}`,
        isLoading: false,
        phase: 'start',
      }))
    }
  },

  // ── Load existing data from localStorage (+ server fallback) ─
  loadGameData: async () => {
    try {
      const configRes = await axios.get('/api/config')
      set({ hasApiKey: configRes.data.hasApiKey })
    } catch {
      // server might not be up yet
    }

    get().loadSessions()

    let world = lsGet<WorldData>(LS_WORLD)
    let npcs = lsGet<NPC[]>(LS_NPCS)
    let narrative = lsGet<string>(LS_NARRATIVE)

    // If localStorage is empty, try to load from server (returning user on new device/browser)
    if (!world) {
      try {
        const [worldRes, npcsRes, narrativeRes] = await Promise.all([
          axios.get('/api/world', { timeout: 5000 }),
          axios.get('/api/npcs', { timeout: 5000 }),
          axios.get('/api/narrative', { timeout: 5000 }),
        ])
        if (worldRes.data.world) {
          world = worldRes.data.world as WorldData
          npcs = npcsRes.data.npcs as NPC[]
          narrative = narrativeRes.data.narrative as string
          lsSet(LS_WORLD, world)
          lsSet(LS_NPCS, npcs)
          lsSet(LS_NARRATIVE, narrative)
        }
      } catch {
        // no world on server yet, that's fine
      }
    }

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
      set({ error: `배경 생성 실패: ${extractMessage(err)}`, isLoading: false })
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
      saveSessionToServer(session)
      updateUrlWithSession(sessionId)

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
      set({ error: `세션 생성 실패: ${extractMessage(err)}`, isLoading: false })
    }
  },

  // ── Send action (streaming SSE) ───────────────────────────
  sendAction: async (input: string) => {
    const {
      sessionId, world, npcs, narrative, character, messages, currentLocation,
      sceneImageCache, npcPortraitCache,
    } = get()
    if (!world || !character) return

    set({ isProcessing: true, streamingContent: '', error: null })

    const playerMsg: GameMessage = {
      id: `msg_${Date.now()}_player`,
      role: 'player',
      content: input,
      timestamp: Date.now(),
    }
    set(state => ({ messages: [...state.messages, playerMsg] }))

    try {
      const res = await fetch('/api/game/action/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldData: world,
          npcs,
          narrative,
          character,
          history: messages.slice(-10),
          input,
          currentLocation,
          sceneTagCache: sceneImageCache,
          npcPortraitCache,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '서버 오류' }))
        throw new Error(err.error ?? '서버 오류')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let sseBuffer = ''

      const processEvent = (data: Record<string, unknown>) => {
        if (data.type === 'chunk') {
          set(state => ({ streamingContent: state.streamingContent + (data.content as string) }))
        } else if (data.type === 'done') {
          const {
            narration, summary, sceneImageUrl, sceneTag,
            currentLocation: newLoc, npcSpeaking, gameOver, newNpc, suggestedActions,
          } = data as {
            narration: string
            summary: string
            sceneImageUrl: string | null
            sceneTag: string
            currentLocation: string
            npcSpeaking: { id: string; name: string; title: string; emotion: string; portraitUrl: string } | null
            gameOver: boolean
            newNpc: NPC | null
            suggestedActions: string[]
          }

          const resolvedSceneUrl: string | undefined =
            sceneImageUrl ?? get().currentScene?.imageUrl ?? undefined

          const updatedSceneCache = { ...sceneImageCache }
          if (sceneImageUrl && sceneTag) updatedSceneCache[sceneTag] = sceneImageUrl

          const updatedNpcCache = { ...npcPortraitCache }
          if (npcSpeaking?.portraitUrl && npcSpeaking?.id && npcSpeaking?.emotion) {
            updatedNpcCache[`${npcSpeaking.id}_${npcSpeaking.emotion}`] = npcSpeaking.portraitUrl
          }

          const responseMsg: GameMessage = {
            id: `msg_${Date.now()}_response`,
            role: npcSpeaking ? 'npc' : 'narrator',
            content: narration,
            summary: summary || undefined,
            npcId: npcSpeaking?.id,
            npcName: npcSpeaking?.name,
            npcEmotion: npcSpeaking?.emotion,
            timestamp: Date.now(),
            sceneImageUrl: resolvedSceneUrl,
            suggestedActions: suggestedActions?.length ? suggestedActions : undefined,
          }

          const newMessages = [...get().messages, responseMsg]
          const updatedLocation = newLoc ?? currentLocation
          const newScene: SceneData = {
            description: '',
            imageUrl: resolvedSceneUrl,
            currentLocation: updatedLocation,
            npcsPresent: [],
          }

          set({
            messages: newMessages,
            currentLocation: updatedLocation,
            currentScene: newScene,
            sceneImageCache: updatedSceneCache,
            npcPortraitCache: updatedNpcCache,
            suggestedActions: suggestedActions ?? [],
            isProcessing: false,
            streamingContent: '',
            ...(gameOver ? { phase: 'start' } : {}),
          })

          if (newNpc) {
            set(state => {
              if (state.npcs.some(n => n.id === (newNpc as NPC).id)) return {}
              const updatedNpcs = [...state.npcs, newNpc as NPC]
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

          if (sessionId) {
            const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
            const existing = sessions[sessionId]
            if (existing) {
              const updatedSession = { ...existing, messages: newMessages, currentLocation: updatedLocation, currentScene: newScene, updatedAt: Date.now() }
              sessions[sessionId] = updatedSession
              lsSet(LS_SESSIONS, sessions)
              saveSessionToServer(updatedSession)
              get().loadSessions()
            }
          }
        } else if (data.type === 'error') {
          throw new Error(data.error as string)
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        sseBuffer += decoder.decode(value, { stream: true })
        const parts = sseBuffer.split('\n\n')
        sseBuffer = parts.pop() ?? ''
        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (line.startsWith('data: ')) {
              try { processEvent(JSON.parse(line.slice(6))) } catch { /* skip malformed */ }
            }
          }
        }
      }
    } catch (err: unknown) {
      set({ error: `행동 처리 실패: ${extractMessage(err)}`, isProcessing: false, streamingContent: '' })
    }
  },

  // ── Resume session from server (cross-device) ─────────────
  resumeSessionFromServer: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const [sessionRes, worldRes, npcsRes, narrativeRes] = await Promise.all([
        axios.get(`/api/session/${sessionId}`, { timeout: 10000 }),
        axios.get('/api/world', { timeout: 10000 }),
        axios.get('/api/npcs', { timeout: 10000 }),
        axios.get('/api/narrative', { timeout: 10000 }),
      ])
      const session: GameSession = sessionRes.data.session
      const world: WorldData = worldRes.data.world
      const npcs: NPC[] = npcsRes.data.npcs
      const narrative: string = narrativeRes.data.narrative

      // Cache in localStorage for this device
      lsSet(LS_WORLD, world)
      lsSet(LS_NPCS, npcs)
      lsSet(LS_NARRATIVE, narrative)
      const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
      sessions[sessionId] = session
      lsSet(LS_SESSIONS, sessions)
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
        mapImageUrl: world.mapImageUrl ?? null,
        hasApiKey: true,
        phase: 'game',
        isLoading: false,
        error: null,
      })
    } catch (err) {
      set({ error: `세션 불러오기 실패: ${extractMessage(err)}`, isLoading: false })
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
      currentScene: null, sceneImageCache: {}, npcPortraitCache: {}, error: null,
    })
  },
}))
