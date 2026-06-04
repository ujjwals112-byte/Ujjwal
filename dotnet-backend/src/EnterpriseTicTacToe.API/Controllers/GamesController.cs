using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using EnterpriseTicTacToe.API.DTOs;
using EnterpriseTicTacToe.API.Models;
using EnterpriseTicTacToe.API.Services;

namespace EnterpriseTicTacToe.API.Controllers
{
    [ApiController]
    [Route("api/games")]
    [Produces("application/json")]
    public class GamesController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly IScoreboardService _scoreboardService;

        public GamesController(IGameService gameService, IScoreboardService scoreboardService)
        {
            _gameService = gameService;
            _scoreboardService = scoreboardService;
        }

        /// <summary>
        /// Creates a new game session with specified mode.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(GameStateResponse))]
        public IActionResult CreateGame([FromBody] CreateGameRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var session = _gameService.CreateGame(request.Mode);
            var response = MapToResponse(session);
            
            return CreatedAtAction(nameof(GetGame), new { id = session.Id }, response);
        }

        /// <summary>
        /// Retrieves the current game state by unique ID.
        /// </summary>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GameStateResponse))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult GetGame(Guid id)
        {
            try
            {
                var session = _gameService.GetGame(id);
                return Ok(MapToResponse(session));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Submits a player move to the board.
        /// </summary>
        [HttpPost("{id:guid}/moves")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GameStateResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult MakeMove(Guid id, [FromBody] MakeMoveRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var session = _gameService.MakeMove(id, request.Player, request.CellIndex);
                return Ok(MapToResponse(session));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Reverts the latest move or move-pair.
        /// </summary>
        [HttpPost("{id:guid}/undo")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GameStateResponse))]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult UndoMove(Guid id)
        {
            try
            {
                var session = _gameService.UndoLastMove(id);
                return Ok(MapToResponse(session));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Resets the specified game, clearing moves but keeping scoreboard.
        /// </summary>
        [HttpPost("{id:guid}/reset")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GameStateResponse))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public IActionResult ResetGame(Guid id)
        {
            try
            {
                var session = _gameService.ResetGame(id);
                return Ok(MapToResponse(session));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        #region Helper Mapping

        private GameStateResponse MapToResponse(GameSession session)
        {
            var boardState = _scoreboardService.GetScoreboard();
            
            return new GameStateResponse
            {
                GameId = session.Id,
                Board = session.Board,
                CurrentPlayer = session.CurrentPlayer,
                GameMode = session.Mode.ToString(),
                GameStatus = session.Status.ToString(),
                Winner = session.Winner,
                WinningCells = session.WinningCells,
                MoveHistory = session.MoveHistory,
                Scoreboard = new ScoreboardResponse
                {
                    WinsX = boardState.WinsX,
                    WinsO = boardState.WinsO,
                    Draws = boardState.Draws
                }
            };
        }

        #endregion
    }
}
