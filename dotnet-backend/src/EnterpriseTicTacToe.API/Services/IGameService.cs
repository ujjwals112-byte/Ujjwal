using System;
using EnterpriseTicTacToe.API.Models;

namespace EnterpriseTicTacToe.API.Services
{
    public interface IGameService
    {
        GameSession CreateGame(GameMode mode);
        GameSession GetGame(Guid id);
        GameSession MakeMove(Guid id, string player, int cellIndex);
        GameSession UndoLastMove(Guid id);
        GameSession ResetGame(Guid id);
    }
}
