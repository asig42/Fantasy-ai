/**
 * r2_service.ts
 * Cloudflare R2 이미지 URL 생성 서비스
 */

const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ??
  'https://pub-32cf77d5db4642c2925681fcffc5375d.r2.dev'
).replace(/\/$/, '')

// 감정 → SFW 씬 ID (run_aeternova.py SFW_SCENES와 동일)
const EMOTION_TO_SCENE: Record<string, string> = {
  neutral:   'portrait',
  happy:     'happy',
  sad:       'portrait',
  surprised: 'portrait',
  angry:     'serious',
  serious:   'serious',
  smug:      'happy',
}

// intensity override
const INTENSITY_TO_SCENE: Record<string, string> = {
  climax:   'action',
  dramatic: 'serious',
}

// 위치 키워드 → locations 파일명
const LOCATION_MAP: Array<[string, string]> = [
  ['선술집', 'loc_tavern'], ['tavern', 'loc_tavern'], ['여관', 'loc_tavern'],
  ['시장',   'loc_market'], ['market', 'loc_market'],
  ['도서관', 'loc_library'], ['library', 'loc_library'],
  ['성',     'loc_castle'], ['castle', 'loc_castle'], ['왕궁', 'loc_castle'],
  ['숲',     'loc_forest'], ['forest', 'loc_forest'],
  ['던전',   'loc_dungeon'], ['dungeon', 'loc_dungeon'],
  ['마을',   'loc_village'], ['village', 'loc_village'],
  ['항구',   'loc_port'],   ['port', 'loc_port'],
  ['산',     'loc_mountain'], ['mountain', 'loc_mountain'],
  ['동굴',   'loc_cave'],   ['cave', 'loc_cave'],
  ['폐허',   'loc_ruins'],  ['ruins', 'loc_ruins'],
  ['사원',   'loc_temple'], ['temple', 'loc_temple'],
]

/**
 * NPC id → R2 폴더명
 * run_aeternova.py 출력 폴더: "001_엘리아나" 형식 사용
 */
export function getNpcFolder(npc: { id: string; name: string }, allNpcs: { id: string }[]): string {
  const idx = allNpcs.findIndex(n => n.id === npc.id)
  const num = String((idx >= 0 ? idx : allNpcs.length) + 1).padStart(3, '0')
  return `${num}_${npc.name}`
}

/**
 * 캐릭터 이미지 URL
 */
export function getCharacterImageUrl(
  charFolder: string,
  emotion: string,
  intensity: string,
  isNsfw = false
): string {
  const category = isNsfw ? 'nsfw' : 'sfw'
  const sceneId  = INTENSITY_TO_SCENE[intensity] ?? EMOTION_TO_SCENE[emotion] ?? 'portrait'
  return `${R2_PUBLIC_URL}/${category}/${charFolder}/${sceneId}.png`
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
