/**
 * r2_service.ts
 * Cloudflare R2 이미지 URL 생성 서비스
 *
 * SFW  R2 구조: sfw/{003_이름}/[씬].png
 *   씬 파일 (전 캐릭터 공통): portrait, happy, serious, action, talk
 *   씬 파일 (일부 캐릭터): library, market, tavern
 *
 * NSFW R2 구조: nsfw/{003_이름}/nsfw_NN_[씬].png
 *   nsfw_01_tease, nsfw_02_bath, nsfw_03_lingerie, nsfw_04_onsen,
 *   nsfw_05_morning, nsfw_06_dress, nsfw_07_wet, nsfw_08_swim,
 *   nsfw_09_office, nsfw_10_bond
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

// ── 위치 키워드 → SFW 캐릭터 씬 ID (intensity 없을 때 적용) ─────────
const LOCATION_TO_SCENE_MAP: Array<[string, string]> = [
  ['선술집', 'tavern'], ['tavern', 'tavern'], ['여관', 'tavern'], ['inn', 'tavern'],
  ['도서관', 'library'], ['library', 'library'],
  ['시장', 'market'], ['market', 'market'], ['상점', 'market'],
]

// ── 컨텍스트 키워드 → NSFW 씬 ID ─────────────────────────────────────
// location, narration, visual_direction 에서 매칭, 순서 = 우선순위
const NSFW_CONTEXT_MAP: Array<[string, string]> = [
  // 결박/감금
  ['결박', 'nsfw_10_bond'], ['포박', 'nsfw_10_bond'], ['사슬', 'nsfw_10_bond'],
  ['bond', 'nsfw_10_bond'], ['restrain', 'nsfw_10_bond'], ['captive', 'nsfw_10_bond'],
  // 욕실/목욕
  ['목욕', 'nsfw_02_bath'], ['욕실', 'nsfw_02_bath'], ['욕조', 'nsfw_02_bath'],
  ['bath', 'nsfw_02_bath'], ['bathtub', 'nsfw_02_bath'],
  // 온천
  ['온천', 'nsfw_04_onsen'], ['노천탕', 'nsfw_04_onsen'], ['onsen', 'nsfw_04_onsen'],
  // 수영/해변
  ['수영', 'nsfw_08_swim'], ['수영장', 'nsfw_08_swim'], ['해수욕', 'nsfw_08_swim'],
  ['swim', 'nsfw_08_swim'], ['pool', 'nsfw_08_swim'], ['beach', 'nsfw_08_swim'],
  ['해변', 'nsfw_08_swim'],
  // 빗속/젖음
  ['폭우', 'nsfw_07_wet'], ['비 맞', 'nsfw_07_wet'], ['흠뻑', 'nsfw_07_wet'],
  ['soaked', 'nsfw_07_wet'], ['drench', 'nsfw_07_wet'],
  // 집무실/사무실
  ['집무실', 'nsfw_09_office'], ['사무실', 'nsfw_09_office'], ['집무', 'nsfw_09_office'],
  ['office', 'nsfw_09_office'], ['study', 'nsfw_09_office'], ['desk', 'nsfw_09_office'],
  // 아침/침실
  ['아침', 'nsfw_05_morning'], ['침대', 'nsfw_05_morning'], ['침실', 'nsfw_05_morning'],
  ['기상', 'nsfw_05_morning'], ['morning', 'nsfw_05_morning'], ['bedroom', 'nsfw_05_morning'],
  // 란제리/속옷 (침실이 아닌 명시적 란제리)
  ['란제리', 'nsfw_03_lingerie'], ['속옷', 'nsfw_03_lingerie'], ['lingerie', 'nsfw_03_lingerie'],
  // 드레스/갈아입기
  ['드레스', 'nsfw_06_dress'], ['갈아입', 'nsfw_06_dress'], ['옷 벗', 'nsfw_06_dress'],
  ['dress', 'nsfw_06_dress'], ['undress', 'nsfw_06_dress'],
]

/** 컨텍스트 문자열들에서 NSFW 씬 ID 결정 (없으면 기본값 tease) */
function resolveNsfwScene(contexts: string[]): string {
  const combined = contexts.join(' ').toLowerCase()
  for (const [keyword, scene] of NSFW_CONTEXT_MAP) {
    if (combined.includes(keyword.toLowerCase())) return scene
  }
  return 'nsfw_01_tease'  // 기본 NSFW 씬
}

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
 * SFW 씬 선택 우선순위:
 *   1. intensity (climax→action, dramatic→serious)
 *   2. 위치 기반 씬 (tavern, library, market)
 *   3. emotion 기반 씬 (happy, serious, talk, portrait)
 *
 * NSFW 씬 선택:
 *   - nsfwContexts(location, narration 등) 키워드 매칭 → nsfw_XX_scene
 *   - 매칭 없으면 nsfw_01_tease (기본)
 *   - 이미지 없는 씬은 프론트엔드 onError로 portrait fallback
 *
 * @param nsfwContexts  NSFW 모드 시 씬 결정에 사용할 컨텍스트 문자열 목록
 */
export function getCharacterImageUrl(
  charFolder: string,
  emotion: string,
  intensity: string,
  currentLocation?: string,
  isNsfw = false,
  nsfwContexts: string[] = []
): string {
  const encodedFolder = encodeURIComponent(charFolder)

  if (isNsfw) {
    const contexts = [currentLocation ?? '', ...nsfwContexts].filter(Boolean)
    const sceneId = resolveNsfwScene(contexts)
    return `${R2_PUBLIC_URL}/nsfw/${encodedFolder}/${sceneId}.png`
  }

  // SFW: Priority 1 intensity, 2 location, 3 emotion
  let sceneId = INTENSITY_TO_SCENE[intensity]
  if (!sceneId && currentLocation) sceneId = resolveLocationScene(currentLocation)
  if (!sceneId) sceneId = EMOTION_TO_SCENE[emotion] ?? 'talk'

  return `${R2_PUBLIC_URL}/sfw/${encodedFolder}/${sceneId}.png`
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
