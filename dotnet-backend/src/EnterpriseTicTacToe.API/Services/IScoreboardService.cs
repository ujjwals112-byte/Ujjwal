using EnterpriseTicTacToe.API.Models;

namespace EnterpriseTicTacToe.API.Services
{
    public interface IScoreboardService
    {
        Scoreboard GetScoreboard();
        void RecordXWin();
        void RecordOWin();
        void RecordDraw();
        void RevertXWin();
        void RevertOWin();
        void RevertDraw();
        void Reset();
    }
}
