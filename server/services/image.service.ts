import { fal } from '@fal-ai/client'
import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import type { VisualDirection, NPC } from '../../src/types/game'

// Configure fal.ai if key is available
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY })
}

// ---------- Download & persist FAL CDN images locally ----------
const PUBLIC_DIR = path.join(process.cwd(), 'public')

async function downloadToLocal(
  cdnUrl: string,
  subdir: 'map' | 'npcs' | 'scenes',
  filename: string
): Promise<string> {
  try {
    const dir = path.join(PUBLIC_DIR, 'images', subdir)
    await fs.ensureDir(dir)

    // Determine extension from content-type or URL
    const ext = cdnUrl.includes('.png') ? '.png' : '.jpeg'
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_') + ext
    const filePath = path.join(dir, safeName)

    const res = await fetch(cdnUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    const localUrl = `/images/${subdir}/${safeName}`
    console.log(`[Image] Saved locally: ${localUrl} (${(buffer.length / 1024).toFixed(0)} KB)`)
    return localUrl
  } catch (err) {
    console.error(`[Image] Failed to download ${cdnUrl}:`, err)
    // Return original CDN URL as fallback
    return cdnUrl
  }
}

function shortHash(): string {
  return crypto.randomBytes(4).toString('hex')
}

// ---------- Placeholder SVG Generator (inline data URLs) ----------
function placeholderDataUrl(type: 'map' | 'portrait' | 'scene', label: string): string {
  let svg: string

  if (type === 'map') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="756" viewBox="0 0 1344 756">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:#1a3a4a"/>
      <stop offset="100%" style="stop-color:#0a1a2a"/>
    </radialGradient>
  </defs>
  <rect width="1344" height="756" fill="url(#bg)"/>
  <rect x="20" y="20" width="1304" height="716" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.5"/>
  <ellipse cx="420" cy="380" rx="220" ry="150" fill="#3d7a35" opacity="0.8"/>
  <ellipse cx="900" cy="360" rx="200" ry="180" fill="#3d7a35" opacity="0.8"/>
  <ellipse cx="650" cy="500" rx="50" ry="35" fill="#2d5a27" opacity="0.8"/>
  <text x="672" y="60" font-family="serif" font-size="28" fill="#D4AF37" text-anchor="middle">${label}</text>
  <text x="672" y="720" font-family="serif" font-size="14" fill="#a09070" text-anchor="middle">세계 지도</text>
  <text x="1260" y="100" font-family="serif" font-size="20" fill="#D4AF37" text-anchor="middle">N</text>
</svg>`
  } else if (type === 'portrait') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%">
      <stop offset="0%" style="stop-color:#2a1a3a"/>
      <stop offset="100%" style="stop-color:#0a0a15"/>
    </radialGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <rect x="5" y="5" width="390" height="590" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.4"/>
  <ellipse cx="200" cy="160" rx="60" ry="70" fill="#3a2a4a" opacity="0.8"/>
  <rect x="140" y="220" width="120" height="200" rx="10" fill="#3a2a4a" opacity="0.7"/>
  <text x="200" y="560" font-family="serif" font-size="16" fill="#D4AF37" text-anchor="middle">${label}</text>
</svg>`
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1344" height="756" viewBox="0 0 1344 756">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a20"/>
      <stop offset="100%" style="stop-color:#1a0a2e"/>
    </linearGradient>
  </defs>
  <rect width="1344" height="756" fill="url(#sky)"/>
  <polygon points="0,756 200,350 400,756" fill="#1a1a3a" opacity="0.9"/>
  <polygon points="300,756 550,300 800,756" fill="#15152e" opacity="0.9"/>
  <polygon points="700,756 950,320 1200,756" fill="#1a1a3a" opacity="0.9"/>
  <rect x="0" y="620" width="1344" height="136" fill="#0d0d20"/>
  <text x="672" y="690" font-family="serif" font-size="18" fill="#D4AF37" text-anchor="middle">${label.slice(0, 60)}</text>
</svg>`
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// ---------- Main Image Generation Functions (stateless - no file I/O) ----------

// 💡 비주얼 노벨/애니메이션 스타일에 최적화 (SDXL map/portrait 용)
const SDXL_PREFIX = "(masterpiece, best quality, highres:1.2), visual novel CG art style, 2d anime illustration, vibrant cinematic lighting, flat color, clear outlines, safe fantasy artwork";

// 💡 실사풍/기괴한 인체 방지 (SDXL 전용)
const ANIMAGINE_NEGATIVE = "(worst quality, low quality, normal quality:1.4), (realistic, photorealistic, 3d, lip, nose:1.3), bad anatomy, bad face, asymmetrical eyes, malformed mouth, bad hands, missing fingers, extra digit, ugly, deformed, text, watermark, error, blurry, monochrome, duplicate body";

// 💡 FLUX Schnell: 씬 이미지용 빠른 프롬프트 접두사 (~2-4s, 4 steps)
// FLUX는 natural language prompt에 최적화 — 태그 스타일 대신 문장형 사용
const FLUX_SCENE_PREFIX = "fantasy game scene, anime illustration style, vibrant cinematic lighting, detailed background,";

function determineComposition(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes('kiss') || desc.includes('whisper') || desc.includes('intimate') || desc.includes('seductive') || desc.includes('breath')) {
    return "extreme close-up, focused on faces and expressions, intimate proximity, shallow depth of field, blurred background";
  }
  if (desc.includes('hug') || desc.includes('embrace') || desc.includes('talking') || desc.includes('holding hands') || desc.includes('looking at each other')) {
    return "medium shot, upper body, two characters interacting closely, emotional tension, focus on character chemistry";
  }
  if (desc.includes('character') || desc.includes('standing') || desc.includes('sitting')) {
    return "cowboy shot, medium full shot, character-centric, detailed character features";
  }

  return "wide shot, cinematic composition, character in environment";
}

export async function generateMapImage(
  worldName: string,
  _worldLore: string,
  continents: Array<{ name: string }>,
  falKeyOverride?: string
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('map', worldName)
  }

  try {
    fal.config({ credentials: falKey })
    const prompt = `${SDXL_PREFIX}fantasy world map illustration, parchment texture, hand-drawn, top-down aerial view, two large continents named ${continents.map(c => c.name).join(' and ')}, mountains, forests, rivers, ocean with decorative waves, compass rose, decorative border, medieval fantasy cartography style, warm golden-brown colors, high quality`

    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 7.0,
        scheduler: "Euler a",
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('map', worldName)
    return downloadToLocal(cdnUrl, 'map', `world-map-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Map generation failed:', err)
    return placeholderDataUrl('map', worldName)
  }
}

export async function generateNpcPortrait(
  npc: { name: string; title: string; appearance: string; gender: string }
): Promise<string> {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('portrait', `${npc.title}\n${npc.name}`)
  }

  try {
    fal.config({ credentials: falKey })
    const genderWord = npc.gender === '여성' ? 'female' : 'male'
    const prompt = `${SDXL_PREFIX}full body character portrait, fantasy RPG character art, ${genderWord}, ${npc.appearance}, ${npc.title}, standing pose, detailed fantasy outfit, consistent character design, clean gradient background, visual novel character art style`

    console.log(`[Image/Portrait] ─────────────────────────────────────────`)
    console.log(`[Image/Portrait] NPC: ${npc.name} | PROMPT: ${prompt}`)
    console.log(`[Image/Portrait] ─────────────────────────────────────────`)

    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 7.0,
        scheduler: "Euler a",
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('portrait', npc.name)
    const safeName = npc.name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
    return downloadToLocal(cdnUrl, 'npcs', `${safeName}-portrait-${shortHash()}`)
  } catch (err) {
    console.error(`[Image] Portrait failed for ${npc.name}:`, err)
    return placeholderDataUrl('portrait', npc.name)
  }
}

export async function generateNpcEmotion(
  npc: { name: string; appearance: string; gender: string },
  emotion: string,
  emotionDescription: string,
  falKeyOverride?: string
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('portrait', `${npc.name}\n(${emotion})`)
  }

  try {
    fal.config({ credentials: falKey })
    const emotionMap: Record<string, string> = {
      neutral: 'neutral calm expression',
      happy: 'smiling happy joyful expression',
      angry: 'angry furious expression',
      sad: 'sad melancholy expression',
      surprised: 'surprised shocked expression',
      serious: 'serious determined expression',
      smug: 'smug confident smiling expression',
    }

    const genderWord = npc.gender === '여성' ? 'female' : 'male'
    const prompt = `${SDXL_PREFIX}bust portrait, fantasy character, ${genderWord}, ${npc.appearance}, EXACTLY same character appearance and outfit, ${emotionMap[emotion] ?? emotion}, ${emotionDescription}, centered face, symmetrical facial features, detailed eyes, clean lineart, consistent character design, visual novel character art style, clean background`

    console.log(`[Image/Emotion] ─────────────────────────────────────────`)
    console.log(`[Image/Emotion] NPC: ${npc.name} | emotion: ${emotion} | PROMPT: ${prompt}`)
    console.log(`[Image/Emotion] ─────────────────────────────────────────`)

    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 7.0,
        scheduler: "Euler a",
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('portrait', npc.name)
    const safeName = npc.name.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
    return downloadToLocal(cdnUrl, 'npcs', `${safeName}-${emotion}-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Emotion portrait failed:', err)
    return placeholderDataUrl('portrait', npc.name)
  }
}

// ── Camera shot → composition prompt mapping ──────────────────
const SHOT_COMPOSITION: Record<NonNullable<VisualDirection['camera_shot']>, string> = {
  'close-up': 'close-up shot, face and expression details, shallow depth of field, blurred bokeh background',
  'bust-up': 'bust-up portrait shot, focused on upper body and face, slight depth of field',
  'waist-up': 'waist-up shot, character interaction visible, medium shot, detailed torso and face',
  'full-body': 'full body shot, dynamic standing pose, cinematic character showcase',
  'wide': 'wide angle establishing shot, breathtaking environment, character small in frame',
}

// ── Focus type → additional tags ─────────────────────────────
const FOCUS_TAGS: Record<NonNullable<VisualDirection['focus']>, string> = {
  'character': 'character-centric composition, expressive emotions, detailed character design',
  'environment': 'environmental storytelling, rich background detail, atmospheric depth, establishing shot',
  'intimate': 'intimate proximity, emotional tension, warm soft bokeh focus',
  'object': 'object in focus, macro detail, story-telling prop, dramatic lighting on object',
}

// ── Korean location → English environment tags ────────────────
// currentLocation은 한국어 (예: "어두운 주점", "왕궁 내부") → 영어 환경 태그로 매핑
const KOREAN_LOCATION_MAP: Array<[string, string]> = [
  // 실내 건물
  ['주점', 'tavern'], ['선술집', 'tavern'], ['술집', 'tavern'],
  ['여관', 'inn'], ['숙소', 'inn'], ['숙박', 'inn'],
  ['성', 'castle'], ['왕궁', 'castle'], ['궁전', 'castle'], ['요새', 'castle'],
  ['던전', 'dungeon'], ['지하', 'dungeon'], ['감옥', 'dungeon'], ['지하실', 'dungeon'],
  ['사원', 'temple'], ['신전', 'temple'], ['교회', 'temple'], ['성당', 'temple'],
  ['시장', 'market'], ['상점', 'market'], ['상가', 'market'], ['가게', 'market'],
  ['도시', 'city'], ['도심', 'city'], ['수도', 'city'],
  ['마을', 'village'], ['촌', 'village'], ['마을 광장', 'village'],
  ['항구', 'port'], ['부두', 'port'], ['선착장', 'port'],
  ['학원', 'castle'], ['훈련장', 'castle'], ['병영', 'castle'],
  // 자연/실외
  ['숲', 'forest'], ['삼림', 'forest'], ['나무', 'forest'], ['수풀', 'forest'],
  ['산', 'mountain'], ['절벽', 'mountain'], ['고원', 'mountain'], ['봉우리', 'mountain'],
  ['동굴', 'cave'], ['굴', 'cave'], ['석굴', 'cave'],
  ['폐허', 'ruins'], ['유적', 'ruins'], ['폐성', 'ruins'], ['무너진', 'ruins'],
  ['길', 'road'], ['도로', 'road'], ['평원', 'road'], ['들판', 'road'],
]

// ── Location keyword → detailed environment visual tags ───────
const LOCATION_TAGS: Record<string, string> = {
  'tavern': 'warm tavern interior, wooden beams, stone fireplace, barrels and mugs, candlelit atmosphere',
  'inn': 'cozy inn interior, warm candlelight, wooden furniture, hearth fire, intimate setting',
  'forest': 'ancient dense forest, towering trees, mossy ground, dappled light filtering through canopy, rich foliage',
  'dungeon': 'dark stone dungeon, dripping moisture on walls, iron bars, flickering torchlight, oppressive darkness',
  'castle': 'grand medieval castle interior, massive stone walls, tapestries, iron chandeliers, imposing architecture',
  'city': 'medieval city cobblestone street, half-timber buildings, city crowd, merchant district',
  'market': 'busy medieval market square, colorful merchant stalls, crowds of people, wooden signs',
  'mountain': 'rugged mountain landscape, rocky cliffs, alpine winds, sweeping distant peaks, dramatic sky',
  'cave': 'underground cave system, stalactites, glowing crystals, deep mysterious shadows',
  'village': 'small peaceful medieval village, thatched rooftops, dirt paths, rural pastoral scenery',
  'ruins': 'ancient crumbling stone ruins, overgrown vines and moss, mysterious weathered atmosphere',
  'temple': 'stone temple interior, altar with offerings, religious iconography, incense smoke, sacred light',
  'road': 'dirt road through rolling countryside, distant forests, open sky, travel atmosphere',
  'port': 'medieval harbor port, wooden docks, sailing ships, salt sea air, fishermen and nets',
}

function resolveLocationTag(currentLocation?: string): string {
  if (!currentLocation) return ''

  // 1) 한국어 키워드 매핑 (정확도 우선)
  for (const [kor, eng] of KOREAN_LOCATION_MAP) {
    if (currentLocation.includes(kor)) return LOCATION_TAGS[eng] ?? ''
  }
  // 2) 영어 키워드 매핑 (혼용될 경우 대비)
  const lower = currentLocation.toLowerCase()
  for (const [eng, tag] of Object.entries(LOCATION_TAGS)) {
    if (lower.includes(eng)) return tag
  }
  return ''
}

// ── Weather → visual atmospheric tags ────────────────────────
const WEATHER_TAGS: Record<string, string> = {
  '맑음': 'clear blue sky, bright warm golden sunlight, crisp visibility',
  '흐림': 'overcast cloudy sky, diffused soft grey lighting, muted atmosphere',
  '비': 'heavy rain falling, wet glistening cobblestones, dark overcast sky, rainy atmosphere',
  '폭풍': 'violent storm raging, lightning in dark dramatic clouds, howling wind, intense weather',
  '안개': 'thick ethereal fog, soft diffused light through mist, mysterious atmospheric haze',
  '눈': 'snowflakes gently falling, white snow covering ground, winter frost atmosphere',
  '뇌우': 'thunderstorm, dramatic lightning flash illuminating dark sky, heavy downpour',
  '사막열풍': 'swirling sand dust storm, harsh blazing sunlight, shimmering heat haze, desert winds',
}

export async function generateEnhancedSceneImage(
  sceneDescription: string,
  direction?: VisualDirection | null,
  activeNpcs?: NPC[],
  heroAppearance?: string,
  currentLocation?: string,
  weather?: string,
  falKeyOverride?: string,
  imagePrompt?: string        // Rich Claude-authored prompt (preferred when available)
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) return placeholderDataUrl('scene', sceneDescription.slice(0, 40))

  try {
    fal.config({ credentials: falKey })

    let prompt: string

    if (imagePrompt?.trim()) {
      // ── Use Claude's rich image_prompt directly ──────────────────
      // Claude already wrote a detailed anime illustration prompt — use it as-is.
      prompt = imagePrompt.trim()
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
      console.log(`[Image/FLUX] PROMPT (Claude, ${prompt.length} chars): ${prompt}`)
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
    } else {
      // ── Fallback: assemble prompt from tags ──────────────────────
      let npcAppearance = '';
      if (activeNpcs && activeNpcs.length > 0) {
        const targetNpcs = activeNpcs.slice(0, 2);
        npcAppearance = targetNpcs.map(n => `(${n.appearance}:1.1)`).join(', ');
        const personCount = targetNpcs.length === 1 ? "solo character, portrait framing" : "2 characters maximum, character-focused framing";
        npcAppearance = `${personCount}, ${npcAppearance}`;
      }

      const locationTag = resolveLocationTag(currentLocation)
      const weatherTag = weather ? (WEATHER_TAGS[weather] ?? '') : ''
      const composition = direction?.camera_shot
        ? SHOT_COMPOSITION[direction.camera_shot]
        : determineComposition(sceneDescription)
      const focusTags = direction?.focus
        ? FOCUS_TAGS[direction.focus]
        : 'character-centric composition, protagonist clearly visible, face details preserved, cinematic composition'
      const lightingTag = direction?.lighting ? direction.lighting + ' lighting' : 'cinematic atmospheric lighting'

      const fluxPromptParts = [
        FLUX_SCENE_PREFIX,
        sceneDescription ? sceneDescription.slice(0, 200) : '',
        locationTag,
        weatherTag,
        lightingTag,
        composition,
        focusTags,
        heroAppearance ? `protagonist: ${heroAppearance}` : '',
        npcAppearance ? `characters: ${npcAppearance}` : '',
      ].filter(Boolean)

      prompt = fluxPromptParts.join(', ')
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
      console.log(`[Image/FLUX] PROMPT (Fallback): ${prompt}`)
      console.log(`[Image/FLUX] ─────────────────────────────────────────`)
    }

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,  // FLUX Schnell optimal: 4 steps (~2-4s)
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('scene', sceneDescription.slice(0, 40))
    return downloadToLocal(cdnUrl, 'scenes', `scene-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Enhanced scene generation failed:', err)
    return placeholderDataUrl('scene', sceneDescription.slice(0, 40))
  }
}


// ── Backward-compat alias (deprecated) ───────────────────────
export async function generateSceneImage(sceneDescription: string): Promise<string> {
  return generateEnhancedSceneImage(sceneDescription, null, [])
}

// ================================================================
// 에테르노바 전용 맵 이미지 생성 — 상세 프롬프트 직접 사용
// ================================================================
export async function generateMapImageWithPrompt(
  fullPrompt: string,
  falKeyOverride?: string
): Promise<string> {
  const falKey = falKeyOverride ?? process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('map', 'Aeternova')
  }

  try {
    fal.config({ credentials: falKey })
    const result = await fal.subscribe('fal-ai/animagine-xl-v3-1', {
      input: {
        prompt: `${SDXL_PREFIX}${fullPrompt}`,
        negative_prompt: ANIMAGINE_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 32,
        guidance_scale: 7.5,
        scheduler: 'Euler a',
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    const cdnUrl = result.data?.images?.[0]?.url
    if (!cdnUrl) return placeholderDataUrl('map', 'Aeternova')
    return downloadToLocal(cdnUrl, 'map', `aeternova-map-${shortHash()}`)
  } catch (err) {
    console.error('[Image] Aeternova map generation failed:', err)
    return placeholderDataUrl('map', 'Aeternova')
  }
}
