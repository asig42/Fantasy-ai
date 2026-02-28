// ================================================================
// 🌍 에테르노바 (Aeternova) — 하드코딩된 세계 데이터
// "마나가 흐르는 곳에 문명이 피어나고, 마나가 끊기는 곳에 야망이 자란다"
// ================================================================

import type { WorldData, Continent, Island, City } from '../types/game'

// ── 대륙 ────────────────────────────────────────────────────────
const CONTINENTS: Continent[] = [
  {
    id: 'arcana',
    name: '아르카나 대륙',
    description:
      '마나가 가장 풍부하게 흐르는 서쪽의 땅. 중심의 거대한 산맥에서 마나가 대지맥처럼 온 대륙으로 퍼져나가며, 수천 년의 역사와 문명이 돌 위에 새겨져 있다.',
    climate: '온대~아한대 혼합 (산맥 기준 동/서 기후 분리)',
    majorKingdoms: ['발타르 왕국', '아르카나 마법 학원', '엘페아 숲 자치령', '드워프 산채 연맹'],
  },
  {
    id: 'oruna',
    name: '오루나 대륙',
    description:
      '마나가 희박한 동쪽의 땅. 고대의 재앙으로 대지맥이 끊겨 결핍의 땅이 되었으나, 그 결핍이 오루나인들을 강하게 단련시켰다. 힘과 야망의 문명이 뿌리내린 곳.',
    climate: '건조~사막 (내륙), 온대 (해안)',
    majorKingdoms: ['오루나 제국', '황야 부족 연합', '고대 유적 탐험대', '해안 상인 공화국'],
  },
]

// ── 섬들 ────────────────────────────────────────────────────────
const ISLANDS: Island[] = [
  {
    id: 'gears_island',
    name: '기어스 섬',
    description:
      '에테르 해 한가운데 솟은 마나 스팀펑크 자유 도시. 거대한 마나 증기 파이프가 섬 전체를 관통하며, 하늘에는 언제나 마나 비행선이 오간다. 어느 나라에도 속하지 않는 기술과 야망의 섬.',
  },
  {
    id: 'corsair_archipelago',
    name: '해적 군도',
    description:
      '에테르 해 남부에 흩어진 수십 개의 섬들. 중심 항구 루나 하버를 중심으로 세계 모든 나라의 수배자·첩자·상인이 교차하는 무법의 자유 지대. 붉은 마나 해적단이 현재 패권을 쥐고 있다.',
  },
  {
    id: 'mist_isles',
    name: '안개 섬들',
    description:
      '에테르 해 북부, 짙은 마나 안개에 영원히 싸인 미지의 섬들. 나침반도 작동하지 않으며, 살아 돌아온 항해사들은 눈빛이 달라진 채 입을 다문다. 세계의 비밀이 잠들어 있다는 전설이 전해진다.',
  },
  {
    id: 'ember_atoll',
    name: '엠버 환초',
    description:
      '에테르 해 동남쪽, 화산 활동으로 형성된 환초 지대. 마나가 용암과 결합해 불꽃 마나석이 산출되며, 이를 노리는 광부·연금술사·마법사들이 위험을 감수하고 모여든다.',
  },
]

// ── 주요 도시 ────────────────────────────────────────────────────
const MAJOR_CITIES: City[] = [
  {
    id: 'valthar_city',
    name: '발타르 시티',
    continent: '아르카나 대륙',
    description:
      '아르카나 최대 도시이자 발타르 왕국의 수도. 웅장한 성벽과 마나 결정체 빛이 흘러내리는 왕궁, 그리고 햇빛도 들지 않는 빈민가 회색 골목이 공존하는 불평등의 도시.',
    population: '대도시 (인구 약 40만)',
  },
  {
    id: 'arcana_academy',
    name: '아르카나 학원 도시',
    continent: '아르카나 대륙',
    description:
      '마나의 척추 산맥 기슭에 세워진 세계 최고 마법 학원과 그 주변 학술 도시. 7개의 속성별 탑에서 마법사들이 밤낮으로 연구하며, 지하 금지된 서고의 존재가 끊임없이 소문을 낳는다.',
    population: '중소도시 (학자·마법사 약 8천)',
  },
  {
    id: 'green_vale',
    name: '초록 평야 농촌 지대',
    continent: '아르카나 대륙',
    description:
      '산맥 서쪽 완만한 평야에 점점이 흩어진 마나 농법 마을들의 집합. 최근 마나 불안정으로 흉작이 이어지며 도시로의 이주민이 급증하고 있다.',
    population: '농촌 소읍 분산 (총 약 5만)',
  },
  {
    id: 'elfea_heart',
    name: '엘페아 수도 실바란',
    continent: '아르카나 대륙',
    description:
      '아르카나 북부 고대 숲 깊은 곳, 수천 년 된 대목 위에 세워진 엘프들의 성도. 외부인 출입이 극히 제한되며, 마나와 공존하는 엘프 문명의 정수가 담긴 신성한 도시.',
    population: '폐쇄 도시 (엘프 약 1만 2천)',
  },
  {
    id: 'dwarven_deep',
    name: '드워프 대산채 카르둠',
    continent: '아르카나 대륙',
    description:
      '마나의 척추 산맥 지하 깊숙이 파고 들어간 드워프들의 지하 대도시. 마나 증기기관과 마나 화약이 탄생한 곳. 세계에서 가장 정밀한 기계 공학의 심장부.',
    population: '지하 도시 (드워프 약 3만)',
  },
  {
    id: 'oruna_capital',
    name: '오루나 황도 임페리아',
    continent: '오루나 대륙',
    description:
      '오루나 제국의 수도. 황제의 궁전을 중심으로 동심원처럼 신분별 구역이 뻗어나가는 계획 도시. 마나 없이도 강한 군사력과 마나 기계 병기로 대륙을 장악했다.',
    population: '제국 수도 (인구 약 60만)',
  },
  {
    id: 'luna_harbor',
    name: '루나 하버',
    continent: '해적 군도',
    description:
      '해적 군도의 중심 항구. 세계에서 가장 무법하고 가장 활기찬 도시. 모든 나라의 수배자와 첩자와 상인이 이곳을 거쳐가며, 해적왕 자리를 놓고 끊임없는 패권 다툼이 벌어진다.',
    population: '항구 도시 (유동 인구 약 15만)',
  },
  {
    id: 'gears_city',
    name: '기어스 시티',
    continent: '기어스 섬',
    description:
      '섬 전체가 하나의 기계인 마나 스팀펑크 자유 도시. 마나 비행선·증기 운송·마나 통신이 일상화된 미래와 중세가 뒤섞인 기이하고 경이로운 곳.',
    population: '자유 도시 (인구 약 9만, 세계 최다 종족 혼재)',
  },
]

// ── 세계 서사 (NarrativeScreen 및 WorldMapScreen용) ─────────────
export const AETERNOVA_LORE = `태초에 세계는 침묵이었다. 그러나 침묵 속에서 하나의 맥박이 뛰기 시작했다. 대지의 심층부에서 마나(Mana)가 솟구쳤고, 마나가 닿은 땅에서는 나무가 자랐으며 마침내 생명이 깨어났다. 고대의 현자들은 기록했다: "마나는 세계의 숨결이다. 그것이 흐르는 곳에 문명이 피어나고, 그것이 끊기는 곳에 야망이 자란다." 세계는 두 대륙과 무수한 섬들로 이루어졌고, 사람들은 이것을 에테르노바(Aeternova)라 불렀다. 영원히 새로 태어나는 것이라는 뜻이었다.`

// ── 지역별 상세 서사 (WorldMapScreen 지역 클릭 시 표시) ──────────
export const REGION_LORE: Record<string, { narrative: string; imagePrompt: string }> = {
  arcana: {
    narrative:
      '아르카나는 마나가 가장 풍부하게 흐르는 서쪽의 땅이다. 대륙의 중심에는 "마나의 척추"라 불리는 거대한 산맥이 남북으로 뻗어 있고, 그 산맥 아래에서 마나가 대지맥처럼 온 대륙으로 퍼져나간다. 수천 년의 역사가 돌 위에 새겨져 있으며, 왕국과 제국이 흥망했고, 마법사들의 탑이 하늘을 찌른다.',
    imagePrompt:
      'Epic fantasy western continent, lush green lands divided by a massive spine mountain range glowing with mana veins, ancient kingdoms with towering magical spires, elven forests in the north, dwarf holds carved into mountains, warm golden light, aerial view, detailed fantasy map illustration style',
  },
  oruna: {
    narrative:
      '오루나는 마나가 희박한 동쪽의 땅이다. 고대의 어떤 재앙이 이 땅의 마나를 앗아갔다는 전설이 전해지며, 마나의 결핍이 오루나인들을 강하게 단련시켰다. 군사력과 야망으로 대륙을 장악한 제국, 황야에서 살아남은 반수인 부족들, 그리고 아무도 이해하지 못한 고대 유적들이 공존한다.',
    imagePrompt:
      'Epic fantasy eastern continent, vast arid plains and deserts with scattered oases, massive circular imperial capital city, ancient mysterious ruins glowing faintly, beast-kin tribal encampments in the wastes, muted earthy tones with flashes of arcane energy from ruins, aerial view fantasy map style',
  },
  gears_island: {
    narrative:
      '기어스 섬 — 세계에서 가장 기이하고 경이로운 곳. 섬 전체가 하나의 기계다. 거대한 마나 증기 파이프가 도시 전체를 관통하며, 그 증기로 모든 것이 작동한다. 하늘에는 언제나 마나 비행선이 오가고, 어느 나라에도 속하지 않는 자유 도시를 선언한 이곳에는 세계에서 가장 다양한 종족이 뒤섞여 산다.',
    imagePrompt:
      'Steampunk fantasy island city, massive mana steam pipes crisscrossing the entire island, airships floating in smog-filled golden skies, gears and clockwork mechanisms integrated into gothic architecture, glowing blue mana crystals powering everything, diverse fantasy races in streets, dramatic overhead view',
  },
  corsair_archipelago: {
    narrative:
      '해적 군도 — 에테르 해 남부에 흩어진 수십 개의 섬들. 이곳의 해적들은 단순한 도적이 아니다. 그들은 에테르 해의 주권을 주장하는 자들이다. 중심 항구 루나 하버는 세계에서 가장 무법하고 가장 활기찬 곳이며, 붉은 마나 해적단의 붉은 깃발이 밤하늘을 배경으로 휘날린다.',
    imagePrompt:
      'Fantasy pirate archipelago, dozens of lush tropical islands scattered across glowing azure sea, massive pirate harbor with hundreds of ships, red mana sails glowing in sunset, taverns and black markets visible in port city, sea monsters lurking in deep waters, dramatic warm light cinematic view',
  },
  mist_isles: {
    narrative:
      '안개 섬들 — 에테르 해 북부, 아무도 정확한 위치를 모르는 섬들. 짙은 마나 안개에 영원히 싸여 나침반도 작동하지 않는다. 전설에 따르면 이 안개 속에 세계의 비밀이 잠들어 있다고 한다. 가끔 살아 돌아온 항해사들은 하나같이 눈빛이 달라져 있으며, 자신이 무엇을 보았는지 절대로 말하지 않는다.',
    imagePrompt:
      'Mysterious fog-shrouded islands in a northern sea, thick mana mist glowing with ethereal blue-purple light, ancient towers barely visible through fog, abandoned ships caught in magical currents, eerie silent atmosphere, moonlit surreal landscape, painterly fantasy illustration style',
  },
}

// ── 랜덤 시작 위치 풀 ─────────────────────────────────────────
// 캐릭터 생성 시 이 목록 중 하나에서 랜덤으로 시작
export const STARTING_LOCATIONS: Array<{
  id: string
  name: string
  continent: string
  description: string
  atmosphere: string
  imagePromptBase: string
}> = [
  {
    id: 'valthar_grey_alley',
    name: '발타르 시티 — 회색 골목',
    continent: '아르카나 대륙',
    description: '발타르 왕국 수도의 빈민가. 화려한 왕궁의 빛이 닿지 않는 좁고 축축한 골목. 혁명의 씨앗이 자라는 곳.',
    atmosphere: 'dark, gritty urban fantasy',
    imagePromptBase: 'dark narrow alley in medieval fantasy city, cobblestones slick with rain, lantern light flickering, poor district with laundry hanging between buildings, suspicious cloaked figures',
  },
  {
    id: 'valthar_market',
    name: '발타르 시티 — 대시장',
    continent: '아르카나 대륙',
    description: '발타르 수도 중심부의 거대한 시장. 온갖 물건과 온갖 소문이 교차하는 활기찬 곳.',
    atmosphere: 'busy medieval market',
    imagePromptBase: 'bustling medieval fantasy marketplace, colorful stalls selling magical goods, diverse fantasy races trading, golden afternoon light, castle walls visible in background, fantasy RPG atmosphere',
  },
  {
    id: 'arcana_academy_gate',
    name: '아르카나 학원 — 입구 광장',
    continent: '아르카나 대륙',
    description: '마나의 척추 산맥 기슭, 세계 최고 마법 학원의 웅장한 입구 광장. 여러 속성의 마법 불꽃이 탑 꼭대기에서 타오른다.',
    atmosphere: 'majestic magical academy',
    imagePromptBase: 'grand magical academy entrance plaza, seven towering spires with different colored flames, young mages in robes, glowing mana crystals embedded in ancient stone walls, misty mountain backdrop',
  },
  {
    id: 'green_vale_village',
    name: '초록 평야 — 농촌 마을',
    continent: '아르카나 대륙',
    description: '마나 농법으로 작물을 키우는 소박한 농촌 마을. 최근 흉작이 이어지며 불안한 기운이 감돈다.',
    atmosphere: 'rural fantasy village',
    imagePromptBase: 'peaceful medieval fantasy village in green plains, thatched roof cottages, farmers using minor magic on crops, village well at center, worried expressions on villagers, overcast sky hinting at troubles',
  },
  {
    id: 'dwarven_main_gate',
    name: '드워프 산채 카르둠 — 대문',
    continent: '아르카나 대륙',
    description: '마나의 척추 산맥 깊숙이 파고 들어간 드워프 대도시의 웅장한 철제 대문. 마나 증기기관의 굉음이 끊이지 않는다.',
    atmosphere: 'underground steampunk dwarven city',
    imagePromptBase: 'massive iron gate entrance to underground dwarven city, glowing mana steam vents, intricate mechanical clockwork on walls, stout dwarves in leather aprons, warm forge light from within mountain, epic scale',
  },
  {
    id: 'oruna_outer_district',
    name: '오루나 황도 — 외곽 구역',
    continent: '오루나 대륙',
    description: '오루나 제국 수도의 동심원 외곽 구역. 제국의 엄격한 질서와 군사 문화가 골목골목에 배어 있다.',
    atmosphere: 'imperial military city',
    imagePromptBase: 'outer district of vast circular imperial city, Roman-inspired fantasy architecture, imperial soldiers patrolling, propaganda banners on walls, dust in air, mana-powered siege weapons visible on walls, serious atmosphere',
  },
  {
    id: 'ashen_wastes_camp',
    name: '황야 — 부족 야영지',
    continent: '오루나 대륙',
    description: '마나가 완전히 끊긴 오루나 내륙 황야의 반수인 부족 야영지. 마법 없이도 이 척박한 땅에서 살아남은 자들의 강인한 세계.',
    atmosphere: 'tribal wasteland camp',
    imagePromptBase: 'tribal encampment in arid wasteland, beast-kin races around bonfire, hide tents and bone totems, starlit desert sky, magic does not work here so only fire and physical tools, primal atmospheric scene',
  },
  {
    id: 'luna_harbor_dock',
    name: '루나 하버 — 항구 부두',
    continent: '해적 군도',
    description: '해적 군도의 중심 항구, 루나 하버의 부두. 세계 모든 나라의 선원과 도둑과 상인이 뒤섞이는 위험하고 활기찬 곳.',
    atmosphere: 'pirate port chaos',
    imagePromptBase: 'chaotic fantasy pirate harbor at dusk, dozens of ships with colorful flags including red mana pirate banners, taverns and black market stalls on docks, rough sailors of diverse fantasy races, dramatic sunset over the sea',
  },
  {
    id: 'gears_lower_district',
    name: '기어스 섬 — 하층 증기 구역',
    continent: '기어스 섬',
    description: '기어스 섬의 거대한 마나 증기 파이프 아래 하층 구역. 증기와 연기 속에서 기술자들과 발명가들이 밤새 불빛을 태운다.',
    atmosphere: 'steampunk lower city',
    imagePromptBase: 'steampunk fantasy lower city district, massive glowing steam pipes overhead, cramped workshops with inventors working, mana crystals powering small machines, smog and steam in alleyways, warm orange workshop lights at night',
  },
  {
    id: 'ancient_ruins_entrance',
    name: '고대 유적 — 입구',
    continent: '오루나 대륙',
    description: '오루나 곳곳에 흩어진 선행 문명의 유적 입구. 알 수 없는 마나 반응이 감지되며, 들어갔다 돌아오지 않은 탐험가들의 이야기가 전해진다.',
    atmosphere: 'mysterious ancient ruins',
    imagePromptBase: 'entrance to ancient mysterious ruins in desert, cyclopean stone architecture covered in unknown glowing runes, sand blown against walls, expedition camp outside with abandoned equipment, eerie purple mana glow from within, dusk light',
  },
]

// ── 세계 전체 shadow (위기) 서사 ─────────────────────────────────
export const WORLD_CRISIS_NARRATIVE = `에테르노바는 지금 변곡점에 서 있다. 수백 년 동안 안정적으로 흐르던 마나의 흐름이 최근 들어 불안정해지기 시작했다. 아르카나의 농촌에서는 흉작이 이어지고, 엘프들의 숲에서는 고대 나무들이 말라가고 있다. 오루나 황야의 마나 공백 지역은 점점 넓어지고 있으며, 기어스 섬의 마나 증기 파이프에서는 원인 모를 폭발이 잦아졌다. 일부는 이것을 마나의 고갈이라 부른다. 일부는 이것을 각성이라 부른다. 그리고 아주 소수는, 이것을 귀환이라 부른다 — 선행 문명이 남긴 유적들이 다시 깨어나고 있다는 것이다. 진실은 아무도 모른다.`

// ── 에테르노바 WorldData 객체 ────────────────────────────────────
export const AETERNOVA_WORLD: WorldData = {
  name: '에테르노바 (Aeternova)',
  lore: AETERNOVA_LORE,
  continents: CONTINENTS,
  islands: ISLANDS,
  majorCities: MAJOR_CITIES,
  // mapImageUrl은 최초 1회 생성 후 localStorage에서 로드
}

// ── 에테르노바 서사 텍스트 (NarrativeScreen용) ──────────────────
export const AETERNOVA_NARRATIVE = `${AETERNOVA_LORE}

${WORLD_CRISIS_NARRATIVE}

아르카나 대륙의 서쪽, 마나가 가장 풍부하게 흐르는 땅. 그 중심에는 "마나의 척추"라 불리는 거대한 산맥이 남북으로 뻗어 있고, 그 기슭에 세워진 아르카나 마법 학원에서는 세계 각지의 마법사 지망생들이 7개 속성의 마법을 배운다. 발타르 왕국의 수도 발타르 시티는 대륙 최대의 화려한 도시지만, 그 이면에는 햇빛도 들지 않는 빈민가 회색 골목이 있다. 엘프들은 아르카나 북부의 고대 숲에서 마나와 공존하는 법을 지키고 있으며, 드워프들은 산맥 깊숙이 마나를 기계로 변환하는 기술을 연구한다.

에테르 해를 건너 동쪽의 오루나 대륙. 마나가 끊긴 이 땅에서 인간 제국은 군사력으로 대륙을 지배하고, 황야의 반수인 부족들은 마법 없이도 살아남는 강인함을 키웠다. 고대 유적들은 아직도 이해되지 않는 선행 문명의 흔적을 간직한 채 불안하게 반짝이고 있다.

에테르 해 한가운데, 기어스 섬은 마나와 기계가 결합한 스팀펑크 문명의 심장부다. 해적 군도는 세계의 주권을 주장하는 자유인들의 무법지대이며, 안개 섬들은 아직도 그 비밀을 세계에 내어주지 않고 있다.

이제 당신이 이 세계에 발을 내딛는다. 마나가 흐르는 곳, 야망이 자라는 곳, 그리고 비밀이 깨어나는 곳 — 에테르노바에서.`

// ── 맵 이미지 생성용 프롬프트 (AI 이미지 생성 도구용) ──────────
export const MAP_IMAGE_PROMPT = `Detailed fantasy world map of Aeternova, two large continents separated by a glowing aether sea. Left continent Arcana: lush green lands with a glowing magical mountain spine running north-south, magical academy towers visible, elven forest in north, dwarf mountain holds. Right continent Oruna: arid darker lands, massive circular imperial city, desert wastes with faint ruin glows, coastline cities. Center sea: steampunk gear island with airships, pirate archipelago in south, mysterious fog-shrouded islands in north. Antique parchment map style with elaborate borders, compass rose, depth and detail, warm sepia and gold tones with magical blue mana highlights, hand-drawn cartography aesthetic, epic fantasy world map`
