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
  CharacterStats,
  Quest,
  InventoryItem,
  StatusEffect,
  TimeOfDay,
} from '../types/game'

// ─── Class starting skills ────────────────────────────────────
const CLASS_SKILLS: Record<CharacterClass, string[]> = {
  '전사':    ['강타', '방어 태세', '전투 의지'],
  '마법사':  ['파이어볼', '마나 실드', '마법 탐지'],
  '도적':    ['암습', '잠금 해제', '독 사용'],
  '성직자':  ['치유', '정화', '신성한 빛'],
  '사냥꾼':  ['정밀 사격', '함정 설치', '야생 추적'],
  '연금술사':['폭발 포션 제조', '강화', '약물 분석'],
  '음유시인':['매혹의 노래', '영웅 서사시', '거짓말 간파'],
  '팔라딘':  ['신성 강타', '수호 오라', '죄악 탐지'],
}

// ─── Class-based initial stats ────────────────────────────────
function getInitialStats(characterClass: CharacterClass): CharacterStats {
  const classStats: Record<CharacterClass, { hp: number; mana: number }> = {
    '전사':    { hp: 120, mana: 30 },
    '마법사':  { hp: 80,  mana: 120 },
    '도적':    { hp: 90,  mana: 50 },
    '성직자':  { hp: 100, mana: 100 },
    '사냥꾼':  { hp: 100, mana: 40 },
    '연금술사':{ hp: 85,  mana: 85 },
    '음유시인':{ hp: 85,  mana: 90 },
    '팔라딘':  { hp: 110, mana: 70 },
  }
  const base = classStats[characterClass] ?? { hp: 100, mana: 80 }
  return {
    hp: base.hp, maxHp: base.hp,
    mana: base.mana, maxMana: base.mana,
    level: 1, experience: 0, gold: 50,
    strength: 10, dexterity: 10, intelligence: 10,
    charisma: 10, wisdom: 10, constitution: 10,
  }
}

// ─── Server session helpers ───────────────────────────────────
async function saveSessionToServer(session: GameSession) {
  try {
    await axios.post('/api/session/save', { session }, { timeout: 15000, headers: buildApiHeaders() })
  } catch (err) {
    console.warn('[Save] 서버 저장 실패 (로컬 저장은 유지됨):', err instanceof Error ? err.message : err)
    // Retry once after 3s
    setTimeout(async () => {
      try {
        await axios.post('/api/session/save', { session }, { timeout: 15000, headers: buildApiHeaders() })
      } catch { /* 2nd attempt failed — local save is primary */ }
    }, 3000)
  }
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
const LS_ANTHROPIC_KEY = 'fantasy-ai-anthropic-key'
const LS_FAL_KEY = 'fantasy-ai-fal-key'

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

function buildApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const anthropicKey = lsGet<string>(LS_ANTHROPIC_KEY)
  const falKey = lsGet<string>(LS_FAL_KEY)
  if (anthropicKey) headers['x-anthropic-key'] = anthropicKey
  if (falKey) headers['x-fal-key'] = falKey
  return headers
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
  quests: Quest[]
  timeOfDay: TimeOfDay | null
  weather: string | null

  // Image caches for cost reduction
  sceneImageCache: Record<string, string>   // scene_tag → imageUrl
  npcPortraitCache: Record<string, string>  // "{npcId}_{emotion}" → portraitUrl

  isLoading: boolean
  isProcessing: boolean
  streamingContent: string
  suggestedActions: string[]
  error: string | null
  streamStatus: string | null
  responseTruncated: boolean

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
  clearStreamFlags: () => void
  saveApiKey: (anthropicKey: string, falKey?: string) => Promise<void>
  loadSessions: () => void
  loadServerSessions: () => Promise<void>
  resumeSession: (sessionId: string) => void
  resumeSessionFromServer: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
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
  quests: [],
  timeOfDay: null,
  weather: null,
  sceneImageCache: {},
  npcPortraitCache: {},
  isLoading: false,
  isProcessing: false,
  streamingContent: '',
  suggestedActions: [],
  error: null,
  streamStatus: null,
  responseTruncated: false,

  hasApiKey: false,
  savedSessions: [],
  loadingSteps: INIT_STEPS.map(s => ({ ...s })),

  setError: (error) => set({ error }),

  // ── Save API key ────────────────────────────────────────────
  saveApiKey: async (anthropicKey: string, falKey?: string) => {
    set({ error: null })
    try {
      lsSet(LS_ANTHROPIC_KEY, anthropicKey)
      if (falKey) lsSet(LS_FAL_KEY, falKey)
      await axios.post('/api/config', { anthropicApiKey: anthropicKey, falKey }, { timeout: 30000, headers: buildApiHeaders() })
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

  // ── Load sessions from server (cross-device) ────────────
  loadServerSessions: async () => {
    try {
      const res = await axios.get('/api/sessions', { timeout: 5000, headers: buildApiHeaders() })
      const serverSessions: SessionSummary[] = res.data.sessions ?? []
      if (serverSessions.length === 0) return

      // Merge with localStorage sessions (server sessions take priority for updatedAt)
      set(state => {
        const merged = new Map<string, SessionSummary>()
        for (const s of state.savedSessions) merged.set(s.id, s)
        for (const s of serverSessions) {
          const existing = merged.get(s.id)
          if (!existing || s.updatedAt > existing.updatedAt) merged.set(s.id, s)
        }
        const sorted = Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt)
        return { savedSessions: sorted }
      })
    } catch {
      // server unavailable — localStorage only
    }
  },

  // ── Resume a saved session (localStorage → server fallback) ─
  resumeSession: (sessionId: string) => {
    const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
    const localSession = sessions[sessionId]

    // Not in localStorage → fetch from server (cross-device)
    if (!localSession) {
      get().resumeSessionFromServer(sessionId)
      return
    }

    // Compare timestamps: if server has a newer version, sync from server
    // savedSessions already has server timestamps from loadServerSessions()
    const { savedSessions } = get()
    const serverSummary = savedSessions.find(s => s.id === sessionId)
    if (serverSummary && serverSummary.updatedAt > localSession.updatedAt) {
      console.log(`[Session] Server has newer save (server:${serverSummary.updatedAt} > local:${localSession.updatedAt}), syncing...`)
      get().resumeSessionFromServer(sessionId)
      return
    }

    const world = lsGet<WorldData>(LS_WORLD)
    const npcs = lsGet<NPC[]>(LS_NPCS) ?? []
    const narrative = lsGet<string>(LS_NARRATIVE) ?? ''

    lsSet(LS_LAST_SESSION, sessionId)
    updateUrlWithSession(sessionId)

    set({
      sessionId: localSession.id,
      character: localSession.character,
      messages: localSession.messages,
      currentLocation: localSession.currentLocation,
      currentScene: localSession.currentScene ?? null,
      quests: localSession.quests ?? [],
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

      // Step 2: Narrative
      setStep('narrative', 'loading')
      const narrativeRes = await axios.post('/api/narrative/generate', { world })
      const narrative: string = narrativeRes.data.narrative
      lsSet(LS_NARRATIVE, narrative)
      set({ narrative })
      setStep('narrative', 'done')

      // Step 3: Map image — skip if already cached in world
      setStep('map', 'loading')
      if (world.mapImageUrl) {
        set({ mapImageUrl: world.mapImageUrl })
        setStep('map', 'done')
      } else {
        axios.post('/api/map/generate', { world })
          .then(res => {
            const mapImageUrl: string = res.data.mapImageUrl
            const updatedWorld = { ...world, mapImageUrl }
            lsSet(LS_WORLD, updatedWorld)
            set({ world: updatedWorld, mapImageUrl })
            setStep('map', 'done')
          })
          .catch(() => setStep('map', 'error'))
      }

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
    get().loadServerSessions()

    let world = lsGet<WorldData>(LS_WORLD)
    let npcs = lsGet<NPC[]>(LS_NPCS)
    let narrative = lsGet<string>(LS_NARRATIVE)

    // If localStorage is empty, try to load from server (returning user on new device/browser)
    if (!world) {
      try {
        const [worldRes, npcsRes, narrativeRes] = await Promise.all([
          axios.get('/api/world', { timeout: 5000, headers: buildApiHeaders() }),
          axios.get('/api/npcs', { timeout: 5000, headers: buildApiHeaders() }),
          axios.get('/api/narrative', { timeout: 5000, headers: buildApiHeaders() }),
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
    const { world, narrative } = get()

    const character: PlayerCharacter = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      characterClass: data.characterClass,
      background: data.backstory,
      backstory: data.backstory,
      stats: getInitialStats(data.characterClass),
      skills: CLASS_SKILLS[data.characterClass] ?? [],
      inventory: [],
    }
    const sessionId = uuidv4()

    // 즉시 game 화면으로 전환 (isProcessing이 초기 장면 로딩을 표시)
    lsSet(LS_LAST_SESSION, sessionId)
    updateUrlWithSession(sessionId)
    set({
      sessionId,
      character,
      messages: [],
      currentLocation: '',
      currentScene: null,
      quests: [],
      isProcessing: true,
      streamingContent: '',
      phase: 'game',
      error: null,
    })

    // 퀘스트 생성 (백그라운드, 논블로킹)
    axios.post('/api/quests/generate', {
      worldName: world?.name ?? '',
      character: { name: data.name, characterClass: data.characterClass, backstory: data.backstory },
    }, { timeout: 30000, headers: buildApiHeaders() }).then(res => {
      const quests: Quest[] = res.data.quests ?? []
      set({ quests })
    }).catch(() => {})

    // 초기 장면 생성
    try {
      const res = await axios.post('/api/session/create', {
        ...data,
        worldData: world,
        narrative,
      }, { timeout: 90000, headers: buildApiHeaders() })

      const {
        initialNarration,
        currentLocation,
        weather,
        sceneImagePending,
        initialScene,
      } = res.data as {
        initialNarration: string
        currentLocation: string
        weather?: string | null
        sceneImagePending?: boolean
        initialScene?: {
          sceneDescription: string
          visualDirection?: string | null
        }
      }

      const firstMessage: GameMessage = {
        id: 'msg_initial',
        role: 'narrator',
        content: initialNarration,
        timestamp: Date.now(),
        sceneImagePending: sceneImagePending || undefined,
      }

      const session: GameSession = {
        id: sessionId,
        character,
        messages: [firstMessage],
        currentLocation,
        currentScene: {
          description: '',
          imageUrl: undefined,
          currentLocation,
          npcsPresent: [],
        },
        quests: get().quests,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
      sessions[sessionId] = session
      lsSet(LS_SESSIONS, sessions)
      saveSessionToServer(session)

      set({
        messages: [firstMessage],
        currentLocation,
        currentScene: session.currentScene ?? null,
        weather: weather ?? null,
        isProcessing: false,
      })

      if (initialScene?.sceneDescription) {
        axios.post('/api/session/initial-image', {
          sceneDescription: initialScene.sceneDescription,
          visualDirection: initialScene.visualDirection ?? null,
          currentLocation,
          weather: weather ?? null,
          character,
        }, { timeout: 120000, headers: buildApiHeaders() })
          .then(imgRes => {
            const sceneImageUrl = imgRes.data?.sceneImageUrl as string | undefined
            if (!sceneImageUrl) throw new Error('empty image url')
            set(state => ({
              messages: state.messages.map(m =>
                m.id === firstMessage.id ? { ...m, sceneImageUrl, sceneImagePending: false } : m
              ),
              currentScene: state.currentScene
                ? { ...state.currentScene, imageUrl: sceneImageUrl }
                : { description: '', imageUrl: sceneImageUrl, currentLocation, npcsPresent: [] },
            }))
          })
          .catch(() => {
            set(state => ({
              messages: state.messages.map(m =>
                m.id === firstMessage.id ? { ...m, sceneImagePending: false } : m
              ),
            }))
          })
      }

      get().loadSessions()
    } catch (err: unknown) {
      set({ error: `모험 시작 실패: ${extractMessage(err)}`, isProcessing: false })
    }
  },

  // ── Send action (streaming SSE) ───────────────────────────
  sendAction: async (input: string) => {
    const {
      sessionId, world, npcs, narrative, character, messages, currentLocation,
      sceneImageCache, npcPortraitCache, weather: currentWeather,
    } = get()
    if (!world || !character) return

    set({ isProcessing: true, streamingContent: '', error: null, streamStatus: '응답을 준비 중...', responseTruncated: false })

    const playerMsg: GameMessage = {
      id: `msg_${Date.now()}_player`,
      role: 'player',
      content: input,
      timestamp: Date.now(),
    }
    set(state => ({ messages: [...state.messages, playerMsg] }))

    const STREAM_TIMEOUT_MS = 120_000
    const MAX_RETRIES = 2

    const attemptStream = async (attempt: number): Promise<void> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS)

      try {
        const res = await fetch('/api/game/action/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...buildApiHeaders() },
          signal: controller.signal,
          body: JSON.stringify({
            worldData: world,
            npcs,
            narrative,
            character,
            history: messages.slice(-10),
            input,
            currentLocation,
            currentWeather,
            sceneTagCache: sceneImageCache,
            npcPortraitCache,
          }),
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: '서버 오류' }))
          throw new Error(err.error ?? '서버 오류')
        }

      const reader = res.body!.getReader()
      let receivedDone = false
      const decoder = new TextDecoder()
      let sseBuffer = ''

      const processEvent = (data: Record<string, unknown>) => {
        if (data.type === 'chunk') {
          set(state => ({ streamingContent: state.streamingContent + (data.content as string), streamStatus: '이야기를 생성 중...' }))
        } else if (data.type === 'status') {
          set({ streamStatus: String((data as { message?: string }).message ?? '처리 중...') })
        } else if (data.type === 'heartbeat') {
          set(state => ({ streamStatus: state.streamStatus ?? '응답을 기다리는 중...' }))
        } else if (data.type === 'image') {
          // Async scene image arrived after 'done'
          const { sceneImageUrl: imageUrl, sceneTag: tag } = data as { sceneImageUrl: string | null; sceneTag: string }
          if (imageUrl) {
            set(state => {
              const updatedCache = tag ? { ...state.sceneImageCache, [tag]: imageUrl } : state.sceneImageCache
              const updatedMsgs = state.messages.map(m =>
                m.sceneImagePending ? { ...m, sceneImageUrl: imageUrl, sceneImagePending: false } : m
              )
              const updatedScene = state.currentScene ? { ...state.currentScene, imageUrl } : state.currentScene
              return { messages: updatedMsgs, sceneImageCache: updatedCache, currentScene: updatedScene }
            })
          } else {
            // Image generation failed — just clear pending flag
            set(state => ({
              messages: state.messages.map(m =>
                m.sceneImagePending ? { ...m, sceneImagePending: false } : m
              ),
            }))
          }
        } else if (data.type === 'portrait') {
          // Async NPC portrait arrived after 'done'
          const { npcId, emotion, portraitUrl } = data as { npcId: string; emotion: string; portraitUrl: string }
          set(state => {
            const cacheKey = `${npcId}_${emotion}`
            return {
              npcPortraitCache: { ...state.npcPortraitCache, [cacheKey]: portraitUrl },
              npcs: state.npcs.map(n => n.id === npcId ? { ...n, portraitUrl } : n),
              // Backfill portrait into messages created before async portrait arrived
              messages: state.messages.map(m =>
                m.npcId === npcId && m.npcEmotion === emotion && !m.npcPortraitUrl
                  ? { ...m, npcPortraitUrl: portraitUrl }
                  : m
              ),
            }
          })
        } else if (data.type === 'done') {
          receivedDone = true
          const {
            narration, summary, sceneImageUrl, sceneImagePending: imagePending, sceneTag,
            currentLocation: newLoc, timeOfDay: newTimeOfDay, weather: newWeather,
            npcSpeaking, gameOver, newNpc, suggestedActions, statChanges,
            questUpdates, inventoryChanges, statusEffectChanges,
          } = data as {
            narration: string
            summary: string
            sceneImageUrl: string | null
            sceneImagePending: boolean
            sceneTag: string
            currentLocation: string
            timeOfDay: TimeOfDay | null
            weather: string | null
            npcSpeaking: { id: string; name: string; title: string; emotion: string; portraitUrl: string | null } | null
            gameOver: boolean
            newNpc: NPC | null
            suggestedActions: string[]
            statChanges: { hp_change: number; mana_change: number; gold_change: number; experience_gain: number } | null
            questUpdates: Array<{ id: string; title?: string; description?: string; status?: string; objectives?: string[] }> | null
            inventoryChanges: Array<{ action: 'add' | 'remove'; name: string; description: string; quantity: number; type: InventoryItem['type'] }> | null
            statusEffectChanges: Array<{ action: 'add' | 'remove'; id: string; name: string; description: string; type: StatusEffect['type']; icon: string }> | null
          }

          // null + imagePending → image is coming async, don't fallback
          // null + !imagePending → reuse previous scene
          const resolvedSceneUrl: string | undefined = imagePending
            ? undefined
            : (sceneImageUrl ?? get().currentScene?.imageUrl ?? undefined)

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
            // Snapshot portrait at creation time — prevents icon changing when NPC emotion updates later
            npcPortraitUrl: npcSpeaking?.portraitUrl ?? undefined,
            timestamp: Date.now(),
            sceneImageUrl: resolvedSceneUrl,
            sceneImagePending: imagePending || undefined,
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

          // Apply stat changes from AI
          const prevChar = get().character
          let updatedCharacter = prevChar
          if (prevChar && statChanges) {
            const s = prevChar.stats
            let newHp = Math.max(0, Math.min(s.maxHp, s.hp + (statChanges.hp_change ?? 0)))
            let newMana = Math.max(0, Math.min(s.maxMana, s.mana + (statChanges.mana_change ?? 0)))
            const newGold = Math.max(0, s.gold + (statChanges.gold_change ?? 0))
            let newExp = s.experience + (statChanges.experience_gain ?? 0)
            let newLevel = s.level
            let newMaxHp = s.maxHp
            let newMaxMana = s.maxMana
            const expThreshold = 100 * s.level
            if (newExp >= expThreshold) {
              newLevel += 1
              newExp -= expThreshold
              newMaxHp += 10
              newMaxMana += 5
              newHp = Math.min(newHp + 20, newMaxHp)
              newMana = Math.min(newMana + 10, newMaxMana)
            }
            updatedCharacter = {
              ...prevChar,
              stats: { ...s, hp: newHp, mana: newMana, gold: newGold, experience: newExp, level: newLevel, maxHp: newMaxHp, maxMana: newMaxMana },
            }
          }

          // Apply quest updates from AI
          let updatedQuests = get().quests
          if (questUpdates && questUpdates.length > 0) {
            updatedQuests = [...updatedQuests]
            for (const u of questUpdates) {
              if (u.id === 'new' && u.title) {
                updatedQuests.push({
                  id: `q_${Date.now()}`,
                  title: u.title,
                  description: u.description ?? '',
                  status: (u.status as Quest['status']) ?? 'active',
                  objectives: u.objectives ?? [],
                })
              } else {
                updatedQuests = updatedQuests.map(q =>
                  q.id === u.id ? { ...q, ...(u.status ? { status: u.status as Quest['status'] } : {}) } : q
                )
              }
            }
          }

          // Apply inventory changes
          if (inventoryChanges && inventoryChanges.length > 0 && updatedCharacter) {
            let inventory = [...(updatedCharacter.inventory ?? [])]
            for (const change of inventoryChanges) {
              if (change.action === 'add') {
                const existing = inventory.find(i => i.name === change.name)
                if (existing) {
                  inventory = inventory.map(i => i.name === change.name ? { ...i, quantity: i.quantity + change.quantity } : i)
                } else {
                  inventory.push({ id: `item_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, name: change.name, description: change.description, quantity: change.quantity, type: change.type })
                }
              } else {
                inventory = inventory.map(i => i.name === change.name ? { ...i, quantity: Math.max(0, i.quantity - change.quantity) } : i)
                  .filter(i => i.quantity > 0)
              }
            }
            updatedCharacter = { ...updatedCharacter, inventory }
          }

          // Apply status effect changes
          if (statusEffectChanges && statusEffectChanges.length > 0 && updatedCharacter) {
            let statusEffects = [...(updatedCharacter.statusEffects ?? [])]
            for (const change of statusEffectChanges) {
              if (change.action === 'add') {
                if (!statusEffects.find(e => e.id === change.id)) {
                  statusEffects.push({ id: change.id, name: change.name, description: change.description, type: change.type, icon: change.icon })
                }
              } else {
                statusEffects = statusEffects.filter(e => e.id !== change.id)
              }
            }
            updatedCharacter = { ...updatedCharacter, statusEffects }
          }

          const updatedTimeOfDay = newTimeOfDay ?? get().timeOfDay
          const updatedWeather = newWeather ?? get().weather

          set({
            messages: newMessages,
            currentLocation: updatedLocation,
            currentScene: { ...newScene, timeOfDay: updatedTimeOfDay ?? undefined, weather: updatedWeather ?? undefined },
            sceneImageCache: updatedSceneCache,
            npcPortraitCache: updatedNpcCache,
            suggestedActions: suggestedActions ?? [],
            quests: updatedQuests,
            timeOfDay: updatedTimeOfDay,
            weather: updatedWeather,
            isProcessing: false,
            streamingContent: '',
            streamStatus: imagePending ? '텍스트 응답 완료 · 이미지 생성 중...' : null,
            ...(updatedCharacter !== prevChar ? { character: updatedCharacter } : {}),
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
                n.id === npcSpeaking.id ? { ...n, portraitUrl: npcSpeaking.portraitUrl ?? undefined } : n
              ),
            }))
          }

          if (sessionId) {
            const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
            const existing = sessions[sessionId]
            if (existing) {
              const updatedSession = {
                ...existing,
                character: updatedCharacter ?? existing.character,
                messages: newMessages,
                currentLocation: updatedLocation,
                currentScene: newScene,
                updatedAt: Date.now(),
              }
              sessions[sessionId] = updatedSession
              lsSet(LS_SESSIONS, sessions)
              saveSessionToServer(updatedSession)
              get().loadSessions()
            }
          }
        } else if (data.type === 'complete') {
          set({ streamStatus: null })
        } else if (data.type === 'error') {
          throw new Error(data.error as string)
        }
      }

      const flushSseParts = (rawParts: string[]) => {
        for (const part of rawParts) {
          if (!part) continue
          for (const line of part.split('\n')) {
            if (!line.startsWith('data:')) continue
            const payload = line.slice(5).trimStart()
            if (!payload) continue
            try { processEvent(JSON.parse(payload)) } catch { /* skip malformed */ }
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        sseBuffer += decoder.decode(value, { stream: true })
        const parts = sseBuffer.split('\n\n')
        sseBuffer = parts.pop() ?? ''
        flushSseParts(parts)
      }

      sseBuffer += decoder.decode()
      flushSseParts([sseBuffer])

      if (!receivedDone) {
        set({ responseTruncated: true, streamStatus: null })
        throw new Error('응답이 중간에 종료되었습니다. 이어서 다시 시도해주세요.')
      }
      } catch (innerErr: unknown) {
        clearTimeout(timeoutId)
        const isAbort = innerErr instanceof DOMException && innerErr.name === 'AbortError'
        const isNetwork = innerErr instanceof TypeError && innerErr.message.includes('fetch')
        if ((isAbort || isNetwork) && attempt < MAX_RETRIES) {
          const delay = 1500 * (attempt + 1)
          set({ streamingContent: '', error: null, streamStatus: '재연결 중...' })
          await new Promise(r => setTimeout(r, delay))
          return attemptStream(attempt + 1)
        }
        throw innerErr
      }
    }

    try {
      await attemptStream(0)
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError'
      const msg = isAbort ? '응답 시간이 초과되었습니다. 다시 시도해주세요.' : `행동 처리 실패: ${extractMessage(err)}`
      set({ error: msg, isProcessing: false, streamingContent: '', streamStatus: null })
    }
  },

  // ── Resume session from server (cross-device) ─────────────
  resumeSessionFromServer: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      // Session data is critical — fetch it first
      const sessionRes = await axios.get(`/api/session/${sessionId}`, { timeout: 15000, headers: buildApiHeaders() })
      const session: GameSession = sessionRes.data.session

      // Reuse already-loaded world/npcs/narrative if available (avoids redundant cross-device fetches)
      const state = get()
      let world: WorldData | null = state.world ?? lsGet<WorldData>(LS_WORLD)
      let npcs: NPC[] | null = state.npcs.length > 0 ? state.npcs : lsGet<NPC[]>(LS_NPCS)
      let narrative: string | null = state.narrative || lsGet<string>(LS_NARRATIVE)

      // Fetch only missing pieces — individually so one failure doesn't block the others
      const [worldRes, npcsRes, narrativeRes] = await Promise.all([
        world   ? Promise.resolve(null) : axios.get('/api/world',     { timeout: 15000, headers: buildApiHeaders() }).catch(() => null),
        npcs    ? Promise.resolve(null) : axios.get('/api/npcs',      { timeout: 15000, headers: buildApiHeaders() }).catch(() => null),
        narrative ? Promise.resolve(null) : axios.get('/api/narrative', { timeout: 15000, headers: buildApiHeaders() }).catch(() => null),
      ])

      if (!world && worldRes)       world = worldRes.data.world ?? null
      if (!npcs && npcsRes)         npcs  = npcsRes.data.npcs ?? []
      if (!narrative && narrativeRes) narrative = narrativeRes.data.narrative ?? ''

      // Cache to localStorage for this device
      if (world)    lsSet(LS_WORLD, world)
      if (npcs)     lsSet(LS_NPCS, npcs)
      if (narrative) lsSet(LS_NARRATIVE, narrative)
      const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
      sessions[sessionId] = session
      lsSet(LS_SESSIONS, sessions)
      lsSet(LS_LAST_SESSION, sessionId)
      updateUrlWithSession(sessionId)

      set({
        sessionId: session.id,
        character: session.character,
        messages: session.messages,
        currentLocation: session.currentLocation,
        currentScene: session.currentScene ?? null,
        quests: session.quests ?? [],
        world:     world ?? state.world,
        npcs:      npcs  ?? state.npcs,
        narrative: narrative ?? state.narrative,
        mapImageUrl: world?.mapImageUrl ?? state.mapImageUrl ?? null,
        hasApiKey: true,
        phase: 'game',
        isLoading: false,
        error: null,
      })
    } catch (err) {
      set({ error: `세션 불러오기 실패: ${extractMessage(err)}`, isLoading: false })
    }
  },

  // ── Delete a saved session ────────────────────────────────
  deleteSession: async (sessionId: string) => {
    // Remove from localStorage
    const sessions = lsGet<Record<string, GameSession>>(LS_SESSIONS) ?? {}
    delete sessions[sessionId]
    lsSet(LS_SESSIONS, sessions)

    // Remove from server
    try {
      await axios.delete(`/api/session/${sessionId}`, { timeout: 5000, headers: buildApiHeaders() })
    } catch { /* ignore — local deletion is enough */ }

    // If this was the last session, clear that reference too
    const lastId = lsGet<string>(LS_LAST_SESSION)
    if (lastId === sessionId) lsDel(LS_LAST_SESSION)

    // Refresh session list
    get().loadSessions()
    get().loadServerSessions()
  },

  // ── Reset game ────────────────────────────────────────────
  resetGame: async () => {
    lsDel(LS_LAST_SESSION)
    set({
      phase: 'start',
      world: null, npcs: [], narrative: '', mapImageUrl: null,
      character: null, backgroundOptions: [],
      sessionId: null, messages: [], currentLocation: '',
      currentScene: null, quests: [], sceneImageCache: {}, npcPortraitCache: {},
      timeOfDay: null, weather: null, error: null, streamStatus: null, responseTruncated: false,
    })
  },
}))
