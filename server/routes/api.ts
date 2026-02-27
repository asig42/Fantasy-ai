import { Router, Request, Response } from 'express'
import * as claude from '../services/claude.service'
import * as imageService from '../services/image.service'
import { buildHeroAppearance } from '../services/claude.service'
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
router.post('/world/generate', async (req: Request, res: Response) => {
  try {
    const { anthropic: anthropicKey } = getRequestKeys(req)
    const world = await claude.generateWorld(anthropicKey)
    console.log(`[API] World created: ${world.name}`)
    saveWorld(world).catch(() => {})
    res.json({ world })
  } catch (err) {
    console.error('[API] World generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/npcs/generate — Step 2: Generate NPCs
// ================================================================
router.post('/npcs/generate', async (req: Request, res: Response) => {
  const { world } = req.body as { world: WorldData }
  if (!world) return res.status(400).json({ error: 'world required' })
  try {
    const { anthropic: anthropicKey } = getRequestKeys(req)
    const npcs = await claude.generateNPCs(world, anthropicKey)
    console.log(`[API] NPCs created: ${npcs.length}`)
    saveNPCs(npcs).catch(() => {})
    res.json({ npcs })
  } catch (err) {
    console.error('[API] NPC generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/narrative/generate — Step 3: Generate narrative
// ================================================================
router.post('/narrative/generate', async (req: Request, res: Response) => {
  const { world } = req.body as { world: WorldData }
  if (!world) return res.status(400).json({ error: 'world required' })
  try {
    const { anthropic: anthropicKey } = getRequestKeys(req)
    const narrative = await claude.generateNarrative(world, anthropicKey)
    console.log('[API] Narrative created')
    saveNarrative(narrative).catch(() => {})
    res.json({ narrative })
  } catch (err) {
    console.error('[API] Narrative generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/map/generate — Step 4 (optional): Generate map image
// ================================================================
router.post('/map/generate', async (req: Request, res: Response) => {
  const { world } = req.body as { world: WorldData }
  if (!world) return res.status(400).json({ error: 'world required' })
  try {
    const { fal: falKey } = getRequestKeys(req)
    const mapImageUrl = await imageService.generateMapImage(world.name, world.lore, world.continents, falKey)
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
  const { name, age, gender, characterClass, backstory, worldData, narrative } = req.body as {
    name: string
    age: number
    gender: string
    characterClass: CharacterClass
    backstory: string
    worldData: WorldData
    narrative: string
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
    const initialResponse = await claude.generateInitialScene(worldData, narrative, character, anthropicKey)

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
    visualDirection?: string | null
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
    const sceneImageUrl = await imageService.generateEnhancedSceneImage(
      sceneDescription,
      visualDirection ?? null,
      [],
      heroApp,
      currentLocation,
      weather ?? undefined,
      falKey
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

    if (response.reuse_scene_image) {
      sceneImageUrl = null                              // client keeps previous
    } else {
      sceneImagePending = true                          // always generate fresh image
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

    if (sceneImagePending) {
      sendEvent({ type: 'status', stage: 'scene_image_generating', message: '장면 이미지를 생성하고 있습니다.' })
      // 현재 장면에 있는 NPC 객체를 찾아 외모 데이터를 이미지 프롬프트에 포함
      const sceneNpcs = (response.available_npcs ?? [])
        .map((id: string) => allNpcs.find(n => n.id === id))
        .filter((n): n is NPC => !!n)
      const heroApp = character ? buildHeroAppearance(character) : undefined

      pendingTasks.push(
        imageService.generateEnhancedSceneImage(
          response.scene_description,
          response.visual_direction ?? null,
          sceneNpcs,
          heroApp,
          response.current_location ?? currentLocation,
          response.weather ?? currentWeather,
          falKey
        )
          .then(url => { sendEvent({ type: 'image', sceneImageUrl: url, sceneTag }) })
          .catch(err => {
            console.error('[Image] Generation failed:', err)
            sendEvent({ type: 'image', sceneImageUrl: null, sceneTag })
          })
      )
    }

    if (pendingPortrait) {
      sendEvent({ type: 'status', stage: 'portrait_generating', message: 'NPC 초상화를 생성하고 있습니다.' })
      const { npc, emotion, emotionDesc } = pendingPortrait
      pendingTasks.push(
        imageService.generateNpcEmotion(npc, emotion, emotionDesc, falKey)
          .then(url => { sendEvent({ type: 'portrait', npcId: npc.id, emotion, portraitUrl: url }) })
          .catch(err => { console.error('[Portrait] Generation failed:', err) })
      )
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
    const sceneTag = response.scene_tag ?? ''

    if (response.reuse_scene_image) {
      // Claude says scene unchanged → skip (client keeps previous)
      sceneImageUrl = null
      console.log(`[Image] Reuse scene (unchanged): ${sceneTag}`)
    } else {
      // Always generate fresh image when scene changes
      const allNpcsForImage = [...(npcs ?? [])]
      if (response.new_npc) allNpcsForImage.push(response.new_npc)
      const sceneNpcs = (response.available_npcs ?? [])
        .map((id: string) => allNpcsForImage.find(n => n.id === id))
        .filter((n): n is NPC => !!n)
      const heroApp = character ? buildHeroAppearance(character) : undefined

      sceneImageUrl = await imageService.generateEnhancedSceneImage(
        response.scene_description,
        response.visual_direction ?? null,
        sceneNpcs,
        heroApp,
        response.current_location ?? currentLocation,
        response.weather ?? currentWeather,
        falKey
      )
      console.log(`[Image] Generated new scene: ${sceneTag}`)
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
          portraitUrl = await imageService.generateNpcEmotion(npc, emotion, emotionDesc, falKey)
          console.log(`[Image] Generated NPC portrait: ${cacheKey}`)
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
  try {
    const npcs = await loadNPCs()
    res.json({ npcs })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
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
