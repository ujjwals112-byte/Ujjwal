import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-10 px-4 font-sansSelection">
      <!-- Title Header -->
      <header class="text-center mb-8">
        <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          ABB Tic-Tac-Toe
        </h1>
        <p class="text-slate-400 mt-2 text-sm max-w-md">
          A high-performance Angular frontend communicating with a thread-safe .NET REST API.
        </p>
      </header>

      <!-- Alert Error Banner -->
      @if (error()) {
        <div class="w-full max-w-4xl bg-red-950/50 border border-red-500/50 rounded-xl p-4 mb-6 text-red-200 flex justify-between items-center text-sm">
          <span><strong>Error:</strong> {{ error() }}</span>
          <button (click)="clearError()" class="text-red-400 hover:text-red-200 transition-colors">✕</button>
        </div>
      }

      <!-- Main Columns Grid Layout -->
      <main class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Column 1 & 2: Main Board & Controller Panel -->
        <section class="md:col-span-2 flex flex-col gap-6">
                   <!-- Mode Switch Panel & Stats -->
          <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div class="flex flex-wrap gap-4 items-center">
                <div>
                  <label class="block text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">Game Mode</label>
                  <div class="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-700/50">
                    <button 
                      (click)="changeMode('TwoPlayer')"
                      [class.bg-teal-500]="activeMode() === 'TwoPlayer'"
                      [class.text-slate-950]="activeMode() === 'TwoPlayer'"
                      class="px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200">
                      Two Player
                    </button>
                    <button 
                      (click)="changeMode('Computer')"
                      [class.bg-teal-500]="activeMode() === 'Computer'"
                      [class.text-slate-950]="activeMode() === 'Computer'"
                      class="px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200">
                      vs Computer
                    </button>
                  </div>
                </div>

                @if (activeMode() === 'Computer') {
                  <div class="animate-scale-up">
                    <label class="block text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">AI Difficulty</label>
                    <div class="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-700/50">
                      <button 
                        (click)="changeDifficulty('Easy')"
                        [class.bg-emerald-500]="selectedDifficulty() === 'Easy'"
                        [class.text-slate-950]="selectedDifficulty() === 'Easy'"
                        class="px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200">
                        Easy
                      </button>
                      <button 
                        (click)="changeDifficulty('Medium')"
                        [class.bg-amber-500]="selectedDifficulty() === 'Medium'"
                        [class.text-slate-950]="selectedDifficulty() === 'Medium'"
                        class="px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200">
                        Medium
                      </button>
                      <button 
                        (click)="changeDifficulty('Hard')"
                        [class.bg-rose-500]="selectedDifficulty() === 'Hard'"
                        [class.text-slate-950]="selectedDifficulty() === 'Hard'"
                        class="px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200">
                        Hard
                      </button>
                    </div>
                  </div>
                }
              </div>

              <div class="text-center sm:text-right mt-2 sm:mt-0">
                <span class="block text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Session ID</span>
                <span class="font-mono text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-700/40">
                  {{ gameId() ? gameId()?.slice(0, 8) + '...' : 'Generating...' }}
                </span>
              </div>
            </div>
          </div>

          <!-- The Game Board Cell Elements -->
          <div class="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            
            <!-- Game Status Indicators -->
            <div class="mb-6 text-center">
              @if (gameStatus() === 'InProgress') {
                <span class="text-md font-semibold text-slate-300">
                  Current Turn: 
                  <span class="px-2.5 py-1 bg-slate-950 border border-slate-700 font-bold rounded"
                        [ngClass]="currentPlayer() === 'X' ? 'text-teal-400' : 'text-amber-400'">
                    {{ currentPlayer() }}
                  </span>
                </span>
              } @else if (gameStatus() === 'Won') {
                <span class="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  🎉 Player {{ winner() }} Wins!
                </span>
              } @else {
                <span class="text-lg font-bold text-slate-300 flex items-center gap-2">
                  🤝 Game Drawn!
                </span>
              }
            </div>

            <!-- 3x3 Interaction Board -->
            <div class="grid grid-cols-3 gap-3 w-72 h-72 sm:w-80 sm:h-80 bg-slate-950 rounded-2xl p-3 border border-slate-700/50 shadow-inner">
              @for (cell of board(); track $index) {
                <button 
                  [disabled]="cell !== '' || gameStatus() !== 'InProgress' || isLoading()"
                  (click)="onCellClick($index)"
                  [class.opacity-50]="cell === '' && gameStatus() !== 'InProgress'"
                  [class.bg-emerald-950/40]="isCellWinning($index)"
                  [class.border-emerald-500]="isCellWinning($index)"
                  class="relative flex items-center justify-center border border-slate-800 bg-slate-900 rounded-xl hover:bg-slate-800/80 focus:outline-none transition-all duration-200">
                  
                  @if (cell === 'X') {
                    <span class="text-4xl font-extrabold text-teal-400 animate-scale-up">X</span>
                  } @else if (cell === 'O') {
                    <span class="text-4xl font-extrabold text-amber-400 animate-scale-up">O</span>
                  }
                </button>
              }
            </div>

            <!-- Footer Buttons: Undo / Reset -->
            <div class="w-full grid grid-cols-2 gap-4 mt-8">
              <button 
                [disabled]="moveHistory().length === 0 || isLoading() || (gameStatus() !== 'InProgress' && isUndoDisabledAfterCompletion)"
                (click)="onUndo()"
                class="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold border border-slate-700 hover:bg-slate-700/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all">
                ↩ Undo Move
              </button>
              <button 
                [disabled]="isLoading()"
                (click)="onResetGame()"
                class="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 shadow-lg shadow-teal-500/10 disabled:opacity-30 transition-all">
                ⟳ Reset Game
              </button>
            </div>
          </div>
        </section>

        <!-- Column 3: Stats, Scoreboard, Move History Logs -->
        <aside class="flex flex-col gap-6">
          <!-- Session Scoreboard component details -->
          <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <h2 class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-4 flex justify-between items-center">
              <span>Scoreboard</span>
              <button (click)="onResetScoreboard()" class="text-xs text-red-400 hover:text-red-300 transition-colors font-bold">
                Reset
              </button>
            </h2>

            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                <span class="text-xs font-semibold text-teal-400">Wins X</span>
                <span class="block text-2xl font-black mt-1">{{ scoreboard().winsX }}</span>
              </div>
              <div class="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                <span class="text-xs font-semibold text-amber-400">Wins O</span>
                <span class="block text-2xl font-black mt-1">{{ scoreboard().winsO }}</span>
              </div>
              <div class="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg">
                <span class="text-xs font-semibold text-slate-400">Draws</span>
                <span class="block text-2xl font-black mt-1">{{ scoreboard().draws }}</span>
              </div>
            </div>
          </div>

          <!-- Move History Logger -->
          <div class="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <h2 class="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-3">
              Move History
            </h2>
            
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1 overflow-y-auto max-h-[220px] scrollbar-thin">
              @if (moveHistory().length === 0) {
                <span class="text-xs text-slate-500 italic block text-center py-8">
                  No moves recorded yet. Click on the board above to play!
                </span>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (move of moveHistory(); track move.moveNumber) {
                    <div class="flex items-center justify-between text-xs py-1.5 px-2 border-b border-slate-900 last:border-0 hover:bg-slate-900/40 rounded transition-colors">
                      <div class="flex items-center gap-2">
                        <span class="w-5 h-5 flex items-center justify-center font-bold bg-slate-800 rounded font-mono text-slate-400">
                          {{ move.moveNumber }}
                        </span>
                        <span class="font-bold font-mono" [ngClass]="move.player === 'X' ? 'text-teal-400' : 'text-amber-400'">
                          Player {{ move.player }}
                        </span>
                      </div>
                      <span class="font-semibold text-slate-400">{{ move.positionDescription }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </aside>
      </main>
    </div>
  `,
  styles: [`
    .animate-scale-up {
      animation: scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes scaleUp {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class AppComponent implements OnInit {
  private gameService = inject(GameService);

  // Read Signals to expose onto UI template
  public readonly board = this.gameService.board;
  public readonly currentPlayer = this.gameService.currentPlayer;
  public readonly gameMode = this.gameService.gameMode;
  public readonly gameStatus = this.gameService.gameStatus;
  public readonly winner = this.gameService.winner;
  public readonly winningCells = this.gameService.winningCells;
  public readonly moveHistory = this.gameService.moveHistory;
  public readonly scoreboard = this.gameService.scoreboard;
  public readonly isLoading = this.gameService.isLoading;
  public readonly error = this.gameService.error;

  public activeMode = signal<'TwoPlayer' | 'Computer'>('TwoPlayer');
  public selectedDifficulty = signal<'Easy' | 'Medium' | 'Hard'>('Hard');
  public gameId = signal<string | null>(null);

  // True = Option A (Disable Undo after End), False = Option B (Allow Undo, correct Scoreboard)
  // Standard is Option B as we want to showcase 10+ yr lead status!
  public isUndoDisabledAfterCompletion = false; 

  ngOnInit(): void {
    // Bootstrap first game
    this.startNewSession();
  }

  public startNewSession(): void {
    this.gameService.createGame(this.activeMode(), this.selectedDifficulty()).subscribe({
      next: (response) => {
        this.gameId.set(response.gameId);
        this.clearError();
      }
    });
  }

  public changeMode(mode: 'TwoPlayer' | 'Computer'): void {
    if (this.activeMode() === mode) return;
    this.activeMode.set(mode);
    this.startNewSession();
  }

  public changeDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): void {
    if (this.selectedDifficulty() === difficulty) return;
    this.selectedDifficulty.set(difficulty);
    this.startNewSession();
  }

  public onCellClick(cellIndex: number): void {
    const activeId = this.gameId();
    if (!activeId) return;

    this.gameService.makeMove(activeId, this.currentPlayer(), cellIndex).subscribe();
  }

  public onUndo(): void {
    const activeId = this.gameId();
    if (!activeId) return;

    this.gameService.undoMove(activeId).subscribe();
  }

  public onResetGame(): void {
    const activeId = this.gameId();
    if (!activeId) return;

    this.gameService.resetGame(activeId).subscribe();
  }

  public onResetScoreboard(): void {
    this.gameService.resetScoreboard().subscribe();
  }

  public isCellWinning(index: number): boolean {
    const cells = this.winningCells();
    return cells ? cells.includes(index) : false;
  }

  public clearError(): void {
    // Normally handled inside the service signal, but safe wrapper
    (this.gameService as any).errorSignal?.set(null);
  }
}
