// ================================================================
// 🧑‍🤝‍🧑 에테르노바 (Aeternova) — NPC 125인 하드코딩 데이터
// 여성 70% / 남성 30% 비율
// 1~20:   권력자·귀족층
// 21~35:  마법사·학자층
// 36~50:  전사·군인층
// 51~62:  암흑가·첩보층
// 63~72:  기술자·발명가층
// 73~81:  성직자·신관층
// 82~90:  평민·사회층
// 91~100: 미지·특수 존재
// 101~125: 생활 밀착형 반복 등장 인물
// ================================================================

import type { NPC, Alignment } from '../types/game'

function _emotionSet(n: string, h: string, a: string, s: string) {
  return [
    { emotion: 'neutral', description: n },
    { emotion: 'happy', description: h },
    { emotion: 'angry', description: a },
    { emotion: 'sad', description: s },
  ]
}

/** Sentinel for NPCs whose ages are unknown / mysterious */
function unknown_age(): number {
  return 0
}

// ── helpers ──────────────────────────────────────────────────────
function unknown_age(): number { return 0 }

function npc(
  num: number,
  name: string,
  title: string,
  age: number,
  gender: '여성' | '남성',
  nationality: string,
  appearance: string,
  personality: string[],
  background: string,
  alignment: Alignment,
  skills: string[],
  relationshipToPlayer: string,
  emotions: ReturnType<typeof _emotionSet>
): NPC {
  return {
    id: `npc_${String(num).padStart(3, '0')}`,
    name,
    title,
    age,
    gender,
    nationality,
    appearance,
    personality,
    background,
    alignment,
    skills,
    relationshipToPlayer,
    emotions,
  }
}

// ================================================================
// 🏰 1~20번 — 권력자 & 귀족층
// ================================================================
const GROUP_ROYALTY: NPC[] = [
  npc(1, '엘리아나 발타르', '발타르 왕국 여왕', 44, '여성', '발타르 왕국',
    'tall queen, silver-streaked auburn hair, sharp emerald eyes, royal crimson gown with golden mana crystals',
    ['냉철함', '실용주의', '외로움'],
    '마나 위기의 공식 대응 결정권자. 왕국을 20년간 홀로 이끌어왔다. 진실을 알면서도 침묵하는 것들이 있다.',
    '질서-중립', ['국정 운영', '마나 외교', '전략적 판단'],
    '왕국의 공식 의뢰인 또는 최대 장애물',
    _emotionSet('composed regal gaze, slight tension around eyes', 'rare warm smile that transforms her face', 'cold fury, perfectly controlled, most terrifying version', 'hidden grief, shown only in solitude')),

  npc(2, '세라핀 드 발타르', '발타르 왕국 제1공주', 21, '여성', '발타르 왕국',
    'young princess, wavy dark auburn hair, bright curious green eyes, academic robes over noble dress, ink-stained fingers',
    ['호기심', '용기', '충동적'],
    '마법 학원 수석 재학 중. 금지된 서고를 몰래 연구하고 있으며, 세계의 진실에 가장 가까이 다가간 인물.',
    '혼돈-선', ['고급 마법', '고대어 해독', '서고 잠입'],
    '플레이어의 핵심 동료 후보, 비밀 공유자',
    _emotionSet('bright intelligent look, always slightly distracted', 'excited grin when discovering something new', 'frustrated pout, stamps foot', 'tearful but determined, wipes eyes quickly')),

  npc(3, '카이로스 발타르', '발타르 왕국 왕자', 26, '남성', '발타르 왕국',
    'prince, short military-cut dark hair, steel grey eyes, royal guard uniform, always armed',
    ['결단력', '완고함', '누나를향한복잡한감정'],
    '군부파 수장. 마나 위기를 오루나 제국의 음모로 확신하며 전쟁을 주장한다. 공주와 노선 충돌.',
    '질서-중립', ['검술', '군사 전략', '부하 통솔'],
    '갈등적 조력자 또는 적대적 장애물',
    _emotionSet('stern military bearing, jaw set', 'genuine rare smile aimed at sister only', 'explosive anger, veins visible', 'rare — hides it, seen only when alone')),

  npc(4, '이사벨 드 크로넬', '왕국 귀족 원로원 의장 / 대공비', 58, '여성', '발타르 왕국',
    'mature noblewoman, steel-grey perfect hair, calculating violet eyes, elaborate dark blue court dress, many rings',
    ['교활함', '우아함', '냉혹함'],
    '귀족 파벌의 실질 조종자. 비밀 결사와 연루되어 있으며, 왕가 전체를 손바닥 위에서 논다.',
    '질서-악', ['정치 공작', '독 제조', '심리 조종'],
    '표면적 후원자, 실질적 최대 적',
    _emotionSet('perfectly pleasant mask, nothing in eyes', 'predatory smile when plans succeed', 'cold disdain, never raises voice', 'never shown — it would be a weakness')),

  npc(5, '마레나 실바란', '엘페아 숲 엘프 여왕', 612, '여성', '엘페아 숲',
    'ancient elf queen, moonsilver long hair, deep forest-green eyes glowing faintly, living-wood crown, flowing white robes',
    ['고요함', '슬픔', '고집'],
    '수백 년간 숲을 지켜왔다. 고대 나무들이 죽어가는 원인을 알고 있지만, 그 진실이 세계를 무너뜨릴 것을 안다.',
    '중립-선', ['고대 마나 제어', '자연 마법', '예언'],
    '핵심 정보 보유자, 조건부 동맹',
    _emotionSet('serene timeless calm, eyes hold centuries', 'warm ancient smile, like sunrise over forest', 'cold elvish fury, air crackles with mana', 'deep sorrow, tears like silver drops')),

  npc(6, '타이론 오루나', '오루나 제국 황제', 61, '남성', '오루나 제국',
    'emperor, shaved head, scarred face, one black eye and one golden mechanical eye, heavy black imperial armor always worn',
    ['야망', '잔인함', '카리스마'],
    '마나가 없는 세계에서 군사력으로 대륙을 통일했다. 마나 기계 병기로 아르카나를 침략할 계획을 진행 중.',
    '질서-악', ['마나 기계 병기 운용', '전략', '공포 통치'],
    '세계관 최대 빌런, 최종 대결 상대',
    _emotionSet('imposing silence, golden eye scanning everything', 'rare cold smile when plan succeeds', 'terrifying calm rage, empire shakes', 'never — would execute anyone who saw it')),

  npc(7, '제나 오루나', '오루나 황후', 38, '여성', '오루나 제국(반수인 혈통)',
    'empress, half-beast blood hidden, amber eyes with slit pupils, dark skin, elaborate imperial robes that hide beastkin markings',
    ['이중성', '모성애', '두려움'],
    '반수인 혈통을 은폐하며 황후 자리를 유지 중. 황야 부족과 비밀 연결고리를 가지고 있다.',
    '중립-악', ['변장', '황야 연락', '생존술'],
    '예상치 못한 아군 후보',
    _emotionSet('careful neutral mask, always watching exits', 'genuine warmth with children only', 'cornered animal fear turned rage', 'hidden grief for lost homeland')),

  npc(8, '아리엘 오루나', '오루나 황녀 / 마나 연구자', 24, '여성', '오루나 제국',
    'princess, soft features contrasting sharp father, warm brown eyes, simple researcher coat over imperial dress, always has notebook',
    ['지성', '공감', '용기'],
    '아버지의 전쟁 노선에 반대하는 개혁파. 마나 없는 땅에서도 마나 연구를 이어간다.',
    '중립-선', ['마나 이론 연구', '외교', '설득'],
    '핵심 동맹 후보, 제국 내부 협력자',
    _emotionSet('thoughtful gaze, pen tapping lip', 'bright genuine smile, whole face lights up', 'quiet firm resolve, more scary than shouting', 'tears for those hurt by father\'s wars')),

  npc(9, '발렌 크라우스', '오루나 제국 원수', 52, '남성', '오루나 제국',
    'field marshal, grey-streaked black hair, battle-worn face, medals on chest, right arm replaced with mana mechanical prosthetic',
    ['충성심', '피로', '내적갈등'],
    '전장의 전략가. 황제의 명령을 따르지만 황녀를 몰래 보호하고 있다. 전쟁의 끝을 원한다.',
    '질서-중립', ['전략', '마나 기계 병기', '부하 통솔'],
    '복잡한 조력자, 황제와 플레이어 사이에서',
    _emotionSet('tired professional soldier bearing', 'proud mentor smile for princess', 'controlled military anger', 'heavy guilt for past orders followed')),

  npc(10, '도르나 카르둠', '드워프 산채 여왕', 189, '여성', '드워프 산채',
    'dwarf queen, elaborate braided white hair with gold rings, fierce amber eyes, ceremonial forge-armor studded with mana gems',
    ['자부심', '혁신', '실용성'],
    '마나 기계화 기술의 창시자. 드워프들에게 신으로 추앙받으며, 기술이 오루나에 흘러간 것에 분노한다.',
    '질서-선', ['마나 기계 공학', '연금술', '드워프 정치'],
    '강력한 동맹, 기술 자원 제공자',
    _emotionSet('proud dignified bearing of master craftsdwarf', 'booming laugh, slaps thigh', 'volcanic dwarf rage, forge sparks', 'stoic grief, shown as silence and still hands')),

  npc(11, '루시아 드 벨몬', '왕국 재무 대신', 47, '여성', '발타르 왕국',
    'finance minister, sleek black hair in tight bun, calculating grey eyes, understated expensive grey dress, always holds ledger',
    ['분석적', '전쟁반대', '비밀많음'],
    '마나 결정체 경제를 쥔 실력자. 전쟁이 경제를 파괴한다는 것을 알며, 평화파의 핵심 자금줄.',
    '질서-중립', ['경제 조작', '정보 수집', '협상'],
    '평화 노선의 핵심 지원자',
    _emotionSet('precise professional composure', 'pleased smile when numbers align', 'sharp rebuke in clipped sentences', 'worried frown over economic crisis reports')),

  npc(12, '셀린 아즈라', '왕국 외교 대사', 35, '여성', '발타르 왕국',
    'ambassador, olive skin, dark wavy hair, diplomatic silver dress, always carries sealed letters, warm professional smile',
    ['능수능란', '이중적', '야망'],
    '오루나 황실과 비밀 협상을 진행 중. 왕국과 제국 어느 쪽의 진짜 편인지 아무도 모른다.',
    '진중립', ['외교', '언어 6개국어', '심리 파악'],
    '정보 제공자, 신뢰 불가 동맹',
    _emotionSet('perfectly calibrated diplomatic warmth', 'genuine laugh — rare and disarming', 'cold professional fury, smile vanishes', 'shown only when alone, deep exhaustion')),

  npc(13, '오스카르 테인', '왕국 기사단장', 48, '남성', '발타르 왕국',
    'knight commander, square jaw, salt-pepper hair, immaculate royal guard armor with golden trim, hand always near sword hilt',
    ['명예', '충성', '갈등'],
    '왕국 최강 전력. 왕자파와 왕비파 사이에서 줄타기하며 진짜 충성 대상을 찾고 있다.',
    '질서-선', ['검술 최고위', '기사단 지휘', '마나 강화 전투'],
    '강력한 조력자, 올바른 선택 시 최강 아군',
    _emotionSet('firm honorable bearing, direct gaze', 'warm respect for worthy opponents', 'righteous anger, resonates with ideals', 'honor-bound grief, cannot abandon duty')),

  npc(14, '피오나 드 아스텔', '귀족 원로원 부의장', 63, '여성', '발타르 왕국',
    'elder noblewoman, white hair with lavender tint, sharp blue eyes, purple velvet court dress, cane she doesn\'t need',
    ['지혜', '냉소', '인내'],
    '이사벨 대공비의 라이벌. 원로원 내 유일한 견제 세력. 은밀히 공주를 지지한다.',
    '질서-중립', ['귀족 정치', '역사 지식', '중재'],
    '숨겨진 조력자, 귀족 사회 안내자',
    _emotionSet('sharp observant gaze behind pleasant mask', 'genuine approving smile for smart moves', 'cutting wit disguised as polite concern', 'regret for a lifetime of political compromise')),

  npc(15, '나이아 오루나', '오루나 황태후', 68, '여성', '오루나 제국',
    'dowager empress, silver hair, sunken dark eyes, black mourning dress always worn, thin hands grip prayer beads',
    ['광신적', '슬픔', '음모'],
    '전 황제의 황후. 현 황제를 자신이 만들었다고 믿으며, 황실 음모의 원점에 있는 인물.',
    '중립-악', ['황실 의식', '독약 지식', '심리 조종'],
    '예상치 못한 적 또는 비밀 정보원',
    _emotionSet('pious serene mask hiding obsession', 'tender with grandchildren only', 'cold imperial wrath wrapped in prayer', 'genuine grief for dead husband, her only weakness')),

  npc(16, '브리아 켈도른', '드워프 기계 대장', 134, '여성', '드워프 산채',
    'dwarf engineer, short powerful build, oil-stained copper braids, goggles pushed up forehead, mechanic overalls with tool belt',
    ['실용주의', '돈욕심', '죄책감'],
    '마나 병기 기술을 오루나에 팔았다는 의혹. 도르나 여왕과 비밀 갈등 중.',
    '혼돈-중립', ['마나 무기 설계', '협상', '도주'],
    '의뢰 또는 추격 대상',
    _emotionSet('defensive posture, always checking exits', 'relaxed only when deep in mechanical work', 'defensive panic disguised as aggression', 'genuine guilt she won\'t admit')),

  npc(17, '타나 실바란', '엘프 근위대장', 287, '여성', '엘페아 숲',
    'elf guard captain, silver hair in warrior\'s braid, forest green eyes cold as winter, black leather armor with leaf motifs, twin short swords',
    ['냉정', '충성', '잔인함'],
    '마레나 여왕의 그림자. 천 년간 여왕을 지켜온 어쌔신 기술 보유자.',
    '질서-중립', ['쌍검 암살', '그림자 이동', '독 사용'],
    '여왕에 접근하려면 반드시 통과해야 할 관문',
    _emotionSet('unreadable cold silver gaze', 'almost imperceptible softening for queen only', 'terrifying stillness before lethal action', 'ancient grief, millennia of watching things die')),

  npc(18, '에렌 발타르', '발타르 왕국 전 국왕(태상왕)', 71, '남성', '발타르 왕국',
    'former king, aged but once-handsome face, faded green eyes, informal robes, pretends to be senile but eyes are sharp',
    ['위선', '두려움', '후회'],
    '은퇴 후 배후 조종 시도. 마나 고갈의 진실을 알고 있으며 침묵의 대가를 치르고 있다.',
    '질서-악', ['정치 조종', '비밀 은폐', '연기'],
    '진실의 열쇠, 하지만 절대 순순히 내어주지 않음',
    _emotionSet('convincing senile grandfather act', 'genuine warmth for granddaughter princess', 'rare flashes of old authoritarian rage', 'true face: terrified old man hiding secrets')),

  npc(19, '소리아 드 메이든', '왕국 국방 대신', 41, '여성', '발타르 왕국',
    'defense minister, athletic build, chestnut hair in practical updo, military uniform under court dress, weapon calluses on hands',
    ['실용주의', '비밀', '용기'],
    '기사단장과 오랜 연인 사이. 군사 기밀 공유 의혹을 받고 있으나 실제로는 왕국을 지키기 위해 움직인다.',
    '중립-선', ['군사 전략', '마나 방어 진지', '위기 관리'],
    '신뢰할 수 있는 조력자, 기사단장과 세트로 활용',
    _emotionSet('professional soldier composure', 'warm private smile for knight commander', 'fierce protective anger for her people', 'conflicted tears — love vs duty')),

  npc(20, '이리나 황금빛', '해적 군도 여왕', 45, '여성', '해적 군도',
    'pirate queen, dark skin, gold dreadlocks, one eye covered by jeweled eyepatch, crimson coat with golden mana-powered buttons',
    ['자유', '탐욕', '의리'],
    '루나 하버 전체를 실질 지배. 모든 세력과 거래하며 에테르 해의 주권을 주장한다.',
    '혼돈-중립', ['해전 지휘', '마나 항법', '협상'],
    '중립적 정보 브로커, 가장 비싸지만 가장 확실한 동맹',
    _emotionSet('lazy dangerous confidence', 'booming laugh, genuinely delighted', 'explosive violence in golden flash', 'hidden: misses the open sea before power')),
]

// ================================================================
// 🎓 21~35번 — 마법사 & 학자층
// ================================================================
const GROUP_MAGES: NPC[] = [
  npc(21, '아우로라 셉템', '아르카나 마법 학원 원장', 77, '여성', '아르카나 학원',
    'archmage headmaster, white hair floating slightly with ambient mana, pale silver eyes, layered white and gold academic robes, staff with seven-colored gem',
    ['위엄', '비밀', '죄책감'],
    '금지된 서고의 진실을 알지만 침묵 중. 학원을 지키기 위해 너무 많은 것을 묻어두었다.',
    '질서-중립', ['7속성 마법', '마나 이론', '마음 읽기'],
    '최고의 조언자, 하지만 진실을 숨기는 자',
    _emotionSet('serene authoritative wisdom, mana shimmers around her', 'warm pride for brilliant students', 'cold institutional authority, air chills', 'deep burden, seen only when alone with memories')),

  npc(22, '베로니카 플레임', '화염 속성 탑 탑주', 43, '여성', '아르카나 학원',
    'fire tower head, flame-red hair always slightly smoking, amber eyes with fire pupils, burnt-edged crimson robes, fire scars on hands',
    ['열정', '직관', '충동적'],
    '마나 이상 현상을 가장 먼저 감지한 인물. 모두가 무시했고, 그 후회를 하고 있다.',
    '혼돈-선', ['화염 마법', '마나 감지', '전투 마법'],
    '가장 빠르게 진실을 공유하는 조력자',
    _emotionSet('intense focus, fire in eyes', 'explosive joyful enthusiasm', 'literal flames in hair when angry', 'frustrated tears — warned them but no one listened')),

  npc(23, '류네 아쿠아', '수류 속성 탑 탑주', 39, '여성', '아르카나 학원',
    'water tower head, flowing teal hair, eyes that shift color like deep water, layered blue-green robes that move like waves',
    ['신비로움', '집착', '통찰'],
    '안개 섬들과 교신 시도 중. 물의 흐름에서 마나 이상을 읽는 독특한 능력 보유.',
    '중립-선', ['수류 마법', '원거리 교신', '미래 예지 (단편)'],
    '안개 섬 실마리의 핵심 제공자',
    _emotionSet('distant gaze as if looking elsewhere', 'mysterious smile, knows something', 'cold wave of water pressure anger', 'resonates with water\'s endless grief')),

  npc(24, '사이러스 스톰', '뇌전 속성 탑 탑주', 51, '남성', '아르카나 학원',
    'lightning tower head, wild silver-streaked hair standing on end, crackling eyes, grey robes with burn holes, always smells of ozone',
    ['야망', '편집증', '천재'],
    '마나 병기화 연구를 비밀리에 진행 중. 국가보다 지식의 힘을 믿는다.',
    '혼돈-중립', ['뇌전 마법', '마나 무기화', '정밀 실험'],
    '위험한 정보 제공자, 이용 가능하지만 통제 불가',
    _emotionSet('manic energy barely contained', 'gleeful child excitement over discoveries', 'crackling lightning anger, literal sparks fly', 'paranoid fear he\'s being watched and they\'re coming')),

  npc(25, '엘로이즈 테라', '대지 속성 탑 탑주', 68, '여성', '아르카나 학원',
    'earth tower head, solid build, brown skin deeply lined with age, grey-brown hair in earth-toned braids, forest green robes, always barefoot',
    ['인내', '직관', '고집'],
    '대지맥 이상을 10년 전부터 추적해 온 노학자. 아무도 믿어주지 않았다.',
    '중립-선', ['대지 마나 분석', '지진 예지', '고대 대지맥 지식'],
    '마나 위기의 진실에 가장 가까운 학자',
    _emotionSet('still as stone, deep listening', 'slow warm smile like spring thaw', 'heavy earth-shaking certainty of righteous anger', 'quiet tears for the dying land she loves')),

  npc(26, '미라 루나', '달빛 속성 탑 탑주', 55, '여성', '아르카나 학원',
    'moon tower head, pale as moonlight, silver-white hair, eyes with stars visible inside, midnight blue robes with constellation patterns',
    ['신비', '예언적', '동떨어짐'],
    '예언과 점성술 전문. 플레이어의 운명을 이미 알고 있으며, 얼마나 말해줄지 고민 중.',
    '진중립', ['달빛 마법', '예언 해석', '운명 열람'],
    '플레이어 운명의 열쇠, 단서를 조금씩만 줌',
    _emotionSet('otherworldly calm, seeing things others can\'t', 'cryptic smile — she knows', 'cold lunar light fury when prophecy defied', 'silver tears for fates she\'s seen but can\'t change')),

  npc(27, '카스텔 아르카나', '전 학원장 (은퇴)', 94, '남성', '아르카나 학원',
    'ancient former headmaster, deliberately disheveled white hair, cloudy grey eyes that sharpen unexpectedly, patched old robes, mutters constantly',
    ['연기', '비밀', '죄책감'],
    '금지된 서고를 직접 만든 인물. 치매를 연기하며 자신이 숨긴 것들을 지키고 있다.',
    '중립-악', ['고대 마법', '기억 지우기', '서고 설계'],
    '진실의 열쇠이자 최대 장애물',
    _emotionSet('convincing rambling confusion act', 'lucid brilliant flash when caught off guard', 'terrified authentic panic when past catches up', 'genuine grief for what he buried')),

  npc(28, '린디아 에테르', '마나 이론 수석 교수', 36, '여성', '아르카나 학원',
    'mana theory professor, messy dark hair full of pencils, glasses perched crooked, ink-stained white coat, always gesturing while explaining',
    ['집착', '정직', '용기'],
    '마나 고갈이 인위적 결과임을 증명하는 논문 작성 중. 학원 수뇌부에게 압력을 받고 있다.',
    '중립-선', ['마나 이론', '데이터 분석', '논문 작성'],
    '결정적 증거 보유자, 보호 필요',
    _emotionSet('frantic excited explaining to herself', 'pure joy when theory proves correct', 'frustrated urgent need to be believed', 'fear — they know what she\'s found')),

  npc(29, '펠릭스 다크', '금지된 서고 관리자', 60, '남성', '아르카나 학원',
    'archive keeper, thin pale figure, black archival robes, grey eyes that catalog everything, gloves always on, carries iron key ring',
    ['철저함', '협박', '도덕적공백'],
    '서고 접근자 목록을 30년간 기억. 그 정보를 협박 수단으로 활용하며 상당한 부를 축적했다.',
    '질서-악', ['기억 완벽 보존', '서고 보안', '협박'],
    '정보 구매처, 하지만 대가를 치러야 함',
    _emotionSet('precise cataloguing neutral expression', 'only when receiving payment: satisfied', 'cold precision when threat ignored', 'none visible — emotional records archived')),

  npc(30, '제나이다 스타', '유성 마법 연구자', 31, '여성', '아르카나 학원',
    'stellar researcher, dark skin with faint star-shaped birthmarks, bright black eyes, midnight blue research coat covered in drawn constellation maps',
    ['몽상가', '집착', '인류애'],
    '선행 문명 유적의 마나와 별의 연관성 연구. 마나가 하늘에서 온다는 증거를 찾고 있다.',
    '혼돈-선', ['천체 마나학', '고대 문명 연구', '별자리 해독'],
    '선행 문명 실마리 제공자',
    _emotionSet('head tilted, watching stars even indoors', 'rapturous awe at new stellar discovery', 'urgent need to share what she\'s found', 'small afraid — what if stars are also dying')),

  npc(31, '아이야 오루나', '오루나 황실 마법사', 33, '여성', '오루나 제국',
    'imperial mage, sharp features, obsidian black hair, golden eyes, severe black and gold imperial robes, crystal orb always in hand',
    ['냉철함', '야망', '비밀엄수'],
    '마나 없는 땅에서 마법을 구현하는 비술 보유. 황제의 가장 강력한 도구이자 비밀 병기.',
    '질서-중립', ['마나 공백 마법', '황실 비술', '스파이 마법'],
    '적 또는 아군, 황녀의 신뢰가 열쇠',
    _emotionSet('crystalline professional composure', 'calculating approval — she respects competence', 'cold imperial precision', 'hidden: doubts emperor she serves')),

  npc(32, '베아트리체 고스트', '기어스 섬 독립 마법사', 28, '여성', '기어스 섬',
    'independent mage, short spiky platinum hair, violet eyes with gear-shaped pupils (from mana-machine hybrid accident), patched coat with mechanical arm brace',
    ['반항적', '창의적', '자유분방'],
    '마나와 기계를 결합한 신마법 개척 중. 학원에서 퇴학당한 후 기어스 섬에서 독립 연구.',
    '혼돈-중립', ['마나-기계 융합 마법', '발명', '해킹'],
    '비공식 기술 동맹, 학원 외 최강 마법사',
    _emotionSet('cocky grin, arms crossed', 'excited chaos when experiment works', 'principled outrage at stupidity', 'small: misses the academy sometimes')),

  npc(33, '타마라 블랙', '금지 마법 전문가', 37, '여성', '무소속(수배 중)',
    'fugitive mage, constantly changing hair color via magic, chameleon grey eyes, layered concealing dark clothes, face half-hidden',
    ['생존본능', '자조', '두려움'],
    '현상수배 중. 금지 마법을 이용해 세계를 구하려 했지만 오해를 샀다.',
    '혼돈-선', ['금지 마법', '변장', '탈출'],
    '위험한 동맹, 하지만 가장 강력한 카드',
    _emotionSet('paranoid constant assessment of exits', 'genuine warmth when truly trusted', 'cornered animal panic', 'quiet: just wants it to end')),

  npc(34, '세이지 윈드', '여행하는 현자', 88, '남성', '에테르 해 전역',
    'wandering sage, weathered ageless face, white hair in long ponytail, dusty travel robes, enormous journal always open, walking staff with world map carved in',
    ['관찰', '중립', '고독'],
    '세계 각지 마나 이상 현상을 홀로 기록 중인 유일한 목격자. 누구의 편도 아니다.',
    '진중립', ['마나 관측', '세계 지식', '고대어'],
    '세계 전체 그림을 아는 유일한 인물, 중립적 정보원',
    _emotionSet('patient observational calm', 'genuine delight at unexpected new data', 'quiet disappointment when patterns repeat', 'old grief — has watched too many civilizations fall')),

  npc(35, '이나 문', '안개 섬 출신 마법사', unknown_age(), '여성', '미지(안개 섬)',
    'mist island survivor, grey mist seems to cling to pale skin and white hair, eyes that see through walls, simple grey robes, bare feet always',
    ['단절', '단편적기억', '신비'],
    '안개 섬에서 살아 돌아온 유일한 인물. 기억 일부가 소실되었으며, 때로 알 수 없는 말을 한다.',
    '진중립', ['안개 마나', '단편 예언', '존재 은폐'],
    '안개 섬 열쇠, 이해 불가능한 단서 제공자',
    _emotionSet('distant as if half-elsewhere, mist in eyes', 'clarity flashes — warm before fog returns', 'confused distress when memory tries to surface', 'echo of grief for something she can\'t remember')),
]

// ================================================================
// ⚔️ 36~50번 — 전사 & 군인층
// ================================================================
const GROUP_WARRIORS: NPC[] = [
  npc(36, '레나 아이언하트', '왕국 근위 기사 대장', 32, '여성', '발타르 왕국',
    'royal guard captain, short practical red hair, fierce brown eyes, polished silver armor with red cape, longsword and shield always ready',
    ['충성', '직관', '비밀'],
    '기사단장의 직속 부관이지만 진짜 충성 대상은 공주다. 두 사람의 충돌을 막으려 고군분투 중.',
    '질서-선', ['검술', '기사단 지휘', '경호'],
    '공주 루트의 핵심 연결고리',
    _emotionSet('vigilant professional guard posture', 'genuine warm loyalty for princess', 'fierce protective anger for those she guards', 'torn between two loyalties')),

  npc(37, '발키리아 스타', '전설의 팔라딘', 52, '여성', '무소속',
    'legendary paladin, platinum silver hair cropped short, battle-scarred face with serene eyes, ancient worn holy armor, two-handed holy blade',
    ['숭고함', '피로', '사명'],
    '성전 이후 은퇴했으나 마나 위기에 다시 소집될 예정. 세계에서 가장 강한 전사 중 하나.',
    '질서-선', ['팔라딘 성기술', '마나 정화', '지도력'],
    '마지막 수단의 최강 동맹',
    _emotionSet('serene heavy-bearing warrior monk', 'rare radiant smile like dawn', 'righteous fury that makes enemies flee', 'deep compassion for what war costs')),

  npc(38, '드레이크 오루나', '오루나 제국 근위대장', 36, '남성', '오루나 제국',
    'imperial guard captain, stern handsome face, black military hair, black and gold imperial armor, blade always half-drawn',
    ['명예', '갈등', '용기'],
    '황녀를 몰래 보호 중. 황제의 명령을 거부할 준비를 하고 있다.',
    '질서-중립', ['근접 전투', '경호', '황실 내부 파악'],
    '황녀 루트의 핵심, 제국 내부 협력자',
    _emotionSet('rigid imperial duty posture', 'small private smile for princess he protects', 'quiet refusal — more powerful than shouting', 'weight of choosing wrong orders followed')),

  npc(39, '아나 스피어', '용병 길드 마스터', 40, '여성', '발타르 시티',
    'mercenary guild master, bronze skin, black cropped hair, practical battle-worn leather coat, gold mercenary guild badge, twin daggers visible',
    ['실용주의', '중립', '의리'],
    '최강 용병단 보유. 최고가 입찰자에게 충성하지만 배신은 하지 않는 철칙을 지킨다.',
    '진중립', ['용병 전술', '계약 협상', '전투 지휘'],
    '비용을 지불하면 가장 확실한 전력',
    _emotionSet('professional market evaluation of everyone', 'genuine respect for competence', 'cold contract-based anger — breach means death', 'rare: grieves contracts that go wrong')),

  npc(40, '셰나 블레이드', '전직 왕국 암살단원', 27, '여성', '무소속(도망 중)',
    'ex-royal assassin, lean athletic build, short black hair, dark practical clothing, several hidden blades, always scanning for exits',
    ['생존', '분노', '배신감'],
    '섀도 퀸에게 배신당한 전직 길드원. 기사단장에 대한 비밀을 폭로할 준비를 하고 있다.',
    '혼돈-선', ['암살', '잠입', '독'],
    '폭발성 정보를 가진 위험한 동맹',
    _emotionSet('paranoid survival mode, always moving', 'fierce relief when genuinely safe', 'cold focused assassination readiness', 'bitter betrayal still raw and bleeding')),

  npc(41, '코르 반', '반수인 전사 족장', 44, '남성', '오루나 황야',
    'beastkin chief, massive orc-tiger hybrid, striped dark skin, golden slit eyes, tribal war paint, enormous ancestral weapon',
    ['강인함', '자부심', '전략'],
    '오루나 제국에 저항하는 반수인 연합 수장. 황후의 비밀을 알고 이를 협상 카드로 쓰려 한다.',
    '혼돈-중립', ['반수인 전투술', '부족 통솔', '황야 생존'],
    '반수인 연합 동맹의 문, 황후 비밀의 열쇠',
    _emotionSet('proud tribal warrior bearing', 'booming laugh, clan pride', 'war-drum rage, earth shakes', 'hidden grief for fallen tribespeople')),

  npc(42, '라이라 윈드런', '엘프 활잡이 전설', 445, '여성', '엘페아 숲',
    'legendary elf archer, willowy form, copper-gold hair, leaf-green sharp eyes, mottled forest armor, legendary bow of living wood',
    ['초연함', '정확함', '오래된슬픔'],
    '천 년 된 엘프 전사. 여왕의 실질적 호위이며, 인간 생애 수십 개를 지켜봤다.',
    '중립-선', ['전설적 궁술', '숲 이동', '엘프 전통 검술'],
    '여왕 접근의 최종 문지기, 검증받으면 강력한 동맹',
    _emotionSet('still as ancient tree, nothing wasted', 'warm — reserved for those who earn centuries of trust', 'precise lethal calm, arrow already nocked', 'centuries of watching loved ones age and die')),

  npc(43, '미나 크로스', '왕국 기사 (평민 출신)', 22, '여성', '발타르 왕국',
    'young knight, strong build, practical short brown hair, standard knight armor with dents from hard training, determined bright eyes',
    ['의지', '열등감극복', '정의감'],
    '귀족 기사들의 텃세를 극복 중인 신진 기사. 마나 없이 기사가 된 유일한 평민.',
    '질서-선', ['무마나 검술', '끈기', '평민 네트워크'],
    '플레이어의 가장 공감 가능한 동료 후보',
    _emotionSet('determined chin-up posture despite pressure', 'bright genuine smile when accepted as equal', 'furious at injustice, sword hand tightens', 'private tears after being looked down on again')),

  npc(44, '자라 두얼', '이중 검술 사범', 34, '여성', '기어스 섬',
    'dual blade master, tan athletic build, dark braided hair with silver beads, light mobile armor, twin curved swords always at hips',
    ['중립', '전문성', '자유'],
    '어느 나라에도 고용될 수 있는 중립 전투 전문가. 기어스 섬에서 무술 도장 운영.',
    '진중립', ['이중 검술', '무기 훈련', '중립 정보 거래'],
    '전투 교사 또는 고용 가능한 전력',
    _emotionSet('relaxed combat-ready ease', 'grinning challenge — loves good sparring', 'precise professional anger — no wasted energy', 'watches students surpass her with quiet pride')),

  npc(45, '버크 스톤', '드워프 전쟁 기계 조종사', 156, '남성', '드워프 산채',
    'dwarf mech pilot, barrel-chested, grey beard with bronze beads, pilot goggles, heavy mechanical suit interface ports on arms',
    ['자부심', '용감함', '단순함'],
    '마나 골렘 전투 병기를 혼자 운용하는 달인. 복잡한 정치는 몰라도 적이 누구인지는 안다.',
    '질서-선', ['마나 골렘 조종', '기계 전투', '드워프 전통 도끼'],
    '드워프 군사력 동원 열쇠',
    _emotionSet('proud pilot stance, hand on goggles', 'booming proud laughter', 'simple honest anger, very clear', 'genuine simple grief, uncomplicated')),

  npc(46, '이오나 레드', '해적 군도 일등 선장', 31, '여성', '해적 군도',
    'pirate first captain, sun-darkened skin, fiery red hair in wind-blown braids, red and black pirate coat, curved cutlass glowing with red mana',
    ['무모함', '충성', '열정'],
    '붉은 마나 해적단의 실질적 전투 지휘관. 이리나 여왕을 진심으로 따른다.',
    '혼돈-선', ['해전 지휘', '마나 검술', '항해'],
    '해적 군도 전투력의 열쇠',
    _emotionSet('restless sea-wind energy', 'explosive joy, cannon fire celebrate', 'reckless battle frenzy', 'rare quiet grief watching sea alone')),

  npc(47, '테사 워커', '오루나 황야 척후대장', 29, '여성', '오루나 제국',
    'scout captain, lean desert-hardened body, dust-coloured clothing, amber eyes sharp as hawk, detailed ruin maps tattooed on forearms',
    ['호기심', '실용', '단독행동'],
    '고대 유적 탐사 전문. 황야 유적 내부 지도를 절반 완성했으며, 제국에 완전히 제출하기 전 망설이고 있다.',
    '혼돈-중립', ['유적 탐사', '황야 생존', '마나 유물 분석'],
    '고대 유적 진입의 안내자',
    _emotionSet('sharp scout observation', 'excited explorer grin at new ruins', 'frustrated when ruins won\'t give up secrets', 'awed reverence for precursor civilization')),

  npc(48, '리코 다크', '전직 오루나 특수부대원', 38, '남성', '무소속',
    'ex-imperial special ops, medium build designed to be forgettable, grey eyes, civilian clothes hiding old scars and weapons',
    ['죄책감', '단호함', '속죄'],
    '황제의 명으로 자행한 학살에 양심의 가책을 느끼고 탈영했다. 속죄의 방법을 찾는 중.',
    '혼돈-선', ['특수 전투', '잠입', '황제 정보'],
    '제국 내부 정보의 열쇠, 속죄를 원하는 전력',
    _emotionSet('deliberately unremarkable posture', 'small relief when doing something right', 'self-directed anger for past actions', 'quiet: carries dead faces with him always')),

  npc(49, '나라 흑표', '반수인 암살자', 25, '여성', '오루나 황야',
    'beastkin assassin, half-panther hybrid, black spotted skin, amber slit eyes, dark fluid clothing that moves like liquid shadow',
    ['냉정', '충성', '자부심'],
    '오루나 제국 요인 암살 전담. 코르 반 족장 직속으로, 반수인의 자유를 위해 싸운다.',
    '혼돈-중립', ['암살', '그림자 이동', '독', '반수인 본능'],
    '반수인 연합 동맹 시 강력한 전력',
    _emotionSet('panther stillness, predator calm', 'rare clan-pride satisfaction', 'cold focused hunt mode', 'grief only for fallen clan members')),

  npc(50, '아스트리드 실버', '성기사단 부단장', 39, '여성', '아르카나 왕국',
    'silver paladin vice-commander, silver-blonde hair, steel blue eyes, pristine silver holy armor with blue mana gems, holy lance',
    ['신념', '유연함', '외로움'],
    '마레나 엘프 여왕과 비밀 동맹 유지 중. 종교와 자연 마나의 화해를 믿는다.',
    '질서-선', ['성기사술', '마나 정화', '엘프 외교'],
    '왕국-엘프 동맹의 핵심 연결고리',
    _emotionSet('calm faith-grounded presence', 'genuine warmth for those in need', 'righteous measured anger', 'lonely: bridges two worlds but belongs fully to neither')),
]

// ================================================================
// 🗡️ 51~62번 — 암흑가 & 첩보층
// ================================================================
const GROUP_SHADOWS: NPC[] = [
  npc(51, '섀도 퀸', '암살 길드 마스터', unknown_age(), '여성', '발타르 시티',
    'shadow queen, face always obscured, flowing black robes, only feature visible: cold purple eyes, seems to blur at edges',
    ['계산적', '무자비', '권력욕'],
    '진짜 이름 불명. 왕국 귀족 다수를 협박 중이며, 세라핀 공주의 적이다.',
    '질서-악', ['암살 지휘', '협박', '정체 은폐'],
    '세계 최대 다크 세력, 핵심 적대자',
    _emotionSet('void-like stillness', 'predatory satisfaction when prey is caught', 'nothing — removes problem instead', 'impossible to know — if she has them they\'re weapons')),

  npc(52, '린 나이트', '루나 하버 최고 정보상', 33, '여성', '루나 하버',
    'info broker, forgettable average face by design, brown eyes that miss nothing, plain travelling clothes hiding recording devices, ever-present tea cup',
    ['중립', '지식욕', '생존'],
    '세계 모든 세력의 비밀 거래 기록 보유. 정보를 팔지만 특정 세력의 편은 들지 않는다.',
    '진중립', ['정보 수집·분석', '중립 협상', '기억력'],
    '모든 것의 답을 가진 인물, 하지만 비용이 큼',
    _emotionSet('deliberately bland neutral expression', 'pleased: payment received, curiosity satisfied', 'cold information-withdrawal — worst punishment', 'curiosity is emotion — excited by new data')),

  npc(53, '피아 고스트', '왕국 비밀 첩보원', 28, '여성', '발타르 왕국',
    'royal spy, chameleon appearance changes by mission, base form: plain features, grey eyes that adapt to surroundings, always ordinary clothing',
    ['충성', '이중성', '의심'],
    '왕비 직속 첩보원. 공주를 감시하는 임무를 받았으나 공주에게 동화되고 있다.',
    '질서-중립', ['변장', '잠입', '보고'],
    '내부 갈등하는 정보원, 공주 편으로 전환 가능',
    _emotionSet('perfect situational blending', 'small genuine smile for princess\'s kindness', 'conflict when mission contradicts conscience', 'fragile: losing self in roles')),

  npc(54, '레온 다크', '오루나 제국 스파이', 31, '남성', '오루나 제국',
    'imperial spy, unremarkably handsome, adaptable appearance, dark hair styled differently per cover, charming professional smile',
    ['전문성', '불신', '외로움'],
    '발타르 시티 잠복 중. 플레이어와 접촉을 시도하는데, 그 목적이 순수하지 않다.',
    '중립-악', ['변장', '사회공학', '이중 플레이'],
    '위험한 접촉, 하지만 제국 정보 제공 가능',
    _emotionSet('warm professional charm — completely calculated', 'genuine disarming laugh (always performative)', 'cold controlled danger', 'hidden: exhausted of being no one')),

  npc(55, '에바 쉐이드', '도적 길드 부마스터 / 혁명 조직원', 30, '여성', '발타르 회색 골목',
    'thief guild vice, grey street clothes, short choppy black hair, dark eyes burning with conviction, lockpick ring always on finger',
    ['분노', '신념', '보호'],
    '빈민가 혁명 조직의 실질 지도자. 로사 그레이와 함께 체제를 바꾸려 한다.',
    '혼돈-선', ['도적술', '대중 선동', '빈민가 네트워크'],
    '빈민가 세력의 핵심, 혁명 루트 열쇠',
    _emotionSet('coiled anger at systemic injustice', 'fierce communal joy at small victories', 'explosive righteous fury', 'grief for every person the system crushed')),

  npc(56, '케이 포이즌', '독 전문 암살자', 26, '여성', '무소속',
    'poison specialist, delicate deceptive appearance, soft features hiding danger, always scent of flowers (from poisons), lace gloves always on',
    ['배신감', '생존', '조심성'],
    '섀도 퀸에게 배신당한 전직 길드원. 복수를 원하지만 혼자는 힘들다.',
    '혼돈-중립', ['독 제조·투여', '위장', '암살'],
    '섀도 퀸 대항의 핵심 카드',
    _emotionSet('wary assessment of everyone\'s motives', 'rare soft gratitude when truly helped', 'cold precise poison-delivery focus', 'raw wound of betrayal just beneath surface')),

  npc(57, '미르 블랭크', '기어스 섬 기술 도둑', 24, '남성', '기어스 섬',
    'tech thief, young clever face, messy engineer hair, augmented eye with blue mana scanner, jacket full of stolen component pockets',
    ['탐욕', '영리함', '겁쟁이'],
    '드워프 기술 설계도를 오루나에 팔려는 중. 자신이 무엇을 일으킬지 모른다.',
    '혼돈-중립', ['기술 절도', '해킹', '도주'],
    '저지하거나 이용할 수 있는 소규모 적대자',
    _emotionSet('nervous calculating money-eyes', 'greedy glee at successful theft', 'panic when cornered', 'doesn\'t think far enough ahead to feel regret')),

  npc(58, '유나 베일', '이중 첩자', 35, '여성', '아르카나/오루나',
    'double agent, perfectly ordinary middle-aged appearance, warm brown eyes hiding a compass pointing nowhere, always slightly different accessories',
    ['자기혐오', '생존', '피로'],
    '왕국과 제국 양쪽에 거짓 정보를 유통 중. 어느 쪽에도 진심이 없다. 탈출을 꿈꾼다.',
    '진중립', ['이중 정보 유통', '신뢰 구축', '거짓말'],
    '진실과 거짓이 섞인 정보원, 탈출을 도우면 진짜 정보 제공',
    _emotionSet('exhausted professional warmth', 'genuine: imagining the day she\'s truly free', 'cold terror when both sides close in', 'bone-deep exhaustion of living two lies')),

  npc(59, '카라 미스트', '안개 섬 첩자', unknown_age(), '여성', '미지(안개 섬)',
    'mist island agent, translucent pale appearance, hair and clothes always slightly foggy, eyes that shift between grey and white',
    ['목적', '침묵', '비인간적'],
    '안개 섬 세력의 대륙 파견 요원. 무엇을 수집하고 있는지 아무도 모른다.',
    '진중립', ['안개 이동', '관찰', '비물질화'],
    '안개 섬 세력 접촉의 유일한 창구',
    _emotionSet('absent as morning mist', 'warmth: briefly more solid, more human', 'becomes less visible, fades with displeasure', 'the mist is grief, perhaps')),

  npc(60, '루아 스틸', '반수인 정보원', 27, '여성', '오루나 황야/제국',
    'beastkin informant, half-wolf hybrid passing as human, silver hair cut to hide pointed ears, amber eyes, plain traveller\'s clothes',
    ['고통', '영리함', '충성'],
    '황후의 반수인 출신 비밀을 알고 있는 유일한 인물. 이 정보가 자신을 죽일 수도 있다.',
    '혼돈-중립', ['반수인 네트워크', '변장', '생존'],
    '황후 비밀의 열쇠, 위험한 정보 보유자',
    _emotionSet('hypervigilant survival awareness', 'clan warmth with other beastkin', 'cornered wolf fear-aggression', 'loneliness of hiding what you are')),

  npc(61, '다이아나 레이스', '해적 정보망 총책', 38, '여성', '해적 군도',
    'pirate intelligence chief, sharp features, dark skin, silver-streaked black hair, elegant pirate attire with hidden weapons, always smoking thin pipe',
    ['냉철함', '충성', '오만'],
    '루나 하버 이리나 여왕의 눈과 귀. 에테르 해의 모든 움직임을 파악하고 있다.',
    '질서-중립', ['정보 네트워크', '암호 해독', '해적 정치'],
    '해적 군도 정보의 문지기',
    _emotionSet('cool analytical assessment', 'satisfied smoke ring when intel proves right', 'cold professional anger — no dramatics', 'loyal grief if queen is threatened')),

  npc(62, '재스퍼 훅', '전직 왕국 첩보대장', 64, '남성', '무소속',
    'retired spymaster, rumpled old man appearance completely deliberate, faded blue eyes sharp as ever, retired civil servant clothes, fishing rod often carried',
    ['냉소', '경험', '탐욕'],
    '은퇴 후 정보 판매업. 왕국의 모든 비밀을 알고 있으며, 최고가에 판매한다.',
    '진중립', ['왕국 역사 비밀', '인맥', '심리 분석'],
    '가장 비싸지만 가장 정확한 정보원',
    _emotionSet('amiable retired gentleman act', 'pleased when paid well', 'sharp flash of real self when underestimated', 'old spy regret for a life of necessary lies')),
]

// ================================================================
// ⚙️ 63~72번 — 기술자 & 발명가층
// ================================================================
const GROUP_ENGINEERS: NPC[] = [
  npc(63, '코그나 기어', '기어스 섬 수석 발명가', 45, '여성', '기어스 섬',
    'chief inventor, wild copper hair with gears woven in, magnifying goggles, oil-stained white coat, mechanical gauntlet on right hand',
    ['집착적창의성', '낙관', '책임감'],
    '마나-기계 융합 기술의 정점. 섬 전체 에너지 시스템 설계자이며, 마나 고갈의 대안을 연구 중.',
    '혼돈-선', ['마나 기계 공학', '에너지 시스템 설계', '발명'],
    '기어스 섬 전체 기술력의 열쇠',
    _emotionSet('manic inventor energy barely contained', 'explosive eureka joy, jumps on tables', 'frustrated when materials/budget limit ideas', 'afraid: what if machines can\'t replace mana')),

  npc(64, '레나 스팀', '마나 증기 기관 설계자', 38, '여성', '기어스 섬',
    'steam system designer, practical short dark hair, protective goggles, burn-scarred hands, blueprint-covered coveralls',
    ['완벽주의', '걱정', '능력'],
    '섬 전체 마나 증기 시스템 설계자. 최근 폭발 사고의 원인을 추적 중이며, 두렵다.',
    '질서-중립', ['증기 시스템 설계', '마나 공학', '사고 분석'],
    '기어스 섬 폭발 사고 해결의 핵심',
    _emotionSet('focused system-monitoring concentration', 'relief when complex system runs perfectly', 'controlled panic when pipes fail', 'fear she designed a flaw that kills people')),

  npc(65, '볼트 해머', '드워프 마스터 장인', 201, '남성', '드워프 산채(행방불명)',
    'master dwarf craftsman, massive beard with hammers braided in, anvil-calloused hands, traditional forge apron, last seen carrying legendary weapon blueprints',
    ['고집', '완성에대한집착', '비밀'],
    '역대 최강 마나 무기 제조자. 현재 행방불명이며, 그가 만든 무기가 오루나에 있다.',
    '중립-선', ['마나 무기 제조 최고위', '비밀 기술 보유', '드워프 장인 전통'],
    '최강 무기 제조와 드워프 비밀 기술의 열쇠',
    _emotionSet('master\'s total focus, world disappears', 'rare: completed masterwork approval', 'immovable refusal when craft principles violated', 'grief for weapons used wrong')),

  npc(66, '아이다 스프링', '연금술사 길드장', 50, '여성', '발타르 시티',
    'alchemist guild head, elegant for a chemist, auburn hair pinned with crystalline pins, formal attire with subtle acid stains, crystal vials always present',
    ['독점욕', '지성', '표면적친절'],
    '마나 결정체 정제 기술 독점. 막대한 정치 자금으로 귀족 사회를 조종한다.',
    '질서-중립', ['연금술', '마나 결정체 정제', '정치 자금 운용'],
    '중요 자원의 수문장, 비용 또는 거래 필요',
    _emotionSet('professional guild-head charm', 'pleased with successful monopoly maintenance', 'cold economic precision when threatened', 'careful — vulnerability is business weakness')),

  npc(67, '크리스 코퍼', '기어스 섬 폭발물 전문가', 29, '여성', '기어스 섬',
    'explosives expert, wild orange hair singed at ends, goggles always on head, blast-resistant coveralls, fingers smell of sulphur',
    ['직설적', '비밀', '죄책감'],
    '최근 기어스 섬 연속 폭발 사고의 진짜 원인을 혼자 알고 있다. 말하면 죽을 수 있다.',
    '혼돈-중립', ['폭발물 제조·분석', '마나 결합 폭약', '사고 위장'],
    '기어스 섬 폭발 사건의 핵심 증인',
    _emotionSet('hyper-alert disaster-prevention focus', 'explosive laugh at close calls', 'panic disguised as aggression', 'guilt she hasn\'t told anyone yet')),

  npc(68, '펌프 아이언', '드워프 마나 광부 대장', 167, '남성', '드워프 산채',
    'mining foreman, stocky even for dwarf, iron-grey beard matted with ore dust, mining helm with cracked mana light, enormous pickaxe',
    ['단순함', '경험', '충격'],
    '대지맥 이상 현상을 광산에서 직접 목격. 무슨 의미인지는 모르지만, 보고 싶지 않다.',
    '질서-중립', ['광산 운영', '지질 감지', '드워프 노동자 통솔'],
    '대지맥 이상의 첫 번째 목격자 증언',
    _emotionSet('solid reliable foreman bearing', 'proud when tunnel work is good', 'honest simple anger at danger to workers', 'genuine fear of what he saw underground')),

  npc(69, '테키 루비', '마나 결정체 감정사', 26, '여성', '기어스 섬',
    'mana crystal appraiser, young energetic, ruby-red hair, jeweler\'s loupe always at eye, pristine white coat, crystal samples everywhere',
    ['정직', '집착', '무결점주의'],
    '가짜 마나석 유통 사건을 추적 중. 진짜와 가짜를 구별하는 유일한 인물.',
    '질서-중립', ['마나석 감정', '결정체 분석', '시장 추적'],
    '마나석 부족 위기의 진실 폭로자',
    _emotionSet('precise analytical focus on every crystal', 'pure joy at finding perfect genuine mana stone', 'furious — counterfeits insult her craft', 'worried: fakes suggest supply is failing')),

  npc(70, '제니 와이어', '마나 통신 장치 발명가', 31, '여성', '기어스 섬',
    'communication inventor, glasses with antenna attachments, curly dark hair stuffed under headset, prototype devices all over coat, always distracted by signals',
    ['몽상가', '집착', '순진'],
    '대륙간 통신망 구축 중. 자신이 도청당하고 있다는 것을 모른다.',
    '혼돈-선', ['마나 통신 기술', '신호 분석', '네트워크 설계'],
    '통신 기술 동맹, 보호 필요',
    _emotionSet('distracted by signals others can\'t hear', 'ecstatic when connection established', 'genuinely baffled when people don\'t share enthusiasm', 'doesn\'t know she should be scared')),

  npc(71, '알마 포지', '엘프-드워프 혼혈 기술자', 89, '여성', '기어스 섬',
    'half-elf half-dwarf engineer, slight elf height with dwarf stockiness, pointed ears with gear earrings, nature-tech hybrid coat, wooden-and-iron tools',
    ['고독', '이중성', '통합'],
    '자연 마나와 기계 마나를 동시에 다루는 유일한 인물. 두 세계 어디에도 완전히 속하지 못한다.',
    '중립-선', ['자연-기계 마나 융합', '하이브리드 기술', '조정 능력'],
    '두 세계를 연결하는 유일한 기술자',
    _emotionSet('belonging-to-two-worlds-belonging-to-neither', 'rare complete peace when both sides of heritage align', 'caught between two worlds\' expectations', 'loneliness of the bridge between worlds')),

  npc(72, '루크 클락', '기어스 섬 시계탑 관리인', 55, '남성', '기어스 섬',
    'clocktower keeper, thin precise figure, white hair neatly parted, formal clockwork-patterned vest, pocket watch always in hand, keys to everything',
    ['질서', '비밀', '무게'],
    '섬의 핵심 마나 제어 장치를 단독 관리. 모든 것이 그를 거치지만 자신은 거의 알려져 있지 않다.',
    '질서-중립', ['핵심 시스템 제어', '마나 흐름 조정', '섬 전체 열쇠 관리'],
    '기어스 섬 핵심 접근의 열쇠',
    _emotionSet('precise clockwork movements, everything in time', 'pleased when island runs perfectly', 'quiet clockwork stopping — most dangerous version', 'weight of what would happen if he failed')),
]

// ================================================================
// 🛐 73~81번 — 성직자 & 신관층
// ================================================================
const GROUP_CLERGY: NPC[] = [
  npc(73, '세레나 라이트', '마나 교단 대사제', 59, '여성', '아르카나 왕국',
    'high priestess, imposing height, silver-white hair in ceremonial headdress, golden mana-crystal robes, voice that carries without effort',
    ['광신', '카리스마', '조종'],
    '마나 고갈을 신의 심판으로 해석하며 전쟁을 부추기는 설교를 한다. 교단의 절대 권력자.',
    '질서-악', ['대중 선동', '마나 의식', '정치 조종'],
    '종교 세력의 최대 적대자',
    _emotionSet('absolute certainty of divine purpose', 'zealous joy when flock believes', 'cold divine judgment on heretics', 'none — doubt would destroy her')),

  npc(74, '이브 화이트', '치유 성녀', 23, '여성', '아르카나 왕국',
    'healing saint, gentle luminous appearance, white-gold hair, eyes that glow faintly when healing, simple white robes, hands always slightly warm',
    ['공감', '순수', '강인함'],
    '플레이어가 위기에 처했을 때 구해주는 인물. 교단의 대사제와 내적 갈등 중.',
    '중립-선', ['치유 마나', '마나 정화', '생명 감지'],
    '플레이어의 생명줄, 치유와 안식',
    _emotionSet('gentle warm presence, light from within', 'pure joy when someone heals', 'quiet firm resolve against cruelty', 'deep sorrow for suffering she couldn\'t prevent')),

  npc(75, '클라리아 문', '달의 신관', 41, '여성', '에테르 해 북부',
    'moon priestess, translucent pale, silver hair braided with moonstone, robes that shift between silver and shadow, boat that moves without wind',
    ['신탁', '모호함', '진실반거짓반'],
    '안개 섬의 신탁을 해석하는 자. 말의 절반은 진실이고 절반은 의도적으로 모호하다.',
    '진중립', ['신탁 해석', '달빛 의식', '미래 단편'],
    '예언 정보원, 해석이 필요한 단서 제공',
    _emotionSet('moonlit distant calm', 'cryptic satisfaction at perfect oracle delivery', 'coldly removes herself from events', 'genuine: sometimes she sees too clearly')),

  npc(76, '아론 선', '태양 신전 수장', 62, '남성', '아르카나 왕국',
    'sun temple head, golden-tan skin, bright amber eyes, sun-gold ceremonial robes, warm commanding presence',
    ['합리성', '온화함', '용기'],
    '교단 대사제와 종파 갈등. 마나 위기를 자연 현상으로 보며 과학적 해법을 지지한다.',
    '질서-선', ['태양 마나 의식', '대중 설득', '종교 정치'],
    '교단에 대항하는 종교 내부 동맹',
    _emotionSet('warm authoritative faith-grounded presence', 'genuine solar joy at cooperation', 'righteous steady opposition to fanaticism', 'compassion for those misled by fear')),

  npc(77, '도나 어스', '반수인 무당', 67, '여성', '오루나 황야',
    'beastkin shaman, ancient wrinkled face, bone-white braids, tribal robes hung with teeth and feathers, staff of twisted ancient wood',
    ['고집', '통찰', '시대와불화'],
    '고대 유적의 마나를 해석하는 유일한 인물. 선행 문명에 대한 지식이 있지만 믿어주는 사람이 없다.',
    '중립-선', ['고대 마나 의식', '유적 해석', '부족 치유'],
    '선행 문명 해독의 핵심',
    _emotionSet('ancient patient observation', 'cackle laugh at irony of youth dismissing old knowledge', 'sharp shamanic authority when provoked', 'grief for a world she knew was coming')),

  npc(78, '사빈 크로스', '전직 성직자 (파문)', 35, '남성', '무소속',
    'excommunicated priest, former holiness worn away, travel-worn plain clothes, wooden makeshift holy symbol, haunted but determined eyes',
    ['진실', '배신감', '용기'],
    '교단 부패를 고발하다 파문당했다. 진실을 폭로할 증거를 모으고 있다.',
    '혼돈-선', ['교단 내부 지식', '증거 수집', '설교'],
    '교단 부패 폭로의 핵심',
    _emotionSet('former priest posture, still carries itself with grace', 'genuine warmth for those the church abandoned', 'righteous anger at hypocrisy he once enabled', 'grief for faith that wasn\'t wrong, just betrayed')),

  npc(79, '오라 블레스', '왕국 왕실 사제', 48, '여성', '발타르 왕궁',
    'royal chaplain, perfectly composed, silver hair in severe bun, pristine white and gold robes, smile that reaches eyes but not mind',
    ['복종', '비밀', '죄책감'],
    '왕가 비밀 의식 집행자. 기억을 지우는 마법을 왕명으로 사용해왔다.',
    '질서-악', ['기억 지우기 마법', '왕실 의식', '비밀 유지'],
    '왕가 비밀의 공범, 회유 시 증언 가능',
    _emotionSet('perfectly composed professional holiness', 'genuine piety alone in prayer', 'cold resolve when executing orders', 'buried deep: guilt for memories she erased')),

  npc(80, '네이아 다크문', '금지 의식 전문 사제', 29, '여성', '무소속',
    'forbidden rite priest, ink-black hair, dark robes covered in precursor civilization symbols, eyes too bright, ancient texts always open',
    ['광신', '집착', '확신'],
    '선행 문명 부활 의식을 재현하려는 광신도. 그 의식이 무엇을 일으킬지 모른다.',
    '혼돈-악', ['금지 의식', '고대어 해독', '마나 각성'],
    '선행 문명 부활의 위험한 촉매자',
    _emotionSet('fervent certainty burning in eyes', 'ecstatic when ritual progresses', 'cold rejection of doubt as weakness', 'cannot feel doubt — it would break the purpose')),

  npc(81, '형 드래곤', '오루나 황실 제사장', 53, '남성', '오루나 제국',
    'imperial chaplain, shaved head with tattoos, severe black imperial robes, prayer beads of iron, one eye slightly clouded',
    ['광신', '황제숭배', '교활'],
    '황제에게 마나 없는 신에 대한 신앙을 전파 중. 제국의 종교 정책을 사실상 결정한다.',
    '질서-악', ['황실 의식', '제국 신학', '심리 조종'],
    '제국 종교 세력의 수장, 황제 접근 경로',
    _emotionSet('absolute imperial piety posture', 'cold satisfaction at empire\'s divine mandate', 'heretic-crushing certainty', 'devotion that has burned away everything else')),
]

// ================================================================
// 🌾 82~90번 — 평민 & 사회층
// ================================================================
const GROUP_COMMONS: NPC[] = [
  npc(82, '로사 그레이', '회색 골목 혁명 지도자', 28, '여성', '발타르 빈민가',
    'revolutionary leader, strong calloused hands, dark curly hair tied back, worn grey clothing, passionate burning eyes, scar on cheek',
    ['신념', '열정', '피로'],
    '마나 없는 평민들의 권리 운동 수장. 왕국 수배 중이며 혁명의 불꽃을 지피고 있다.',
    '혼돈-선', ['대중 선동', '빈민가 조직', '생존 전술'],
    '사회 변혁 루트의 핵심',
    _emotionSet('burning determined exhaustion', 'fierce communal joy at solidarity', 'righteous fury at systemic injustice', 'grief for every person she couldn\'t save')),

  npc(83, '마야 파머', '초록 평야 마을 이장', 52, '여성', '아르카나 농촌',
    'village elder, weathered kind face, grey-brown hair in practical braid, muddy practical village clothes, hands that know real work',
    ['현실적', '걱정', '강인함'],
    '마나 흉작의 최전선. 왕국 정부에 탄원을 거듭하지만 아무도 듣지 않는다.',
    '질서-선', ['농업 지식', '마을 행정', '마나 농법'],
    '마나 위기의 실제 영향을 보여주는 인물',
    _emotionSet('practical worry of a caretaker', 'warm earth-mother welcome', 'quiet firm demand when village is threatened', 'exhausted grief for crops that won\'t grow')),

  npc(84, '샘 웨이브', '에테르 해 노련한 선장', 61, '남성', '에테르 해',
    'veteran sea captain, weathered bronze skin, white beard, captain\'s coat with mana compass, one hand replaced with mechanical hook',
    ['경험', '중립', '비밀'],
    '안개 섬 항로를 아는 유일한 민간인. 그 대가로 모든 항구의 신세를 졌다.',
    '진중립', ['항해', '안개 섬 항로 기억', '바다 생존'],
    '안개 섬 접근의 현실적 열쇠',
    _emotionSet('easy old sea dog confidence', 'booming laugh, sea story incoming', 'simple honest storm-captain anger', 'old grief, someone left on the mist isles')),

  npc(85, '니나 마켓', '발타르 대시장 거상', 44, '여성', '발타르 시티',
    'merchant queen of markets, rich practical dress, calculating brown eyes, jewelry that is actually currency, market ledger always in hand',
    ['탐욕', '영리함', '실용적중립'],
    '마나 결정체 암시장 운영. 모든 세력에 물자를 공급하며 전쟁보다 거래를 선호한다.',
    '진중립', ['물자 유통', '암시장', '정보 수집'],
    '물자와 암시장 정보의 수문장',
    _emotionSet('market-queen professional assessment', 'pleased: good deal struck', 'cold economic calculation of loss', 'carefully hidden: war is bad for business')),

  npc(86, '토마 디거', '고대 유적 탐험가', 33, '남성', '오루나 황야',
    'ruin explorer, dust-stained adventurer\'s gear, excited eyes behind cracked goggles, forearm maps matching ruin layouts, always slightly dirty',
    ['호기심', '낙관', '무모함'],
    '유적 내부 지도를 절반쯤 완성. 들어갔다 나온 적이 있는 몇 안 되는 사람 중 하나.',
    '혼돈-선', ['유적 탐사', '罠 감지', '고대 유물 식별'],
    '유적 탐사 가이드, 무모한 동료',
    _emotionSet('excited explorer always planning next ruin', 'infectious enthusiasm for discovery', 'frustrated when ruins block progress', 'awed reverence for precursor civilization scale')),

  npc(87, '에리카 브레드', '발타르 여관 주인', 47, '여성', '발타르 시티',
    'innkeeper, broad comfortable presence, red-brown hair in messy bun, flour-dusted apron over solid dress, always has food and information',
    ['관찰', '인정많음', '비밀'],
    '모든 소문의 집결지이자 정보원 네트워크의 중심. 먼저 나서지는 않지만 누가 물으면 다 안다.',
    '진중립', ['정보 수집·보관', '음식', '빈민 지원'],
    '발타르 정보의 중심, 안전한 거점',
    _emotionSet('warm watchful innkeeper', 'genuine warm welcome for trusted regulars', 'firm sharp warning when inn threatened', 'soft grief for guests who didn\'t come back')),

  npc(88, '라나 피시', '루나 하버 선술집 주인', 39, '여성', '해적 군도',
    'tavern keeper, sun-weathered skin, wild black curly hair, practical tavern clothes, strong arms, laugh that calms bar fights',
    ['중립', '실용', '의리'],
    '모든 해적 파벌의 중립지대 운영. 실질적 분쟁 중재자이며, 이리나 여왕과 오랜 친구.',
    '진중립', ['분쟁 중재', '해적 정보', '술 제조'],
    '해적 군도 중립 거점이자 정보 집결지',
    _emotionSet('easy tavern calm that prevents fights', 'booming genuine laugh that lights room', 'absolute firm neutrality enforced loudly', 'quiet: misses simpler times before she had this weight')),

  npc(89, '카로 달', '마나를 잃은 전직 마법사', 41, '남성', '무소속',
    'former mage, drained appearance, faded eyes that once held mana glow, worn plain clothes, mage\'s ring still worn but inert',
    ['분노', '비밀', '슬픔'],
    '마나를 잃은 후 평민으로 살며 분노와 비밀을 품고 있다. 왜 마나를 잃었는지 알고 있다.',
    '혼돈-중립', ['마나 이론 지식 (이론만)', '쓴 경험', '분노'],
    '마나 고갈의 개인적 증인, 비밀 보유자',
    _emotionSet('hollow grief of the lost', 'bitter laugh: he sees irony others miss', 'misdirected anger at everything mana', 'deep grief for ability and identity both gone')),

  npc(90, '이나 웹', '기어스 섬 하층 노동자', 19, '여성', '기어스 섬',
    'lower district worker, young tired face, grease-stained clothes, wide scared eyes, constantly looking over shoulder, small burn on left hand from explosion',
    ['두려움', '생존', '진실'],
    '폭발 사고 현장의 유일한 목격자. 쫓기는 중이며 누군가에게 이 사실을 전하고 싶다.',
    '혼돈-중립', ['목격 증언', '하층 지역 지리', '숨기'],
    '기어스 섬 폭발 사건의 열쇠',
    _emotionSet('constant low-level fear, flinches at sounds', 'desperate relief when someone listens', 'panic when pursuer closes in', 'child\'s grief: she just wanted to work and survive')),
]

// ================================================================
// 🐉 91~100번 — 미지 & 특수 존재
// ================================================================
const GROUP_UNKNOWN: NPC[] = [
  npc(91, '아에라 아이언', '반수인 족장 연합 대표', 38, '여성', '오루나 황야',
    'beastkin council leader, iron-grey wolf hybrid, silver-striped fur, iron crown of twisted beastkin symbols, war staff, dignified power',
    ['자부심', '전략', '절박'],
    '오루나 제국과 전면전 직전. 플레이어가 중재할 수 있는 마지막 기회.',
    '혼돈-선', ['연합 통솔', '황야 전술', '종족 외교'],
    '반수인 전쟁의 분기점 열쇠',
    _emotionSet('dignified beastkin authority', 'fierce clan pride joy', 'war-ready leader anger, unbreakable', 'grief for all tribes lost to empire expansion')),

  npc(92, '비르 고스트', '안개 섬에서 온 자', unknown_age(), '여성', '미지',
    'from the mist, half-present appearance, white hair merging with fog, grey eyes with depth of ocean, robes that are partially mist',
    ['목적불명', '단편적', '비인간성'],
    '목적 불명. 항상 안개에 반쯤 싸여 있으며, 때로 미래의 일을 현재형으로 말한다.',
    '진중립', ['안개 이동', '시간 인식 이상', '존재 투과'],
    '안개 섬 세계의 실체적 단서',
    _emotionSet('absent half-present', 'brief genuine presence — more terrifying than absence', 'cold fog solidifying', 'echoes of something like grief')),

  npc(93, '에코 루인', '선행 문명 유적 각성체', unknown_age(), '여성', '고대 유적',
    'precursor spirit, humanoid but too perfect, skin like polished stone with glowing rune-veins, ancient-modern merged clothing, moves like water',
    ['고대의식', '학습중', '무죄'],
    '유적이 만들어낸 마나 정령이 인간 형태로 각성했다. 세계의 역사를 알지만 현재를 이해 중.',
    '진중립', ['선행 문명 지식', '마나 조작 원형', '학습 능력'],
    '세계 최대 비밀의 화신',
    _emotionSet('ancient calm processing current world', 'wonder at human unpredictability', 'incomprehension at destruction of what she built', 'grief-echo of civilizations that ended')),

  npc(94, '오로 드래곤', '드래곤 혈통 인간', 312, '남성', '무소속',
    'dragon lineage human, tall with subtle scales along jaw and hands, amber slit eyes, worn travel clothes can\'t hide sheer physical presence',
    ['고독', '통찰', '오래된지혜'],
    '수백 년 전 드래곤의 후손. 마나 이상을 본능적으로 감지하며, 이미 예상하고 있었다.',
    '혼돈-중립', ['드래곤 본능', '마나 감지', '고대 지식'],
    '세계 위기의 가장 오래된 관찰자',
    _emotionSet('ancient observer calm, seen it before', 'rare genuine respect for surprising humans', 'draconic quiet warning before scale-showing', 'centuries of lonely watching')),

  npc(95, '루나 세일', '해적왕 후계자', 19, '여성', '해적 군도',
    'pirate queen heir, young version of mother Irina, gold-streaked black hair, captain\'s coat too big still growing into, fierce determined eyes',
    ['야망', '미성숙', '충성'],
    '이리나 여왕의 딸. 모든 해적 파벌 통합을 꿈꾸며 어머니보다 더 강해지려 한다.',
    '혼돈-중립', ['검술 훈련 중', '해적 통솔 학습', '항법'],
    '다음 세대 해적 세력의 씨앗',
    _emotionSet('young overconfidence barely covering uncertainty', 'fierce proud delight in victories', 'impulsive young anger, not yet controlled', 'loneliness at the top no one sees')),

  npc(96, '실 다크엘프', '추방된 다크엘프', 178, '여성', '무소속',
    'dark elf exile, deep charcoal skin with faint silver vein patterns, white-silver hair, practical dark armor, eyes like silver moons',
    ['냉소', '생존', '숨겨진따뜻함'],
    '엘페아 숲에서 추방된 다크엘프. 금지 마나 기술을 보유하며, 혼자서 살아온 지 오래됐다.',
    '혼돈-중립', ['금지 마나 기술', '어둠 마법', '생존'],
    '엘프 세계 비밀의 또 다른 열쇠',
    _emotionSet('centuries of survival wariness', 'startled by own warmth — almost forgot it existed', 'cold ancient contempt', 'exiled grief she pretends doesn\'t exist')),

  npc(97, '제로 널', '마나 공백 지역 태생', 17, '남성', '오루나 황야',
    'mana-void born, ordinary young face hiding extraordinary nature, plain clothes, no mana glow anywhere near him, radius of mana-silence around him',
    ['혼란', '탐색', '두려움'],
    '마나 공백 지역에서 태어나 마나 마법이 완전히 통하지 않는다. 원인도 의미도 모른다.',
    '진중립', ['마나 무효화 (본능)', '황야 생존', '학습 빠름'],
    '마나 위기의 새로운 세계 첫 존재',
    _emotionSet('confused searching for belonging', 'surprised joy when someone sees him not his anomaly', 'fear-lashing when mana abilities involuntarily trigger', 'alone: genuinely doesn\'t know what he is')),

  npc(98, '아이 스타차일드', '별에서 온 예언자', unknown_age(), '여성', '미지',
    'star prophet, appearance shifts with starlight, seems younger or older depending on angle, clothing like night sky, star-shaped pupils',
    ['예언적', '슬픔', '관찰'],
    '마나의 근원이 하늘에서 왔다는 고대 기록의 화신. 마나 위기의 진짜 원인을 안다.',
    '진중립', ['성좌 마나', '세계 역사 전체', '예언'],
    '세계 위기의 최종 진실 열쇠',
    _emotionSet('starlight calm, already knows how it ends', 'stellar wonder at small human moments of courage', 'cold grief at predictable choices', 'infinite sadness for cycles that keep repeating')),

  npc(99, '베나 라스트', '마지막 선행 문명인', unknown_age(), '여성', '고대 유적',
    'last precursor, ancient beyond measure but appears as young woman, crystalline skin with dormant mana veins, clothing of materials that don\'t exist',
    ['충격', '학습', '죄책감'],
    '수천 년간 유적 안에서 잠들어 있다가 최근 각성했다. 마나 위기가 자신들의 실수임을 안다.',
    '중립-선', ['선행 문명 전체 지식', '원형 마나 제어', '각성 이제 시작'],
    '세계 위기 해결의 최종 열쇠이자 원인',
    _emotionSet('ancient confusion at changed world', 'wonder that some things survived', 'devastated guilt for what her civilization caused', 'deepest grief: slept through all of it')),

  npc(100, '더 나레이터', '정체 불명의 여행자', unknown_age(), '남성', '에테르 해 전역',
    'unknown traveller, unremarkable face that is somehow always forgotten, plain clothes that fit every era, always there first, faint smile',
    ['관찰', '중립', '비밀'],
    '모든 사건 현장에 항상 먼저 도착해 있는 존재. 누구인지, 무엇인지 아무도 모른다.',
    '진중립', ['편재', '기억되지않음', '관찰'],
    '세계의 증인, 메타적 존재',
    _emotionSet('pleasant unremarkable everyman expression', 'knowing smile that unsettles', 'does he feel anger? you can\'t tell', 'faint smile might be sadness — you forget before you\'re sure')),
]

// ================================================================
// 🏨 101~125번 — 생활 밀착형 반복 등장 인물
// ================================================================
const GROUP_RECURRING: NPC[] = [
  // ── 숙박 & 음식업 101~108
  npc(101, '마르타 웜스', '발타르 대도시 여관 주인', 48, '여성', '발타르 시티',
    'innkeeper, warm broad face, brown hair escaping bun, always-clean apron, sharp eyes that catalog every guest, key ring at hip',
    ['관찰', '실용', '전직도적숨김'],
    '전직 도적 출신. 소문 수집의 달인이며 방값 대신 정보로 거래 가능.',
    '진중립', ['정보 수집', '전직 도적 기술', '숙박 운영'],
    '발타르 시티의 첫 번째 정보 거점',
    _emotionSet('warm professional innkeeper assessment', 'genuine welcome for paying respectful guests', 'firm: rules of the house are absolute', 'quiet: old life shows in how she checks exits')),

  npc(102, '헬가 브루', '루나 하버 항구 선술집 주인', 44, '여성', '루나 하버',
    'harbor tavern keeper, battle-built figure from years of breaking up fights, sea-bleached hair, leather apron, bottle that doubles as weapon',
    ['실용', '중립지킴', '약조제가능'],
    '모든 해적 파벌 중립 구역 운영. 술에 약을 탈 줄 알며 이 사실을 아무도 모른다.',
    '진중립', ['분쟁 중재', '약물 제조', '해적 정보'],
    '루나 하버 정보와 중립 거점',
    _emotionSet('unshakeable neutral ground posture', 'rare laugh when someone does something truly dumb', 'absolute authority: leave or be left', 'private: proud of neutral ground she built')),

  npc(103, '소냐 브레드', '농촌 여인숙 주인', 39, '여성', '초록 평야',
    'rural innkeeper, flour-dusted apron, kind tired face, worn dress, welcoming home energy despite worry lines',
    ['따뜻함', '걱정', '절박'],
    '마나 흉작으로 폐업 직전. 플레이어에게 마을 살리기 의뢰를 줄 수 있다.',
    '질서-선', ['농촌 네트워크', '기본 의료', '마나 농법 지식'],
    '농촌 위기 퀘스트의 시작점',
    _emotionSet('warm worried welcome', 'relief and gratitude when helped', 'desperate worry masked as calm', 'quiet: counting how many nights left')),

  npc(104, '뚱보 칼', '기어스 섬 선술집 주인', 53, '남성', '기어스 섬',
    'gear island tavern owner, enormous cheerful man, oil-stained apron, handlebar moustache with tiny gears in it, laugh shakes tables',
    ['명랑', '정보통', '술제조'],
    '모든 발명가와 기술자의 단골집. 기술 정보를 잡담처럼 흘리는 것을 즐긴다.',
    '진중립', ['기술자 네트워크', '술 제조', '정보 유통'],
    '기어스 섬 기술 정보 거점',
    _emotionSet('booming cheerful host energy', 'explosive laughter, drinks on house', 'dramatic declaration: you\'re banned! (never serious)', 'hidden soft heart for struggling inventors')),

  npc(105, '리아 스위트', '아르카나 학원 마법 카페 주인', 26, '여성', '아르카나 학원',
    'academic cafe owner, young sharp face, mana-styled hair that changes color with her mood, barista apron with spell-circles on it',
    ['감각적', '영리', '마법덕후'],
    '마법사들의 단골. 마법 재료도 같이 판매하며 학원 소문을 가장 빨리 안다.',
    '혼돈-중립', ['학원 소문', '마법 재료', '마나 음료 제조'],
    '학원 내부 정보의 비공식 창구',
    _emotionSet('bright cafe energy, mood-color hair shifts', 'excited when mage does interesting spell nearby', 'pouty when no interesting magic happens', 'genuinely invested in students succeeding')),

  npc(106, '나나 스프', '발타르 빈민가 급식소 운영자', 55, '여성', '발타르 회색 골목',
    'soup kitchen operator, kind exhausted face, grey hair in practical scarf, patched clothing, soup ladle always in hand',
    ['인정', '연락책', '지혜'],
    '혁명 조직 로사 그레이의 연락책. 음식을 나누며 정보를 모은다.',
    '혼돈-선', ['빈민가 네트워크', '혁명 연락', '식료품 관리'],
    '빈민가 혁명 세력으로 가는 문',
    _emotionSet('mother-of-the-district calm', 'warm genuine pride at full bowls', 'quiet firm refusal of injustice', 'grief for each face in line she knows')),

  npc(107, '베로 와인', '발타르 귀족 구역 고급 식당 주인', 50, '여성', '발타르 시티 귀족 구역',
    'upscale restaurant owner, elegantly dressed to blend with nobility, silver-streaked dark hair, trained to be invisible while present',
    ['관찰', '판매', '표면적우아함'],
    '귀족들의 은밀한 대화를 모두 엿들음. 정보를 판매하되 출처를 절대 밝히지 않는다.',
    '진중립', ['귀족 정보 수집', '고급 요리', '계급 연기'],
    '귀족 사회 내밀한 정보 판매',
    _emotionSet('invisible professional service', 'pleased: excellent meal, excellent payment', 'cold: this conversation is over', 'private contempt for what power does to people')),

  npc(108, '핀 피시', '오루나 황야 오아시스 주막 주인', 46, '남성', '오루나 황야',
    'oasis tavern owner, desert-weathered face, sun-bleached hair, practical robes, water vessel always full, survival-smart eyes',
    ['생존주의', '실용', '반수인인맥'],
    '황야 생존 정보 제공. 반수인 부족과 인맥이 있으며 그것이 살아남은 이유다.',
    '진중립', ['황야 생존 정보', '반수인 연락', '물 공급'],
    '황야 탐사 필수 거점',
    _emotionSet('desert-practical efficiency', 'genuine warmth: rare water, rare trust', 'simple danger assessment of threat', 'quiet: desert takes people. he stays.')),

  // ── 경비 & 위병 109~115
  npc(109, '브루나 게이트', '발타르 시티 성문 위병대장', 37, '여성', '발타르 성문',
    'city gate captain, stocky uniform figure, short practical hair under helmet, clipboard of warrants, coin-weighing fingers',
    ['규칙', '뇌물약점', '정보'],
    '수배자 명단을 가장 최신으로 보유. 뇌물에 약하며 이를 본인도 안다.',
    '질서-중립', ['출입 통제', '수배자 명단', '성문 관리'],
    '신분 위협과 통과 협상의 첫 관문',
    _emotionSet('official gate-check professional mode', 'briefly warm when bribe is sufficient', 'loud official denial of bribery', 'uncomfortable: knows she\'s compromised')),

  npc(110, '스텔라 패트롤', '왕도 야간 순찰대장', 31, '여성', '발타르 시티',
    'night patrol captain, dark practical uniform, black hair in tight braid, lantern and patrol log, sees everything in shadow',
    ['관찰', '내통의혹', '보호'],
    '밤의 회색 골목을 실질 관할. 혁명 조직과 내통 의혹을 받고 있다.',
    '혼돈-중립', ['야간 순찰', '골목 지형', '빈민 보호'],
    '빈민가와 왕국 사이의 비밀 연결고리',
    _emotionSet('alert night-eyes always moving', 'small nod of respect to those protecting the weak', 'sharp authority when people are in danger', 'conflict between duty and what she sees every night')),

  npc(111, '하크 아이언', '왕국 감옥 간수장', 52, '남성', '발타르 지하 감옥',
    'prison chief, massive scarred figure, iron ring of keys, worn guard uniform, small eyes that note which cell could be opened for price',
    ['탐욕', '경험', '실용'],
    '죄수들의 비밀을 팔아 부업 중. 탈옥을 도울 수 있다, 물론 대가가 있다.',
    '질서-중립', ['감옥 운영', '죄수 심문', '뇌물 거래'],
    '감옥 탈출과 죄수 정보의 열쇠',
    _emotionSet('counting money behind bland prison face', 'satisfied grunt when payment clears', 'official threat when rules cited (negotiable)', 'old: has seen what desperation does')),

  npc(112, '유리 왓치', '기어스 섬 민간 경비 대장', 34, '여성', '기어스 섬',
    'island security chief, practical armored coat, augmented arm with built-in tool, short silver-dyed hair, badge of gears and crossed swords',
    ['실용', '중립', '섬의법'],
    '어느 나라 법도 통하지 않는 섬의 자체 법 집행관. 기어스 섬 법만 따른다.',
    '질서-중립', ['섬 내 법 집행', '마나 기계 무기', '중립 협상'],
    '기어스 섬 내 활동 허가의 문',
    _emotionSet('no-nonsense island law enforcement', 'approval: handled it right on the island', 'absolute island authority invoked', 'private: weight of keeping free city free')),

  npc(113, '토르 가드', '마법 학원 경비 수장', 58, '남성', '아르카나 학원',
    'academy security head, battle-worn older guard, salt-and-pepper hair, academy security uniform with extra reinforcements, suspicious of everyone',
    ['집착', '베테랑', '비밀보호'],
    '금지된 서고 접근 시도자를 30년째 막아온 베테랑. 무엇이 안에 있는지는 모른다.',
    '질서-중립', ['경비', '마법 방어막', '서고 잠금'],
    '서고 접근의 가장 현실적 장애물',
    _emotionSet('perpetual suspicion of everyone\'s intentions', 'grudging respect for those who ask permission properly', 'absolute refusal at restricted area boundary', 'doesn\'t want to know what he\'s guarding')),

  npc(114, '레아 포트', '루나 하버 항구 세관원', 29, '여성', '루나 하버',
    'customs officer, official uniform that is mostly decoration, sharp eyes for profitable cargo, palm always slightly out',
    ['뇌물', '영리함', '정보'],
    '뇌물 없이는 아무것도 통과 안 됨. 밀수 정보를 팔 수도 있다.',
    '혼돈-중립', ['화물 검사', '밀수 정보', '통과 협상'],
    '해적 항구 물자 이동의 열쇠',
    _emotionSet('official customs check mode (palm out)', 'satisfied: payment received, cargo passes', 'dramatic official impediment (negotiable)', 'private: this is the best job in the harbor')),

  npc(115, '크라 워치', '오루나 황도 외곽 순찰병', 22, '여성', '오루나 황도',
    'imperial perimeter guard, young soldier face showing cracks, standard imperial armor ill-fitted, hand on weapon she hopes not to draw',
    ['갈등', '두려움', '양심'],
    '탈영 직전. 황제의 명령에 내적 갈등을 겪고 있다.',
    '혼돈-중립', ['황도 경비', '제국 내부 정보', '탈영 직전'],
    '제국 내부 균열의 작은 창구',
    _emotionSet('scared young soldier holding it together', 'grateful relief when someone is kind', 'confused fear masking as duty', 'crying alone after shifts')),

  // ── 상인 & 행상 116~121
  npc(116, '제나 마켓', '발타르 대시장 무기상', 36, '여성', '발타르 시티',
    'weapons dealer, practical dark clothes, callused hands, display of blades behind her, neutral assessment of everyone as potential customer',
    ['중립', '출처불문', '실용'],
    '합법·불법 경계의 무기 판매. 출처를 묻지 않으며 구매자도 묻지 않는다.',
    '진중립', ['무기 감정', '무기 판매', '출처 네트워크'],
    '장비 보급 첫 번째 창구',
    _emotionSet('neutral market assessment of your budget', 'pleased: good sale', 'cold: can\'t help you (price too low or heat too high)', 'professional: she\'s seen worse')),

  npc(117, '올가 크리스탈', '마나 결정체 행상', 42, '여성', '에테르 해 전역',
    'travelling mana crystal merchant, weathered sea-trader, crystal samples hanging from pack, every vessel knows her face',
    ['여행', '정보유통', '탐욕'],
    '배를 타고 대륙을 순회하며 마나석 판매. 정보도 같이 유통한다.',
    '진중립', ['마나석 거래', '대륙간 정보', '항해'],
    '세계 각지 마나석과 정보의 유동 공급자',
    _emotionSet('trader\'s friendly opener', 'enthusiastic about quality crystals and good prices', 'curt when time wasted', 'has no home — ocean is fine')),

  npc(118, '두 코인', '발타르 빈민가 잡화상', 31, '남성', '발타르 회색 골목',
    'grey alley dealer, shifty thin figure, coin always flipping, ill-gotten goods in coat pockets, nervous energy',
    ['탐욕', '비겁', '접촉'],
    '훔친 물건 전문 취급. 도적 길드 납품업자이며 에바 쉐이드와 연결된다.',
    '혼돈-중립', ['장물 거래', '도적 길드 연락', '빈민가 지리'],
    '저비용 장비와 빈민가 정보',
    _emotionSet('nervous coin-flipping assessment', 'greedily happy at good trade', 'flight response when threatened', 'just trying to survive the alley')),

  npc(119, '아사 포션', '아르카나 학원 연금술 재료상', 33, '여성', '아르카나 학원',
    'alchemy supply dealer, smart appearance, carefully stained coat, crystal vials organized perfectly, knowing smile for special requests',
    ['영리함', '뒷거래', '중립'],
    '금지 재료도 취급. 학원 교수들에게 뒷거래를 하며 두 가지 가격표가 있다.',
    '혼돈-중립', ['연금 재료', '금지 재료 접촉', '학원 뒷거래'],
    '학원 내 특수 재료와 정보 접근',
    _emotionSet('professional two-price-list smile', 'pleased: special request fills specialty inventory', 'cold: this conversation didn\'t happen', 'quietly proud of running the best gray-market in academia')),

  npc(120, '빌 스크랩', '기어스 섬 고물상', 44, '남성', '기어스 섬',
    'junk dealer, big grimy hands, magnifying lens over one eye, clothes entirely made of repurposed gear materials, always sorting parts',
    ['잡학다식', '탐욕', '우연한도움'],
    '망가진 마나 기계 부품 전문. 희귀 설계도를 간혹 보유하고 있으나 그 가치를 모른다.',
    '진중립', ['희귀 부품', '마나 기계 지식', '잡동사니'],
    '예상치 못한 핵심 부품 또는 설계도',
    _emotionSet('rummaging focus, everything has potential', 'delighted: found something useful in the pile', 'grumpy when undersold', 'doesn\'t know what he has sometimes — best of both worlds')),

  npc(121, '이나 트레이드', '오루나-아르카나 무역상', 38, '여성', '에테르 해',
    'intercontinental trader, carefully neutral clothing for both cultures, dark hair in practical travel style, ledger of two sets of records',
    ['중립유지', '위험한위치', '정보'],
    '두 대륙 사이 유일한 민간 무역로 운영. 양쪽 첩보를 취급하며 양쪽에 위험하다.',
    '진중립', ['대륙간 무역', '이중 정보', '항법'],
    '두 대륙 연결과 대륙간 정보',
    _emotionSet('careful neutral trader persona for both sides', 'genuine relief in neutral open sea', 'cold assessment when balance threatened', 'exhaustion of living between two worlds')),

  // ── 기타 생활 서비스 122~125
  npc(122, '안나 포지', '발타르 시티 대장장이', 28, '여성', '발타르 시티',
    'blacksmith, strong arms with forge burns, hair tied back with leather strip, soot-smudged face, leather apron, hammer never far',
    ['자부심', '장인정신', '스승향수'],
    '볼트 해머(65번)의 제자. 왕국 최고 무기 수리공이며 스승의 실종을 알고 있다.',
    '질서-선', ['무기 제조·수리', '마나 주입 단조', '드워프 기술'],
    '무기 수리와 드워프 기술 실마리',
    _emotionSet('forge-focus professional intensity', 'proud satisfaction in good weapon work', 'firm: cheap work gets cheap result', 'worried about missing master')),

  npc(123, '마사 힐', '떠돌이 치료사', 51, '여성', '에테르 해 전역',
    'wandering healer, gentle weathered face, herb-scented clothes, medical pack larger than herself, appears at battlefields before the fighting ends',
    ['공감', '중립', '신비'],
    '마나 없이도 약초로 치료. 전장 어디에나 나타나는 것이 수상하다.',
    '진중립', ['약초 치료', '전장 의료', '생명 감지 (약간)'],
    '플레이어의 회복 거점이자 신비로운 정보원',
    _emotionSet('calm healing presence', 'grateful relief when patient recovers', 'quiet refusal to treat those who cause suffering', 'old grief: has seen too many who didn\'t make it')),

  npc(124, '오토 스테이블', '왕도 마구간 & 운송 관리인', 43, '남성', '발타르 시티',
    'stablemaster, stocky practical build, horse-smell permanent, worn work clothes, knows every back road out of the city',
    ['실용', '비밀', '도망루트'],
    '도시 내 모든 이동 수단을 알선. 특히 도망 루트 전문으로 숙박비보다 비싸다.',
    '진중립', ['이동 수단 알선', '도망 루트', '마구간 네트워크'],
    '도주와 은밀한 이동의 필수 거점',
    _emotionSet('calm practical animal-handler energy', 'satisfied: horse and rider matched well', 'firm when people mistreat animals', 'quiet: animals are simpler than people')),

  npc(125, '기나 세일', '에테르 해 여객선 선장', 36, '여성', '에테르 해',
    'passenger ship captain, sun-bronzed capable face, sea-wind hair, captain\'s coat clean despite sea spray, steady hands on any helm',
    ['책임감', '중립', '용기'],
    '대륙 간 정기 여객선 운영. 안전하게 어디든 데려다 주지만, 가장 위험한 항로도 안다.',
    '질서-중립', ['항법', '여객 운항', '위험 항로 지식'],
    '대륙 이동의 가장 안전하고 공식적인 방법',
    _emotionSet('confident steady sea captain bearing', 'warm: all passengers delivered safe', 'storm-calm authority when danger comes', 'quiet pride: never lost a passenger')),
]

// ================================================================
// 전체 NPC 배열 내보내기
// ================================================================
export const AETERNOVA_NPCS: NPC[] = [
  ...GROUP_ROYALTY,
  ...GROUP_MAGES,
  ...GROUP_WARRIORS,
  ...GROUP_SHADOWS,
  ...GROUP_ENGINEERS,
  ...GROUP_CLERGY,
  ...GROUP_COMMONS,
  ...GROUP_UNKNOWN,
  ...GROUP_RECURRING,
]

// 그룹별 접근용
export const NPC_GROUPS = {
  royalty: GROUP_ROYALTY,    // 1~20
  mages: GROUP_MAGES,      // 21~35
  warriors: GROUP_WARRIORS,   // 36~50
  shadows: GROUP_SHADOWS,    // 51~62
  engineers: GROUP_ENGINEERS,  // 63~72
  clergy: GROUP_CLERGY,     // 73~81
  commons: GROUP_COMMONS,    // 82~90
  unknown: GROUP_UNKNOWN,    // 91~100
  recurring: GROUP_RECURRING,  // 101~125
}

// ID로 빠른 접근용 Map
export const NPC_MAP: Map<string, NPC> = new Map(
  AETERNOVA_NPCS.map(n => [n.id, n])
)

// 위치별 NPC 빠른 조회
export const NPC_BY_LOCATION: Record<string, NPC[]> = AETERNOVA_NPCS.reduce(
  (acc, npc) => {
    const loc = npc.nationality
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(npc)
    return acc
  },
  {} as Record<string, NPC[]>
)
