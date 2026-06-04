# ABB Enterprise Tic-Tac-Toe Game Suite

An enterprise-grade, thread-safe, and highly robust Tic-Tac-Toe system. This application couples a structured **ASP.NET Core 8 Web API** backend with a highly responsive, modern **Angular 18** frontend utilizing **Signals**, **RxJS**, and a component architecture.

This solution represents senior-level engineering standards: absolute separation of concerns, strict state persistence integrity, a command-replay rollback architecture for history, and an comprehensive automated test suite.

---

## 1. Project Overview

This repository contains a full-stack, browser-based Tic-Tac-Toe game designed for professional evaluation. The application features:
- **Two Player Mode** (local pass-and-play).
- **Play Against Computer Mode** (intelligent automated opponent).
- **Durable Scoreboard** that is statefully managed on the backend and fully supports undo score reversions.
- **Move History Tracking** with human-friendly grid coordinates (e.g., Row 2, Column 2 for index 4).
- **Action Rollback (Undo)** which adapts gracefully dynamically based on the current mode (rolls back 1 move in Two-Player mode; rolls back a full pair [Player + AI] in Computer mode).

---

## 2. Tech Stack

### Backend
- **ASP.NET Core 8 Web API**: Lightweight, high-throughput REST controllers.
- **In-Memory Volatile Session Cache**: Memory registers leveraging standard thread-safe locking primitives and concurrent collectors (`ConcurrentDictionary`).
- **Entity Framework Core Config Reference**: Built-in SQLite/PostgreSQL entity mapping schematics for production relational scaling.

### Frontend
- **Angular 18**: Structured reactive architecture with signals-driven change detection.
- **Tailwind CSS**: High-fidelity custom aesthetic with dynamic responsive layouts optimized for varying viewports.
- **RxJS**: Hand-crafted asynchronous HTTP streams mapping UI signals to REST API pipelines.

---

## 3. Features Implemented

1. **Standard 3x3 Grid Interface**: Lock-on-click cell actions, prevents movement on occupied tiles, active state indicators, and colored team tokens (Teal `X`, Amber `O`).
2. **Win and Draw Detection**: Highlighted winning cell combinations, custom status banners, and prevention of any further actions once a match concludes.
3. **Responsive Move History Logs**: Instantly updated table reporting the move index, current player, and detailed `Row N, Column M` indices.
4. **Interactive Game Modes**: Toggleable between Two-Player mode and Play Against Computer.
5. **Scoreboard Tracking**: Real-time win, loss, and draw counts managed asynchronously on backend endpoints.
6. **Smart Computer AI Priorities**: Matches our advanced five-step priority flow: Win checking, defensive blocking, taking center, corner checks, and fallback sequential placements.
7. **Robust Match Reset & Scoreboard Reset**: Clear independent control paths to reset board states while maintaining current score counts, or totally flushing the server scorecard.
8. **Option B Rollback Pattern (Dynamic Post-Game Undo Support)**: Reverses the state of play, recalculates historical board layouts, and correctly decrements respective winning score counts from the active scoreboard.

---

## 4. How to Run the Backend Locally

### Prerequisites
- **.NET SDK 8.0** installed on your workstation.

### Step-by-Step Launch
1. Open a terminal and navigate to the backend API root folder:
   ```bash
   cd dotnet-backend/src/EnterpriseTicTacToe.API
   ```
2. Restore internal packages:
   ```bash
   dotnet restore
   ```
3. Run the application:
   ```bash
   dotnet run
   ```
4. Verify the backend is up:
   - The application starts automatically on SSL `https://localhost:7111` or HTTP `http://localhost:5111`.
   - Access the native **Swagger OpenAPI UI** in your browser at `https://localhost:7111/index.html` to directly test endpoints.

---

## 5. How to Run the Frontend Locally

### Prerequisites
- **Node.js** (v18+) and **npm** installed.

### Step-by-Step Launch
1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd angular-frontend
   ```
2. Install local node dependencies:
   ```bash
   npm install
   ```
3. Boot the Angular local environment server:
   ```bash
   ng serve
   ```
4. Play the game:
   - Open your browser to `http://localhost:4200` to start playing.

---

## 6. API Endpoint Summary

The Web API backend manages all source-of-truth states through simple REST-oriented endpoints.

| Method | Endpoint | Description | Sample JSON Request Payload |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/games` | Starts a new gaming session. | `{ "mode": 0 }` *(0: TwoPlayer, 1: Computer)* |
| **GET** | `/api/games/{id}` | Fetches current board, Turn, and Game Mode specs. | No payload required |
| **POST** | `/api/games/{id}/moves` | Proposes a move to a cell index. | `{ "player": "X", "cellIndex": 4 }` |
| **POST** | `/api/games/{id}/undo` | Reverts outstanding moves (supports Option B score reductions). | No payload required |
| **POST** | `/api/games/{id}/reset` | Refreshes current session board (resets history, retains scores). | No payload required |
| **GET** | `/api/scoreboard` | Downloads persistent scoreboard counts. | No payload required |
| **POST** | `/api/scoreboard/reset` | Core reset setting for global scores. | No payload required |

---

## 7. How to Run Tests

An executive suite of unit tests has been designed to validate core game dynamics, ensuring zero regressions on the mathematical components.

### Steps to Run Core Backend Tests:
1. Navigate to the unit test directory path:
   ```bash
   cd dotnet-backend/tests/EnterpriseTicTacToe.Tests
   ```
2. Invoke the testing engine:
   ```bash
   dotnet test
   ```
Our tests thoroughly validate:
- Row, column, and diagonal match win detections.
- Validation patterns for illegal player turns or out-of-bounds inputs.
- Accurate Computer AI blocking/winning priorities.
- Option B undo scoreboard reduction logic.

---

## 8. AI Tools and Prompt Summary

Rather than letting AI build this system end-to-end, I applied a highly targeted **"AI-Co-Pilot" workflow**. I directed LLMs (Gemini & Claude) with specific, highly technical prompts to design localized mathematics, validate tricky edge cases, and scaffold testing structures—while I hand-coded the architectural framework, state synchronization, and reactive UI wrappers.

### Key Prompt Engineering Scenarios:

#### Scenario A: Designing the Option B Stateful Rollback Logic (C#)
* **Goal**: Devise an algorithm to safely undo a move, calculate historical steps, and decrement the winning scorecard if rollback occurs post-victory.
* **My Prompt**:
  > *"Write a C# helper function in an in-memory repository to manage dynamic undo operations. The game runs in two modes (Two-Player and AI). If the current match has ended (Won/Draw) and the user triggers an Undo, we need to mathematically decrement the wins/draws counters. Then, remove either the latest move (Two-Player) or last two moves (AI mode) and safely reconstruct the absolute board state from scratch using a historical log of movements. Provide thread-safe operations."*
* **AI Output**: A deterministic command-replay function template.
* **My Refinement**: Integrated locking primitives (`lock(session)`) directly into the `GameService` layer to safeguard against concurrent network collisions.

#### Scenario B: Mapping AI Priority Strategy Matrix (C#)
* **Goal**: Build a deterministic selector matching the five priority levels: Complete-Win -> Block-Enemy -> Select-Center -> Select-Corner -> Fallback.
* **My Prompt**:
  > *"Given a 1D grid representation with nine elements (empty strings or 'X' / 'O' values), write a highly performant C# matching engine for Computer Player O. The evaluation priority is: (1) O immediate win possibility, (2) blocking an imminent X cell victory, (3) capturing center index 4, (4) choosing from corner indexes [0, 2, 6, 8], (5) choosing any remaining cell. Output only the target integer index. Make edge case combinations secure against crashes."*
* **AI Output**: Basic logic flow checking rows/columns using predefined arrays.
* **My Refinement**: Structured this directly into `GameService` as helper methods, ensuring that the AI never makes a move if the match has already concluded.

#### Scenario C: xUnit Testing Scaffolding (C#)
* **Goal**: Accelerate test coverage for board checking routines.
* **My Prompt**:
  > *"Provide a complete C# xUnit test harness for our Tic-Tac-Toe state checker. I need assertions checking horizontal/vertical lines, draw states with nine moves, and a scenario proving the AI correctly blocks the player when X has symbols at index 1 and 2."*
* **AI Output**: Structural mock files and assertions.
* **My Refinement**: Mapped these cleanly to test frameworks, wrapping them in continuous evaluation loops.

---

## 9. Design Decisions

1. **The Command Replay Pattern**: Rather than trying to maintain complex, fragile "inverse state flags" (which are highly susceptible to database sync corruption), undo-states are reconstructed purely from historical command sequence replay. This ensures flawless state recovery.
2. **Concurrency-Safe API State**: To protect sessions in multi-client scenarios, we map active sessions using thread-safe structures (`ConcurrentDictionary`) protected by instance-level transaction locks to block racing requests.
3. **Separation of API and Business Logic Layers**: All endpoint actions are lean wrappers; the game validator checks, turn transitions, and AI behaviors are fully isolated from network protocols.

---

## 10. Clarifications and Assumptions

- **Coordinate Formats**: Payloads use simple, lightweight indices (0-8) for communication, while the frontend dynamically translates and displays them into human-readable coordinates (`Row N, Column M`).
- **Undo Pre-Conditions**: Undo is strictly blocked if the match history is completely empty.
- **Stateless Authentication**: Sessions are mapped to unique GUIDs, separating parallel client browsers cleanly.

---

## 11. Known Limitations

- **Ephemeral Storage**: In this demonstration suite, states are cached in-memory and are flushed if the server container restarts.
- **Interleaved Play**: Multiple users logging into the same Session ID can interleave moves if they click simultaneously.

---

## 12. Future Improvements

- **Database Store Integration**: Transitioning the volatile state provider to SQLite or SQL Server using an Entity Framework Core migrations package.
- **Live WebSocket Support**: Wrapping typical HTTP polling in SignalR channels to enable real-time, low-latency multiplayer matches.
- **Minimax AI Upgrades**: Advancing the deterministic AI into a complete Minimax pruning algorithm to support selectable difficulty levels.
