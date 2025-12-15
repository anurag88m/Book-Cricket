export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  TRANSITION = 'TRANSITION', // For switching players in 2P
  GAME_OVER = 'GAME_OVER'
}

export enum GameMode {
  ONE_PLAYER = 'ONE_PLAYER',
  TWO_PLAYER = 'TWO_PLAYER'
}

export enum MatchType {
  QUICK = 'QUICK',
  LONG = 'LONG'
}

export interface PlayerStats {
  name: string;
  score: number;
  ballsBowled: number;
  wicketsLost: number;
  isOut: boolean; // Means "All Out" or "Turn Completed"
  history: number[]; // Store individual ball scores for a chart/list
}

export interface TurnResult {
  pageNumber: number;
  lastDigit: number;
  scoreAdded: number;
  ballsAdded: number; // 0 or 1
  message: string;
  type: 'RUNS' | 'DOT' | 'WIDE' | 'NOBALL' | 'OUT' | 'SAVED';
}

export interface GameSettings {
  p1Name: string;
  p2Name: string; // Optional if 1P
  overs: number;
  mode: GameMode;
  totalWickets: number; // 1 for Quick, 10 for Long
}

export interface ScoreHistoryItem {
  name: string;
  score: number;
  date: string;
}