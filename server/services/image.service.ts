import { fal } from '@fal-ai/client'
import type { VisualDirection, NPC, PlayerCharacter } from '../../src/types/game'

// Configure fal.ai if key is available
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY })
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

// 💡 유지보수를 위해 공통으로 들어갈 프롬프트 태그를 위로 빼두었습니다.
const SDXL_PREFIX = "score_9, score_8_up, score_7_up, rating_explicit, (masterpiece), (best quality), anime style, (medieval fantasy), (high fantasy), sword and sorcery, european medieval setting, vibrant cinematic lighting, ";
// 부정 태그: 현대/미래/공상과학 요소 철저히 제거
const SDXL_NEGATIVE = "low quality, bad anatomy, text, error, blurry, photo, ugly, deformed, extra limbs, lowres, monochrome, science fiction, futuristic, sci-fi, modern, contemporary, spaceship, robot, firearm, gun, pistol, technology, neon lights, cyberpunk, 21st century, skyscraper, car, computer, electricity pole, modern architecture, child, loli, shota, infant, baby face, young child";

function determineComposition(description: string): string {
  const desc = description.toLowerCase();
  
  // 1. 아주 가까운 감정 묘사 (키스, 유혹, 속삭임 등)
  if (desc.includes('kiss') || desc.includes('whisper') || desc.includes('intimate') || desc.includes('seductive') || desc.includes('breath')) {
    return "extreme close-up, focused on faces and expressions, intimate proximity, shallow depth of field, blurred background";
  }
  
  // 2. 인물 간의 교감이나 대화 (포옹, 마주보기, 손잡기 등)
  if (desc.includes('hug') || desc.includes('embrace') || desc.includes('talking') || desc.includes('holding hands') || desc.includes('looking at each other')) {
    return "medium shot, upper body, two characters interacting closely, emotional tension, focus on character chemistry";
  }
  
  // 3. 인물이 중심이 되는 일반적인 상황
  if (desc.includes('character') || desc.includes('standing') || desc.includes('sitting')) {
    return "cowboy shot, medium full shot, character-centric, detailed character features";
  }

  // 4. 기본: 배경과 인물의 조화
  return "wide shot, cinematic composition, character in environment";
}

export async function generateMapImage(
  worldName: string,
  _worldLore: string,
  continents: Array<{ name: string }>
): Promise<string> {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('map', worldName)
  }

  try {
    fal.config({ credentials: falKey })
    // 지도에도 기본 퀄리티 향상을 위해 Prefix 적용
    const prompt = `${SDXL_PREFIX}fantasy world map illustration, parchment texture, hand-drawn, top-down aerial view, two large continents named ${continents.map(c => c.name).join(' and ')}, mountains, forests, rivers, ocean with decorative waves, compass rose, decorative border, medieval fantasy cartography style, warm golden-brown colors, high quality`

    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        prompt,
        negative_prompt: SDXL_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: 25, // SDXL에 맞는 스텝 수
        enable_safety_checker: false, // 검열 해제
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    return result.data?.images?.[0]?.url ?? placeholderDataUrl('map', worldName)
  } catch (err) {
    console.error('[Image] Map generation failed:', err)
    return placeholderDataUrl('map', worldName)
  }
}

export async function generateNpcPortrait(
  npc: { name: string; title: string; appearance: string; gender: string; age?: number }
): Promise<string> {
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    return placeholderDataUrl('portrait', `${npc.title}\n${npc.name}`)
  }

  try {
    fal.config({ credentials: falKey })
    const genderWord = npc.gender === '여성' ? 'female' : 'male'
    const ageDesc = npc.age ? `${npc.age} years old, ` : ''
    const prompt = `${SDXL_PREFIX}full body character portrait, (medieval fantasy), fantasy RPG character art, ${genderWord}, ${ageDesc}${npc.appearance}, ${npc.title}, standing pose, detailed medieval fantasy outfit, consistent character design, clean gradient background, visual novel character art style`

    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        prompt,
        negative_prompt: SDXL_NEGATIVE,
        image_size: 'portrait_4_3',
        num_inference_steps: 25,
        enable_safety_checker: false, // NSFW 허용
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    return result.data?.images?.[0]?.url ?? placeholderDataUrl('portrait', npc.name)
  } catch (err) {
    console.error(`[Image] Portrait failed for ${npc.name}:`, err)
    return placeholderDataUrl('portrait', npc.name)
  }
}

export async function generateNpcEmotion(
  npc: { name: string; appearance: string; gender: string; age?: number },
  emotion: string,
  emotionDescription: string
): Promise<string> {
  const falKey = process.env.FAL_KEY
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
    const ageDesc = npc.age ? `${npc.age} years old, ` : ''
    const prompt = `${SDXL_PREFIX}bust portrait, (medieval fantasy), fantasy character, ${genderWord}, ${ageDesc}${npc.appearance}, EXACTLY same character appearance and outfit, ${emotionMap[emotion] ?? emotion}, ${emotionDescription}, consistent character design, visual novel character art style, clean background`

    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        prompt,
        negative_prompt: SDXL_NEGATIVE,
        image_size: 'square_hd',
        num_inference_steps: 25,
        enable_safety_checker: false, // NSFW 허용
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    return result.data?.images?.[0]?.url ?? placeholderDataUrl('portrait', npc.name)
  } catch (err) {
    console.error('[Image] Emotion portrait failed:', err)
    return placeholderDataUrl('portrait', npc.name)
  }
}

// ── Camera shot → composition prompt mapping ──────────────────
const SHOT_COMPOSITION: Record<NonNullable<VisualDirection['camera_shot']>, string> = {
  'close-up':  'extreme close-up shot, face and expression details, shallow depth of field, blurred bokeh background',
  'bust-up':   'bust-up portrait shot, focused on upper body and face, slight depth of field',
  'waist-up':  'waist-up shot, character interaction visible, medium shot, detailed torso and face',
  'full-body': 'full body shot, dynamic standing pose, cinematic character showcase',
  'wide':      'wide angle establishing shot, breathtaking environment, character small in frame',
}

// ── Focus type → additional tags ─────────────────────────────
const FOCUS_TAGS: Record<NonNullable<VisualDirection['focus']>, string> = {
  'character':    'character-centric composition, expressive emotions, detailed character design',
  'environment':  'environmental storytelling, rich background detail, atmospheric depth, establishing shot',
  'intimate':     'intimate proximity, emotional tension, warm soft bokeh focus',
  'object':       'object in focus, macro detail, story-telling prop, dramatic lighting on object',
}

// ── Korean location → English environment tags ────────────────
// currentLocation은 한국어 (예: "어두운 주점", "왕궁 내부") → 영어 환경 태그로 매핑
const KOREAN_LOCATION_MAP: Array<[string, string]> = [
  // 실내 건물
  ['주점', 'tavern'], ['선술집', 'tavern'], ['술집', 'tavern'],
  ['여관', 'inn'],    ['숙소', 'inn'],      ['숙박', 'inn'],
  ['성', 'castle'],   ['왕궁', 'castle'],   ['궁전', 'castle'],  ['요새', 'castle'],
  ['던전', 'dungeon'],['지하', 'dungeon'],  ['감옥', 'dungeon'], ['지하실', 'dungeon'],
  ['사원', 'temple'], ['신전', 'temple'],   ['교회', 'temple'],  ['성당', 'temple'],
  ['시장', 'market'], ['상점', 'market'],   ['상가', 'market'],  ['가게', 'market'],
  ['도시', 'city'],   ['도심', 'city'],     ['수도', 'city'],
  ['마을', 'village'],['촌', 'village'],    ['마을 광장', 'village'],
  ['항구', 'port'],   ['부두', 'port'],     ['선착장', 'port'],
  ['학원', 'castle'], ['훈련장', 'castle'], ['병영', 'castle'],
  // 자연/실외
  ['숲', 'forest'],   ['삼림', 'forest'],   ['나무', 'forest'],  ['수풀', 'forest'],
  ['산', 'mountain'], ['절벽', 'mountain'], ['고원', 'mountain'],['봉우리', 'mountain'],
  ['동굴', 'cave'],   ['동굴', 'cave'],     ['굴', 'cave'],      ['석굴', 'cave'],
  ['폐허', 'ruins'],  ['유적', 'ruins'],    ['폐성', 'ruins'],   ['무너진', 'ruins'],
  ['길', 'road'],     ['도로', 'road'],     ['평원', 'road'],    ['들판', 'road'],
]

// ── Location keyword → detailed environment visual tags ───────
const LOCATION_TAGS: Record<string, string> = {
  'tavern':    'warm tavern interior, wooden beams, stone fireplace, barrels and mugs, candlelit atmosphere',
  'inn':       'cozy inn interior, warm candlelight, wooden furniture, hearth fire, intimate setting',
  'forest':    'ancient dense forest, towering trees, mossy ground, dappled light filtering through canopy, rich foliage',
  'dungeon':   'dark stone dungeon, dripping moisture on walls, iron bars, flickering torchlight, oppressive darkness',
  'castle':    'grand medieval castle interior, massive stone walls, tapestries, iron chandeliers, imposing architecture',
  'city':      'medieval city cobblestone street, half-timber buildings, city crowd, merchant district',
  'market':    'busy medieval market square, colorful merchant stalls, crowds of people, wooden signs',
  'mountain':  'rugged mountain landscape, rocky cliffs, alpine winds, sweeping distant peaks, dramatic sky',
  'cave':      'underground cave system, stalactites, glowing crystals, deep mysterious shadows',
  'village':   'small peaceful medieval village, thatched rooftops, dirt paths, rural pastoral scenery',
  'ruins':     'ancient crumbling stone ruins, overgrown vines and moss, mysterious weathered atmosphere',
  'temple':    'stone temple interior, altar with offerings, religious iconography, incense smoke, sacred light',
  'road':      'dirt road through rolling countryside, distant forests, open sky, travel atmosphere',
  'port':      'medieval harbor port, wooden docks, sailing ships, salt sea air, fishermen and nets',
}

function resolveLocationTag(currentLocation?: string): string {
  if (!currentLocation) return ''
  const loc = currentLocation

  // 1) 한국어 키워드 매핑 (정확도 우선)
  for (const [kor, eng] of KOREAN_LOCATION_MAP) {
    if (loc.includes(kor)) return LOCATION_TAGS[eng] ?? ''
  }
  // 2) 영어 키워드 매핑 (scene_description 등에서 혼용될 경우)
  const lower = loc.toLowerCase()
  for (const [eng, tag] of Object.entries(LOCATION_TAGS)) {
    if (lower.includes(eng)) return tag
  }
  return ''
}

// ── Weather → visual atmospheric tags ────────────────────────
const WEATHER_TAGS: Record<string, string> = {
  '맑음':    'clear blue sky, bright warm golden sunlight, crisp visibility',
  '흐림':    'overcast cloudy sky, diffused soft grey lighting, muted atmosphere',
  '비':      'heavy rain falling, wet glistening cobblestones, dark overcast sky, rainy atmosphere',
  '폭풍':    'violent storm raging, lightning in dark dramatic clouds, howling wind, intense weather',
  '안개':    'thick ethereal fog, soft diffused light through mist, mysterious atmospheric haze',
  '눈':      'snowflakes gently falling, white snow covering ground, winter frost atmosphere',
  '뇌우':    'thunderstorm, dramatic lightning flash illuminating dark sky, heavy downpour',
  '사막열풍': 'swirling sand dust storm, harsh blazing sunlight, shimmering heat haze, desert winds',
}

export async function generateEnhancedSceneImage(
  sceneDescription: string,
  direction?: VisualDirection | null,
  activeNpcs?: NPC[],
  heroAppearance?: string,
  currentLocation?: string,
  weather?: string
): Promise<string> {
  const falKey = process.env.FAL_KEY
  if (!falKey) return placeholderDataUrl('scene', sceneDescription.slice(0, 40))

  try {
    fal.config({ credentials: falKey })

    // ── NPC 외모 태그 ──
    const npcAppearance = activeNpcs && activeNpcs.length > 0
      ? activeNpcs
          .map(n => `${n.age ? `${n.age}yo ` : ''}${n.appearance}`)
          .filter(Boolean)
          .join(', ')
      : ''

    // ── 장소/날씨 태그 (한국어 우선 매핑) ──
    const locationTag = resolveLocationTag(currentLocation)
    const weatherTag  = weather ? (WEATHER_TAGS[weather] ?? '') : ''

    // ── 카메라/구도 결정 ──
    // visual_direction이 있으면 우선 사용, 없으면 씬 기반 자동 판단
    const composition = direction?.camera_shot
      ? SHOT_COMPOSITION[direction.camera_shot]
      : determineComposition(sceneDescription)

    const focusTags  = direction?.focus    ? FOCUS_TAGS[direction.focus]    : 'medium shot, protagonist visible, cinematic composition'
    const lightingTag = direction?.lighting ? direction.lighting + ' lighting' : 'cinematic atmospheric lighting'

    // ── 강도별 품질/스텝 분기 ──
    const isHighIntensity   = direction?.intensity === 'climax' || direction?.intensity === 'dramatic'
    const inferenceSteps    = isHighIntensity ? 42 : 30
    const qualityTag        = isHighIntensity
      ? '(masterpiece CG illustration), (highly detailed emotional scene), intricate background'
      : '(visual novel CG style), detailed scene, quality illustration'

    // ── 프롬프트 조합 ──
    // 중요도 순서: sceneDescription > 세계관/장소 > 날씨/조명 > 구도/포커스 > 캐릭터 > 품질
    const promptParts = [
      SDXL_PREFIX,
      // 1순위: 이번 씬의 핵심 내용 (가중치 부여)
      sceneDescription ? `(${sceneDescription}:1.15)` : '',
      // 2순위: 세계관 + 장소
      '(medieval fantasy setting:1.2)',
      locationTag,
      // 3순위: 날씨/조명
      weatherTag,
      lightingTag,
      // 4순위: 구도/포커스
      composition,
      focusTags,
      // 5순위: 캐릭터 외모
      heroAppearance ? `protagonist: ${heroAppearance}` : '',
      npcAppearance  ? `characters: ${npcAppearance}`   : '',
      // 6순위: 품질 수정자
      qualityTag,
    ].filter(Boolean)

    const prompt = promptParts.join(', ')

    console.log(`[Image] scene="${sceneDescription.slice(0,50)}" | loc=${currentLocation ?? '-'} | weather=${weather ?? '-'} | intensity=${direction?.intensity ?? 'auto'} | shot=${direction?.camera_shot ?? 'auto'} | steps=${inferenceSteps}`)

    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: {
        prompt,
        negative_prompt: SDXL_NEGATIVE,
        image_size: 'landscape_16_9',
        num_inference_steps: inferenceSteps,
        guidance_scale: isHighIntensity ? 8.5 : 7.5,
        enable_safety_checker: false,
      },
    }) as unknown as { data: { images: Array<{ url: string }> } }

    return result.data?.images?.[0]?.url ?? placeholderDataUrl('scene', sceneDescription.slice(0, 40))
  } catch (err) {
    console.error('[Image] Enhanced scene generation failed:', err)
    return placeholderDataUrl('scene', sceneDescription.slice(0, 40))
  }
}

// ── Backward-compat alias (deprecated) ───────────────────────
export async function generateSceneImage(sceneDescription: string): Promise<string> {
  return generateEnhancedSceneImage(sceneDescription, null, [])
}