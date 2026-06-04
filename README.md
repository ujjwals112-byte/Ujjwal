# Enterprise Tic-Tac-Toe Suite 🎮

I built this project to demonstrate a clean, modern, full-stack implementation of a Tic-Tac-Toe gaming system. It couples a robust **ASP.NET Core 8 Web API** backend with a reactive **Angular 18** frontend utilizing **Signals**, **RxJS**, and **Tailwind CSS**. 

Rather than relying on basic client-only logic, the entire state engine, concurrent sessions, scoreboard history, and AI strategies are managed server-side. I focused on clean separation of concerns, concurrency safety, dynamic game history rolling-back, and a comprehensive automated test suite.

---

## 🚀 Architectural Blueprint

The application is structured as a clear distributed system:
*   **The Backend (C# / .NET 8 Web API)**: Formulated as a stateless controller layer communicating with a thread-safe in-memory session manager. It handles game simulation, AI move generation, scoreboard persistence, and history restoration.
*   **The Frontend (TypeScript / Angular 18)**: Built entirely around Angular's modern **Signals** API for lightning-fast, predictable change detection, paired with **RxJS** pipelines to stream user interactions directly to backend REST endpoints.

---

## ✨ Features Implemented

1.  **Multiple AI Difficulty Options**: Restructure vs-Computer mode with three adaptive modes:
    *   **Easy**: Plays unpredictable, randomly selected valid moves.
    *   **Medium**: A 50/50 split of strategic blocks and random choices.
    *   **Hard**: Follows a deterministic 5-step win/block/center/corner rule matrix.
2.  **Two-Player Mode**: Local pass-and-play supporting instant turns and live indicators.
3.  **Active Move Log with GPS Coordinates**: Live history tables reporting exact indices translated on the fly into human-readable grids (such as `Row 2, Column 3`).
4.  **State-Safe Undo Operations (Option B)**: Reverts state changes accurately. Clicking Undo dynamically checks the mode:
    *   In *Two-Player mode*, it rolls back the single latest player move.
    *   In *vs-Computer mode*, it rolls back a full turn pair (both the computer's move and your preceding move).
    *   **Score Correction**: If a game had already ended in a Win/Draw when Undo is clicked, the system dynamically deducts that point from the persistent scoreboard server counters.
5.  **Robust Concurrency Control**: Session states are isolated on the server using `ConcurrentDictionary` and guarded by thread locks, allowing multiple independent browser tabs to play separate matches concurrently.
6.  **Interactive Dashboard Theme**: Sleek slate UI utilizing a high-contrast palette (Teal `X`, Amber `O`) with modern micro-animations.

---

## 🛠️ Step-by-Step Local Setup

### Running the Backend REST API
Ensure you have the **.NET SDK 8.0** installed on your workstation.

1.  Open your terminal and navigate to the API project directory:
    ```bash
    cd dotnet-backend/src/EnterpriseTicTacToe.API
    ```
2.  Restore the dependencies:
    ```bash
    dotnet restore
    ```
3.  Boot the backend host:
    ```bash
    dotnet run
    ```
4.  **Verification**: 
    - The API starts on Secure HTTPS `https://localhost:7111` and HTTP `http://localhost:5111`.
    - You can head to `https://localhost:7111/index.html` in your browser to inspect or test all endpoints live via **Swagger UI**.

---

### Running the Angular Client App
Ensure you have **Node.js (v18+)** and **npm** installed.

1.  Open a separate terminal window and head to the client root directory:
    ```bash
    cd angular-frontend
    ```
2.  Install all packages:
    ```bash
    npm install
    ```
3.  Start the local Angular environment server:
    ```bash
    ng serve
    ```
4.  **Play**: Open `http://localhost:4200` to interact with the game.

---

## 🧪 Testing and Verification

I wrote a suite of automated unit tests to ensure that the core winner checks, invalid moves, and AI strategies are mathematically correct.

To execute the unit tests:
1.  Navigate to the testing directory:
    ```bash
    cd dotnet-backend/tests/EnterpriseTicTacToe.Tests
    ```
2.  Run the dotnet test runner:
    ```bash
    dotnet test
    ```

The assertions validate:
*   Horizontal, vertical, and diagonal winning line coordinates.
*   Draw states occurring on the 9th move.
*   Correct AI blocking moves when a player is on the verge of winning.
*   "Option B" score decrements when rollback triggers post-match victory.

---

## 📡 API Endpoint Reference

The backend communicates via lightweight JSON payloads. Below is a summary of the active endpoints:

| Method | Endpoint | Use Case | Payload Sample |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/games` | Starts a new session | `{ "mode": 1, "difficulty": 2 }` *(Mode 0: TwoPlayer, 1: Computer; Diff 0: Easy, 1: Medium, 2: Hard)* |
| **GET** | `/api/games/{id}` | Fetches active board/turn state | None |
| **POST** | `/api/games/{id}/moves` | Registers a move | `{ "player": "X", "cellIndex": 4 }` |
| **POST** | `/api/games/{id}/undo` | Invokes dynamic rollback | None |
| **POST** | `/api/games/{id}/reset` | Restarts current board (retains scores) | None |
| **GET** | `/api/scoreboard` | Retrieves global scorecard | None |
| **POST** | `/api/scoreboard/reset` | Resets global scorecard | None |

---

## 🧠 AI Co-Pilot & Prompt Engineering Strategy

Rather than letting AI build this system end-to-end, I wanted to act as the head architect. I designed the structure, wrote the API route endpoints, and built the Angular state services, but I treated LLMs (such as Claude 3.5 Sonnet and Gemini) as specialized static math calculators. 

By writing highly specific, isolated prompts with strict input/output bounds, I had AI generate deterministic logic blocks, which I then integrated and manually refined.

Here is the exact playbook of how I designed my prompts to solve key algorithms:

### Prompt 1: Designing the Option B Stateful Rollback Logic (C#)
*   **Target Context**: Creating a robust undo mechanism that can correctly reconstruct past board layouts from a log of coordinates, adjust scoreboard states retrospectively, and remain concurrent-safe.
*   **Prompt I wrote**:
    > "I am writing a game state manager in a C# Web API. The system stores GameSession objects in an in-memory repository. A game has a list of moves `{ integer index, player tag }`. If a match concludes with a winner (or a draw) and the scorecard is incremented, and then the user selects 'Undo', I need to revert that match-end state. 
    > 
    > Write a C# helper method that:
    > 1. Checks if the log has enough moves.
    > 2. Re-evaluates if the game state was already marked won/draw, and if so, instructs me on how to decrement the current scoreboard.
    > 3. Truncates either the last 1 move (TwoPlayer mode) or last 2 moves (vs Computer mode).
    > 4. Completely rebuilds the 3x3 board array state (9 string elements) step-by-step from the remaining historical moves so we never end up with corrupt states. Make the lookup thread-safe."
*   **How I refined the result**: The AI provided a clean sequential replay generator. I integrated it into my `GameService` and wrapped the execution blocks in explicit thread-safety loops (`lock (session)`) to prevent racing conditions from concurrent tabs.

---

### Prompt 2: Mapping predictable AI Defense & Move Priority States
*   **Target Context**: Generating a highly defensive, rule-based AI opponent that can reliably analyze the 1D board array and make logical choices.
*   **Prompt I wrote**:
    > "I need a deterministic search function in C# for a computer player 'O' playing against player 'X' on a 1D board of 9 cells. I want the AI to run according to these strict priorities:
    > Priority 1: Check if 'O' can immediately win in 1 move, return that cell index.
    > Priority 2: Check if 'X' has two in a row and block their winning move.
    > Priority 3: Grab the center square (index 4) if open.
    > Priority 4: Select from remaining open corner indices [0, 2, 6, 8].
    > Priority 5: Fallback to the first available index.
    > Write the helper method `int FindBestMove(string[] board)` returning the optimal 0-8 position. Keep it lightweight and free of external package dependencies."
*   **How I refined the result**: The AI generated simple static array checks. I integrated this logic as a core utility inside my `GameService`, ensuring that it triggers automatically as a callback on the server every time a human player registers an action.

---

### Prompt 3: Modeling Multi-Difficulty AI Selector Branches
*   **Target Context**: Adding Easy/Medium/Hard difficulty options dynamically in the C# server logic.
*   **Prompt I wrote**:
    > "I want to add difficulty levels to my computer opponent in C#. Let's use an enum `DifficultyLevel { Easy, Medium, Hard }`. 
    > - Easy mode: AI chooses any random open index from the board.
    > - Hard mode: AI uses our existing deterministic 5-step rules priority matrix.
    > - Medium mode: The AI has a 50% chance of making a random move, and a 50% chance of playing the optimal Hard move.
    > Write a clean, high-performance method to branch these. Make sure the random number generator is thread-safe and doesn't get reseeded on every call."
*   **How I refined the result**: I converted the RNG selection to use a static readonly `Random` instance at class level to ensure high entropy, and integrated this directly with the UI request binding payloads. This lets the user toggle between difficulty levels seamlessly during vs-computer play.

---

## 🎨 Notable Design Decisions

*   **Command Replay Pattern**: The "Undo" action doesn't try to guess or use inverse math calculations. It clears the board and replays history sequentially up to the targeted index. This guarantees mathematical model correctness.
*   **Stateless REST API via Session UUID**: Users can open multiple browser windows to play separate matches simultaneously. Every tab is bound to a unique state GUID generated on game initialization so sessions never cross-talk.
*   **Angular Signals Over Raw State**: By using `signal` and `computed`, the frontend avoids unnecessary heavy re-renders. Component elements only refresh when their specific bound slice of data changes.
