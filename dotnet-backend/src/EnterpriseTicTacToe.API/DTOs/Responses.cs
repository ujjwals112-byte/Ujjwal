using System;
using System.Collections.Generic;
using EnterpriseTicTacToe.API.Models;

namespace EnterpriseTicTacToe.API.DTOs
{
    public class GameStateResponse
    {
        public Guid GameId { get; set; }
        public string[] Board { get; set; } = new string[9];
        public string CurrentPlayer { get; set; } = "X";
        public string GameMode { get; set; } = "TwoPlayer";
        public string Difficulty { get; set; } = "Hard";
        public string GameStatus { get; set; } = "InProgress";
        public string? Winner { get; set; }
        public List<int>? WinningCells { get; set; }
        public List<Move> MoveHistory { get; set; } = new List<Move>();
        public ScoreboardResponse Scoreboard { get; set; } = new ScoreboardResponse();
    }

    public class ScoreboardResponse
    {
        public int WinsX { get; set; }
        public int WinsO { get; set; }
        public int Draws { get; set; }
    }
}
