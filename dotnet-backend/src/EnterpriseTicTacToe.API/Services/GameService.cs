using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using EnterpriseTicTacToe.API.Models;

namespace EnterpriseTicTacToe.API.Services
{
    public class GameService : IGameService
    {
        private readonly ConcurrentDictionary<Guid, GameSession> _sessions = new();
        private readonly IScoreboardService _scoreboardService;

        public GameService(IScoreboardService scoreboardService)
        {
            _scoreboardService = scoreboardService;
        }

        public GameSession CreateGame(GameMode mode)
        {
            var session = new GameSession
            {
                Id = Guid.NewGuid(),
                Mode = mode,
                CurrentPlayer = "X"
            };
            _sessions[session.Id] = session;
            return session;
        }

        public GameSession GetGame(Guid id)
        {
            if (!_sessions.TryGetValue(id, out var session))
            {
                throw new KeyNotFoundException($"Game session with ID {id} was not found.");
            }
            return session;
        }

        public GameSession MakeMove(Guid id, string player, int cellIndex)
        {
            var session = GetGame(id);

            lock (session)
            {
                ValidateMove(session, player, cellIndex);

                // Perform the player's move
                ApplyMoveToSession(session, player, cellIndex);

                // If in Computer Mode and game is still in progress, the computer (O) moves immediately
                if (session.Mode == GameMode.Computer && session.Status == GameStatus.InProgress)
                {
                    int computerCell = CalculateComputerMove(session.Board);
                    ApplyMoveToSession(session, "O", computerCell);
                }

                return session;
            }
        }

        public GameSession UndoLastMove(Guid id)
        {
            var session = GetGame(id);

            lock (session)
            {
                if (!session.MoveHistory.Any())
                {
                    throw new InvalidOperationException("No moves to undo.");
                }

                // If the game had completed and we are reverting, reduce the recorded score (Option B)
                if (session.Status != GameStatus.InProgress && session.ScoreUpdated)
                {
                    RevertScoreboardOutcome(session);
                    session.ScoreUpdated = false;
                }

                // Determine how many moves to undo based on mode
                int movesToRemove = 1;
                if (session.Mode == GameMode.Computer && session.MoveHistory.Count >= 2)
                {
                    // In computer mode, undo both the computer's turn and the player's prior turn
                    movesToRemove = 2;
                }

                for (int i = 0; i < movesToRemove; i++)
                {
                    if (session.MoveHistory.Any())
                    {
                        session.MoveHistory.RemoveAt(session.MoveHistory.Count - 1);
                    }
                }

                // Re-play moves from scratch to guarantee perfect state reconstruction
                ReplayMovesAndRecalculateState(session);

                return session;
            }
        }

        public GameSession ResetGame(Guid id)
        {
            var session = GetGame(id);

            lock (session)
            {
                session.Board = new string[9] { "", "", "", "", "", "", "", "", "" };
                session.CurrentPlayer = "X";
                session.Status = GameStatus.InProgress;
                session.Winner = null;
                session.WinningCells = null;
                session.MoveHistory.Clear();
                session.ScoreUpdated = false;
                return session;
            }
        }

        #region Private Helper Methods

        private void ValidateMove(GameSession session, string player, int cellIndex)
        {
            if (session.Status != GameStatus.InProgress)
            {
                throw new InvalidOperationException("Move is rejected. The game has already completed.");
            }

            if (cellIndex < 0 || cellIndex > 8)
            {
                throw new ArgumentOutOfRangeException(nameof(cellIndex), "Move must be in cell range 0-8.");
            }

            if (!string.IsNullOrEmpty(session.Board[cellIndex]))
            {
                throw new InvalidOperationException($"Move rejected. Cell index {cellIndex} is already occupied.");
            }

            if (session.CurrentPlayer != player)
            {
                throw new InvalidOperationException($"Move rejected. It is {session.CurrentPlayer}'s turn, not {player}'s.");
            }
        }

        private void ApplyMoveToSession(GameSession session, string player, int cellIndex)
        {
            session.Board[cellIndex] = player;

            var newMove = new Move
            {
                MoveNumber = session.MoveHistory.Count + 1,
                Player = player,
                CellIndex = cellIndex,
                Timestamp = DateTime.UtcNow
            };
            session.MoveHistory.Add(newMove);

            EvaluateGameState(session);

            if (session.Status == GameStatus.InProgress)
            {
                // Switch players
                session.CurrentPlayer = (session.CurrentPlayer == "X") ? "O" : "X";
            }
        }

        private void EvaluateGameState(GameSession session)
        {
            int[][] winLines = new int[][]
            {
                new[] { 0, 1, 2 }, new[] { 3, 4, 5 }, new[] { 6, 7, 8 }, // Rows
                new[] { 0, 3, 6 }, new[] { 1, 4, 7 }, new[] { 2, 5, 8 }, // Columns
                new[] { 0, 4, 8 }, new[] { 2, 4, 6 }              // Diagonals
            };

            foreach (var line in winLines)
            {
                string c1 = session.Board[line[0]];
                string c2 = session.Board[line[1]];
                string c3 = session.Board[line[2]];

                if (!string.IsNullOrEmpty(c1) && c1 == c2 && c1 == c3)
                {
                    session.Status = GameStatus.Won;
                    session.Winner = c1;
                    session.WinningCells = line.ToList();

                    // Record Scoreboard changes once
                    if (!session.ScoreUpdated)
                    {
                        if (c1 == "X") _scoreboardService.RecordXWin();
                        else _scoreboardService.RecordOWin();
                        session.ScoreUpdated = true;
                    }
                    return;
                }
            }

            // Check if board is full (Draw)
            if (session.Board.All(cell => !string.IsNullOrEmpty(cell)))
            {
                session.Status = GameStatus.Draw;
                session.Winner = null;
                session.WinningCells = null;

                if (!session.ScoreUpdated)
                {
                    _scoreboardService.RecordDraw();
                    session.ScoreUpdated = true;
                }
            }
        }

        private void RevertScoreboardOutcome(GameSession session)
        {
            if (session.Status == GameStatus.Won)
            {
                if (session.Winner == "X") _scoreboardService.RevertXWin();
                else if (session.Winner == "O") _scoreboardService.RevertOWin();
            }
            else if (session.Status == GameStatus.Draw)
            {
                _scoreboardService.RevertDraw();
            }
        }

        private void ReplayMovesAndRecalculateState(GameSession session)
        {
            // Reset state fields
            session.Board = new string[9] { "", "", "", "", "", "", "", "", "" };
            session.CurrentPlayer = "X";
            session.Status = GameStatus.InProgress;
            session.Winner = null;
            session.WinningCells = null;

            // Re-apply history
            var tempHistory = session.MoveHistory.ToList();
            session.MoveHistory.Clear();

            foreach (var move in tempHistory)
            {
                session.Board[move.CellIndex] = move.Player;
                session.MoveHistory.Add(move);
                EvaluateGameState(session);
                
                if (session.Status == GameStatus.InProgress)
                {
                    session.CurrentPlayer = (move.Player == "X") ? "O" : "X";
                }
            }
        }

        private int CalculateComputerMove(string[] board)
        {
            // O is Computer, X is Human
            
            // Priority 1: If O can win, play the winning move
            int oWinCell = FindWinningCell(board, "O");
            if (oWinCell != -1) return oWinCell;

            // Priority 2: If X can win next, block X
            int xBlockCell = FindWinningCell(board, "X");
            if (xBlockCell != -1) return xBlockCell;

            // Priority 3: Take center if available
            if (string.IsNullOrEmpty(board[4])) return 4;

            // Priority 4: Take a corner if available (0, 2, 6, 8)
            int[] corners = new[] { 0, 2, 6, 8 };
            foreach (var idx in corners)
            {
                if (string.IsNullOrEmpty(board[idx])) return idx;
            }

            // Priority 5: Take any available cell
            for (int i = 0; i < 9; i++)
            {
                if (string.IsNullOrEmpty(board[i])) return i;
            }

            throw new InvalidOperationException("No valid moves available for the computer.");
        }

        private int FindWinningCell(string[] board, string targetPlayer)
        {
            int[][] winLines = new int[][]
            {
                new[] { 0, 1, 2 }, new[] { 3, 4, 5 }, new[] { 6, 7, 8 },
                new[] { 0, 3, 6 }, new[] { 1, 4, 7 }, new[] { 2, 5, 8 },
                new[] { 0, 4, 8 }, new[] { 2, 4, 6 }
            };

            foreach (var line in winLines)
            {
                string c1 = board[line[0]];
                string c2 = board[line[1]];
                string c3 = board[line[2]];

                int emptyCount = 0;
                int targetCount = 0;
                int targetIndex = -1;

                for (int i = 0; i < 3; i++)
                {
                    string val = board[line[i]];
                    if (string.IsNullOrEmpty(val))
                    {
                        emptyCount++;
                        targetIndex = line[i];
                    }
                    else if (val == targetPlayer)
                    {
                        targetCount++;
                    }
                }

                if (targetCount == 2 && emptyCount == 1)
                {
                    return targetIndex;
                }
            }

            return -1;
        }

        #endregion
    }
}
