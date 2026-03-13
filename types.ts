
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Bird {
  y: number;
  velocity: number;
  rotation: number;
  width: number;
  height: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

export interface Coin {
  x: number;
  y: number;
  collected: boolean;
  isSuper?: boolean;
}

export interface UserSettings {
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  effectsEnabled: boolean;
}

export interface Character {
  id: string;
  name: string;
  src: string;
  color: string;
  unlocked: boolean;
  price: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  coins: number;
  superCoins: number;
  currentLevel: number;
  unlockedLevels: number;
  characterLevel: number;
  selectedCharacterId: string;
  hasPermit: boolean;
  foodPrepared: boolean;
  settings: UserSettings;
}
