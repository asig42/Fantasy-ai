/**
 * r2_service.ts
 * Cloudflare R2 이미지 URL 생성 서비스
 */

const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ??
  'https://pub-32cf77d5db4642c2925681fcffc5375d.r2.dev'
).replace(/\/$/, '')

// 사전 정의 NPC 번호 범위 (aeternova-npcs.ts: npc_001 ~ npc_125)
const PREDEFINED_NPC_MAX = 125

// 감정 → SFW 씬 ID (run_aeternova.py SFW_SCENES와 동일)
const EMOTION_TO_SCENE: Record<string, string> = {
  neutral:   'portrait',
  happy:     'happy',
  sad:       'sad',
  surprised: 'portrait',
  angry:     'angry',
  serious:   'serious',
  smug:      'happy',
}

// intensity override (감정보다 우선)
const INTENSITY_TO_SCENE: Record<string, string> = {
  climax:   'action',
  dramatic: 'serious',
}

// 씬 ID fallback 체인: 없으면 순서대로 시도
// portrait는 항상 존재하므로 최종 fallback
const SCENE_FALLBACK: Record<string, string> = {
  angry:  'serious',
  sad:    'portrait',
}

// 위치 키워드 → locations 파일명
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
 * ID에서 번호를 직접 추출: "npc_042" → "042_이름"
 */
export function getNpcFolder(npc: { id: string; name: string }): string {
  const match = npc.id.match(/(\d+)$/)
  const num = match ? match[1].padStart(3, '0') : '000'
  return `${num}_${npc.name}`
}

/**
 * 캐릭터 이미지 URL (한글/공백 포함 폴더명 URL 인코딩 처리)
 */
export function getCharacterImageUrl(
  charFolder: string,
  emotion: string,
  intensity: string,
  isNsfw = false
): string {
  const category = isNsfw ? 'nsfw' : 'sfw'
  const sceneId  = INTENSITY_TO_SCENE[intensity] ?? EMOTION_TO_SCENE[emotion] ?? 'portrait'
  // 한글·공백이 포함된 폴더명을 URL-safe하게 인코딩
  const encodedFolder = encodeURIComponent(charFolder)
  return `${R2_PUBLIC_URL}/${category}/${encodedFolder}/${sceneId}.png`
}

/**
 * 씬 fallback URL: 특정 감정 씬이 없을 때 portrait으로 대체한 URL 반환
 */
export function getCharacterImageUrlWithFallback(
  charFolder: string,
  emotion: string,
  intensity: string,
  isNsfw = false
): string[] {
  const primary = getCharacterImageUrl(charFolder, emotion, intensity, isNsfw)
  const sceneId = INTENSITY_TO_SCENE[intensity] ?? EMOTION_TO_SCENE[emotion] ?? 'portrait'
  const fallbackSceneId = SCENE_FALLBACK[sceneId]
  const urls = [primary]
  if (fallbackSceneId && fallbackSceneId !== sceneId) {
    const encodedFolder = encodeURIComponent(charFolder)
    const category = isNsfw ? 'nsfw' : 'sfw'
    urls.push(`${R2_PUBLIC_URL}/${category}/${encodedFolder}/${fallbackSceneId}.png`)
  }
  return urls
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
