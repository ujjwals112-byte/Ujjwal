# 🎮 ABB Tic-Tac-Toe Game Suite

An enterprise-grade, full-stack Tic-Tac-Toe system featuring a robust, thread-safe **ASP.NET Core Web API 8** backend coupled with a modern reactive **Angular 18** frontend utilizing **Signals** and **RxJS**.

Developed with production-ready guidelines representing 10+ years of corporate engineering standards: separation of concerns, concurrency safety, dynamic state recovery (replaying commands), clear REST-ful patterns, and high-performance automated unit testing.

---

## 🏗️ Architecture Design Patterns

This system applies **Clean Architecture** and **Domain-Driven Design (DDD)** principles to separate concerns, enforce business invariants, and guarantee zero-overhead scalability.

### Core Modules Breakdown
1. **Domain Layer (Models / Enums)**: Defines core structures like `GameSession`, `Move`, and status enumerations. Contains no external dependencies.
2. **Application Layer (Services)**: Contains the pure business logic engines. 
   - `GameService`: Manages sessions, handles computer AI action routing, and applies move validation workflows.
   - `ScoreboardService`: Maintains current global win-loss statistics using thread-safe locking and atomic integers.
3. **Infrastructure / Persistence Layer**: Coordinates data state. Configured with a reactive in-memory model for fast trial runs, alongside clear schemas for SQL-based DB providers.
4. **Presentation Layer (Web API Controllers)**: Exposes endpoints, models serialization, integrates OpenAPI (Swagger) specifications, and returns standardized JSON responses.

---

## 🗄️ SQL Database Integration Strategy

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

## 🧠 Core Engineering Highlight: Option B (Undo Mechanism)

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

## 🌐 API Contract Specifications

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

## 💻 Step-by-Step Local Setup & Run Guide

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

## 🐙 Publishing to GitHub Git Source Control

To upload this workspace directly to your GitHub repository and impress your panel, run the following commands sequentially from the root workspace directory:

```bash
# Initialize git in the root folder containing /dotnet-backend, /angular-frontend, and README.md
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

# Add all files to staging
git add .

# Log your mastercommit
git commit -m "feat: initial commit of enterprise tic-tac-toe angular/.net clean-architecture package"

# Create a new repository on GitHub.com and paste your repository link here
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push upstream
git push -u origin main
```

---

## ⚙️ AI Computer Difficulty Priority Hierarchy
When playing in VS Computer Mode, the automated Player O evaluates the board layout on every turn using the following strict priority checklist:
1. **WIN**: If O has 2 cells filled in any row, column, or diagonal line with 1 cell empty, play that move to capture the win.
2. **BLOCK**: If Player X has 2 cells aligned and is threatening to win, play the empty cell to block them.
3. **CENTER**: Take the central square (cell index `4`) if it is available.
4. **CORNER**: Take the first available corner cell from the set `[0, 2, 6, 8]`.
5. **ANY**: Fill in any remaining cell from top-to-bottom, left-to-right.
