using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using EnterpriseTicTacToe.API.Models;
using EnterpriseTicTacToe.API.Services;

namespace EnterpriseTicTacToe.Tests
{
    public class GameServiceTests
    {
        private readonly IScoreboardService _scoreboard;
        private readonly IGameService _gameService;

        public GameServiceTests()
        {
            _scoreboard = new ScoreboardService();
            _gameService = new GameService(_scoreboard);
        }

        [Fact]
        public void CreateGame_ShouldInitializeCorrectly()
        {
            // Act
            var session = _gameService.CreateGame(GameMode.TwoPlayer);

            // Assert
            Assert.NotEqual(Guid.Empty, session.Id);
            Assert.Equal(GameMode.TwoPlayer, session.Mode);
            Assert.Equal(GameStatus.InProgress, session.Status);
            Assert.All(session.Board, cell => Assert.Empty(cell));
            Assert.Equal("X", session.CurrentPlayer);
        }

        [Fact]
        public void MakeMove_ValidMove_ShouldUpdateBoardAndSwitchPlayer()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);

            // Act
            var updated = _gameService.MakeMove(s.Id, "X", 0);

            // Assert
            Assert.Equal("X", updated.Board[0]);
            Assert.Equal("O", updated.CurrentPlayer);
            Assert.Single(updated.MoveHistory);
            Assert.Equal(1, updated.MoveHistory[0].MoveNumber);
        }

        [Fact]
        public void MakeMove_InvalidCell_ShouldThrowException()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);

            // Act & Assert
            Assert.Throws<ArgumentOutOfRangeException>(() => _gameService.MakeMove(s.Id, "X", 9));
        }

        [Fact]
        public void MakeMove_CellAlreadyOccupied_ShouldThrowException()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);
            _gameService.MakeMove(s.Id, "X", 0);

            // Act & Assert
            var ex = Assert.Throws<InvalidOperationException>(() => _gameService.MakeMove(s.Id, "O", 0));
            Assert.Contains("already occupied", ex.Message);
        }

        [Fact]
        public void MakeMove_WrongPlayerTurn_ShouldThrowException()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);

            // Act & Assert
            var ex = Assert.Throws<InvalidOperationException>(() => _gameService.MakeMove(s.Id, "O", 1));
            Assert.Contains("It is X's turn, not O's", ex.Message);
        }

        [Fact]
        public void PlayerX_RowWin_ShouldEndGameAndUpdateScoreboard()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);

            // Act
            _gameService.MakeMove(s.Id, "X", 0); // Row 1
            _gameService.MakeMove(s.Id, "O", 3); // Row 2 block attempt
            _gameService.MakeMove(s.Id, "X", 1);
            _gameService.MakeMove(s.Id, "O", 4);
            _gameService.MakeMove(s.Id, "X", 2); // Row 1 completed

            // Assert
            var final = _gameService.GetGame(s.Id);
            Assert.Equal(GameStatus.Won, final.Status);
            Assert.Equal("X", final.Winner);
            Assert.Equal(new List<int> { 0, 1, 2 }, final.WinningCells);
            
            var scores = _scoreboard.GetScoreboard();
            Assert.Equal(1, scores.WinsX);
        }

        [Fact]
        public void UndoLastMove_InTwoPlayerMode_ShouldRemoveOneMove()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);
            _gameService.MakeMove(s.Id, "X", 0);
            _gameService.MakeMove(s.Id, "O", 4);

            // Act
            var undone = _gameService.UndoLastMove(s.Id);

            // Assert
            Assert.Equal("O", undone.CurrentPlayer);
            Assert.Empty(undone.Board[4]);
            Assert.Equal("X", undone.Board[0]);
            Assert.Single(undone.MoveHistory);
        }

        [Fact]
        public void Undo_WinningGame_ShouldAdjustScoreboardAndStatusCorrectly_OptionB()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.TwoPlayer);
            _gameService.MakeMove(s.Id, "X", 0); 
            _gameService.MakeMove(s.Id, "O", 3); 
            _gameService.MakeMove(s.Id, "X", 1);
            _gameService.MakeMove(s.Id, "O", 4);
            _gameService.MakeMove(s.Id, "X", 2); // X Wins, Score +1

            var currentScores = _scoreboard.GetScoreboard();
            Assert.Equal(1, currentScores.WinsX);

            // Act
            var undone = _gameService.UndoLastMove(s.Id); // Undo win move

            // Assert
            var revertedScores = _scoreboard.GetScoreboard();
            Assert.Equal(0, revertedScores.WinsX); // Recalculated / decremented scoreboard (Option B)
            Assert.Equal(GameStatus.InProgress, undone.Status);
            Assert.Null(undone.Winner);
            Assert.Null(undone.WinningCells);
            Assert.Equal("X", undone.CurrentPlayer); // It's X's turn again to complete
        }

        [Fact]
        public void ComputerMode_ShouldTriggerAIResponseAndFollowPriorities()
        {
            // Arrange (Computer Mode, human X, CPU O)
            var s = _gameService.CreateGame(GameMode.Computer);

            // Act: Human moves center
            _gameService.MakeMove(s.Id, "X", 4);

            // Assert: Computer (O) should have executed its turn, and it is X's turn again
            var state = _gameService.GetGame(s.Id);
            Assert.Equal("X", state.CurrentPlayer);
            Assert.Equal(2, state.MoveHistory.Count);

            // Computer should take corner because center index 4 was taken by X
            var oMoves = state.MoveHistory.Where(m => m.Player == "O").ToList();
            Assert.Single(oMoves);
            
            int cpuCellIndex = oMoves[0].CellIndex;
            Assert.Contains(cpuCellIndex, new[] { 0, 2, 6, 8 }); // Cornerset
        }

        [Fact]
        public void ComputerAI_ShouldBlockOpponent()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.Computer);
            _gameService.MakeMove(s.Id, "X", 0); // X Corner
            // Computer takes Center index 4 automatically (Priority 3)
            
            // Act: X goes for horizontal win at index 1
            _gameService.MakeMove(s.Id, "X", 1);

            // Assert: Computer O MUST take horizontal block at index 2 (Priority 2)
            var state = _gameService.GetGame(s.Id);
            Assert.Equal("O", state.Board[2]);
        }

        [Fact]
        public void ComputerAI_ShouldPrioritizeItsOwnWin()
        {
            // Arrange
            var s = _gameService.CreateGame(GameMode.Computer);
            // X Center, O Corners, setup O at 0 and 1
            _gameService.MakeMove(s.Id, "X", 4); // X takes Center. O takes first Corner index 0 automatically in AI step
            _gameService.MakeMove(s.Id, "X", 8); // X takes Corner 8. O blocks/plays corner 2 in AI step
            
            // Now O has index 0 and index 2. Index 1 is empty. 
            // O has a win possibility at 1. Complete horizontal.
            // X plays index 3.
            _gameService.MakeMove(s.Id, "X", 3); // O should bypass any blocking or random play to complete vertical/horizontal and take the WIN!

            var state = _gameService.GetGame(s.Id);
            Assert.Equal("O", state.Board[1]); // O takes index 1 to WIN!
            Assert.Equal(GameStatus.Won, state.Status);
            Assert.Equal("O", state.Winner);
        }
    }
}
