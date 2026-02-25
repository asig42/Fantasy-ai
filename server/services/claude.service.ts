import Anthropic from '@anthropic-ai/sdk'
import type {
  WorldData,
  NPC,
  BackgroundOption,
  ClaudeGameResponse,
  CharacterClass,
  GameMessage,
  PlayerCharacter,
} from '../../src/types/game'

let _apiKey: string | undefined = process.env.ANTHROPIC_API_KEY

export function setAnthropicApiKey(key: string) {
  _apiKey = key
  process.env.ANTHROPIC_API_KEY = key
}

export function getAnthropicApiKey(): string | undefined {
  return _apiKey
}

function getClient(): Anthropic {
  if (!_apiKey) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.')
  return new Anthropic({ apiKey: _apiKey })
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    // Use built-in SDK timeout to avoid unhandled rejections from Promise.race
    const testClient = new Anthropic({ apiKey: key, timeout: 20000 })
    await testClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return true
  } catch {
    return false
  }
}

// JSON 파싱 헬퍼 - 잘린 응답 감지 및 배열 부분 복구
function parseJson<T>(text: string, pattern: RegExp, context: string): T {
  const match = text.match(pattern)
  if (!match) throw new Error(`${context}: JSON을 찾을 수 없습니다`)
  try {
    return JSON.parse(match[0]) as T
  } catch (e) {
    const msg = String(e)
    const isTruncated =
      msg.includes('Unterminated') ||
      msg.includes('Unexpected end') ||
      msg.includes("Expected ','") ||
      msg.includes("Expected '}'") ||
      msg.includes("Expected ']'")

    // 배열인 경우 완전한 항목만 복구 시도
    if (isTruncated && pattern.source.startsWith('\\[')) {
      try {
        const partial = match[0]
        const items: unknown[] = []
        // 완성된 객체만 추출 (마지막 불완전한 항목 제외)
        const objPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
        let m: RegExpExecArray | null
        while ((m = objPattern.exec(partial)) !== null) {
          try { items.push(JSON.parse(m[0])) } catch { /* skip malformed */ }
        }
        if (items.length >= 5) {
          console.warn(`[Claude] ${context}: 응답 잘림 - ${items.length}개 항목 복구됨`)
          return items as T
        }
      } catch { /* 복구 실패시 아래 에러로 */ }
    }

    if (isTruncated) {
      throw new Error(`${context}: 응답이 잘렸습니다 (max_tokens 초과). 잠시 후 다시 시도해주세요.`)
    }
    throw new Error(`${context}: JSON 파싱 실패 - ${msg}`)
  }
}

// ================================================================
// 1. WORLD GENERATION
// ================================================================
export async function generateWorld(): Promise<WorldData> {
  console.log('[Claude] Generating world...')

  const msg = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `당신은 판타지 세계를 창조하는 전문 작가입니다.
반드시 유효한 JSON만 반환하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.`,
    messages: [
      {
        role: 'user',
        content: `TRPG 판타지 게임을 위한 매력적인 세계를 만들어주세요.

다음 형식의 JSON을 반환하세요:
{
  "name": "세계 이름 (판타지적이고 독창적인 이름)",
  "lore": "세계 배경 설명 (150자 이내, 고대 문명, 마법, 신들에 대한 간략한 설명)",
  "continents": [
    {
      "id": "continent_1",
      "name": "대륙 이름",
      "description": "대륙 특징 설명 (80자)",
      "climate": "기후 유형",
      "majorKingdoms": ["왕국/국가 이름 1", "왕국/국가 이름 2", "왕국/국가 이름 3"]
    },
    {
      "id": "continent_2",
      "name": "두 번째 대륙 이름",
      "description": "대륙 특징 설명 (80자)",
      "climate": "기후 유형",
      "majorKingdoms": ["왕국/국가 이름 1", "왕국/국가 이름 2"]
    }
  ],
  "islands": [
    {"id": "island_1", "name": "섬 이름", "description": "섬 설명 (50자)"},
    {"id": "island_2", "name": "섬 이름", "description": "섬 설명 (50자)"},
    {"id": "island_3", "name": "섬 이름", "description": "섬 설명 (50자)"},
    {"id": "island_4", "name": "섬 이름", "description": "섬 설명 (50자)"}
  ],
  "majorCities": [
    {"id": "city_1", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모 (예: 대도시, 중소도시)"},
    {"id": "city_2", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"},
    {"id": "city_3", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"},
    {"id": "city_4", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"},
    {"id": "city_5", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"},
    {"id": "city_6", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"},
    {"id": "city_7", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"},
    {"id": "city_8", "name": "도시 이름", "continent": "대륙 이름", "description": "도시 특징 (60자)", "population": "인구 규모"}
  ]
}`,
      },
    ],
  })

  const textContent = msg.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')
  return parseJson<WorldData>(textContent.text.trim(), /\{[\s\S]*\}/, '세계 생성')
}

// ================================================================
// 2. NPC GENERATION
// ================================================================
export async function generateNPCs(world: WorldData): Promise<NPC[]> {
  console.log('[Claude] Generating NPCs...')

  const kingdomsList = world.continents.flatMap(c => c.majorKingdoms).join(', ')

  const msg = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: `당신은 판타지 캐릭터를 설계하는 전문 작가입니다.
반드시 유효한 JSON 배열만 반환하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.
모든 문자열 값은 간결하게 작성하세요.`,
    messages: [
      {
        role: 'user',
        content: `세계 '${world.name}'의 핵심 NPC 10명을 만들어주세요.
국가들: ${kingdomsList}

규칙:
- 황제/왕, 여왕/대공비, 마법사, 기사단장, 고위 성직자, 상인 길드장, 암살자 길드마스터, 용병대장, 현자, 마녀 등 핵심 역할
- 성별: 남성과 여성 혼합 (최소 4명 여성)
- appearance 필드는 영어로 작성 (이미지 생성용, 60자 이내)

JSON 배열 형식 (정확히 10명):
[
  {
    "id": "npc_01",
    "name": "이름",
    "title": "직함",
    "age": 숫자,
    "gender": "남성 또는 여성",
    "nationality": "출신 국가",
    "appearance": "hair, eyes, build, clothing (English, max 60 chars)",
    "personality": ["성격1", "성격2", "성격3"],
    "background": "배경 이야기 (50자 이내)",
    "alignment": "선 또는 중립 또는 악",
    "skills": ["능력1", "능력2"],
    "relationshipToPlayer": "잠재적 관계",
    "emotions": [
      {"emotion": "neutral", "description": "calm expression"},
      {"emotion": "happy", "description": "warm smile"},
      {"emotion": "angry", "description": "fierce eyes"},
      {"emotion": "serious", "description": "determined look"}
    ]
  }
]`,
      },
    ],
  })

  const textContent = msg.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')
  return parseJson<NPC[]>(textContent.text.trim(), /\[[\s\S]*\]/, 'NPC 생성')
}

// ================================================================
// 3. NARRATIVE GENERATION
// ================================================================
export async function generateNarrative(world: WorldData): Promise<string> {
  console.log('[Claude] Generating narrative...')

  const msg = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `당신은 판타지 소설의 나레이터입니다.
영화 오프닝처럼 웅장하고 몰입감 있는 문체로 글을 씁니다.
4문단으로 구성된 서사를 한국어로 작성합니다.`,
    messages: [
      {
        role: 'user',
        content: `세계 '${world.name}'의 주요 서사를 4문단으로 작성해주세요.

세계 배경: ${world.lore}
주요 대륙: ${world.continents.map(c => `${c.name} (${c.description})`).join(', ')}

작성 지침:
- 1문단: 세계의 태초와 과거의 번영 (신화적 시대, 영웅의 시대)
- 2문단: 현재의 위기 등장 (마왕의 부활, 고대 봉인의 해제, 혹은 제국 간의 전쟁)
- 3문단: 어둠이 퍼지는 현재 상황 (세계의 혼란, 희망의 불씨)
- 4문단: 예언과 선택받은 자의 등장 예고 (플레이어에게 보내는 메시지)

문체: 웅장하고 시적인 한국어, 라이트노벨/웹소설 나레이션 스타일
각 문단은 최소 150자 이상으로 작성해주세요.`,
      },
    ],
  })

  const textContent = msg.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')
  return textContent.text.trim()
}

// ================================================================
// 4. CHARACTER BACKGROUND GENERATION
// ================================================================
export async function generateCharacterBackgrounds(
  characterClass: CharacterClass,
  worldName: string,
  worldLore: string
): Promise<BackgroundOption[]> {
  console.log('[Claude] Generating character backgrounds...')

  const classDescriptions: Record<CharacterClass, string> = {
    '전사': '검과 방패를 다루는 전투 전문가',
    '마법사': '고대 마법을 연구하고 시전하는 학자',
    '도적': '그림자 속에서 움직이는 교활한 생존자',
    '성직자': '신의 뜻을 따르는 치유사이자 전사',
    '사냥꾼': '자연을 누비는 숙련된 추적자',
    '연금술사': '물질을 변환하고 비약을 만드는 학자',
    '음유시인': '노래와 이야기로 마법을 다루는 예술가',
    '팔라딘': '정의와 빛을 위해 싸우는 성스러운 기사',
  }

  const msg = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `반드시 유효한 JSON만 반환하세요. 설명 없이 순수 JSON 배열만 출력하세요.`,
    messages: [
      {
        role: 'user',
        content: `직업 '${characterClass}' (${classDescriptions[characterClass]})의 배경 이야기 3가지를 만들어주세요.
세계: ${worldName} - ${worldLore}

각 배경은 서로 완전히 다른 스타일이어야 합니다 (예: 귀족 출신, 평민 출신, 비극적 과거 등).

JSON 배열:
[
  {
    "title": "배경 제목 (10자 이내)",
    "description": "3문장으로 구성: 성장 배경, ${characterClass}가 된 이유, 모험을 시작하는 동기"
  },
  {
    "title": "배경 제목",
    "description": "3문장 배경 이야기"
  },
  {
    "title": "배경 제목",
    "description": "3문장 배경 이야기"
  }
]`,
      },
    ],
  })

  const textContent = msg.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')
  return parseJson<BackgroundOption[]>(textContent.text.trim(), /\[[\s\S]*\]/, '배경 생성')
}

// ================================================================
// SHARED HELPERS
// ================================================================

// Build compact history text: use pre-computed summaries when available,
// falling back to truncated content. Allows sending many more turns
// without blowing up the token budget.
function buildHistoryText(history: GameMessage[]): string {
  return history.slice(-12).map(m => {
    if (m.role === 'player') return `[플레이어] ${m.content}`
    const prefix = m.role === 'npc' ? `[${m.npcName || 'NPC'}]` : '[나레이터]'
    const text = m.summary ?? m.content.slice(0, 120)
    return `${prefix} ${text}`
  }).join('\n\n')
}

// The extra JSON fields we ask Claude to return alongside narration
const GM_JSON_FORMAT = `{
  "narration": "웹소설 스타일의 서술 (3-4문단, 대사 포함, 한국어, 최소 250자)",
  "summary": "이번 턴 핵심 요약 (한국어 1-2문장, 50자 이내): 플레이어 행동 결과와 중요 정보만",
  "scene_description": "English description for image generation: location, atmosphere, characters present, time of day, weather, mood (max 60 words)",
  "scene_tag": "short_location_tag (e.g. tavern_night, forest_day, dungeon_corridor)",
  "reuse_scene_image": false,
  "current_location": "현재 위치명",
  "npc_speaking": "현재 대화 중인 NPC의 id (없으면 null)",
  "npc_emotion": "NPC 감정 상태 neutral/happy/angry/sad/surprised/serious/smug 중 하나 (없으면 null)",
  "available_npcs": ["현재 장면에 있는 NPC id 배열"],
  "game_over": false,
  "new_npc": null
}`

const NEW_NPC_RULES = `## 새 NPC 즉석 생성 규칙
- 위 NPC 목록에 없는 새 인물이 이야기에 등장해야 할 때만 new_npc 필드를 채우세요
- 기존 NPC와 상호작용할 때는 new_npc를 null로 두세요
- new_npc를 생성할 경우 npc_speaking에 그 id를 사용하세요
- new_npc 형식:
{
  "id": "npc_dyn_[고유숫자]",
  "name": "이름",
  "title": "직함",
  "age": 숫자,
  "gender": "남성 또는 여성",
  "nationality": "출신 국가/지역",
  "appearance": "English: hair, eyes, build, clothing for portrait generation",
  "personality": ["성격1", "성격2"],
  "background": "배경 (50자)",
  "alignment": "선(善) 또는 중립(中立) 또는 악(惡)",
  "skills": ["기술1", "기술2"],
  "relationshipToPlayer": "관계",
  "emotions": [
    {"emotion": "neutral", "description": "calm expression"},
    {"emotion": "happy", "description": "warm smile"},
    {"emotion": "angry", "description": "fierce look"},
    {"emotion": "serious", "description": "focused gaze"}
  ]
}`

// Auto-select model based on turn complexity.
// Sonnet for dramatic/combat moments and game opening; Haiku for routine turns.
function selectModel(playerInput: string, history: GameMessage[]): string {
  if (history.length < 6) return 'claude-sonnet-4-6'
  const dramatic = ['전투', '싸우', '공격', '죽', '사망', '탈출', '위기', '마법', '보스', '배신', '비밀']
  if (dramatic.some(kw => playerInput.includes(kw))) return 'claude-sonnet-4-6'
  return 'claude-haiku-4-5-20251001'
}

function buildSystemPrompt(
  world: WorldData, npcs: NPC[], narrative: string,
  character: PlayerCharacter, currentLocation: string
): string {
  const npcSummary = npcs.map(n =>
    `- ID: ${n.id} | ${n.title} ${n.name} | 성격: ${n.personality.join(', ')} | 성향: ${n.alignment}`
  ).join('\n')

  return `당신은 판타지 TRPG 게임의 게임 마스터입니다.
세계: ${world.name}
세계 배경: ${world.lore}

## 주요 NPC 목록
${npcSummary}

## 메인 서사
${narrative.slice(0, 500)}...

## 게임 규칙
- 웹소설/라이트노벨 스타일로 4-6문단의 몰입감 있는 서술을 작성하세요
- 대사는 큰따옴표 "로 표시하세요
- 플레이어 행동에 논리적으로 반응하세요
- NPC의 성격과 성향에 맞게 행동시키세요
- 세계관의 일관성을 유지하세요
- scene_description은 영어로 작성하세요 (이미지 생성용)
- 반드시 유효한 JSON만 반환하세요

## 이미지 재사용 규칙 (비용 절감)
- scene_tag: 장소+시간대를 나타내는 짧은 영어 슬러그 (예: "tavern_night", "forest_day", "dungeon_corridor", "city_market_day", "castle_interior", "cave_entrance"). 2-3 단어, 소문자, 언더스코어 구분.
- reuse_scene_image: 아래 조건이 모두 해당하면 true, 하나라도 아니면 false
  * 이전 턴과 current_location이 동일
  * 시간대/날씨/조명이 크게 변하지 않음
  * 장면의 전반적 분위기가 유사 (전투 시작/종료 등 극적 변화 없음)

## 주인공 정보
이름: ${character.name} | 직업: ${character.characterClass} | 레벨: ${character.stats.level}
배경: ${character.backstory.slice(0, 100)}

현재 위치: ${currentLocation}`
}

// ================================================================
// 5. GAME ACTION PROCESSING (Main GM Function)
// ================================================================
export async function processGameAction(
  world: WorldData,
  npcs: NPC[],
  narrative: string,
  character: PlayerCharacter,
  history: GameMessage[],
  playerInput: string,
  currentLocation: string
): Promise<ClaudeGameResponse> {
  console.log('[Claude] Processing game action...')

  const historyText = buildHistoryText(history)

  const userMessage = `## 최근 대화 기록 (요약 포함)
${historyText}

## 플레이어 행동
${playerInput}

다음 JSON 형식으로 응답하세요:
${GM_JSON_FORMAT}

${NEW_NPC_RULES}`

  const msg = await getClient().messages.create({
    model: selectModel(playerInput, history),
    max_tokens: 6000,
    system: [{ type: 'text', text: buildSystemPrompt(world, npcs, narrative, character, currentLocation), cache_control: { type: 'ephemeral' } }] as Parameters<typeof getClient().messages.create>[0]['system'],
    messages: [{ role: 'user', content: userMessage }],
  })

  const textContent = msg.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')
  return parseJson<ClaudeGameResponse>(textContent.text.trim(), /\{[\s\S]*\}/, '게임 액션')
}

// ================================================================
// 5b. GAME ACTION STREAMING
// ================================================================
type StreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done'; response: ClaudeGameResponse }

export async function* processGameActionStream(
  world: WorldData,
  npcs: NPC[],
  narrative: string,
  character: PlayerCharacter,
  history: GameMessage[],
  playerInput: string,
  currentLocation: string
): AsyncGenerator<StreamEvent> {
  const historyText = buildHistoryText(history)

  const userMessage = `## 최근 대화 기록 (요약 포함)
${historyText}

## 플레이어 행동
${playerInput}

다음 JSON 형식으로 응답하세요:
${GM_JSON_FORMAT}

${NEW_NPC_RULES}`

  const stream = getClient().messages.stream({
    model: selectModel(playerInput, history),
    max_tokens: 6000,
    system: [{ type: 'text', text: buildSystemPrompt(world, npcs, narrative, character, currentLocation), cache_control: { type: 'ephemeral' } }] as Parameters<typeof getClient().messages.create>[0]['system'],
    messages: [{ role: 'user', content: userMessage }],
  })

  let fullText = ''
  let narrationOffset = -1
  let narrationSent = 0

  for await (const event of stream) {
    if (event.type !== 'content_block_delta') continue
    const delta = event.delta as { type: string; text?: string }
    if (delta.type !== 'text_delta' || !delta.text) continue

    fullText += delta.text

    // Detect start of narration string value
    if (narrationOffset === -1) {
      const prefix = '"narration": "'
      const idx = fullText.indexOf(prefix)
      if (idx !== -1) narrationOffset = idx + prefix.length
    }

    if (narrationOffset === -1) continue

    // Extract newly streamed narration characters
    const available = fullText.slice(narrationOffset)
    let endIdx = -1
    let escaped = false
    for (let i = narrationSent; i < available.length; i++) {
      if (escaped) { escaped = false; continue }
      if (available[i] === '\\') { escaped = true; continue }
      if (available[i] === '"') { endIdx = i; break }
    }

    const raw = endIdx !== -1
      ? available.slice(narrationSent, endIdx)
      : available.slice(narrationSent)

    if (raw) {
      const decoded = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      yield { type: 'chunk', content: decoded }
      narrationSent = endIdx !== -1 ? endIdx : available.length
    }
  }

  const response = parseJson<ClaudeGameResponse>(fullText.trim(), /\{[\s\S]*\}/, '게임 액션')
  yield { type: 'done', response }
}

// ================================================================
// 6. INITIAL SCENE GENERATION (Game Start)
// ================================================================
export async function generateInitialScene(
  world: WorldData,
  narrative: string,
  character: PlayerCharacter
): Promise<ClaudeGameResponse> {
  console.log('[Claude] Generating initial scene...')

  const msg = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `당신은 판타지 TRPG의 게임 마스터입니다.
반드시 유효한 JSON만 반환하세요.`,
    messages: [
      {
        role: 'user',
        content: `세계 '${world.name}'에서 막 모험을 시작하는 ${character.name} (${character.characterClass})의 첫 장면을 만들어주세요.

주인공 배경: ${character.backstory}
주요 서사: ${narrative.slice(0, 300)}...

첫 장면은:
- 소도시나 여관, 혹은 관문 도시에서 시작
- 세계의 위기가 서서히 드러나기 시작
- 첫 만남이 될 수 있는 NPC나 상황 제시
- 플레이어가 무엇을 할 수 있는지 자연스럽게 암시

JSON 형식:
{
  "narration": "게임 시작 나레이션 (웹소설 스타일, 4-6문단, 한국어, 최소 500자)",
  "scene_description": "English: tavern/town starting area, fantasy RPG atmosphere, warm lantern light, busy marketplace or inn, medieval fantasy setting",
  "scene_tag": "tavern_night",
  "reuse_scene_image": false,
  "current_location": "시작 위치명",
  "npc_speaking": null,
  "npc_emotion": null,
  "available_npcs": [],
  "game_over": false
}`,
      },
    ],
  })

  const textContent = msg.content.find(b => b.type === 'text')
  if (!textContent || textContent.type !== 'text') throw new Error('No text response')
  return parseJson<ClaudeGameResponse>(textContent.text.trim(), /\{[\s\S]*\}/, '초기 장면 생성')
}
