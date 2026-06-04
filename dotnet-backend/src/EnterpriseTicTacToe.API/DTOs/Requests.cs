using System.ComponentModel.DataAnnotations;
using EnterpriseTicTacToe.API.Models;

namespace EnterpriseTicTacToe.API.DTOs
{
    public class CreateGameRequest
    {
        [Required]
        public GameMode Mode { get; set; } = GameMode.TwoPlayer;

        public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Hard;
    }

    public class MakeMoveRequest
    {
        [Required]
        [RegularExpression("^[XO]$", ErrorMessage = "Player must be 'X' or 'O'")]
        public string Player { get; set; } = string.Empty;

        [Required]
        [Range(0, 8, ErrorMessage = "CellIndex must be between 0 and 8")]
        public int CellIndex { get; set; }
    }
}
