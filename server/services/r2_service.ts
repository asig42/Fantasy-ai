/**
 * r2_service.ts
 * Cloudflare R2 이미지 URL 생성 서비스
 *
 * R2 구조: sfw/{003_이름}/[씬].png
 *   씬 파일 (전 캐릭터 공통): portrait, happy, serious, action, talk
 *   씬 파일 (일부 캐릭터): library, market, tavern
 */

const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ??
  'https://pub-32cf77d5db4642c2925681fcffc5375d.r2.dev'
).replace(/\/$/, '')

// 사전 정의 NPC 번호 범위 (aeternova-npcs.ts: npc_001 ~ npc_125)
const PREDEFINED_NPC_MAX = 125

// ── 감정 → 씬 ID ──────────────────────────────────────────────────
// neutral 기본값은 talk (대화 포즈), portrait는 배경 없는 스탠딩
const EMOTION_TO_SCENE: Record<string, string> = {
  neutral:   'talk',
  happy:     'happy',
  sad:       'portrait',
  surprised: 'portrait',
  angry:     'serious',
  serious:   'serious',
  smug:      'happy',
}

// ── intensity → 씬 ID (감정/위치보다 우선) ─────────────────────────
const INTENSITY_TO_SCENE: Record<string, string> = {
  climax:   'action',
  dramatic: 'serious',
}

// ── 위치 키워드 → 캐릭터 씬 ID (intensity 없을 때 적용) ────────────
// 해당 위치에서 NPC 대화 시 배경이 일치하는 씬 이미지 사용
const LOCATION_TO_SCENE_MAP: Array<[string, string]> = [
  ['선술집', 'tavern'], ['tavern', 'tavern'], ['여관', 'tavern'], ['inn', 'tavern'],
  ['도서관', 'library'], ['library', 'library'],
  ['시장', 'market'], ['market', 'market'], ['상점', 'market'],
]

// ── 위치 키워드 → locations 배경 이미지 파일명 ─────────────────────
const LOCATION_MAP: Array<[string, string]> = [
  ['선술집', 'loc_tavern'], ['tavern', 'loc_tavern'], ['여관', 'loc_tavern'],
  ['시장',   'loc_market'], ['market', 'loc_market'],
  ['도서관', 'loc_library'], ['library', 'loc_library'],
  ['왕궁',  'loc_castle'], ['성',     'loc_castle'], ['castle', 'loc_castle'],
  ['숲',     'loc_forest'], ['forest', 'loc_forest'],
  ['던전',   'loc_dungeon'], ['dungeon', 'loc_dungeon'],
  ['마을',   'loc_village'], ['village', 'loc_village'],
  ['항구',   'loc_port'],   ['port', 'loc_port'],
  ['산',     'loc_mountain'], ['mountain', 'loc_mountain'],
  ['동굴',   'loc_cave'],   ['cave', 'loc_cave'],
  ['폐허',   'loc_ruins'],  ['ruins', 'loc_ruins'],
  ['사원',   'loc_temple'], ['temple', 'loc_temple'],
  ['광장',   'loc_plaza'],  ['plaza', 'loc_plaza'],
  ['해변',   'loc_beach'],  ['beach', 'loc_beach'],
  ['학원',   'loc_academy'], ['academy', 'loc_academy'],
]

function resolveLocationScene(location: string): string | undefined {
  const lower = location.toLowerCase()
  for (const [keyword, scene] of LOCATION_TO_SCENE_MAP) {
    if (lower.includes(keyword)) return scene
  }
  return undefined
}

/**
 * 사전 정의 NPC 여부 확인 (npc_001 ~ npc_125)
 * 이 범위의 NPC는 R2에 이미지가 존재하므로 fal.ai 생성 불필요
 */
export function isPreDefinedNpc(npcId: string): boolean {
  const match = npcId.match(/^npc_(\d+)$/)
  if (!match) return false
  const num = parseInt(match[1], 10)
  return num >= 1 && num <= PREDEFINED_NPC_MAX
}

/**
 * NPC id → R2 폴더명
 * R2 구조: {num}_{이름첫단어}  예) npc_001, 엘리아나 발타르 → "001_엘리아나"
 */
export function getNpcFolder(npc: { id: string; name: string }): string {
  const match = npc.id.match(/(\d+)$/)
  const num = match ? match[1].padStart(3, '0') : '000'
  const firstName = npc.name.split(' ')[0]   // "엘리아나 발타르" → "엘리아나"
  return `${num}_${firstName}`
}

/**
 * 캐릭터 이미지 URL
 *
 * 씬 선택 우선순위:
 *   1. intensity (climax→action, dramatic→serious)
 *   2. 현재 위치 기반 씬 (tavern, library, market)  ← 위치 immersion
 *   3. emotion 기반 씬 (happy, serious, talk, portrait)
 *
 * 한글·공백 포함 폴더명은 encodeURIComponent로 URL 인코딩
 */
export function getCharacterImageUrl(
  charFolder: string,
  emotion: string,
  intensity: string,
  currentLocation?: string,
  isNsfw = false
): string {
  const category = isNsfw ? 'nsfw' : 'sfw'

  // Priority 1: intensity override
  let sceneId = INTENSITY_TO_SCENE[intensity]

  // Priority 2: location-specific scene (action 씬이 아닐 때만)
  if (!sceneId && currentLocation) {
    sceneId = resolveLocationScene(currentLocation)
  }

  // Priority 3: emotion
  if (!sceneId) {
    sceneId = EMOTION_TO_SCENE[emotion] ?? 'talk'
  }

  const encodedFolder = encodeURIComponent(charFolder)
  return `${R2_PUBLIC_URL}/${category}/${encodedFolder}/${sceneId}.png`
}

/**
 * 배경/장소 이미지 URL
 */
export function getLocationImageUrl(location: string): string | null {
  const lower = location.toLowerCase()
  for (const [keyword, id] of LOCATION_MAP) {
    if (lower.includes(keyword)) {
      return `${R2_PUBLIC_URL}/locations/${id}.png`
    }
  }
  return null
}
