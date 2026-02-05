
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

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
}
