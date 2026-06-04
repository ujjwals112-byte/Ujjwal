import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { GameStateResponse, CreateGameRequest, MakeMoveRequest, ScoreboardResponse } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'https://localhost:7111/api'; // Standard Dev .NET Https port

  // Enterprise Writable Signals for state management
  private gameStateSignal = signal<GameStateResponse | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Expose Readonly Signals to components to enforce state boundaries
  public readonly gameState = computed(() => this.gameStateSignal());
  public readonly isLoading = computed(() => this.loadingSignal());
  public readonly error = computed(() => this.errorSignal());
  
  public readonly board = computed(() => this.gameStateSignal()?.board || Array(9).fill(''));
  public readonly currentPlayer = computed(() => this.gameStateSignal()?.currentPlayer || 'X');
  public readonly gameMode = computed(() => this.gameStateSignal()?.gameMode || 'TwoPlayer');
  public readonly gameStatus = computed(() => this.gameStateSignal()?.gameStatus || 'InProgress');
  public readonly winner = computed(() => this.gameStateSignal()?.winner || null);
  public readonly winningCells = computed(() => this.gameStateSignal()?.winningCells || null);
  public readonly moveHistory = computed(() => this.gameStateSignal()?.moveHistory || []);
  public readonly scoreboard = computed(() => this.gameStateSignal()?.scoreboard || { winsX: 0, winsO: 0, draws: 0 });

  constructor(private http: HttpClient) {}

  /**
   * Sets a custom API base URL if needed (e.g. for dynamic staging or proxies)
   */
  public setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * POST /api/games - Create a new game session
   */
  public createGame(mode: 'TwoPlayer' | 'Computer'): Observable<GameStateResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    const modeValue = mode === 'TwoPlayer' ? 0 : 1;

    return this.http.post<GameStateResponse>(`${this.apiUrl}/games`, { mode: modeValue } as CreateGameRequest).pipe(
      tap((response) => {
        this.gameStateSignal.set(response);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * GET /api/games/{id} - Get modern state of existing session
   */
  public getGame(gameId: string): Observable<GameStateResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<GameStateResponse>(`${`${this.apiUrl}/games`}/${gameId}`).pipe(
      tap((response) => {
        this.gameStateSignal.set(response);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * POST /api/games/{id}/moves - Submit and validate a grid click
   */
  public makeMove(gameId: string, player: string, cellIndex: number): Observable<GameStateResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const payload: MakeMoveRequest = { player, cellIndex };

    return this.http.post<GameStateResponse>(`${this.apiUrl}/games/${gameId}/moves`, payload).pipe(
      tap((response) => {
        this.gameStateSignal.set(response);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * POST /api/games/{id}/undo - Undo last valid move
   */
  public undoMove(gameId: string): Observable<GameStateResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<GameStateResponse>(`${this.apiUrl}/games/${gameId}/undo`, {}).pipe(
      tap((response) => {
        this.gameStateSignal.set(response);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * POST /api/games/{id}/reset - Soft-reset board of current session
   */
  public resetGame(gameId: string): Observable<GameStateResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<GameStateResponse>(`${this.apiUrl}/games/${gameId}/reset`, {}).pipe(
      tap((response) => {
        this.gameStateSignal.set(response);
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * POST /api/scoreboard/reset - Full wipe scoreboard values
   */
  public resetScoreboard(): Observable<ScoreboardResponse> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<ScoreboardResponse>(`${this.apiUrl}/scoreboard/reset`, {}).pipe(
      tap((scoreResponse) => {
        const current = this.gameStateSignal();
        if (current) {
          this.gameStateSignal.set({
            ...current,
            scoreboard: scoreResponse
          });
        }
      }),
      catchError(this.handleError.bind(this)),
      finalize(() => this.loadingSignal.set(false))
    );
  }

  /**
   * Top-tier REST Error parsing
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected server error occurred. Please try again.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side/network error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Backend returned error code
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.statusText) {
        errorMessage = `Server response error (${error.status}): ${error.statusText}`;
      }
    }
    
    this.errorSignal.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
