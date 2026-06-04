using System;

namespace EnterpriseTicTacToe.API.Models
{
    public class Move
    {
        public int MoveNumber { get; set; }
        public string Player { get; set; } = string.Empty; // "X" or "O"
        public int CellIndex { get; set; } // 0-8
        public int Row => (CellIndex / 3) + 1; // 1-based Row coordinate for human readability
        public int Column => (CellIndex % 3) + 1; // 1-based Column coordinate for human readability
        public string PositionDescription => $"Row {Row}, Column {Column}";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
