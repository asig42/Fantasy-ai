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
  npcId?: string
  npcName?: string
  npcEmotion?: string
  timestamp: number
  sceneImageUrl?: string
}

export interface GameSession {
  id: string
  character: PlayerCharacter
  messages: GameMessage[]
  currentLocation: string
  currentScene?: SceneData
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

// ---------- Claude Internal Response ----------
export interface ClaudeGameResponse {
  narration: string
  scene_description: string  // English, for image generation
  scene_tag: string          // Short normalized tag e.g. "tavern_night", "forest_day" for cache lookup
  reuse_scene_image: boolean // true = scene unchanged, skip image generation
  current_location: string
  npc_speaking: string | null
  npc_emotion: string | null
  available_npcs: string[]
  game_over: boolean
  new_npc?: NPC  // Dynamically created NPC (when Claude introduces a new character)
}
