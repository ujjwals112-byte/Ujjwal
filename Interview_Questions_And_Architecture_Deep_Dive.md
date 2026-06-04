# GUIDE 2: ARCHITECTURE DEEP-DIVE & TECHNICAL INTERVIEW STUDY GUIDE
### Complete Full-Stack Architectural Specs, Core Logic Calculations, and Mock Interview Prep

This comprehensive manual is a preparation guide for technical assessments, architecture reviews, or client-facing demonstrations (e.g., at Accenture). Use this to explain exactly how the Enterprise Tic-Tac-Toe system is designed, how its algorithms calculate decisions, and how to defend your architectural choices under intense technical questioning.

---

## Part 1: Comprehensive Full-Stack Architecture Deep Dive

The solution is divided into three concrete, isolated layers designed around the principle of **Separation of Concerns**:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         FRONTEND LAYER (UIs)                                │
 │                                                                             │
 │    React Client (Vite)                       Angular Client                 │
 │   - Tailwind CSS Engine                    - Component-Service pattern      │
 │   - motion/react Animation                 - Typings / Interfaces           │
 └──────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    │ HTTPS (JSON payloads + X-API-KEY Header)
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         BACKEND WEB API GATEWAY                             │
 │                                                                             │
 │   Controllers (GamesController, ScoreboardController)                       │
 │   - Maps REST endpoints                                                     │
 │   - Enforces ApiKeyAuth Filters (Security validation)                      │
 └──────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    │ Dependency Injection Lifecycles
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         ENTERPRISE BUSINESS SERVICES                        │
 │                                                                             │
 │    IGameService                           IScoreboardService                │
 │   - Concurrency Management               - Atomic counters                 │
 │   - Thread-safe Caching                  - Thread-safe score registry      │
 │   - Decision-Priority AI Engines                                            │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1. The Presentation Tier (React & Angular Clients)
*   **React + Vite Implementation**: Serves as the primary viewport. It is a state-managed React SPA. It employs Tailwind CSS for crisp layouts and `motion/react` to orchestrate smooth viewport transitions and state entry feedback. It handles state binding locally for speed, but communicates via HTTP service proxies to coordinate game instances.
*   **Angular Source Code Asset**: Serves as a modular client alternative. It aligns with the component-service architecture, splitting model typing declarations, HTTP operations, and template binding.

### 2. The API Controller Security Gateway (.NET Core Web API)
Written using ASP.NET Core controllers, this tier registers user inputs. It enforces system safety checking through custom action filters which validate security headers before passing payloads to service interfaces.

### 3. The Enterprise Business Services Tier
*   **Game State Cache Engine (`IGameService`)**: Manages the lifecycle of active boards. Rather than relying on transactional local database files, it processes states via in-memory data caches.
*   **Scorekeeping Register (`IScoreboardService`)**: Handles parallel scoreboards atomically, ensuring thread-safe reads and updates.

---

## Part 2: Logical Calculations & Internal Decision-Priority Matrices

### A. The Hard AI Priority Decision Matrix
The algorithm for the **Hard AI difficulty** is designed around a strict, sequence-prioritized decision tree:

```
[Is there an immediate winning move for Computer (O)?]
     │
     ├── YES ──► Write O to win cell. (End Calculation)
     │
     └── NO  ──► [Is there an opponent winning threat to block (X)?]
                       │
                       ├── YES ──► Place O in threatening cell to block.
                       │
                       └── NO  ──► [Is the center cell (1, 1) available?]
                                         │
                                         ├── YES ──► Occupy Center (1, 1).
                                         │
                                         └── NO  ──► [Are there empty corner cells?]
                                                           │
                                                           ├── YES ──► Take random empty corner.
                                                           │
                                                           └── NO  ──► Take random empty side.
```

#### Order of Complexity ($O(n)$)
*   Because the board size is fixed at $3 \times 3$ (exactly 9 cells), the calculation complexity is technically **$O(1)$ constant time**.
*   Even if scaled to an $N \times N$ viewport, analyzing lines for win and block checks requires analyzing exactly $2N + 2$ configurations (rows, columns, and diagonals). The scanning complexity is **$O(N^2)$**, rendering it highly performant compared to deep tree-exploration heuristics (like minimax searches without caching).

### B. Smart Undo State Rollbacks
The rollback logic differs based on playmode configuration parameters:
*   **Player vs. Player (PvP) Local Mode**:
    The undo trigger removes exactly **one** cell mark from the board list:
    $$\text{UndoClick} \longrightarrow \text{State} = \text{State}_{t-1} \longrightarrow \text{ToggleActivePlayer()}$$
*   **vs. Computer Mode**:
    Since the Player is X and the Computer is O, undoing only one step would leave the board in a state where it is the Computer's turn, triggering an unwanted, automatic computer move.
    Thus, the algorithm recursively extracts **two** moves (both the computer's response and your triggering move) to return the active turn cleanly back to you:
    $$\text{UndoClick} \longrightarrow \text{State} = (\text{State}_{t-1})_{\text{AI-move}} \longrightarrow \text{State} = (\text{State}_{t-2})_{\text{Player-move}}$$

---

## Part 3: High-Frequency Interview Questions (with Expert Answers)

Use these detailed questions and answers to prep for technical interviews.

### Q1: Explain the overall architectural layout of this multi-tier application. How do the frontend and backend communicate?
**Answer:**
"The application is structured as a full-stack, decoupled single-page architecture (SPA). The frontend layers—whether built with React or Angular—handle UI rendering, state binding, and user actions. The backend is built with ASP.NET Core Web API controllers.
The two communicate over secure HTTPS using standard REST protocols. The frontend sends JSON payloads in HTTP requests, and the backend resolves them, executing game actions and returning the updated state DTO (Data Transfer Object) in the HTTP response. For security, every connection is protected by a custom `X-API-KEY` inspection header filter."

### Q2: Why did you choose in-memory caches like `ConcurrentDictionary` on your .NET Backend over standard relational database records (like SQL Server or PostgreSQL)?
**Answer:**
"A relational database introduces transactional latency, round-trip connection times, and the overhead of schema-migration scripts. For a quick-play game platform, storing game state in high-speed, thread-safe memory caches inside the hosting container is much more performant.
However, using standard dictionary classes can cause race conditions or crash thread pools during parallel requests. To prevent this, I used `ConcurrentDictionary<Guid, GameSession>`. This provides thread-safe, lock-free lookups and modifications, ensuring maximum throughput even under heavy parallel load."

### Q3: Walk us through the priority matrix calculation of your Hard AI Algorithm. Why is it structured this way?
**Answer:**
"The Hard AI does not rely on random moves. Instead, it systematically evaluates the board using a prioritized sequence of rules:
1. **Immediate Win Scan**: Iterate through all winning lines (3 rows, 3 columns, 2 diagonals). If any line contains exactly two `O`s and one empty cell, the AI moves there to win immediately.
2. **Immediate Threat Blocking**: If no win is available, iterate through the same lines looking for two `X`s and one empty cell. If found, the AI places its `O` there to block the threat.
3. **Center Control**: If the center cell (index 4) is vacant, claim it immediately. Center control statistically unlocks the highest number of branching paths.
4. **Corner Dominance**: Claim diagonal corners to set up potential fork patterns of our own.
5. **Sides as Fallback**: If no higher priority cells are available, occupy the remaining side cells.
This rule-based approach is incredibly efficient, executing in constant $O(1)$ time on a $3 \times 3$ grid, completely bypassing the memory and processor overhead of deeper minimax search engines."

### Q4: Explain the security model of the Web API. How does your authorization filter intercept and process incoming traffic?
**Answer:**
"Security is enforced at the controller entry level using a custom Action Filter, `ApiKeyAuthAttribute`, which implements `IAsyncActionFilter`. 
When an HTTP request hits any game route, the filter interceptor reads the HTTP header parameters looking for `X-API-KEY`.
*   If the header is absent or does not match the configured master security token, the filter blocks request pipeline execution instantly, bypassing the controller logic and returning an HTTP `401 Unauthorized` response with a clean error message.
*   If security checking succeeds, the request proceeds down the middleware pipe to the endpoint handler. This keeps security validation cleanly separated from core business logic."

### Q5: How did you design the Undo system in 'vs Computer' mode? Why does it need a double-rollback?
**Answer:**
"In local PvP mode, players take turns on the same device. If they make a mistake, clicking Undo simply rolls back the board states exactly by one move and toggles the active turn marker.
However, in 'vs Computer' mode, it is a human playing against an automated, reactive service. When a user registers a move on the board, the backend processes it and immediately responds with its AI counter-move.
If the client-side undo button only rolled back one move, it would remove the computer's move, but leave the human player's move on the board. The system would then interpret it as the computer's turn, and the AI would instantly run its calculation to place another mark. This would make the Undo button appear broken or frozen.
To solve this, the undo logic in Computer Mode is designed to roll back **two moves recursively**—removing both the computer's last response and the player's original move. This returns the board cleanly back to the player's prior turn, ensuring a perfect user experience."

### Q6: What are CORS (Cross-Origin Resource Sharing) restrictions and how are they handled in your full-stack configuration?
**Answer:**
"CORS is a browser-level security mechanism that prevents web applications running on one port or domain from reading resources on another domain without explicit authorization headers.
During development, the frontend client typically runs on a port like `3000`, while the .NET API services host on port `5000`. By default, the browser blocks requests from port 3000 to port 5000.
To resolve this, we configure CORS policies in the backend's `Program.cs` startup pipeline:
```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowClientGateway", policy => {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```
We then apply this policy globally via middleware (`app.UseCors("AllowClientGateway")`). This instructs the server to include the necessary `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` keys in its responses, allowing the browser to permit cross-origin requests."

### Q7: If you had to scale this application to support millions of concurrent users globally, what structural changes would you make?
**Answer:**
"To scale this system for massive global load, I would propose three key architectural upgrades:
1. **Transition to Distributed Caching**: Storing sessions in-memory via `ConcurrentDictionary` restricts us to a single server instance. If we add more servers behind a load balancer, sticky sessions would be required. By moving session states out of the application process and into a fast, distributed memory cache like **Redis**, we decouple state from local processes. This lets our API tiers scale horizontally with ease.
2. **Persistent Databases for Analytics**: Move high-volume session historical records and user analytical metrics from memory to a scalable database engine (like SQL Server, PostgreSQL, or CosmosDB/Firestore) using Entity Framework (EF Core).
3. **WebSockets/SignalR for Duplex Communication**: Instead of relying on client-side HTTP polling for multi-device matching, implement an event-driven, bidirectionally streaming layout using **ASP.NET Core SignalR**. This provides real-time state synchronization, matchmaking lobbies, and immediate gameplay updates on a global scale."

### Q8: How did you optimize production builds on the React SPA side?
**Answer:**
"The React SPA uses Vite paired with esbuild to bundle and optimize our code for production.
During production builds, Vite compiles TypeScript, bundles code into optimized chunks, and treeshakes unused exports.
We also configured standard static deployment mappings so that after compiling our client-side assets to the `dist/` directory, they can be served as lightweight, static assets. This significantly improves load times and performance in a production environment."
