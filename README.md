# Enterprise Tic-Tac-Toe – System Documentation & Reference Manual

A secure, high-conformance, full-stack Tic-Tac-Toe system. This project integrates a robust **ASP.NET Core Web API backend** (implementing thread-safe state caching, algorithmic AI simulation modes, and API token security filters) with a **modern frontend architecture** (featuring a polished, highly responsive slate interface, reactive game state synchronization, and modular layout design).

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Features Implemented](#3-features-implemented)
4. [How to Run the Backend Locally](#4-how-to-run-the-backend-locally)
5. [How to Run the Frontend Locally](#5-how-to-run-the-frontend-locally)
6. [API Endpoint Summary](#6-api-endpoint-summary)
7. [How to Run Tests](#7-how-to-run-tests)
8. [AI Tools and Prompt Summary](#8-ai-tools-and-prompt-summary)
9. [Design Decisions](#9-design-decisions)
10. [Clarifications and Assumptions](#10-clarifications-and-assumptions)
11. [Known Limitations](#11-known-limitations)
12. [Future Improvements](#12-future-improvements)

---

## 1. Project Overview

The Enterprise Tic-Tac-Toe system provides an interactive, full-stack platform for tactical, grid-based matching. It delivers cross-framework consistency by defining highly structured data structures linking client views to server-side decision registers. 

### Core Architecture Flow
```
[ Frontend: React / Angular ] 
            │ 
            ▼ (X-API-KEY JSON Headers)
[ ASP.NET Core MVC Controllers ] 
            │ 
            ├─► [ ApiKeyAuth Filters ]  --> (Security Gate)
            │ 
            ▼
[ Enterprise Services Lifecycle ]
            ├─► [ IGameService ]        --> (Concurrent Session Registry & AI Engines)
            └─► [ IScoreboardService ]  --> (Atomic Thread-Safe Score Counters)
```

- **Interactive Clients**: Realized through modular component assemblies (with parallel options provided for modern React/Vite implementations and standalone Angular source configurations).
- **Service API Gateway**: Developed under a .NET platform pattern, mapping route parameters directly to deterministic state processors while enforcing security via request header inspection filters.

---

## 2. Tech Stack

The architecture of both components is built upon production-ready framework layers:

### A. Backend Services (.NET Core API)
- **Framework**: `ASP.NET Core (v8.0 / v7.0 compatible)`
- **Language**: `C#`
- **Dependency Scope**: Standard MVC routing, `IAsyncActionFilter` request middleware, Dependency Injection containers.
- **Data Collections**: Ephemeral thread-safe registers (`ConcurrentDictionary<Guid, GameSession>`) maintaining active match states.

### B. Frontend Clients (React & Angular Implementations)
- **Vite & React Ecosystem**: 
  - Framework: `React 19 (TypeScript)`
  - Styling: `Tailwind CSS (V4)` for crisp layouts and transitions
  - Core Motion: `motion` (`motion/react`) for smooth entry state and vector scaling
  - Iconography: `Lucide React`
- **Angular Source Structure**:
  - Framework: `Angular` (Modular TypeScript structure separating Components, Models, and HTTP connection layers).

---

## 3. Features Implemented

The system incorporates high-fidelity gaming parameters:

1. **Deterministic AI Engine (vs. Computer)**:
   - **Easy**: Selects randomly among remaining vacant cell coordinates.
   - **Medium**: Analyzes immediate threats and acts on clear winning avenues, fallback to random fields.
   - **Hard**: Executes a rigid, sequential priority checks matrix to ensure optimal board placement (details in section 9).

2. **Dual-Play Modes**:
   - **vs. Computer**: Single Player (as X) versus the automated, reactive background AI algorithm (as O). 
   - **Local PvP (Player vs. Player)**: Dynamic on-screen alternate click registering for side-by-side matches.

3. **Smart Back-Step (Undo Loop)**:
   - Reverts state variables smoothly.
   - In **PvP mode**, it populates the board back exactly by one move.
   - In **Computer mode**, it recursively removes **both** the AI's response and the player's triggering move, ensuring board state alignment.

4. **Synchronized Active Scoreboard**:
   - Live analytics for current play tracking (Wins X, Wins O, Draws) mapped instantly.
   - Fully interactive resetting functionality.

5. **Visual Customization**:
   - High-contrast toggle for eye-safe Dark and Light canvases.
   - Interactive detailed tactical instruction guide overlay modal.

---

## 4. How to Run the Backend Locally

### Prerequisites
- Install the **.NET Core SDK 8.0** (or compatible 7.0 release) from the official Microsoft portal.
- Verify installation via command line:
  ```bash
  dotnet --version
  ```

### Step-by-Step Directions
1. Navigate directly to the C# project core directory from your system terminal:
   ```bash
   cd dotnet-backend/src/EnterpriseTicTacToe.API
   ```
2. Restore all required NuGet configuration libraries and compiling tools:
   ```bash
   dotnet restore
   ```
3. Compile the assemblies to verify syntax and library links:
   ```bash
   dotnet build
   ```
4. Boot up the ASP.NET Core hosting container:
   ```bash
   dotnet run
   ```
5. By default, the application serves requests locally on development ports:
   - Non-secure HTTP: `http://localhost:5000` (or as overridden in `Properties/launchSettings.json`)
   - Secure HTTPS: `https://localhost:5001`

*(Note: Ensure your configuration sets the environment variable `AuthSecret:ApiKey` or falls back to the default master authorization token: `TicTacToeEnterpriseSecretKey2026`).*

---

## 5. How to Run the Frontend Locally

### A. Core React SPA (Vite Workspace)
#### Prerequisites
- Install **Node.js (v18.0 or higher)** and **npm**.

#### Booting instructions:
1. Navigate to the project root directory containing the primary `package.json` file.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite development preview pipeline (bound to development port 3000):
   ```bash
   npm run dev
   ```
4. Access the client application in your web browser by navigating to:
   ```
   http://localhost:3000
   ```
5. To execute linting and verify TypeScript compilation rules:
   ```bash
   npm run lint
   npm run build
   ```

### B. Angular Frontend Source Integration
The `/angular-frontend` subdirectory serves as a dedicated repository asset containing:
- `/src/app/app.component.ts` – The primary board rendering view controller.
- `/src/app/models/game.model.ts` – Interface modeling representing state bindings.
- `/src/app/services/game.service.ts` – The API proxy service connecting Angular clients to .NET Rest routes.

#### Steps to launch in an Angular Workspace:
1. Initialize an Angular CLI environment (requires `@angular/cli`):
   ```bash
   ng new enterprise-tictactoe-client --style=css --routing=false
   ```
2. Copy the contents of `/angular-frontend/src` into your new workspace, substituting the underlying template modules.
3. Install necessary environment libraries and trigger development host:
   ```bash
   npm install
   ng serve --port 4200
   ```

---

## 6. API Endpoint Summary

All .NET API endpoints are routed under `api/` and secured using a custom key inspection filter.

### Authentication Requirement
All network requests directed to the controller MUST supply the following HTTP header credential:
```http
X-API-KEY: TicTacToeEnterpriseSecretKey2026
```

### Endpoints Table

| HTTP Verb | REST Route Path | Target Payload Structure | Success Response Code | Role description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/games` | `{ "mode": "Computer", "difficulty": "Hard" }` | `201 Created` | Instantiates a new game GUID and outputs initial state parameters. |
| **GET** | `/api/games/{id}` | *None (Id parameter passed in URI)* | `200 OK` | Retrieves the exact board configuration and histories. |
| **POST** | `/api/games/{id}/moves` | `{ "player": "X", "cellIndex": 4 }` | `200 OK` | Registers a token. If Computer mode is active, triggers immediate AI calculation. |
| **POST** | `/api/games/{id}/undo` | *None* | `200 OK` | Reverts the last move (or dual move-pair in CPU matches) restoring context. |
| **POST** | `/api/games/{id}/reset` | *None* | `200 OK` | Clears the board matrix while keeping scoreboard registry scores intact. |
| **GET** | `/api/scoreboard` | *None* | `200 OK`| Fetches session-level scoreboard analytics. |
| **POST** | `/api/scoreboard/reset`| *None* | `200 OK` | Overwrites session scorecard metrics back to 0-0-0. |

---

## 7. How to Run Tests

### A. Backend Unit & Integration Tests (xUnit Suite)
The test library contains automated specifications ensuring correctness of standard moves, victory checks, blocking priorities, and status updates:
1. Navigate to the tests root container:
   ```bash
   cd dotnet-backend/tests/EnterpriseTicTacToe.Tests
   ```
2. Run testing engines via CLI:
   ```bash
   dotnet test
   ```
3. The runner executes the suite and outputs pass/fail status for all game-logic invariants.

### B. Frontend Code Validation
The Vite pipeline includes static type checks using the TypeScript engine:
```bash
npm run lint
```
This performs a full non-emitting verification process (`tsc --noEmit`) to intercept compile-time type errors.

---

## 8. AI Tools and Prompt Summary

### Prompt Methodology
We utilized an iterative prompt translation approach. This system was designed by translating high-level enterprise design documents into structural interfaces and implementation components.

- **Primary Prompts**:
  1. *"Deconstruct the MVC route specifications to build programmatic APIs in .NET Core API, enforcing API Key header checks on all incoming requests."*
  2. *"Formulate an Optimal AI strategy sequence inside the backend game engine to guarantee blocking parameters of opponent wins before looking for lower priority center or corner positions."*
  3. *"Style a highly polished React UI matching the requirements utilizing a cozy Slate background, custom color markers, and fluid entry animations."*

### AI Generation vs. Manual Refactoring
- **AI-Generated Foundations**: Core routing files, boilerplate model attributes (DTOs), default React hooks wrappers, and standard CSS classes.
- **Manual Adjustments & Enhancements**:
  - Implemented the double-rollback logic inside the React state and coordinated MVC service controller to prevent state desynchronization in Computer Mode.
  - Rectified custom esbuild compiling parameters within React to ensure build conformance when bundling.
  - Eliminated repetitive/unrequested telemetry text (such as redundant logs or debug margins) ensuring a high-end human design.

---

## 9. Design Decisions

1. **Strategic AI Logic Hierarchy (Hard Difficulty)**:
   The AI system does not execute random choices on Hard mode; it systematically resolves coordinates in this priority sequence:
   $$\text{Win Move Search (O)} \longrightarrow \text{Block Opponent Fork (X)} \longrightarrow \text{Center Occupancy (1,1)} \longrightarrow \text{Corners Strategy} \longrightarrow \text{Sides}$$
   
2. **Visual Polishing (Modern Slate Theme)**:
   Avoided standard gradients and unnecessary clutter. The visual interface uses a warm slate backdrop (`#0f172a`), elegant typography (Inter displayed with tight tracking), custom active-state indicators (teal for `X`, amber for `O`), and fluid animation layers utilizing `motion/react`.

3. **Stateless Backend Storage**:
   By using static concurrent memory systems, the service layer ensures instant response times on API requests without the overhead or latency of standard transactional databases.

---

## 10. Clarifications and Assumptions

- **Stateless Persistence Assumption**: It is assumed that concurrent in-memory storage represents a sufficient data store for quick-play session matching. Active sessions are kept on the hosting container's memory registry and expire upon container restart.
- **Single-Screen Hotseat (Local PvP)**: It is assumed that 2-Player local matching is performed in hotseat mode (on a single shared viewport device) or alternating click entries.
- **Fixed Board Dimensions**: The system assumes standard $3 \times 3$ grid spacing. Custom grid modifiers are outside the core conformance guidelines.

---

## 11. Known Limitations

- **Horizontal Scaling Limits**: Since sessions reside in-memory (`ConcurrentDictionary`), distributing the backend across multiple servers behind a load balancer would cause "Session Not Found" errors unless server sticky sessions are config-enabled.
- **No Shared Websockets**: Collaborative play is restricted to local hotseat or single-device simulations. Remote multi-device synchronizations require WebSocket/SignalR connections.

---

## 12. Future Improvements

1. **Distributed State Store**: Move session caching from local system threads to a shared memory network layer (e.g., **Redis Cache**) or database (e.g., **EF Core** + **PostgreSQL**).
2. **WebSockets Integration**: Add a **SignalR / Socket.io** communication layer for active remote multiplayer lobbies.
3. **Impenetrable AI with Minimax**: Upgrade the analytical hard AI check logic into a complete **minimax/alpha-beta pruning algorithm** for absolute, mathematical play safety.
4. **Client Translation (i18n)**: Integrate localization hooks to render interface elements in multi-lingual parameters seamlessly.
