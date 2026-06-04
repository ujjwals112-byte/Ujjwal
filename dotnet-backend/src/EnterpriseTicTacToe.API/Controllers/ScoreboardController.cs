using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using EnterpriseTicTacToe.API.DTOs;
using EnterpriseTicTacToe.API.Services;

using EnterpriseTicTacToe.API.Filters;

namespace EnterpriseTicTacToe.API.Controllers
{
    [ApiController]
    [Route("api/scoreboard")]
    [Produces("application/json")]
    [ApiKeyAuth]
    public class ScoreboardController : ControllerBase
    {
        private readonly IScoreboardService _scoreboardService;

        public ScoreboardController(IScoreboardService scoreboardService)
        {
            _scoreboardService = scoreboardService;
        }

        /// <summary>
        /// Retrieves the global session-level scoreboard.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ScoreboardResponse))]
        public IActionResult GetScoreboard()
        {
            var board = _scoreboardService.GetScoreboard();
            return Ok(new ScoreboardResponse
            {
                WinsX = board.WinsX,
                WinsO = board.WinsO,
                Draws = board.Draws
            });
        }

        /// <summary>
        /// Resets the global scoreboard back to 0-0-0.
        /// </summary>
        [HttpPost("reset")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ScoreboardResponse))]
        public IActionResult ResetScoreboard()
        {
            _scoreboardService.Reset();
            return Ok(new ScoreboardResponse
            {
                WinsX = 0,
                WinsO = 0,
                Draws = 0
            });
        }
    }
}
