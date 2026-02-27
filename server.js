const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const client = new Anthropic();

function normalizeEnum(value, allowed, fallback) {
  if (typeof value !== 'string') return fallback;
  const v = value.trim().toLowerCase();
  return allowed.includes(v) ? v : fallback;
}

function normalizeScene(scene) {
  const defaults = {
    location: '이름 없는 장소',
    locationType: 'field',
    timeOfDay: 'morning',
    weather: 'clear',
    mood: 'mysterious'
  };

  if (!scene || typeof scene !== 'object') return defaults;

  let location = typeof scene.location === 'string' ? scene.location.trim() : defaults.location;
  let locationType = typeof scene.locationType === 'string' ? scene.locationType.trim().toLowerCase() : '';
  let timeOfDay = typeof scene.timeOfDay === 'string' ? scene.timeOfDay.trim().toLowerCase() : '';
  let weather = typeof scene.weather === 'string' ? scene.weather.trim().toLowerCase() : '';
  let mood = typeof scene.mood === 'string' ? scene.mood.trim().toLowerCase() : '';

  // Guard against malformed LLM output like "afternoon, clear, Bernhardt Guild Hall"
  // ending up in a single field.
  const merged = [location, locationType, timeOfDay, weather, mood].join(',');
  const parts = merged.split(',').map(p => p.trim()).filter(Boolean);

  if (!timeOfDay) {
    const found = parts.find(p => ['dawn','morning','afternoon','evening','night'].includes(p.toLowerCase()));
    if (found) timeOfDay = found.toLowerCase();
  }
  if (!weather) {
    const found = parts.find(p => ['clear','cloudy','rain','snow','storm','fog'].includes(p.toLowerCase()));
    if (found) weather = found.toLowerCase();
  }
  if (!locationType) {
    const found = parts.find(p => ['forest','castle','town','dungeon','field','mountain','port','temple','cave','road'].includes(p.toLowerCase()));
    if (found) locationType = found.toLowerCase();
  }
  if (!mood) {
    const found = parts.find(p => ['peaceful','tense','mysterious','battle','romantic','sad','joyful','dark'].includes(p.toLowerCase()));
    if (found) mood = found.toLowerCase();
  }

  // If location looks like a CSV of scene props, keep only a readable place text.
  if (location.includes(',')) {
    const candidates = location
      .split(',')
      .map(p => p.trim())
      .filter(p => p && !['dawn','morning','afternoon','evening','night','clear','cloudy','rain','snow','storm','fog','forest','castle','town','dungeon','field','mountain','port','temple','cave','road','peaceful','tense','mysterious','battle','romantic','sad','joyful','dark'].includes(p.toLowerCase()));
    if (candidates.length > 0) location = candidates[candidates.length - 1];
  }

  return {
    location: location || defaults.location,
    locationType: normalizeEnum(locationType, ['forest','castle','town','dungeon','field','mountain','port','temple','cave','road'], defaults.locationType),
    timeOfDay: normalizeEnum(timeOfDay, ['dawn','morning','afternoon','evening','night'], defaults.timeOfDay),
    weather: normalizeEnum(weather, ['clear','cloudy','rain','snow','storm','fog'], defaults.weather),
    mood: normalizeEnum(mood, ['peaceful','tense','mysterious','battle','romantic','sad','joyful','dark'], defaults.mood)
  };
}

// In-memory game state per session (simple approach)
const gameSessions = new Map();

function getSession(sessionId) {
  if (!gameSessions.has(sessionId)) {
    gameSessions.set(sessionId, {
      world: null,
      npcs: [],
      story: null,
      player: null,
      messages: [],
      emotions: {},
      sceneHistory: []
    });
  }
  return gameSessions.get(sessionId);
}

// Generate world data: map locations, NPCs, main story
app.post('/api/init-world', async (req, res) => {
  const { sessionId } = req.body;
  const session = getSession(sessionId);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `당신은 판타지 세계관 설계자입니다. 다음을 JSON 형식으로 생성해주세요.

1. 세계 맵 정보:
- 메인 대륙 1~2개 (이름, 특징, 대략적 위치 비율 0~1)
- 섬 2~4개 (이름, 특징, 위치 비율)
- 주요 지역/도시 8~12개 (이름, 유형[수도/도시/마을/항구/요새/던전/숲/산], 소속 대륙/섬, 위치 비율 x/y, 짧은 설명)

2. 주요 NPC 20명:
각 NPC는 다음 정보를 포함:
- id (1~20)
- name (한국어 판타지 이름)
- title (왕, 공작, 황제, 기사단장, 대마법사, 상인길드장, 도적왕, 현자, 사제, 용사 등 다양하게)
- age (나이)
- gender (성별)
- personality (성격 특성 2~3개)
- appearance (외모 특징: 머리색, 눈색, 체형, 특이사항)
- hairColor (hex 색상코드)
- eyeColor (hex 색상코드)
- faction (소속 세력/국가)
- location (현재 위치 - 위의 지역 중 하나)
- description (2~3문장 배경 설명)
- relationship (다른 NPC와의 관계 1~2개)

3. 메인 스토리라인 (4문단, 각 2~3문장):
- 세계의 현재 상황과 위기
- 과거에 일어난 중요한 사건
- 현재 진행 중인 갈등
- 앞으로 펼쳐질 운명

정확히 아래 JSON 구조를 따라주세요:
{
  "world": {
    "name": "세계 이름",
    "era": "시대명",
    "continents": [{"name":"","description":"","x":0.3,"y":0.4,"width":0.4,"height":0.5}],
    "islands": [{"name":"","description":"","x":0.1,"y":0.2,"size":0.08}],
    "locations": [{"name":"","type":"","continent":"","x":0.5,"y":0.5,"description":""}]
  },
  "npcs": [...],
  "story": {
    "paragraphs": ["문단1", "문단2", "문단3", "문단4"],
    "worldDescription": "나레이션용 세계관 설명 (3~4문장)"
  }
}`
      }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              world: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  era: { type: 'string' },
                  continents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        width: { type: 'number' },
                        height: { type: 'number' }
                      },
                      required: ['name', 'description', 'x', 'y', 'width', 'height'],
                      additionalProperties: false
                    }
                  },
                  islands: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        size: { type: 'number' }
                      },
                      required: ['name', 'description', 'x', 'y', 'size'],
                      additionalProperties: false
                    }
                  },
                  locations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        continent: { type: 'string' },
                        x: { type: 'number' },
                        y: { type: 'number' },
                        description: { type: 'string' }
                      },
                      required: ['name', 'type', 'continent', 'x', 'y', 'description'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['name', 'era', 'continents', 'islands', 'locations'],
                additionalProperties: false
              },
              npcs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    title: { type: 'string' },
                    age: { type: 'integer' },
                    gender: { type: 'string' },
                    personality: { type: 'array', items: { type: 'string' } },
                    appearance: { type: 'string' },
                    hairColor: { type: 'string' },
                    eyeColor: { type: 'string' },
                    faction: { type: 'string' },
                    location: { type: 'string' },
                    description: { type: 'string' },
                    relationship: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['id', 'name', 'title', 'age', 'gender', 'personality', 'appearance', 'hairColor', 'eyeColor', 'faction', 'location', 'description', 'relationship'],
                  additionalProperties: false
                }
              },
              story: {
                type: 'object',
                properties: {
                  paragraphs: { type: 'array', items: { type: 'string' } },
                  worldDescription: { type: 'string' }
                },
                required: ['paragraphs', 'worldDescription'],
                additionalProperties: false
              }
            },
            required: ['world', 'npcs', 'story'],
            additionalProperties: false
          }
        }
      }
    });

    const worldData = JSON.parse(response.content[0].text);
    session.world = worldData.world;
    session.npcs = worldData.npcs;
    session.story = worldData.story;

    res.json({ success: true, data: worldData });
  } catch (error) {
    console.error('World generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate character backgrounds based on chosen class
app.post('/api/generate-backgrounds', async (req, res) => {
  const { sessionId, className } = req.body;
  const session = getSession(sessionId);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `판타지 세계 "${session.world?.name || '아르카디아'}"에서 "${className}" 직업을 가진 주인공의 배경 스토리 3개를 생성해주세요.
각 배경은 3~4문장으로, 서로 다른 분위기(비극적/영웅적/신비로운)로 작성해주세요.

JSON 형식:
{
  "backgrounds": [
    {"id": 1, "title": "배경 제목", "description": "배경 설명 3~4문장", "tone": "비극적"},
    {"id": 2, "title": "배경 제목", "description": "배경 설명 3~4문장", "tone": "영웅적"},
    {"id": 3, "title": "배경 제목", "description": "배경 설명 3~4문장", "tone": "신비로운"}
  ]
}`
      }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              backgrounds: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    tone: { type: 'string' }
                  },
                  required: ['id', 'title', 'description', 'tone'],
                  additionalProperties: false
                }
              }
            },
            required: ['backgrounds'],
            additionalProperties: false
          }
        }
      }
    });

    const data = JSON.parse(response.content[0].text);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Background generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main game interaction - streaming
app.post('/api/play', async (req, res) => {
  const { sessionId, userInput, isFirstTurn } = req.body;
  const session = getSession(sessionId);

  const worldContext = session.world ? `
세계: ${session.world.name} (${session.world.era})
지역들: ${session.world.locations.map(l => `${l.name}(${l.type})`).join(', ')}
` : '';

  const npcContext = session.npcs.length > 0 ? `
주요 NPC들:
${session.npcs.map(n => `- ${n.name} (${n.title}): ${n.personality.join(', ')}. 현재 위치: ${n.location}`).join('\n')}
` : '';

  const playerContext = session.player ? `
주인공: ${session.player.name} (${session.player.gender}, ${session.player.age}세, ${session.player.class})
배경: ${session.player.background}
` : '';

  const emotionContext = Object.keys(session.emotions).length > 0 ? `
저장된 감정 표현 참고: ${JSON.stringify(session.emotions)}
` : '';

  const systemPrompt = `당신은 판타지 TRPG 게임의 게임 마스터(GM)입니다. 일본 라이트노벨/웹소설 스타일로 이야기를 진행합니다.

${worldContext}
${npcContext}
${playerContext}
${emotionContext}

## 규칙:
1. 유저의 행동/대사에 반응하여 이야기를 진행합니다.
2. NPC의 대사는 「」로 감싸주세요.
3. 서술은 웹소설처럼 생동감 있게 작성합니다.
4. 매 턴마다 4~6문단의 이야기를 작성합니다.
5. NPC가 등장하면 해당 NPC의 성격과 특징에 맞게 행동합니다.

반드시 아래 JSON 형식으로 응답하세요:
{
  "narrative": "이야기 텍스트 (4~6문단, 줄바꿈은 \\n으로)",
  "scene": {
    "location": "현재 장소명",
    "locationType": "forest|castle|town|dungeon|field|mountain|port|temple|cave|road",
    "timeOfDay": "dawn|morning|afternoon|evening|night",
    "weather": "clear|cloudy|rain|snow|storm|fog",
    "mood": "peaceful|tense|mysterious|battle|romantic|sad|joyful|dark"
  },
  "presentNpcs": [NPC의 id 번호들],
  "emotion": {
    "primary": "현재 장면의 주요 감정",
    "intensity": 0.8,
    "colors": ["#hex1", "#hex2"]
  },
  "choices": ["선택지1 (있을 경우)", "선택지2", "선택지3"]
}`;

  // Build conversation messages
  if (isFirstTurn) {
    session.messages = [];
  }

  session.messages.push({ role: 'user', content: userInput });

  // Keep conversation history manageable (last 20 turns)
  const recentMessages = session.messages.slice(-40);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: systemPrompt,
      messages: recentMessages,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              narrative: { type: 'string' },
              scene: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                  locationType: { type: 'string' },
                  timeOfDay: { type: 'string' },
                  weather: { type: 'string' },
                  mood: { type: 'string' }
                },
                required: ['location', 'locationType', 'timeOfDay', 'weather', 'mood'],
                additionalProperties: false
              },
              presentNpcs: { type: 'array', items: { type: 'integer' } },
              emotion: {
                type: 'object',
                properties: {
                  primary: { type: 'string' },
                  intensity: { type: 'number' },
                  colors: { type: 'array', items: { type: 'string' } }
                },
                required: ['primary', 'intensity', 'colors'],
                additionalProperties: false
              },
              choices: { type: 'array', items: { type: 'string' } }
            },
            required: ['narrative', 'scene', 'presentNpcs', 'emotion', 'choices'],
            additionalProperties: false
          }
        }
      }
    });

    const gameData = JSON.parse(response.content[0].text);
    gameData.scene = normalizeScene(gameData.scene);

    // Save emotion for reuse
    const emotionKey = gameData.emotion.primary;
    session.emotions[emotionKey] = gameData.emotion;

    // Save assistant response to conversation
    session.messages.push({ role: 'assistant', content: response.content[0].text });

    // Get present NPC data
    const presentNpcData = gameData.presentNpcs
      .map(id => session.npcs.find(n => n.id === id))
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        ...gameData,
        presentNpcData
      }
    });
  } catch (error) {
    console.error('Play error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save player character data
app.post('/api/save-player', async (req, res) => {
  const { sessionId, player } = req.body;
  const session = getSession(sessionId);
  session.player = player;
  res.json({ success: true });
});

// Get session data
app.get('/api/session/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  res.json({
    hasWorld: !!session.world,
    hasPlayer: !!session.player,
    world: session.world,
    npcs: session.npcs,
    story: session.story,
    player: session.player
  });
});

app.listen(PORT, () => {
  console.log(`Fantasy AI TRPG server running on http://localhost:${PORT}`);
});
