import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as storage from '../services/storage.service'
import * as claude from '../services/claude.service'
import * as imageService from '../services/image.service'
import type {
  CreateCharacterRequest,
  GameActionRequest,
  GameSession,
  CharacterClass,
  PlayerCharacter,
} from '../../src/types/game'

const router = Router()

// ================================================================
// GET /api/status — Health check + initialization state
// ================================================================
router.get('/status', async (_req: Request, res: Response) => {
  const initialized = await storage.isWorldInitialized()
  const world = initialized ? await storage.loadWorld() : null
  const npcs = initialized ? await storage.loadNPCs() : []
  const narrative = initialized ? await storage.loadNarrative() : null

  res.json({
    initialized,
    worldName: world?.name ?? null,
    npcCount: npcs.length,
    hasNarrative: !!narrative,
  })
})

// ================================================================
// POST /api/game/init — Generate world, NPCs, narrative
// ================================================================
router.post('/game/init', async (_req: Request, res: Response) => {
  try {
    console.log('[API] Starting game initialization...')

    // Step 1: Generate World
    res.write?.('data: {"step":"world","message":"세계를 창조하는 중..."}\n\n')

    const world = await claude.generateWorld()
    await storage.saveWorld(world)
    console.log(`[API] World created: ${world.name}`)

    // Step 2: Generate Map Image (async, don't block)
    const mapImagePath = storage.getMapImagePath()
    imageService.generateMapImage(world.name, world.lore, world.continents, mapImagePath)
      .then(url => {
        world.mapImageUrl = url
        storage.saveWorld(world)
        console.log(`[API] Map image saved: ${url}`)
      })
      .catch(err => console.error('[API] Map image error:', err))

    // Step 3: Generate NPCs
    const npcs = await claude.generateNPCs(world)
    await storage.saveNPCs(npcs)
    console.log(`[API] NPCs created: ${npcs.length}`)

    // Step 4: Generate NPC Portraits (async)
    npcs.forEach(npc => {
      const portraitPath = storage.getNpcPortraitPath(npc.id)
      imageService.generateNpcPortrait(npc, portraitPath)
        .then(url => {
          storage.updateNPC(npc.id, { portraitUrl: url })
          console.log(`[API] Portrait saved for ${npc.name}: ${url}`)
        })
        .catch(err => console.error(`[API] Portrait error for ${npc.name}:`, err))
    })

    // Step 5: Generate Narrative
    const narrative = await claude.generateNarrative(world)
    await storage.saveNarrative(narrative)
    console.log('[API] Narrative created')

    res.json({
      success: true,
      worldName: world.name,
      npcCount: npcs.length,
      narrative,
      mapImageUrl: world.mapImageUrl ?? null,
    })
  } catch (err) {
    console.error('[API] Init error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// GET /api/game/world — Get world data
// ================================================================
router.get('/game/world', async (_req: Request, res: Response) => {
  const world = await storage.loadWorld()
  if (!world) return res.status(404).json({ error: 'World not found. Run /api/game/init first.' })
  res.json(world)
})

// ================================================================
// GET /api/game/npcs — Get all NPCs
// ================================================================
router.get('/game/npcs', async (_req: Request, res: Response) => {
  const npcs = await storage.loadNPCs()
  res.json(npcs)
})

// ================================================================
// GET /api/game/narrative — Get narrative
// ================================================================
router.get('/game/narrative', async (_req: Request, res: Response) => {
  const narrative = await storage.loadNarrative()
  if (!narrative) return res.status(404).json({ error: 'Narrative not found.' })
  res.json({ narrative })
})

// ================================================================
// GET /api/game/status/images — Check image generation progress
// ================================================================
router.get('/game/status/images', async (_req: Request, res: Response) => {
  const world = await storage.loadWorld()
  const npcs = await storage.loadNPCs()

  const mapExists = world?.mapImageUrl
    ? await storage.imageExists(
        storage.getMapImagePath().replace('.png', '.svg')
      ).then(v => v || storage.imageExists(storage.getMapImagePath()))
    : false

  const portraitsReady = npcs.filter(n => n.portraitUrl).length

  res.json({
    mapReady: mapExists,
    portraitsReady,
    totalNpcs: npcs.length,
    mapImageUrl: world?.mapImageUrl ?? null,
  })
})

// ================================================================
// POST /api/character/backgrounds — Generate background options
// ================================================================
router.post('/character/backgrounds', async (req: Request, res: Response) => {
  const { characterClass } = req.body as { characterClass: CharacterClass }
  if (!characterClass) return res.status(400).json({ error: 'characterClass required' })

  const world = await storage.loadWorld()
  if (!world) return res.status(404).json({ error: 'World not initialized' })

  try {
    const backgrounds = await claude.generateCharacterBackgrounds(
      characterClass,
      world.name,
      world.lore
    )
    res.json({ backgrounds })
  } catch (err) {
    console.error('[API] Background generation error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// POST /api/session/create — Create a new game session
// ================================================================
router.post('/session/create', async (req: Request, res: Response) => {
  const body = req.body as CreateCharacterRequest
  const { name, age, gender, characterClass, backstory } = body

  if (!name || !characterClass) {
    return res.status(400).json({ error: 'name and characterClass are required' })
  }

  const world = await storage.loadWorld()
  const narrative = await storage.loadNarrative()
  if (!world || !narrative) {
    return res.status(404).json({ error: 'World not initialized' })
  }

  const character: PlayerCharacter = {
    name,
    age: age ?? 20,
    gender: gender ?? '미지정',
    characterClass,
    background: backstory,
    backstory,
    stats: {
      hp: 100,
      maxHp: 100,
      level: 1,
      experience: 0,
      gold: 50,
      strength: 10,
      dexterity: 10,
      intelligence: 10,
      charisma: 10,
      wisdom: 10,
      constitution: 10,
    },
  }

  const sessionId = uuidv4()

  try {
    // Generate initial scene
    const initialResponse = await claude.generateInitialScene(world, narrative, character)

    // Generate initial scene image (async)
    const sceneId = uuidv4()
    const sceneImagePath = storage.getSceneImagePath(sceneId)

    let sceneImageUrl: string | undefined

    if (process.env.FAL_KEY) {
      sceneImageUrl = await imageService.generateSceneImage(
        initialResponse.scene_description,
        sceneId,
        sceneImagePath
      ).catch(err => {
        console.error('[API] Initial scene image error:', err)
        return undefined
      })
    }

    const session: GameSession = {
      id: sessionId,
      character,
      messages: [
        {
          id: uuidv4(),
          role: 'narrator',
          content: initialResponse.narration,
          timestamp: Date.now(),
          sceneImageUrl,
        },
      ],
      currentLocation: initialResponse.current_location,
      currentScene: {
        description: initialResponse.scene_description,
        imageUrl: sceneImageUrl,
        currentLocation: initialResponse.current_location,
        npcsPresent: initialResponse.available_npcs,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await storage.saveSession(session)

    res.json({
      sessionId,
      initialNarration: initialResponse.narration,
      sceneImageUrl: sceneImageUrl ?? null,
      currentLocation: initialResponse.current_location,
    })
  } catch (err) {
    console.error('[API] Session creation error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// GET /api/session/:id — Get session
// ================================================================
router.get('/session/:id', async (req: Request, res: Response) => {
  const session = await storage.loadSession(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  res.json(session)
})

// ================================================================
// POST /api/game/action — Process player action
// ================================================================
router.post('/game/action', async (req: Request, res: Response) => {
  const { sessionId, input } = req.body as GameActionRequest

  if (!sessionId || !input?.trim()) {
    return res.status(400).json({ error: 'sessionId and input are required' })
  }

  const session = await storage.loadSession(sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const world = await storage.loadWorld()
  const npcs = await storage.loadNPCs()
  const narrative = await storage.loadNarrative()

  if (!world || !narrative) {
    return res.status(500).json({ error: 'World not initialized' })
  }

  try {
    // Add player message to history
    session.messages.push({
      id: uuidv4(),
      role: 'player',
      content: input,
      timestamp: Date.now(),
    })

    // Process with Claude
    const response = await claude.processGameAction(
      world,
      npcs,
      narrative,
      session.character,
      session.messages.slice(-15),
      input,
      session.currentLocation
    )

    // Generate scene image (async)
    const sceneId = uuidv4()
    const sceneImagePath = storage.getSceneImagePath(sceneId)
    let sceneImageUrl: string | undefined

    // Always generate placeholder, try real image if key available
    const imagePath = storage.getSceneImagePath(sceneId)
    sceneImageUrl = await imageService.generateSceneImage(
      response.scene_description,
      sceneId,
      imagePath
    ).catch(err => {
      console.error('[API] Scene image error:', err)
      return undefined
    })

    // Handle NPC portrait/emotion
    let npcData = undefined
    if (response.npc_speaking) {
      const npc = npcs.find(n => n.id === response.npc_speaking)
      if (npc) {
        const emotion = response.npc_emotion ?? 'neutral'
        let portraitUrl = npc.portraitUrl

        // Try to get emotion-specific portrait
        const emotionPath = storage.getNpcEmotionPath(npc.id, emotion)
        const emotionExists = await storage.imageExists(emotionPath)
          || await storage.imageExists(emotionPath.replace('.png', '.svg'))

        if (!emotionExists) {
          const emotionDesc = npc.emotions.find(e => e.emotion === emotion)?.description
            ?? npc.emotions[0]?.description ?? 'neutral expression'

          portraitUrl = await imageService.generateNpcEmotion(
            npc,
            emotion,
            emotionDesc,
            emotionPath
          ).catch(() => npc.portraitUrl)
        } else {
          portraitUrl = storage.imagePathToUrl(
            emotionExists ? emotionPath : emotionPath.replace('.png', '.svg')
          )
        }

        npcData = {
          id: npc.id,
          name: npc.name,
          title: npc.title,
          emotion,
          portraitUrl: portraitUrl ?? null,
        }
      }
    }

    // Build response message
    const assistantMessage = {
      id: uuidv4(),
      role: (response.npc_speaking ? 'npc' : 'narrator') as 'npc' | 'narrator',
      content: response.narration,
      npcId: response.npc_speaking ?? undefined,
      npcName: npcData?.name,
      npcEmotion: response.npc_emotion ?? undefined,
      timestamp: Date.now(),
      sceneImageUrl,
    }

    session.messages.push(assistantMessage)
    session.currentLocation = response.current_location
    session.currentScene = {
      description: response.scene_description,
      imageUrl: sceneImageUrl,
      currentLocation: response.current_location,
      npcsPresent: response.available_npcs,
    }
    session.updatedAt = Date.now()

    await storage.saveSession(session)

    res.json({
      narration: response.narration,
      sceneImageUrl: sceneImageUrl ?? null,
      currentLocation: response.current_location,
      npcSpeaking: npcData ?? null,
      availableNpcs: response.available_npcs,
      gameOver: response.game_over,
    })
  } catch (err) {
    console.error('[API] Game action error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// ================================================================
// POST /api/game/reset — Reset game data
// ================================================================
router.post('/game/reset', async (_req: Request, res: Response) => {
  try {
    await storage.clearGameData()
    res.json({ success: true, message: '게임 데이터가 초기화되었습니다.' })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
