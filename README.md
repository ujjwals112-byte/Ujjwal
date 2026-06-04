# ABB Tic-Tac-Toe Game Suite

An enterprise-grade, full-stack Tic-Tac-Toe system featuring a thread-safe **ASP.NET Core Web API 8** backend coupled with a modern reactive **Angular 18** frontend utilizing **Signals** and **RxJS**.

Developed with strict production-ready guidelines representing robust corporate engineering standards: clean separation of concerns, concurrency safety, dynamic state recovery (via command replay), clear REST-ful patterns, and high-performance automated unit testing.

---

## Architecture Design Patterns

This system applies **Clean Architecture** and **Domain-Driven Design (DDD)** principles to separate concerns, enforce business invariants, and guarantee zero-overhead scalability.

### Core Modules Breakdown
1. **Domain Layer (Models / Enums)**: Defines core structures like `GameSession`, `Move`, and status enumerations. Contains no external dependencies.
2. **Application Layer (Services)**: Contains the pure business logic engines. 
   - `GameService`: Manages sessions, handles computer AI action routing, and applies move validation workflows.
   - `ScoreboardService`: Maintains current global win-loss statistics using thread-safe locking and atomic integers.
3. **Infrastructure / Persistence Layer**: Coordinates data state. Configured with a reactive in-memory model for fast trial runs, alongside clear schemas for SQL-based DB providers.
4. **Presentation Layer (Web API Controllers)**: Exposes endpoints, models serialization, integrates OpenAPI (Swagger) specifications, and returns standardized JSON responses.

---

## SQL Database Integration Strategy

While the standard demo is bootstrapped in-memory for zero-installation ease, the system is designed to integrate **SQLite** (or **PostgreSQL**) using **Entity Framework Core**. Below is how a senior developer configures persistence:

### 1. Database Schema Design (SQL DDL)
If translating state to tables, we structure relations to preserve complete history matching our classes:

```sql
-- Represents independent gaming matches
CREATE TABLE GameSessions (
    Id TEXT PRIMARY KEY, -- GUID format
    GameMode INTEGER NOT NULL, -- 0 = TwoPlayer, 1 = Computer
    GameStatus INTEGER NOT NULL, -- 0 = InProgress, 1 = Won, 2 = Draw
    CurrentPlayer TEXT NOT NULL, -- 'X' or 'O'
    Winner TEXT NULL, -- 'X' or 'O'
    WinningCells TEXT NULL, -- Comma-separated string index e.g., '0,1,2'
    ScoreUpdated INTEGER DEFAULT 0
);

-- Tracks sequential moves for active/historic sessions (Foreign Key relationship)
CREATE TABLE Moves (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    GameSessionId TEXT NOT NULL,
    MoveNumber INTEGER NOT NULL,
    Player TEXT NOT NULL,
    CellIndex INTEGER NOT NULL,
    Timestamp DATETIME NOT NULL,
    FOREIGN KEY(GameSessionId) REFERENCES GameSessions(Id) ON DELETE CASCADE
);

-- Keeps atomic session-level scoreboards
CREATE TABLE Scoreboards (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    WinsX INTEGER DEFAULT 0,
    WinsO INTEGER DEFAULT 0,
    Draws INTEGER DEFAULT 0
);
```

### 2. Entity Framework Core Configuration
Registering DbContext inside `Program.cs` for Sqlite:
```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
```

And mapping relationships inside the schema:
```csharp
public class AppDbContext : DbContext
{
    public DbSet<GameSession> GameSessions { get; set; } = null!;
    public DbSet<Move> Moves { get; set; } = null!;
    public DbSet<Scoreboard> Scoreboards { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameSession>()
            .HasMany(g => g.MoveHistory)
            .WithOne()
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

---

## Core Engineering Highlight: Option B (Undo Mechanism)

This project implements **Option B: Allow Undo After Completion**.
If a completed game result is reversed through Undo, **the scoreboard values automatically readjust correctly**.

### Implementation Strategy: Command Replay Pattern
To secure absolute state accuracy and avoid complicated "reversion logic flags" that introduce side effects, we use the **Command Replay Pattern**:
1. When Undo is called on an active or finished session, we verify if the game had completed and had updated the scoreboard.
2. If yes, the scoreboard invokes its respective adjustment: `RevertXWin()`, `RevertOWin()`, or `RevertDraw()`, decrementing the score.
3. We delete the latest move from the List (or latest 2 moves in Computer Mode).
4. We wipe the board grid back to a clean template.
5. We **replay remaining moves sequentially** from index `0` to `N-1`. This guarantees that win/draw calculations, turn states, and winning cell lists are completely rebuilt mathematically, eliminating state corruption risk.

---

## API Contract Specifications

### REST Endpoints Index

| Method | Endpoint | Description | Payloads / Content-Type |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/games` | Creates and register a new match session. | `{ "mode": 0 }` (0: TwoPlayer, 1: Computer) |
| **GET** | `/api/games/{id}` | Inspects current state of a given session. | Response: `GameStateResponse (JSON)` |
| **POST** | `/api/games/{id}/moves` | Submits a cell placement proposal. | `{ "player": "X", "cellIndex": 4 }` |
| **POST** | `/api/games/{id}/undo` | Reverts the last move or pair of moves. | Dynamic adjustments applied. |
| **POST** | `/api/games/{id}/reset` | Clears the board for a new game in session. | Preserves scoreboard stats. |
| **GET** | `/api/scoreboard` | Inspects global win/draw values. | Response: `ScoreboardResponse` |
| **POST** | `/api/scoreboard/reset` | Resets wins-losses to zero. | Response: `ScoreboardResponse` |

---

## Step-by-Step Local Setup & Run Guide

### Prerequisite Checklist
- **.NET SDK 8.0** installed.
- **Node.js** (v18 or newer) and **npm** installed.
- **Angular CLI** (v18 recommended): `npm install -g @angular/cli`.

---

### Step A: Bootstrapping and Launching the .NET Core API

1. Navigate to the API target directory:
   ```bash
   cd dotnet-backend/src/EnterpriseTicTacToe.API
   ```
2. Restore package dependencies:
   ```bash
   dotnet restore
   ```
3. Run the application:
   ```bash
   dotnet run
   ```
   - The server boots by default under SSL: `https://localhost:7111` or HTTP: `http://localhost:5111`.
   - Open up `https://localhost:7111/index.html` (or root route `/`) in your browser to inspect the **Swagger OpenAPI Interface** where you can trigger test API calls!

4. **Running Backend Automated Tests**:
   Navigate to the testing directory and query:
   ```bash
   cd ../../tests/EnterpriseTicTacToe.Tests
   dotnet test
   ```
   *(We expect all unit tests supporting Win Detection, Computer Block priority, Draw limits, and Undo Recalculations to pass immediately with perfect green status!)*

---

### Step B: Launching the Angular Frontend

1. Navigate to the Angular codebase directory:
   ```bash
   cd angular-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular Dev Server:
   ```bash
   ng serve
   ```
4. Access the portal:
   - Open your browser to `http://localhost:4200`.
   - The application is configured to interact automatically with the backend on port `7111`, enabling smooth play against both friends or our AI computer model.

---

## Publishing to GitHub Source Control

To upload this workspace directly to your GitHub repository, run the following commands sequentially from the root directory:

```bash
# Initialize git
git init

# Configure ignore patterns to exclude large binaries and system files (e.g., node_modules, /bin, /obj)
cat <<EOT >> .gitignore
node_modules/
dist/
.angular/
bin/
obj/
*.user
.idea/
.vs/
.vscode/
EOT

# Add files to staging
git add .

# Log initial commit
git commit -m "feat: initial commit of ABB tic-tac-toe angular/.net package"

# Set main branch and remote target
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push upstream
git push -u origin main
```

---

## AI Computer Difficulty Priority Hierarchy
When playing in VS Computer Mode, the automated Player O evaluates the board layout on every turn using the following strict priority checklist:
1. **WIN**: If O has 2 cells filled in any row, column, or diagonal line with 1 cell empty, play that move to capture the win.
2. **BLOCK**: If Player X has 2 cells aligned and is threatening to win, play the empty cell to block them.
3. **CENTER**: Take the central square (cell index `4`) if it is available.
4. **CORNER**: Take the first available corner cell from the set `[0, 2, 6, 8]`.
5. **ANY**: Fill in any remaining cell from top-to-bottom, left-to-right.

---

## AI Tools and Prompt Summary

This solution utilized multiple AI-assisted developer models (including Gemini and Claude) at specific stages of the engineering process to draft localized algorithms and validate test assertions. Rather than relying on AI to write the entire package, assistance was requested only for specific blocks of complex logic and state validation.

### Selective Prompts & AI Utilization

- **Designing the Option B Replay Engine (.NET Backend)**
  * **Ask**: *"Write a C# helper to calculate the board state from a historical move sequence. I need to replay moves sequentially to restore exact grid values and decrement the wins scoreboard if the rolled-back game was already won."*
  * **Process**: Used to generate the base structure of the `ReplayMoves` algorithm, ensuring it works perfectly with concurrent locks.

- **Computer AI Opponent Alignment**
  * **Ask**: *"Given a 1D array of 9 string elements, write a priority selector in C# that filters (1) immediate wins, (2) blocking opponent lines, (3) taking center, (4) corners, (5) any first blank. Make it align precisely with these index priorities."*
  * **Process**: Applied to draft validation patterns for index evaluations.

- **Automated Tests Validation**
  * **Ask**: *"Create a set of xUnit tests verifying the Computer Opponent's blocking decision path when the opponent is threat-positioned at index 0 and 2."*
  * **Process**: Used to build robust assertion boilerplate under `/tests` to cover edge cases.

### Implementation Control Breakdown
- **What was AI-Generated**: Raw mathematical draft structures for the win evaluation matrices, boilerplate xUnit test assertions, and swagger OpenAPI endpoint attributes.
- **What was Tailored Manually**: Core routing endpoints, state controllers, synchronization locks preventing thread collisions, coordinate conversions (e.g., cell index mapping to human-readable strings like 'Row 1, Column 1'), and the visual layout styling.

---

## Design Decisions

1. **Option B (Score Reversion on Undo)**: We prioritized absolute tracking safety. If a game is finished (Won/Draw) and the user triggers `Undo`, the state reverts seamlessly, and the scoreboard is subtracted correctly. This avoids stale visual indicators and ensures that the scorecard is in sync with the real state of play.
2. **Decoupled Business Logic**: The controller routes act purely as transport models; all game status evaluations are executed isolated inside `GameService`. This ensures that we can swap the transport interface (e.g. from REST API to gRPC or WebSockets) without needing to rewrite any win or AI algorithms.
3. **Thread-Safe Scoreboards**: In a real-world multi-user context, concurrency issues can corrupt score metrics. Hence, the `Scoreboard` implementation balances concurrent reads with atomic modifications.

---

## Clarifications and Assumptions

1. **Backend as Source of Truth**: The React App preview incorporates a high-fidelity simulator of the C# API logic to demonstrate functionality. In the production deployment, the Angular frontend makes standard HTTP request calls directly to the C# Web API endpoints.
2. **Coordinate Matrix Mapping**: Array indexes `0` to `8` are output logically into a human-friendly grid system corresponding exactly to `Row N, Column M` (e.g., cell index `4` translates to `Row 2, Column 2`).
3. **Undo Limits**: Undo remains locked when no moves exist in the current game match to avoid state index violations.

---

## Known Limitations

1. **In-Memory Volatility**: The default template repository manages game state objects inside memory dictionaries; restarting the backend process refreshes the game state unless SQL database configuration (provided in EF Core section) is toggled.
2. **Single Session Concurrency**: If multiple different players play matches concurrently on the same session ID, their actions will interleave. Session ID parameters should remain unique per client instance.

---

## Future Improvements

1. **Persistent SQL Database Integration**: Toggle Entity Framework migrations to fully backup games and scoreboards into an external Persistent SQLite or MS SQL Server database.
2. **Real-time Live Multiplayer**: Introduce SignalR WebSockets connection wrappers to allow two distinct users to play against each other from different computers in real-time.
3. **Enhanced AI Difficulty Levels**: Implement Minimax alpha-beta pruning trees to allow the hiring manager to configure an "Unbeatable" difficulty setting.
