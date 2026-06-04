using System;
using System.Collections.Generic;

namespace EnterpriseTicTacToe.API.Models
{
    public enum GameMode
    {
        TwoPlayer = 0,
        Computer = 1
    }

    public enum GameStatus
    {
        InProgress = 0,
        Won = 1,
        Draw = 2
    }

    public enum DifficultyLevel
    {
        Easy = 0,
        Medium = 1,
        Hard = 2
    }

    public class GameSession
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        // Represents the 3x3 grid: index 0 to 8. Value can be "", "X", "O"
        public string[] Board { get; set; } = new string[9] { "", "", "", "", "", "", "", "", "" };
        
        public string CurrentPlayer { get; set; } = "X"; // Alternates between X and O
        
        public GameMode Mode { get; set; } = GameMode.TwoPlayer;

        public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Hard;
        
        public GameStatus Status { get; set; } = GameStatus.InProgress;
        
        public string? Winner { get; set; } // "X", "O", or null
        
        public List<int>? WinningCells { get; set; } = null; // e.g., [0, 1, 2]
        
        public List<Move> MoveHistory { get; set; } = new List<Move>();

        // Tracks if this session's outcome has already updated the scoreboard.
        // Important to prevent double-counting of scores on re-evaluation.
        public bool ScoreUpdated { get; set; } = false;
    }
}
