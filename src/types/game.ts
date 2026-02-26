// =============================================
// Core Game Data Types (shared by client/server)
// =============================================

export type GamePhase =
  | 'start'
  | 'generating'
  | 'worldmap'
  | 'narrative'
  | 'character_creation'
  | 'game'

// ---------- World ----------
export interface Continent {
  id: string
  name: string
  description: string
  climate: string
  majorKingdoms: string[]
}

export interface Island {
  id: string
  name: string
  description: string
}

export interface City {
  id: string
  name: string
  continent: string
  description: string
  population: string
}

export interface WorldData {
  name: string
  lore: string
  continents: Continent[]
  islands: Island[]
  majorCities: City[]
  mapImageUrl?: string
}

// ---------- NPCs ----------
export type Alignment =
  | '선(善)'
  | '중립(中立)'
  | '악(惡)'
  | '질서-선'
  | '질서-중립'
  | '질서-악'
  | '중립-선'
  | '진중립'
  | '중립-악'
  | '혼돈-선'
  | '혼돈-중립'
  | '혼돈-악'

export interface EmotionPortrait {
  emotion: string       // e.g., "neutral", "happy", "angry", "sad", "surprised"
  description: string  // description for image generation
  imageUrl?: string
}

export interface NPC {
  id: string
  name: string
  title: string
  age: number
  gender: string
  nationality: string
  appearance: string         // Used for image generation
  personality: string[]
  background: string
  alignment: Alignment
  skills: string[]
  portraitUrl?: string       // Full-body portrait
  emotions: EmotionPortrait[]
  relationshipToPlayer: string
}

// ---------- Player Character ----------
export type CharacterClass =
  | '전사'
  | '마법사'
  | '도적'
  | '성직자'
  | '사냥꾼'
  | '연금술사'
  | '음유시인'
  | '팔라딘'

export interface CharacterStats {
  hp: number
  maxHp: number
  mana: number
  maxMana: number
  level: number
  experience: number
  gold: number
  strength: number
  dexterity: number
  intelligence: number
  charisma: number
  wisdom: number
  constitution: number
}

export interface PlayerCharacter {
  name: string
  age: number
  gender: string
  characterClass: CharacterClass
  background: string
  backstory: string
  stats: CharacterStats
}

// ---------- Background Options ----------
export interface BackgroundOption {
  title: string
  description: string
}

// ---------- Quests ----------
export interface Quest {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'failed'
  objectives: string[]
}

// ---------- Game Session ----------
export interface SceneData {
  description: string
  imageUrl?: string
  currentLocation: string
  npcsPresent: string[]
}

export type MessageRole = 'narrator' | 'npc' | 'player' | 'system'

export interface GameMessage {
  id: string
  role: MessageRole
  content: string
  summary?: string       // Compact summary for use as history context (invisible to user)
  npcId?: string
  npcName?: string
  npcEmotion?: string
  timestamp: number
  sceneImageUrl?: string
  sceneImagePending?: boolean  // true while server is generating the image async
  suggestedActions?: string[]  // AI-suggested player actions for this turn
}

export interface GameSession {
  id: string
  character: PlayerCharacter
  messages: GameMessage[]
  currentLocation: string
  currentScene?: SceneData
  quests: Quest[]
  createdAt: number
  updatedAt: number
}

// ---------- API Request/Response Types ----------
export interface InitGameResponse {
  success: boolean
  worldName: string
  npcCount: number
  narrative: string
  mapImageUrl?: string
}

export interface CreateCharacterRequest {
  name: string
  age: number
  gender: string
  characterClass: CharacterClass
  backstory: string
}

export interface GameActionRequest {
  sessionId: string
  input: string
}

export interface GameActionResponse {
  narration: string
  sceneImageUrl?: string
  currentLocation: string
  npcSpeaking?: {
    id: string
    name: string
    title: string
    emotion: string
    portraitUrl?: string
  }
  availableNpcs: string[]
  gameOver: boolean
}

// ---------- Stat Changes from AI ----------
export interface StatChanges {
  hp_change: number       // negative = damage, positive = healing (0 if none)
  mana_change: number     // negative = mana used, positive = restored (0 if none)
  gold_change: number     // negative = spent, positive = earned (0 if none)
  experience_gain: number // XP gained this turn (0 if none)
}

// ---------- Claude Internal Response ----------
export interface ClaudeGameResponse {
  narration: string
  summary: string            // 1-2 sentence compact summary for history compression
  scene_description: string  // English, for image generation
  scene_tag: string          // Short normalized tag e.g. "tavern_night", "forest_day" for cache lookup
  reuse_scene_image: boolean // true = scene unchanged, skip image generation
  current_location: string
  npc_speaking: string | null
  npc_emotion: string | null
  available_npcs: string[]
  game_over: boolean
  new_npc?: NPC  // Dynamically created NPC (when Claude introduces a new character)
  suggested_actions: string[]  // 3 context-aware action suggestions for the player
  stat_changes: StatChanges    // Gameplay stat changes for this turn
  quest_updates?: Array<{      // Optional: quest status changes or new quests
    id: string                 // existing quest id, or "new" for a new quest
    title?: string
    description?: string
    status?: 'active' | 'completed' | 'failed'
    objectives?: string[]
  }>
}
