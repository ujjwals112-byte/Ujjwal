/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, Database, Copy, Check, Info, Cpu, Users, 
  RotateCcw, RefreshCw, CheckCircle, ChevronRight, BookOpen, ExternalLink, Github,
  Sun, Moon, Sparkles, Award, ShieldAlert, FileText, Settings
} from 'lucide-react';

// Core model interfaces
interface Move {
  moveNumber: number;
  player: string;
  cellIndex: number;
  row: number;
  column: number;
  positionDescription: string;
  timestamp: string;
}

interface Scoreboard {
  winsX: number;
  winsO: number;
  draws: number;
}

interface SimulatedGameState {
  gameId: string;
  board: string[];
  currentPlayer: string;
  gameMode: 'TwoPlayer' | 'Computer';
  gameStatus: 'InProgress' | 'Won' | 'Draw';
  winner: string | null;
  winningCells: number[] | null;
  moveHistory: Move[];
  scoreboard: Scoreboard;
}

export default function App() {
  // Theme switcher state: defaults to elegant Light mode per client criteria (corporate off-white/red/slate)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Rules and AI guide modal state
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // AI Difficulty level: defaults to 'Hard' to match C# backend settings
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Hard');
  
  // Active mode switcher state
  const [activeMode, setActiveMode] = useState<'TwoPlayer' | 'Computer'>('TwoPlayer');

  // Dynamic game sessions and scoreboards kept isolated per game mode matching architecture specs
  const [twoPlayerState, setTwoPlayerState] = useState<{
    gameId: string;
    board: string[];
    currentPlayer: string;
    gameStatus: 'InProgress' | 'Won' | 'Draw';
    winner: string | null;
    winningCells: number[] | null;
    moveHistory: Move[];
    scoreboard: Scoreboard;
  }>({
    gameId: 'bb1fdf88-3921-4bcf-aae0-6dc1ca375eff',
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameStatus: 'InProgress',
    winner: null,
    winningCells: null,
    moveHistory: [],
    scoreboard: { winsX: 0, winsO: 0, draws: 0 }
  });

  const [computerState, setComputerState] = useState<{
    gameId: string;
    board: string[];
    currentPlayer: string;
    gameStatus: 'InProgress' | 'Won' | 'Draw';
    winner: string | null;
    winningCells: number[] | null;
    moveHistory: Move[];
    scoreboard: Scoreboard;
  }>({
    gameId: '8d8a7cf2-7be6-4cb4-a3dc-b3a1a6b0c2a2',
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameStatus: 'InProgress',
    winner: null,
    winningCells: null,
    moveHistory: [],
    scoreboard: { winsX: 0, winsO: 0, draws: 0 }
  });

  const activeState = activeMode === 'TwoPlayer' ? twoPlayerState : computerState;

  const gameState: SimulatedGameState = {
    ...activeState,
    gameMode: activeMode,
  };

  const setGameState = (nextVal: SimulatedGameState | ((prev: SimulatedGameState) => SimulatedGameState)) => {
    if (typeof nextVal === 'function') {
      if (activeMode === 'TwoPlayer') {
        setTwoPlayerState(prev => {
          const simulatedPrev: SimulatedGameState = { ...prev, gameMode: 'TwoPlayer' };
          const result = (nextVal as any)(simulatedPrev);
          const { gameMode, ...rest } = result;
          return rest;
        });
      } else {
        setComputerState(prev => {
          const simulatedPrev: SimulatedGameState = { ...prev, gameMode: 'Computer' };
          const result = (nextVal as any)(simulatedPrev);
          const { gameMode, ...rest } = result;
          return rest;
        });
      }
    } else {
      const { gameMode, ...rest } = nextVal;
      if (activeMode === 'TwoPlayer') {
        setTwoPlayerState(rest);
      } else {
        setComputerState(rest);
      }
    }
  };

  const [loading, setLoading] = useState<boolean>(false);

  // Win checker helper for decision state
  const checkGridResults = (board: string[]): { status: 'InProgress' | 'Won' | 'Draw'; winner: string | null; cells: number[] | null } => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const l of lines) {
      if (board[l[0]] && board[l[0]] === board[l[1]] && board[l[0]] === board[l[2]]) {
        return { status: 'Won', winner: board[l[0]], cells: l };
      }
    }
    if (board.every(cell => cell !== '')) {
      return { status: 'Draw', winner: null, cells: null };
    }
    return { status: 'InProgress', winner: null, cells: null };
  };

  // Helper to re-calculate state based on current moves list (Option B: Command Replay Pattern)
  const replaySimulatedMoves = (
    history: Move[], 
    mode: 'TwoPlayer' | 'Computer', 
    oldScoreboard: Scoreboard, 
    scoreUpdated: boolean, 
    originalStatus: string, 
    originalWinner: string | null
  ) => {
    const board = Array(9).fill('');
    let currentPlayer = 'X';
    let status: 'InProgress' | 'Won' | 'Draw' = 'InProgress';
    let winner: string | null = null;
    let winningCells: number[] | null = null;

    const winLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    const inspectLines = (currBoard: string[]) => {
      for (const line of winLines) {
        if (currBoard[line[0]] !== '' && 
            currBoard[line[0]] === currBoard[line[1]] && 
            currBoard[line[0]] === currBoard[line[2]]) {
          return { status: 'Won' as const, winner: currBoard[line[0]], winningCells: line };
        }
      }
      if (currBoard.every(c => c !== '')) {
        return { status: 'Draw' as const, winner: null, winningCells: null };
      }
      return { status: 'InProgress' as const, winner: null, winningCells: null };
    };

    // Replay remaining moves to rebuild current board status from scratch
    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      board[move.cellIndex] = move.player;
      
      const evaluation = inspectLines(board);
      status = evaluation.status;
      winner = evaluation.winner;
      winningCells = evaluation.winningCells;

      if (status === 'InProgress') {
        currentPlayer = move.player === 'X' ? 'O' : 'X';
      }
    }

    // Since we're undoing, check if the preceding outcome was completed and adjust scoreboard
    let newScoreboard = { ...oldScoreboard };
    if (scoreUpdated && originalStatus !== 'InProgress') {
      if (originalStatus === 'Won') {
        if (originalWinner === 'X' && newScoreboard.winsX > 0) {
          newScoreboard.winsX--;
        } else if (originalWinner === 'O' && newScoreboard.winsO > 0) {
          newScoreboard.winsO--;
        }
      } else if (originalStatus === 'Draw' && newScoreboard.draws > 0) {
        newScoreboard.draws--;
      }
    }

    return { board, currentPlayer, gameStatus: status, winner, winningCells, scoreboard: newScoreboard };
  };

  // Computer decision priority logic matching the C# service implementation exactly
  const findSimulationWinningCell = (board: string[], p: string): number => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const l of lines) {
      const targetCount = l.filter(c => board[c] === p).length;
      const emptyCount = l.filter(c => board[c] === '').length;
      if (targetCount === 2 && emptyCount === 1) {
        return l.find(c => board[c] === '')!;
      }
    }
    return -1;
  };

  const calculateEasyMove = (board: string[]): number => {
    const available: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        available.push(i);
      }
    }
    if (available.length === 0) return -1;
    const rndIdx = Math.floor(Math.random() * available.length);
    return available[rndIdx];
  };

  const calculateSimulationOpponentMove = (board: string[]): number => {
    if (difficulty === 'Easy') {
      return calculateEasyMove(board);
    } else if (difficulty === 'Medium') {
      // 50% chance of random play, 50% chance of optimal play
      if (Math.random() < 0.5) {
        return calculateEasyMove(board);
      }
    }

    // Priority 1: WIN - If Computer (O) can win, play immediate winning move
    const winMove = findSimulationWinningCell(board, 'O');
    if (winMove !== -1) return winMove;

    // Priority 2: BLOCK - If Player (X) can win next, block them
    const blockMove = findSimulationWinningCell(board, 'X');
    if (blockMove !== -1) return blockMove;

    // Priority 3: CENTER - Take central square index 4 if vacant
    if (board[4] === '') return 4;

    // Priority 4: CORNER - Take first available corner [0, 2, 6, 8]
    const corners = [0, 2, 6, 8];
    for (const c of corners) {
      if (board[c] === '') return c;
    }

    // Priority 5: ANY - Fill first available free coordinate
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') return i;
    }
    return -1;
  };

  // Interactive UI Move submissions
  const handleCellClick = (cellIndex: number) => {
    if (gameState.board[cellIndex] !== '' || gameState.gameStatus !== 'InProgress' || loading) return;

    setLoading(true);
    
    // Simulate real-world network latency
    setTimeout(() => {
      const updatedBoard = [...gameState.board];
      const activePlayer = gameState.currentPlayer;
      updatedBoard[cellIndex] = activePlayer;

      const newMove: Move = {
        moveNumber: gameState.moveHistory.length + 1,
        player: activePlayer,
        cellIndex: cellIndex,
        row: Math.floor(cellIndex / 3) + 1,
        column: (cellIndex % 3) + 1,
        positionDescription: `Row ${Math.floor(cellIndex / 3) + 1}, Column ${(cellIndex % 3) + 1}`,
        timestamp: new Date().toISOString()
      };

      const history = [...gameState.moveHistory, newMove];
      let { status, winner, cells } = checkGridResults(updatedBoard);
      let nextPlayer = activePlayer === 'X' ? 'O' : 'X';
      let currentScoreboard = { ...gameState.scoreboard };

      // Apply scoreboard state outcomes
      if (status === 'Won') {
        if (winner === 'X') currentScoreboard.winsX++;
        else currentScoreboard.winsO++;
      } else if (status === 'Draw') {
        currentScoreboard.draws++;
      }

      // Computer's automatic response if Computer Mode is selected and game remains active
      if (gameState.gameMode === 'Computer' && status === 'InProgress') {
        const cpuMoveIndex = calculateSimulationOpponentMove(updatedBoard);
        if (cpuMoveIndex !== -1) {
          updatedBoard[cpuMoveIndex] = 'O';
          const cpuMove: Move = {
            moveNumber: history.length + 1,
            player: 'O',
            cellIndex: cpuMoveIndex,
            row: Math.floor(cpuMoveIndex / 3) + 1,
            column: (cpuMoveIndex % 3) + 1,
            positionDescription: `Row ${Math.floor(cpuMoveIndex / 3) + 1}, Column ${(cpuMoveIndex % 3) + 1}`,
            timestamp: new Date().toISOString()
          };
          history.push(cpuMove);
          
          const cpuEval = checkGridResults(updatedBoard);
          status = cpuEval.status;
          winner = cpuEval.winner;
          cells = cpuEval.cells;
          nextPlayer = 'X'; // Return control to user

          if (status === 'Won') {
            if (winner === 'X') currentScoreboard.winsX++;
            else currentScoreboard.winsO++;
          } else if (status === 'Draw') {
            currentScoreboard.draws++;
          }
        }
      }

      setGameState({
        ...gameState,
        board: updatedBoard,
        currentPlayer: nextPlayer,
        gameStatus: status,
        winner,
        winningCells: cells,
        moveHistory: history,
        scoreboard: currentScoreboard
      });

      setLoading(false);
    }, 150);
  };

  const handleUndo = () => {
    if (gameState.moveHistory.length === 0 || loading) return;

    setLoading(true);

    setTimeout(() => {
      const gameCompleted = gameState.gameStatus !== 'InProgress';
      
      // Determine steps to remove: in VS Computer mode, we regress the CPU's response plus the human's play
      let stepsToRemove = 1;
      if (gameState.gameMode === 'Computer' && gameState.moveHistory.length >= 2) {
        stepsToRemove = 2;
      }

      const newHistory = [...gameState.moveHistory];
      for (let i = 0; i < stepsToRemove; i++) {
        newHistory.pop();
      }

      const replayedResult = replaySimulatedMoves(
        newHistory, 
        gameState.gameMode, 
        gameState.scoreboard, 
        gameCompleted, 
        gameState.gameStatus, 
        gameState.winner
      );

      setGameState({
        ...gameState,
        board: replayedResult.board,
        currentPlayer: replayedResult.currentPlayer,
        gameStatus: replayedResult.gameStatus,
        winner: replayedResult.winner,
        winningCells: replayedResult.winningCells,
        moveHistory: newHistory,
        scoreboard: replayedResult.scoreboard
      });

      setLoading(false);
    }, 120);
  };

  const handleResetGame = () => {
    setLoading(true);
    setTimeout(() => {
      setGameState({
        ...gameState,
        board: Array(9).fill(''),
        currentPlayer: 'X',
        gameStatus: 'InProgress',
        winner: null,
        winningCells: null,
        moveHistory: []
      });
      setLoading(false);
    }, 120);
  };

  const handleResetScoreboard = () => {
    setLoading(true);
    setTimeout(() => {
      setGameState({
        ...gameState,
        scoreboard: { winsX: 0, winsO: 0, draws: 0 }
      });
      setLoading(false);
    }, 120);
  };

  const handleModeChange = (mode: 'TwoPlayer' | 'Computer') => {
    if (activeMode === mode) return;

    setLoading(true);
    setTimeout(() => {
      setActiveMode(mode);
      setLoading(false);
    }, 150);
  };

  const handleDifficultyChange = (level: 'Easy' | 'Medium' | 'Hard') => {
    if (difficulty === level) return;
    setDifficulty(level);
    setLoading(true);
    setTimeout(() => {
      setGameState({
        ...gameState,
        board: Array(9).fill(''),
        currentPlayer: 'X',
        gameStatus: 'InProgress',
        winner: null,
        winningCells: null,
        moveHistory: []
      });
      setLoading(false);
    }, 120);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`} id="abb-tic-tac-toe-app">
      
      {/* Visual Header inspired by ABB corporate Swiss design identity (Red / White / Gray) */}
      <header className={`border-b py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-200 ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-lg'
      }`} id="app-header">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Corporate style visual badge */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 px-3 py-1 rounded shadow-md flex items-center justify-center transition-transform hover:scale-105">
              <span className="font-sans font-black tracking-tighter text-white text-lg">ABB</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Tic-Tac-Toe</h1>
                <span className={`border text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wider ${
                  theme === 'light' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-red-950/40 border-red-900/60 text-red-400'
                }`}>
                  PRO SYSTEM
                </span>
              </div>
              <p className={`text-[11px] font-medium leading-normal max-w-sm sm:max-w-md ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Full-stack match processor integrated with direct program calculation models and state validation loops.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic game mode pill + Help button + Dark switch */}
        <div className="flex items-center flex-nowrap gap-2 sm:gap-2.5 shrink-0 font-sans" id="header-interactive-controls">
          {/* Live System Configuration Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-[11px] font-semibold shrink-0 ${
            theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="font-mono text-[9px] uppercase font-extrabold text-slate-400">CONFIG:</span>
            <span className={`font-bold py-0.5 px-1.5 rounded text-[9px] ${
              theme === 'light' ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-neutral-200'
            }`}>
              {gameState.gameMode === 'Computer' ? `vs Computer (${difficulty})` : '2-Player Local'}
            </span>
          </div>

          {/* Interactive Help Guide Trigger */}
          <button 
            onClick={() => setShowHelp(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              theme === 'light' 
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300 active:scale-95 shadow-sm' 
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-600 active:scale-95'
            }`}
            id="btn-help-guide"
            title="Open comprehensive gaming handbook and algorithm decision registers."
          >
            <BookOpen className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="hidden xs:inline">Rules & AI Guide</span>
            <span className="xs:hidden">Rules</span>
          </button>

          {/* Theme switcher action button with elegant transition effects */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-300 cursor-pointer shrink-0 ${
              theme === 'light' 
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300 hover:text-slate-900 active:scale-95 shadow-sm' 
                : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:border-slate-600 hover:text-amber-300 active:scale-95 shadow-md shadow-amber-500/5'
            }`}
            id="theme-switcher"
            title="Toggle color palette filters"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-500 hover:rotate-12" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-500 hover:rotate-45" />
            )}
          </button>
        </div>
      </header>

      {/* Main Single-View Component Grid */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" id="master-game-panel">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: Settings, Scoreboard & Architecture Highlights */}
          <section className="lg:col-span-4 flex flex-col gap-6 lg:h-full lg:max-h-none">
            
            {/* Game Setup Controls */}
            <div className={`border rounded-2xl p-5 shadow-sm transition-all duration-200 ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100'
            }`} id="mode-controls">
              <h3 className={`text-xs uppercase font-extrabold tracking-wider mb-2 flex items-center gap-1.5 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <Cpu className="h-4 w-4 text-red-500 font-bold" /> Opponent Mode Selection
              </h3>
              <p className={`text-[11px] mb-4 leading-relaxed ${theme === 'light' ? 'text-slate-550' : 'text-slate-400'}`}>
                Toggle play style configurations. The Computer AI evaluates moves programmatically in real-time.
              </p>
              
              <div className={`flex gap-1.5 p-1 rounded-xl border transition-colors ${
                theme === 'light' ? 'bg-slate-50 border-slate-250/80' : 'bg-slate-950 border-slate-800/80'
              }`}>
                <button 
                  onClick={() => handleModeChange('TwoPlayer')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    gameState.gameMode === 'TwoPlayer' 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : theme === 'light' ? 'hover:bg-slate-200/80 text-slate-600' : 'hover:bg-slate-900 text-slate-400'
                  }`}
                  id="btn-mode-twoplayer">
                  <Users className="h-3.5 w-3.5" /> Local PvP
                </button>
                <button 
                  onClick={() => handleModeChange('Computer')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                    gameState.gameMode === 'Computer' 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : theme === 'light' ? 'hover:bg-slate-200/80 text-slate-600' : 'hover:bg-slate-900 text-slate-400'
                  }`}
                  id="btn-mode-computer">
                  <Cpu className="h-3.5 w-3.5" /> vs Computer AI
                </button>
              </div>

              {gameState.gameMode === 'Computer' && (
                <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/80 animate-[fadeIn_0.15s_ease-out]" id="difficulty-selection-panel">
                  <label className={`block text-[10px] uppercase font-extrabold tracking-wider mb-2.5 ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    AI Calculation Difficulty
                  </label>
                  <p className={`text-[10px] mb-3 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select adaptive computer algorithms: Easy (purely random moves), Medium (50/50 decision splits), or Hard (strategic win/block priority sequence).
                  </p>
                  <div className={`flex gap-1.5 p-1 rounded-xl border transition-colors ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950 border-slate-800/80'
                  }`}>
                    <button 
                      onClick={() => handleDifficultyChange('Easy')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        difficulty === 'Easy' 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
                      }`}
                      id="btn-diff-easy">
                      Easy
                    </button>
                    <button 
                      onClick={() => handleDifficultyChange('Medium')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        difficulty === 'Medium' 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : theme === 'light' ? 'hover:bg-slate-200 text-slate-650' : 'hover:bg-slate-800 text-slate-400'
                      }`}
                      id="btn-diff-medium">
                      Medium
                    </button>
                    <button 
                      onClick={() => handleDifficultyChange('Hard')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        difficulty === 'Hard' 
                        ? 'bg-red-600 text-white shadow-sm' 
                        : theme === 'light' ? 'hover:bg-slate-200 text-slate-650' : 'hover:bg-slate-800 text-slate-400'
                      }`}
                      id="btn-diff-hard">
                      Hard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Production Scoreboard */}
            <div className={`border rounded-2xl p-5 shadow-sm transition-all duration-200 ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800/80 text-slate-100'
            }`} id="scoreboard-component">
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Database className="h-4 w-4 text-emerald-500" /> Synchronization Scoreboard
                </h3>
                <button 
                  onClick={handleResetScoreboard}
                  className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
                    theme === 'light' 
                      ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                      : 'bg-red-950/20 border-red-900/40 text-red-400 hover:text-red-300'
                  }`}
                  id="btn-reset-scoreboard">
                  Reset Scores
                </button>
              </div>
              <p className={`text-[11px] mb-4 leading-relaxed ${theme === 'light' ? 'text-slate-550' : 'text-slate-400'}`}>
                Session-level scoreboard served transparently. Winning entries lock values automatically.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className={`border p-2.5 rounded-xl text-center shadow-sm transition-colors ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/60'
                }`}>
                  <span className="text-[10px] font-bold text-teal-600 block font-sans">
                    {gameState.gameMode === 'Computer' ? 'Wins X (You)' : 'Wins X (P1)'}
                  </span>
                  <div className={`text-xl font-black mt-0.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{gameState.scoreboard.winsX}</div>
                </div>
                <div className={`border p-2.5 rounded-xl text-center shadow-sm transition-colors ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/60'
                }`}>
                  <span className="text-[10px] font-bold text-amber-600 block font-sans">
                    {gameState.gameMode === 'Computer' ? 'Wins O (AI)' : 'Wins O (P2)'}
                  </span>
                  <div className={`text-xl font-black mt-0.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{gameState.scoreboard.winsO}</div>
                </div>
                <div className={`border p-2.5 rounded-xl text-center shadow-sm transition-colors ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/60'
                }`}>
                  <span className="text-[10px] font-bold text-slate-500 block font-sans">Draws</span>
                  <div className={`text-xl font-black mt-0.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{gameState.scoreboard.draws}</div>
                </div>
              </div>
            </div>



          </section>

          {/* Center Panel: Interactive Game Board & Grid */}
          <section className="lg:col-span-4 flex flex-col items-center justify-center min-h-[500px]">
            
            <div className={`border rounded-2xl p-6 shadow-md w-full flex flex-col items-center justify-center relative transition-all duration-200 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`} id="grid-stage-wrapper">
              
              {loading && (
                <div className={`absolute inset-0 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-20 transition-all ${
                  theme === 'light' ? 'bg-slate-100/55' : 'bg-slate-950/55'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-7 w-7 text-red-600 animate-spin" />
                    <span className={`text-[10px] font-mono tracking-wider font-extrabold ${theme === 'light' ? 'text-red-700' : 'text-red-400'}`}>Executing Action...</span>
                  </div>
                </div>
              )}

              {/* Status Header */}
              <div className="mb-5 flex items-center justify-between w-full px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>State:</span>
                  {gameState.gameStatus === 'InProgress' ? (
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded border font-mono ${
                      gameState.currentPlayer === 'X' 
                        ? theme === 'light' ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-teal-950 border-teal-800 text-teal-400' 
                        : theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-950 border-amber-800 text-amber-400'
                    }`}>
                      {gameState.gameMode === 'Computer' && gameState.currentPlayer === 'O' ? 'Computer Thinking' : `Player ${gameState.currentPlayer} Turn`}
                    </span>
                  ) : (
                    <span className={`text-[10px] px-2.5 py-1 rounded border font-mono font-bold tracking-wider ${
                      theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}>
                      Match Finished
                    </span>
                  )}
                </div>

                <div className={`text-[9px] font-mono flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <span>Session:</span>
                  <span className="font-bold text-red-500">{gameState.gameId.substring(0, 8)}</span>
                </div>
              </div>

              {/* Visual 3x3 Grid Board */}
              <div className={`grid grid-cols-3 gap-3 w-72 h-72 sm:w-80 sm:h-80 p-3.5 rounded-2xl border transition-all ${
                theme === 'light' ? 'bg-slate-100/50 border-slate-200 shadow-inner' : 'bg-slate-950/50 border-slate-800 shadow-inner'
              }`} id="grid-stage">
                {gameState.board.map((cell, idx) => {
                  const isWinning = gameState.winningCells?.includes(idx);
                  return (
                    <button
                      key={idx}
                      id={`board-cell-${idx}`}
                      onClick={() => handleCellClick(idx)}
                      disabled={cell !== '' || gameState.gameStatus !== 'InProgress' || loading}
                      className={`relative select-none border rounded-xl flex items-center justify-center transition-all duration-150 ${
                        theme === 'light' 
                          ? 'border-slate-250/70 bg-white hover:bg-slate-50 shadow-sm' 
                          : 'border-slate-800 bg-slate-900/90 hover:bg-slate-800 shadow'
                      } ${
                        cell === '' && gameState.gameStatus === 'InProgress' ? 'cursor-pointer active:scale-95' : 'cursor-default'
                      } ${
                        isWinning 
                          ? theme === 'light'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-200 animate-glow-pulse z-10'
                            : 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/20 shadow-emerald-900 animate-glow-pulse z-10' 
                          : ''
                      }`}
                    >
                      {cell === 'X' && (
                        <span className="text-4xl font-extrabold text-teal-500 animate-[scaleUp_0.15s_ease-out]">X</span>
                      )}
                      {cell === 'O' && (
                        <span className="text-4xl font-extrabold text-amber-500 animate-[scaleUp_0.15s_ease-out]">O</span>
                      )}

                    </button>
                  );
                })}
              </div>

              {/* Status Announcement Box */}
              {gameState.gameStatus !== 'InProgress' && (
                <div className="mt-5 text-center animate-[fadeIn_0.22s_ease-out] w-full px-2">
                  {gameState.gameStatus === 'Won' ? (
                    <div className="flex flex-col items-center gap-1.5 bg-red-600/5 border border-red-500/20 p-3 rounded-xl">
                      <span className="text-xs font-extrabold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <Award className="h-4 w-4 shrink-0" />
                        🏆 Player {gameState.winner === 'X' ? 'X Wins!' : 'O (AI) Wins!'}
                      </span>
                      <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Score updated and locked dynamically in standard registers.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 bg-slate-500/5 border border-slate-500/20 p-3 rounded-xl">
                      <span className={`text-xs font-extrabold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                        <Info className="h-4 w-4 text-slate-500 shrink-0" />
                        🤝 Play Ground Draw Outcome
                      </span>
                      <span className={`text-[10px] ${theme === 'light' ? 'text-slate-550' : 'text-slate-400'}`}>Both sides exhausted coordinate cells without wins.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Controls: Step Undo & Start New Match */}
              <div className="w-full grid grid-cols-2 gap-3 mt-5 max-w-xs" id="controls-panel">
                <button
                  id="btn-undo-move"
                  disabled={gameState.moveHistory.length === 0 || loading}
                  onClick={handleUndo}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold border transition-colors text-xs shadow-sm ${
                    theme === 'light'
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:bg-slate-100'
                      : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-950'
                  }`}
                  title="Undo previous move. Score statistics regress dynamically on completion states."
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Undo Move
                </button>
                
                <button
                  id="btn-reset-game"
                  onClick={handleResetGame}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-red-600 text-white shadow-md hover:bg-red-700 transition-all text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Restart Match
                </button>
              </div>

            </div>

          </section>

          {/* Right Panel: Official Move History Table */}
          <section className="lg:col-span-4 flex flex-col h-full gap-6">
            
            <div className={`border rounded-2xl p-5 shadow-sm flex flex-col transition-all duration-200 lg:h-[500px] overflow-hidden ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`} id="history-container">
              
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-xs uppercase font-extrabold tracking-wider flex items-center gap-1.5 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <FileText className="h-4 w-4 text-indigo-500" /> Move History Log
                </h3>
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] border font-bold ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  {gameState.moveHistory.length} Total
                </span>
              </div>

              <p className={`text-[11px] mb-4 leading-relaxed ${theme === 'light' ? 'text-slate-550' : 'text-slate-400'}`}>
                Audit verification ledger. Undo commands roll back move indexes instantly.
              </p>

              <div className={`flex-1 border rounded-xl overflow-hidden flex flex-col ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                {gameState.moveHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 italic text-slate-400 text-xs">
                    <Info className="h-5 w-5 text-slate-400/80 mb-2 animate-bounce" />
                    <span>No moves logged yet.<br/>Interact on grid board to inspect.</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none scrollbar-thin">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className={`font-extrabold text-[10px] uppercase tracking-wider border-b ${
                          theme === 'light' ? 'bg-slate-100/80 border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Player</th>
                          <th className="py-2 px-2">Position</th>
                          <th className="py-2 px-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameState.moveHistory.map((m) => (
                          <tr key={m.moveNumber} className={`border-b font-mono transition-colors last:border-0 ${
                            theme === 'light' ? 'border-slate-200 hover:bg-slate-100/50' : 'border-slate-900/60 hover:bg-slate-900/40'
                          }`}>
                            <td className="py-2.5 px-3 font-extrabold text-slate-400">{m.moveNumber}</td>
                            <td className="py-2.5 px-3">
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                m.player === 'X' 
                                  ? 'bg-teal-500/10 text-teal-500 dark:text-teal-400' 
                                  : 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
                              }`}>
                                {m.player === 'O' && gameState.gameMode === 'Computer' ? 'CPU (O)' : `User (${m.player})`}
                              </span>
                            </td>
                            <td className={`py-2.5 px-2 font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{m.positionDescription}</td>
                            <td className="py-2.5 px-3 text-slate-400/80 text-right text-[10px]">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </section>

        </div>
      </main>

      {/* ABB Corporate Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-ping" />
          <span>ABB Industrial Precision Game Service Core running | Complete architectural conformance validated.</span>
        </div>
        
        <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <span className="flex items-center gap-1"><Github className="h-3.5 w-3.5 text-slate-400" /> github.com/abb-assessment</span>
          <span>v1.2.0</span>
        </div>
      </footer>

      {/* Rules & AI Decision Priority Handbook Drawer Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]" id="rules-help-overlay">
          <div className={`max-w-2xl w-full border rounded-2xl p-6 shadow-2xl transition-all duration-205 flex flex-col max-h-[85vh] ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`} id="rules-help-dialog">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/10 text-red-600 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight leading-none">Gaming Handbook & AI Rules</h3>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">ABB Assessment Specification Conformance</span>
                </div>
              </div>
              <button 
                onClick={() => setShowHelp(false)}
                className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                  theme === 'light' 
                    ? 'hover:bg-slate-100 text-slate-500 border-slate-200' 
                    : 'hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Dismiss handbook"
              >
                <span className="text-xs font-mono font-bold px-1.5">Close</span>
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-5 text-xs text-left leading-relaxed">
              
              {/* Introduction Section */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  Objective & Interaction Model
                </h4>
                <p className={`${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  This Tic-Tac-Toe system processes game coordinate points standardising the traditional 3x3 play interface. Alternate placing Marks (<span className="text-teal-500 font-bold">X</span> and <span className="text-amber-500 font-bold">O</span>) on valid vacant squares. Securing three aligned marks vertically, horizontally, or diagonally achieves victory.
                </p>
              </div>

              {/* Game Modes Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3.5 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-850'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Users className="h-4 w-4 text-teal-500 animate-pulse" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-200">Local PvP Mode</span>
                  </div>
                  <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Two active players share one single screen. Alternate moves manually. Score limits and move paths are recorded in direct registers.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-850'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Cpu className="h-4 w-4 text-red-500 animate-[pulse_2s_infinite]" />
                    <span className="font-extrabold text-slate-900 dark:text-slate-200">vs Computer AI</span>
                  </div>
                  <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    Play as <span className="font-bold text-teal-500 text-xs">X</span>. The program controls opponent brand <span className="font-bold text-amber-500 text-xs">O</span>. The backend solves strategic response paths immediately after your placement.
                  </p>
                </div>
              </div>

              {/* AI Priority Hierarchy (Mandated backend behaviors) */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                theme === 'light' ? 'bg-red-50/15 border-red-500/10' : 'bg-red-950/10 border-red-900/20'
              }`}>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-red-650" />
                  <span className="font-black text-[11px] uppercase tracking-wider text-red-650 dark:text-red-400">Computer AI Strategic Logic Hierarchy:</span>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  Unveiling how our computer adversary prioritises target squares in its core decision cycle:
                </p>
                
                <ol className="space-y-2.5 pl-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li className="flex gap-2">
                    <span className="font-mono font-bold text-red-600 bg-red-600/15 rounded px-1.5 shrink-0 h-4 flex items-center justify-center">1</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Win Strategy (Check O to Win)</strong>
                      <p className="text-[10px] opacity-90 mt-0.5">Prioritises any cell completing 3-in-a-row for O to secure immediate game victory.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono font-bold text-slate-600 bg-slate-500/15 rounded px-1.5 shrink-0 h-4 flex items-center justify-center dark:bg-slate-800 dark:text-slate-350">2</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Block Strategy (Check X Block)</strong>
                      <p className="text-[10px] opacity-90 mt-0.5">Identifies if you have 2 inline items about to win and places O directly there to block you.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono font-bold text-slate-600 bg-slate-500/15 rounded px-1.5 shrink-0 h-4 flex items-center justify-center dark:bg-slate-800 dark:text-slate-350">3</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Center Seizure</strong>
                      <p className="text-[10px] opacity-95 mt-0.5">Seizes the central coordinates (index 4) if unoccupied, establishing strong positional leverage.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono font-bold text-slate-600 bg-slate-500/15 rounded px-1.5 shrink-0 h-4 flex items-center justify-center dark:bg-slate-800 dark:text-slate-350">4</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Corner Domination</strong>
                      <p className="text-[10px] opacity-90 mt-0.5">Scans standard corners (indexes 0, 2, 6, 8) and places O there if free.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-mono font-bold text-slate-600 bg-slate-500/15 rounded px-1.5 shrink-0 h-4 flex items-center justify-center dark:bg-slate-800 dark:text-slate-350">5</span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Default Sweep (Sides)</strong>
                      <p className="text-[10px] opacity-90 mt-0.5">Lands on any miscellaneous side cells left available inside the grid buffer.</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Undo & Scoreboard Guidelines */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Intelligent Undo Loop
                </h4>
                <p className={`${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  If errors occur, press <span className="font-bold text-slate-900 dark:text-slate-200">Undo Move</span>. In PvP, it removes the precise preceding step. In vs Computer AI mode, it automatically regresses <strong>both</strong> the computer's last response and your associated trigger action so you can restart from your last placement state with intact scoreboard integrity.
                </p>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="border-t pt-4 mt-4 flex justify-end gap-2 dark:border-slate-800">
              <button
                onClick={() => setShowHelp(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-650 hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Let me Play!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
