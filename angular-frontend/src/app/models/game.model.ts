export type GameMode = 'TwoPlayer' | 'Computer';
export type GameStatus = 'InProgress' | 'Won' | 'Draw';

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
  gameStatus: string;
  winner: string | null;
  winningCells: number[] | null;
  moveHistory: Move[];
  scoreboard: ScoreboardResponse;
}

export interface CreateGameRequest {
  mode: number; // 0 = TwoPlayer, 1 = Computer
}

export interface MakeMoveRequest {
  player: string;
  cellIndex: number;
}
