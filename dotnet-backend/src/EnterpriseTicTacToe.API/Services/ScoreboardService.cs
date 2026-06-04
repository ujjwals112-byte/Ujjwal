using System.Threading;
using EnterpriseTicTacToe.API.Models;

namespace EnterpriseTicTacToe.API.Services
{
    public class ScoreboardService : IScoreboardService
    {
        private int _winsX = 0;
        private int _winsO = 0;
        private int _draws = 0;

        public Scoreboard GetScoreboard()
        {
            return new Scoreboard
            {
                WinsX = Volatile.Read(ref _winsX),
                WinsO = Volatile.Read(ref _winsO),
                Draws = Volatile.Read(ref _draws)
            };
        }

        public void RecordXWin() => Interlocked.Increment(ref _winsX);
        public void RecordOWin() => Interlocked.Increment(ref _winsO);
        public void RecordDraw() => Interlocked.Increment(ref _draws);

        public void RevertXWin()
        {
            int current = Volatile.Read(ref _winsX);
            if (current > 0)
            {
                Interlocked.CompareExchange(ref _winsX, current - 1, current);
            }
        }

        public void RevertOWin()
        {
            int current = Volatile.Read(ref _winsO);
            if (current > 0)
            {
                Interlocked.CompareExchange(ref _winsO, current - 1, current);
            }
        }

        public void RevertDraw()
        {
            int current = Volatile.Read(ref _draws);
            if (current > 0)
            {
                Interlocked.CompareExchange(ref _draws, current - 1, current);
            }
        }

        public void Reset()
        {
            Volatile.Write(ref _winsX, 0);
            Volatile.Write(ref _winsO, 0);
            Volatile.Write(ref _draws, 0);
        }
    }
}
