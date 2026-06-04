export type GameMode = 'TwoPlayer' | 'Computer';
export type GameStatus = 'InProgress' | 'Won' | 'Draw';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Move {
  moveNumber: number;
  player: string;
  cellIndex: number;
  row: number;
  column: number;
  positionDescription: string;
  timestamp: string;
}

export interface ScoreboardResponse {
  winsX: number;
  winsO: number;
  draws: number;
}

export interface GameStateResponse {
  gameId: string;
  board: string[];
  currentPlayer: string;
  gameMode: string;
  difficulty: string;
  gameStatus: string;
  winner: string | null;
  winningCells: number[] | null;
  moveHistory: Move[];
  scoreboard: ScoreboardResponse;
}

export interface CreateGameRequest {
  mode: number; // 0 = TwoPlayer, 1 = Computer
  difficulty?: number; // 0 = Easy, 1 = Medium, 2 = Hard
}

export interface MakeMoveRequest {
  player: string;
  cellIndex: number;
}
