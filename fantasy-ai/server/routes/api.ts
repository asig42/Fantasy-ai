import { Router, Request, Response } from 'express'
import { getCharacterImageUrl, getLocationImageUrl, getNpcFolder } from '../services/r2_service'
import * as claude from '../services/claude.service'
import * as imageService from '../services/image.service'
import { buildHeroAppearance } from '../services/claude.service'
import { AETERNOVA_WORLD, AETERNOVA_NARRATIVE, MAP_IMAGE_PROMPT } from '../../src/data/aeternova-world'
import { AETERNOVA_NPCS } from '../../src/data/aeternova-npcs'
import {
  saveConfig,
  saveWorld, loadWorld,
  saveNPCs, loadNPCs,
  saveNarrative, loadNarrative,
  saveSession, loadSession, listSessions, deleteSession,
} from '../services/storage.service'
import type {
  WorldData,
  NPC,
  CharacterClass,
  PlayerCharacter,
  GameMessage,
  VisualDirection,
} from '../../src/types/game'

const router = Router()

function getRequestKeys(req: Request) {
  const anthropic = typeof req.headers['x-anthropic-key'] === 'string' ? req.headers['x-anthropic-key'] : undefined
  const fal = typeof req.headers['x-fal-key'] === 'string' ? req.headers['x-fal-key'] : undefined
  return { anthropic, fal }
}

// ── Common API error translator ───────────────────────────────────
function apiError(err: unknown): string {
  const msg = String(err)
  if (msg.includes('credit balance is too low') || msg.includes('Your credit balance'))
    return '크레딧 부족: console.anthropic.com → Plans & Billing에서 크레딧을 충전해주세요.'
  if (msg.includes('invalid x-api-key') || msg.includes('401'))
    return 'API 키가 잘못되었습니다. 설정에서 올바른 Anthropic API 키를 입력해주세요.'
  if (msg.includes('rate limit') || msg.includes('429'))
    return 'API 요청 한도 초과. 잠시 후 다시 시도해주세요.'
  if (msg.includes('overloaded') || msg.includes('529'))
    return 'Anthropic 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.'
  return msg
}

// ================================================================
// GET /api/config — Check if API keys are configured
// ================================================================
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    hasApiKey: !!claude.getAnthropicApiKey(),
    hasFalKey: !!process.env.FAL_KEY,
  })
})

// ================================================================
// POST /api/config — Set API keys
// ================================================================
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { anthropicApiKey, falKey } = req.body as { anthropicApiKey?: string; falKey?: string }

    if (!anthropicApiKey?.trim()) {
      return res.status(400).json({ error: 'anthropicApiKey is required' })
    }

    const isVercel = !!process.env.VERCEL

    // On Vercel, skip the test call (dynamic container = no persistent state anyway)
    // On local dev, validate the key with a real API call
    if (!isVercel) {
      const valid = await claude.testApiKey(anthropicApiKey.trim())
      if (!valid) {
        return res.status(400).json({ error: 'API 키가 유효하지 않습니다. Anthropic 콘솔에서 키를 확인해주세요.' })
      }
    }

    claude.setAnthropicApiKey(anthropicApiKey.trim())
    if (falKey?.trim()) {
      process.env.FAL_KEY = falKey.trim()
    }

    // Persist to disk (local dev only — Vercel filesystem is read-only)
    if (!isVercel) {
      try {
        await saveConfig({ anthropicApiKey: anthropicApiKey.trim(), falKey: falKey?.trim() })
      } catch {
        // ignore write errors
      }
    }

    res.json({ success: true, message: 'API 키가 설정되었습니다.' })
  } catch (err) {
    console.error('[API] Config error:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
  }
})

// ================================================================
// POST /api/world/generate — Step 1: Generate world only
// ================================================================
router.post('/world/generate', async (_req: Request, res: Response) => {
  // 에테르노바 하드코딩 데이터를 즉시 반환 — AI 생성 불필요
  try {
    const existing = await loadWorld().catch(() => null)
    const world: WorldData = {
      ...AETERNOVA_WORLD,
      mapImageUrl: existing?.mapImageUrl ?? AETERNOVA_WORLD.mapImageUrl,
    }
    console.log(`[API] World loaded: ${world.name} (hardcoded Aeternova)`)
    saveWorld(world).catch(() => {})
    res.json({ world })
  } catch (err) {
    console.error('[API] World load error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/npcs/generate — Step 2: Generate NPCs
// ================================================================
router.post('/npcs/generate', async (_req: Request, res: Response) => {
  // 에테르노바 하드코딩 NPC 125명 즉시 반환
  const npcs = AETERNOVA_NPCS
  console.log(`[API] NPCs loaded: ${npcs.length} (hardcoded Aeternova)`)
  saveNPCs(npcs).catch(() => {})
  res.json({ npcs })
})

// ================================================================
// POST /api/narrative/generate — Step 3: Generate narrative
// ================================================================
router.post('/narrative/generate', async (_req: Request, res: Response) => {
  // 에테르노바 하드코딩 서사 즉시 반환
  const narrative = AETERNOVA_NARRATIVE
  console.log('[API] Narrative loaded (hardcoded Aeternova)')
  saveNarrative(narrative).catch(() => {})
  res.json({ narrative })
})

// ================================================================
// POST /api/map/generate — Step 4 (optional): Generate map image
// ================================================================
router.post('/map/generate', async (req: Request, res: Response) => {
  // 에테르노바 전용 맵 이미지 생성 — 상세 프롬프트 사용
  try {
    const { fal: falKey } = getRequestKeys(req)
    const mapImageUrl = await imageService.generateMapImageWithPrompt(MAP_IMAGE_PROMPT, falKey)
    // 생성된 URL을 world 데이터에 저장
    const existing = await loadWorld().catch(() => null)
    if (existing) {
      const updatedWorld = { ...existing, mapImageUrl }
      saveWorld(updatedWorld).catch(() => {})
    }
    res.json({ mapImageUrl })
  } catch (err) {
    console.error('[API] Map generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/game/init — (kept for compatibility) Full init in one call
// ================================================================
router.post('/game/init', async (req: Request, res: Response) => {
  try {
    const { anthropic: anthropicKey } = getRequestKeys(req)
    const world = await claude.generateWorld(anthropicKey)
    const npcs = await claude.generateNPCs(world, anthropicKey)
    const narrative = await claude.generateNarrative(world, anthropicKey)
    res.json({ world, npcs, narrative })
  } catch (err) {
    console.error('[API] Init error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/character/backgrounds — Generate background options
// ================================================================
router.post('/character/backgrounds', async (req: Request, res: Response) => {
  const { characterClass, worldName, worldLore } = req.body as {
    characterClass: CharacterClass
    worldName: string
    worldLore: string
  }

  if (!characterClass || !worldName || !worldLore) {
    return res.status(400).json({ error: 'characterClass, worldName, worldLore required' })
  }

  try {
    const { anthropic: anthropicKey } = getRequestKeys(req)
    const backgrounds = await claude.generateCharacterBackgrounds(characterClass, worldName, worldLore, anthropicKey)
    res.json({ backgrounds })
  } catch (err) {
    console.error('[API] Background generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/session/create — Generate initial scene (stateless)
// ================================================================
router.post('/session/create', async (req: Request, res: Response) => {
  const { name, age, gender, characterClass, backstory, worldData, narrative, startingLocation } = req.body as {
    name: string
    age: number
    gender: string
    characterClass: CharacterClass
    backstory: string
    worldData: WorldData
    narrative: string
    startingLocation?: {
      id: string
      name: string
      continent: string
      description: string
      atmosphere: string
      imagePromptBase: string
    }
  }

  if (!name || !characterClass || !worldData || !narrative) {
    return res.status(400).json({ error: 'name, characterClass, worldData, narrative are required' })
  }

  const character: PlayerCharacter = {
    name,
    age: age ?? 20,
    gender: gender ?? '미지정',
    characterClass,
    background: backstory,
    backstory,
    stats: {
      hp: 100, maxHp: 100, mana: 80, maxMana: 80, level: 1, experience: 0, gold: 50,
      strength: 10, dexterity: 10, intelligence: 10,
      charisma: 10, wisdom: 10, constitution: 10,
    },
  }

  try {
    const { anthropic: anthropicKey } = getRequestKeys(req)
    // 시작 위치 주변 NPC 샘플 (최대 8명) — 초기 장면 분위기용
    const locationNpcs = AETERNOVA_NPCS
      .filter(n => n.nationality.includes(startingLocation?.continent ?? ''))
      .slice(0, 5)
    const initialResponse = await claude.generateInitialScene(worldData, narrative, character, anthropicKey, startingLocation, locationNpcs)

    // 초기 텍스트를 먼저 보여주기 위해 이미지는 별도 API에서 비동기로 생성
    res.json({
      initialNarration: initialResponse.narration,
      currentLocation: initialResponse.current_location,
      weather: initialResponse.weather ?? null,
      sceneImagePending: true,
      initialScene: {
        sceneDescription: initialResponse.scene_description,
        visualDirection: initialResponse.visual_direction ?? null,
      },
    })
  } catch (err) {
    console.error('[API] Session creation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/session/initial-image — Generate initial scene image async
// ================================================================
router.post('/session/initial-image', async (req: Request, res: Response) => {
  const { sceneDescription, visualDirection, currentLocation, weather, character } = req.body as {
    sceneDescription: string
    visualDirection?: VisualDirection | null
    currentLocation?: string
    weather?: string | null
    character?: PlayerCharacter
  }

  if (!sceneDescription || !character) {
    res.status(400).json({ error: 'sceneDescription and character are required' })
    return
  }

  try {
    const { fal: falKey } = getRequestKeys(req)
    const heroApp = buildHeroAppearance(character)
    const sceneImageUrl = getLocationImageUrl(currentLocation ?? '') 
      ?? await imageService.generateEnhancedSceneImage(
          sceneDescription, visualDirection ?? null, [], heroApp,
          currentLocation, weather ?? undefined, falKey
        )

    res.json({ sceneImageUrl })
  } catch (err) {
    console.error('[API] Initial image generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/game/action — Process player action (stateless)
// ================================================================
// ================================================================
// POST /game/action/stream  — streaming SSE version
// ================================================================
router.post('/game/action/stream', async (req: Request, res: Response) => {
  const {
    worldData, npcs, narrative, character, history, input, currentLocation, currentWeather,
    sceneTagCache, npcPortraitCache,
  } = req.body as {
    worldData: WorldData
    npcs: NPC[]
    narrative: string
    character: PlayerCharacter
    history: GameMessage[]
    input: string
    currentLocation: string
    currentWeather?: string
    sceneTagCache?: Record<string, string>
    npcPortraitCache?: Record<string, string>
  }

  if (!worldData || !input?.trim()) {
    res.status(400).json({ error: 'worldData and input are required' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  const heartbeat = setInterval(() => {
    sendEvent({ type: 'heartbeat', ts: Date.now() })
  }, 5000)

  req.on('close', () => {
    clearInterval(heartbeat)
  })

  try {
    const { anthropic: anthropicKey, fal: falKey } = getRequestKeys(req)
    const gen = claude.processGameActionStream(
      worldData, npcs ?? [], narrative ?? '',
      character, history ?? [], input, currentLocation ?? '', anthropicKey
    )

    let response = null
    for await (const event of gen) {
      if (event.type === 'chunk') {
        sendEvent({ type: 'chunk', content: event.content })
      } else {
        response = event.response
      }
    }

    if (!response) throw new Error('No response from Claude')

    const sceneTag = response.scene_tag ?? ''

    // ── Resolve scene image from cache ─────────────────────────
    let sceneImageUrl: string | null = null
    let sceneImagePending = false
    let shouldGenerateSceneImage = false

    const latestHistorySceneImage = [...(history ?? [])]
      .reverse()
      .find(m => !!m.sceneImageUrl)?.sceneImageUrl ?? null

    if (response.reuse_scene_image) {
      const cachedSceneImage = sceneTag ? sceneTagCache?.[sceneTag] : undefined
      if (cachedSceneImage) {
        sceneImageUrl = cachedSceneImage
      } else if (latestHistorySceneImage) {
        // Reuse the latest resolved scene image when Claude says the scene is unchanged.
        sceneImageUrl = latestHistorySceneImage
      } else {
        // No reusable image is available; generate one so the message still has an image.
        sceneImagePending = true
        shouldGenerateSceneImage = true
      }
    } else {
      sceneImagePending = true
      shouldGenerateSceneImage = true
    }

    // ── Resolve NPC portrait from cache ────────────────────────
    const allNpcs = [...(npcs ?? [])]
    if (response.new_npc) allNpcs.push(response.new_npc)

    type PendingPortrait = { npc: NPC; emotion: string; emotionDesc: string }
    let npcData: { id: string; name: string; title: string; emotion: string; portraitUrl: string | null } | null = null
    let pendingPortrait: PendingPortrait | null = null

    if (response.npc_speaking) {
      const npc = allNpcs.find(n => n.id === response.npc_speaking)
      if (npc) {
        const emotion = response.npc_emotion ?? 'neutral'
        const cacheKey = `${npc.id}_${emotion}`
        const cachedPortrait = npcPortraitCache?.[cacheKey]
        if (cachedPortrait) {
          npcData = { id: npc.id, name: npc.name, title: npc.title, emotion, portraitUrl: cachedPortrait }
        } else {
          const emotionDesc = npc.emotions.find(e => e.emotion === emotion)?.description
            ?? npc.emotions[0]?.description ?? 'neutral expression'
          npcData = { id: npc.id, name: npc.name, title: npc.title, emotion, portraitUrl: null }
          pendingPortrait = { npc, emotion, emotionDesc }
        }
      }
    }

    // ── Send 'done' immediately — text is ready, images may follow ──
    sendEvent({
      type: 'done',
      narration: response.narration,
      summary: response.summary ?? '',
      sceneImageUrl,
      sceneImagePending,
      sceneTag,
      currentLocation: response.current_location,
      timeOfDay: response.time_of_day ?? null,
      weather: response.weather ?? null,
      npcSpeaking: npcData,
      availableNpcs: response.available_npcs,
      gameOver: response.game_over,
      newNpc: response.new_npc ?? null,
      suggestedActions: response.suggested_actions ?? [],
      statChanges: response.stat_changes ?? null,
      questUpdates: response.quest_updates ?? null,
      inventoryChanges: response.inventory_changes ?? null,
      statusEffectChanges: response.status_effect_changes ?? null,
    })

    // ── Generate images async, send events when ready ──────────
    const pendingTasks: Promise<void>[] = []

    if (shouldGenerateSceneImage) {
      // R2에서 위치 기반 배경 이미지 즉시 반환
      const r2SceneUrl = getLocationImageUrl(response.current_location ?? currentLocation ?? '')
      if (r2SceneUrl) {
        sendEvent({ type: 'image', sceneImageUrl: r2SceneUrl, sceneTag })
      } else if (latestHistorySceneImage) {
        sendEvent({ type: 'image', sceneImageUrl: latestHistorySceneImage, sceneTag })
      }
    }

    if (pendingPortrait) {
      // R2에서 캐릭터 + 감정 기반 이미지 즉시 반환
      const { npc, emotion } = pendingPortrait
      const intensity = response.visual_direction?.intensity ?? 'routine'
      const charFolder = getNpcFolder(npc, allNpcs)
      const r2PortraitUrl = getCharacterImageUrl(charFolder, emotion, intensity)
      sendEvent({ type: 'portrait', npcId: npc.id, emotion, portraitUrl: r2PortraitUrl })
    }

    await Promise.all(pendingTasks)
    sendEvent({ type: 'complete' })
    clearInterval(heartbeat)
    res.end()
  } catch (err) {
    console.error('[API] Game action stream error:', err)
    sendEvent({ type: 'error', error: apiError(err) })
    clearInterval(heartbeat)
    res.end()
  }
})

// ================================================================
// POST /game/action  — non-streaming fallback
// ================================================================
router.post('/game/action', async (req: Request, res: Response) => {
  const {
    worldData, npcs, narrative, character, history, input, currentLocation, currentWeather,
    sceneTagCache, npcPortraitCache,
  } = req.body as {
    worldData: WorldData
    npcs: NPC[]
    narrative: string
    character: PlayerCharacter
    history: GameMessage[]
    input: string
    currentLocation: string
    currentWeather?: string
    sceneTagCache?: Record<string, string>   // scene_tag → imageUrl
    npcPortraitCache?: Record<string, string> // "{npcId}_{emotion}" → portraitUrl
  }

  if (!worldData || !input?.trim()) {
    return res.status(400).json({ error: 'worldData and input are required' })
  }

  try {
    const { anthropic: anthropicKey, fal: falKey } = getRequestKeys(req)
    const response = await claude.processGameAction(
      worldData,
      npcs ?? [],
      narrative ?? '',
      character,
      history ?? [],
      input,
      currentLocation ?? ''
    )

    // ── Scene image: 3-level reuse check ──────────────────────────
    let sceneImageUrl: string | null = null
    const latestHistorySceneImage = [...(history ?? [])]
      .reverse()
      .find(m => !!m.sceneImageUrl)?.sceneImageUrl ?? null
    const sceneTag = response.scene_tag ?? ''

    if (response.reuse_scene_image) {
      const cachedSceneImage = sceneTag ? sceneTagCache?.[sceneTag] : undefined
      if (cachedSceneImage) {
        sceneImageUrl = cachedSceneImage
        console.log(`[Image] Reuse scene (cache hit): ${sceneTag}`)
      } else if (latestHistorySceneImage) {
        sceneImageUrl = latestHistorySceneImage
        console.log(`[Image] Reuse latest scene (history): ${sceneTag}`)
      } else {
        // Scene is unchanged but we still need an image for this message.
        const allNpcsForImage = [...(npcs ?? [])]
        if (response.new_npc) allNpcsForImage.push(response.new_npc)
        const sceneNpcs = (response.available_npcs ?? [])
          .map((id: string) => allNpcsForImage.find(n => n.id === id))
          .filter((n): n is NPC => !!n)
        const heroApp = character ? buildHeroAppearance(character) : undefined
        sceneImageUrl = getLocationImageUrl(response.current_location ?? currentLocation ?? '')
          ?? await imageService.generateEnhancedSceneImage(
              response.scene_description, response.visual_direction ?? null,
              sceneNpcs, heroApp, response.current_location ?? currentLocation,
              response.weather ?? currentWeather, falKey
            )
        console.log(`[Image] Resolved fallback scene: ${sceneTag}`)
      }
    } else {
      // Always generate fresh image when scene changes
      const allNpcsForImage = [...(npcs ?? [])]
      if (response.new_npc) allNpcsForImage.push(response.new_npc)
      const sceneNpcs = (response.available_npcs ?? [])
        .map((id: string) => allNpcsForImage.find(n => n.id === id))
        .filter((n): n is NPC => !!n)
      const heroApp = character ? buildHeroAppearance(character) : undefined

      sceneImageUrl = getLocationImageUrl(response.current_location ?? currentLocation ?? '')
        ?? await imageService.generateEnhancedSceneImage(
            response.scene_description, response.visual_direction ?? null,
            sceneNpcs, heroApp, response.current_location ?? currentLocation,
            response.weather ?? currentWeather, falKey
          )
      console.log(`[Image] Resolved new scene: ${sceneTag}`)
    }

    // 즉석 생성된 새 NPC가 있으면 목록에 포함
    const allNpcs = [...(npcs ?? [])]
    if (response.new_npc) allNpcs.push(response.new_npc)

    let npcData = undefined
    if (response.npc_speaking) {
      const npc = allNpcs.find(n => n.id === response.npc_speaking)
      if (npc) {
        const emotion = response.npc_emotion ?? 'neutral'
        const cacheKey = `${npc.id}_${emotion}`

        // ── NPC portrait: cache check ──────────────────────────────
        let portraitUrl: string
        if (npcPortraitCache?.[cacheKey]) {
          portraitUrl = npcPortraitCache[cacheKey]
          console.log(`[Image] Reuse NPC portrait (cache hit): ${cacheKey}`)
        } else {
          const emotionDesc = npc.emotions.find(e => e.emotion === emotion)?.description
            ?? npc.emotions[0]?.description ?? 'neutral expression'
          const intensity = response.visual_direction?.intensity ?? 'routine'
          portraitUrl = getCharacterImageUrl(getNpcFolder(npc, allNpcs), emotion, intensity)
          console.log(`[Image] R2 NPC portrait: ${cacheKey}`)
        }

        npcData = {
          id: npc.id,
          name: npc.name,
          title: npc.title,
          emotion,
          portraitUrl,
        }
      }
    }

    res.json({
      narration: response.narration,
      sceneImageUrl,        // null = reuse previous on client
      sceneTag,             // for client-side cache storage
      currentLocation: response.current_location,
      npcSpeaking: npcData ?? null,
      availableNpcs: response.available_npcs,
      gameOver: response.game_over,
      newNpc: response.new_npc ?? null,
    })
  } catch (err) {
    console.error('[API] Game action error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// GET /api/world — Load world from server disk
// ================================================================
router.get('/world', async (_req: Request, res: Response) => {
  try {
    const world = await loadWorld()
    if (!world) return res.status(404).json({ error: 'No world data on server' })
    res.json({ world })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// GET /api/npcs — Load NPCs from server disk
// ================================================================
router.get('/npcs', async (_req: Request, res: Response) => {
  res.json({ npcs: AETERNOVA_NPCS })
})

// ================================================================
// GET /api/narrative — Load narrative from server disk
// ================================================================
router.get('/narrative', async (_req: Request, res: Response) => {
  try {
    const narrative = await loadNarrative()
    res.json({ narrative: narrative ?? '' })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// POST /api/session/save — Save session to server disk
// ================================================================
router.post('/session/save', async (req: Request, res: Response) => {
  try {
    const { session } = req.body as { session: Parameters<typeof saveSession>[0] }
    if (!session?.id) return res.status(400).json({ error: 'session required' })
    await saveSession(session)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// GET /api/session/:id — Load session from server disk
// ================================================================
router.get('/session/:id', async (req: Request, res: Response) => {
  try {
    const session = await loadSession(req.params.id)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json({ session })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// POST /api/quests/generate — Generate initial quests from backstory
// ================================================================
router.post('/quests/generate', async (req: Request, res: Response) => {
  const { worldName, character } = req.body as {
    worldName: string
    character: { name: string; characterClass: string; backstory: string }
  }
  if (!character?.backstory) return res.status(400).json({ error: 'character required' })
  try {
    const quests = await claude.generateInitialQuests(worldName ?? '', character)
    res.json({ quests })
  } catch (err) {
    console.error('[API] Quest generation error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// GET /api/sessions — List all sessions from server disk
// ================================================================
router.get('/sessions', async (_req: Request, res: Response) => {
  try {
    const sessions = await listSessions()
    res.json({ sessions })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// DELETE /api/session/:id — Delete a session from server disk
// ================================================================
router.delete('/session/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteSession(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Session not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
