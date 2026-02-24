import { Router, Request, Response } from 'express'
import * as claude from '../services/claude.service'
import * as imageService from '../services/image.service'
import type {
  WorldData,
  NPC,
  CharacterClass,
  PlayerCharacter,
  GameMessage,
} from '../../src/types/game'

const router = Router()

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
// POST /api/config — Set API keys (local dev only)
// ================================================================
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { anthropicApiKey, falKey } = req.body as { anthropicApiKey?: string; falKey?: string }

    if (!anthropicApiKey?.trim()) {
      return res.status(400).json({ error: 'anthropicApiKey is required' })
    }

    const valid = await claude.testApiKey(anthropicApiKey.trim())
    if (!valid) {
      return res.status(400).json({ error: 'API 키가 유효하지 않습니다. Anthropic 콘솔에서 키를 확인해주세요.' })
    }

    claude.setAnthropicApiKey(anthropicApiKey.trim())
    if (falKey?.trim()) {
      process.env.FAL_KEY = falKey.trim()
    }

    // Persist to disk only if storage is available (local dev)
    try {
      const { saveConfig } = await import('../services/storage.service')
      await saveConfig({ anthropicApiKey: anthropicApiKey.trim(), falKey: falKey?.trim() })
    } catch {
      // Vercel: no persistent storage, that's fine
    }

    res.json({ success: true, message: 'API 키가 저장되었습니다.' })
  } catch (err) {
    console.error('[API] Config error:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
  }
})

// ================================================================
// POST /api/world/generate — Step 1: Generate world only
// ================================================================
router.post('/world/generate', async (_req: Request, res: Response) => {
  try {
    const world = await claude.generateWorld()
    console.log(`[API] World created: ${world.name}`)
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
    const npcs = await claude.generateNPCs(world)
    console.log(`[API] NPCs created: ${npcs.length}`)
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
    const narrative = await claude.generateNarrative(world)
    console.log('[API] Narrative created')
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
    const mapImageUrl = await imageService.generateMapImage(world.name, world.lore, world.continents)
    res.json({ mapImageUrl })
  } catch (err) {
    console.error('[API] Map generation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/game/init — (kept for compatibility) Full init in one call
// ================================================================
router.post('/game/init', async (_req: Request, res: Response) => {
  try {
    const world = await claude.generateWorld()
    const npcs = await claude.generateNPCs(world)
    const narrative = await claude.generateNarrative(world)
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
    const backgrounds = await claude.generateCharacterBackgrounds(characterClass, worldName, worldLore)
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
      hp: 100, maxHp: 100, level: 1, experience: 0, gold: 50,
      strength: 10, dexterity: 10, intelligence: 10,
      charisma: 10, wisdom: 10, constitution: 10,
    },
  }

  try {
    const initialResponse = await claude.generateInitialScene(worldData, narrative, character)
    const sceneImageUrl = await imageService.generateSceneImage(initialResponse.scene_description)

    res.json({
      initialNarration: initialResponse.narration,
      sceneImageUrl,
      currentLocation: initialResponse.current_location,
    })
  } catch (err) {
    console.error('[API] Session creation error:', err)
    res.status(500).json({ error: apiError(err) })
  }
})

// ================================================================
// POST /api/game/action — Process player action (stateless)
// ================================================================
router.post('/game/action', async (req: Request, res: Response) => {
  const { worldData, npcs, narrative, character, history, input, currentLocation } = req.body as {
    worldData: WorldData
    npcs: NPC[]
    narrative: string
    character: PlayerCharacter
    history: GameMessage[]
    input: string
    currentLocation: string
  }

  if (!worldData || !input?.trim()) {
    return res.status(400).json({ error: 'worldData and input are required' })
  }

  try {
    const response = await claude.processGameAction(
      worldData,
      npcs ?? [],
      narrative ?? '',
      character,
      history ?? [],
      input,
      currentLocation ?? ''
    )

    const sceneImageUrl = await imageService.generateSceneImage(response.scene_description)

    // 즉석 생성된 새 NPC가 있으면 목록에 포함
    const allNpcs = [...(npcs ?? [])]
    if (response.new_npc) allNpcs.push(response.new_npc)

    let npcData = undefined
    if (response.npc_speaking) {
      const npc = allNpcs.find(n => n.id === response.npc_speaking)
      if (npc) {
        const emotion = response.npc_emotion ?? 'neutral'
        const emotionDesc = npc.emotions.find(e => e.emotion === emotion)?.description
          ?? npc.emotions[0]?.description ?? 'neutral expression'

        const portraitUrl = await imageService.generateNpcEmotion(npc, emotion, emotionDesc)

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
      sceneImageUrl,
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

export default router
