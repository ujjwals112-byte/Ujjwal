# GUIDE 1: ACCENTURE WORK & PERSONAL LAPTOP RUN & DEMO GUIDE
### Local Setup, Corporate Configuration, Testing, and Live Demonstration Playbook

This reference manual provides precise, step-by-step instructions to install, configure, execute, test, and demonstrate the Enterprise Tic-Tac-Toe system. It accounts for corporate constraints often found on Accenture enterprise workstations (such as restricted administrator rights, network proxies, corporate VPNs, and PowerShell execution blocks) as well as open configurations on personal machines.

---

## Part 1: Workplace (Accenture) Laptop Environment Configuration

Accenture laptops typically employ advanced endpoint security mechanisms (like Zscaler, Pulse Secure, McAfee, or CrowdStrike), strict local firewall rules, and group policies. Use this section to bypass these standard hurdles safely.

### 1. Corporate Network Proxies & VPN Blockers
If you run `npm install` or `dotnet restore` and it hangs or throws connection timeout errors, your workstation is likely routed behind an enterprise proxy.

*   **Configuring npm for Corporate Proxies:**
    Run the following command in your terminal, replacing the placeholder with your actual Accenture proxy URL if required:
    ```bash
    npm config set proxy http://username:password@secureproxy.accenture.com:8080
    npm config set https-proxy http://username:password@secureproxy.accenture.com:8080
    ```
    *Alternatively, disable SSL strict checking temporarily for npm (use with caution):*
    ```bash
    npm config set strict-ssl false
    ```

*   **Configuring .NET CLI for Corporate Proxies:**
    Set standard environment variables in your terminal session before running restore commands:
    *   *Windows Command Prompt:*
        ```cmd
        set HTTP_PROXY=http://secureproxy.accenture.com:8080
        set HTTPS_PROXY=http://secureproxy.accenture.com:8080
        ```
    *   *Windows PowerShell:*
        ```powershell
        $env:HTTP_PROXY="http://secureproxy.accenture.com:8080"
        $env:HTTPS_PROXY="http://secureproxy.accenture.com:8080"
        ```

### 2. Bypass PowerShell execution policies
When attempting to run wrapper scripts or Node commands on Windows, you might hit: `"File cannot be loaded because running scripts is disabled on this system."`
*   **Fix:** Force-enable script execution for the active shell lifecycle without requiring administrative credentials:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
    ```

### 3. Port Allocation Conflicts
The backend API defaults to bind to ports `5000` / `5001`. The frontend web server uses port `3000` or `4200` (Angular). Enterprise monitoring tools or localized IIS servers sometimes bind to these ports.
*   **Check Port Status (Windows):**
    ```cmd
    netstat -ano | findstr 5000
    netstat -ano | findstr 3000
    ```
*   **Kill Blocking Process:**
    Identify the PID (Processes ID) at the end of the line, then execute:
    ```cmd
    taskkill /F /PID <PID_NUMBER>
    ```

### 4. Handling Local SSL and Certification Tracing
For .NET Core to serve HTTPS locally without warning banners:
```bash
dotnet dev-certs https --trust
```
*If a corporate group policy prevents trust certificate injection, simply fall back to the unsecured HTTP URL (`http://localhost:5000`) on your frontend endpoints.*

---

## Part 2: Personal Laptop Setup (Open Network)
Personal workstations generally allow unrestricted access. You can proceed without proxy definitions, security certificates, or execution policy modifications. Ensure you are connected to active internet and open your terminal.

---

## Part 3: Step-by-Step Installation Checklist

### 1. Prerequisite Installations
Ensure the following base engines are installed:
*   **Node.js**: Install Node.js LTS (v18 or newer) from [nodejs.org](https://nodejs.org/).
*   **.NET SDK**: Install .NET SDK (v8.0) from the Microsoft [.NET download page](https://dotnet.microsoft.com/en-us/download).

### 2. Verify Installations
Open a fresh shell viewport and run:
```bash
node --version
npm --version
dotnet --version
```
Verify that the CLI output prints valid version numbers (e.g., `Node: v18.xx.x`, `dotnet: 8.0.xxx`).

---

## Part 4: Running the Full Stack Solution Locally

Follow this exact bootstrap sequence to establish running communication:

### Step A: Initialize the C# ASP.NET Core API Backend
1.  Open your platform terminal and enter the API core working directory:
    ```bash
    cd dotnet-backend/src/EnterpriseTicTacToe.API
    ```
2.  Restore external package links from NuGet registers:
    ```bash
    dotnet restore
    ```
3.  Compile core modules and binaries:
    ```bash
    dotnet build
    ```
4.  Launch the web app:
    ```bash
    dotnet run
    ```
    *Look for the output indicating the host is listening:*
    `Now listening on: http://localhost:5000`

### Step B: Launch the React Client (Vite Platform)
1.  Open a second, separate terminal window. Navigate to the absolute root directory of this project:
    ```bash
    cd <project-root-directory>
    ```
2.  Install all node client package groups:
    ```bash
    npm install
    ```
3.  Launch the development server pipeline:
    ```bash
    npm run dev
    ```
    *The output interface will confirm loading bounds:*
    `  VITE v...  ready in ... ms`
    `  ➜  Local:   http://localhost:3000/`
4.  Open `http://localhost:3000` in your browser.

### Step C: Launch the Angular Client (Alternative Integration)
If your demo specifically requires testing the standalone Angular layouts instead:
1.  Establish an Angular workspace:
    ```bash
    npm install -g @angular/cli
    ng new enterprise-tictactoe-client --defaults
    ```
2.  Copy `/angular-frontend/src` directly over the default workspace files.
3.  Trigger the server:
    ```bash
    ng serve --port 4200
    ```
4.  Open `http://localhost:4200` to interact with the Angular representation.

---

## Part 5: Diagnostic Verification & Automated Tests

To showcase code quality and test coverage, run these validation suites:

### 1. Execute Backend Unit Tests (xUnit)
Run this check to prove that core algorithms, state structures, and victory determinations execute with 100% precision:
1.  Open a terminal inside the tests directory:
    ```bash
    cd dotnet-backend/tests/EnterpriseTicTacToe.Tests
    ```
2.  Trigger the xUnit controller:
    ```bash
    dotnet test
    ```
3.  The console will list the tests passed, verifying that the game's victory states, AI blocking, and score resets work perfectly.

### 2. Execute Client Linter & Static Types Check
Run this check to verify that all React structural parameters adhere to strict TypeScript guidelines:
1.  Navigate back to the project root:
    ```bash
    cd <project-root-directory>
    ```
2.  Trigger the compiler and lint sequence:
    ```bash
    npm run lint
    ```

---

## Part 6: Live Walkthrough and Demonstration Playbook

Follow this scripted operational flow to deliver a spectacular live gameplay demonstration:

### Phase 1: Operational Onboarding
1.  **Open the Viewport**: Navigate to `http://localhost:3000`. Show the initial state: a beautiful Slate canvas with high-contrast markings.
2.  **Toggle Themes**: Click the "Theme Toggle" button on the interface. Demonstrate how smoothly the screen shifts from Dark Slate mode to high-contrast Light mode, keeping consistent layouts and colors.
3.  **Read the Rules**: Toggle the "Game Rules & Strategy Guide" modal. Walk the audience through the clean design, layout, typography, and clear explanations.

### Phase 2: Showcasing Single-Player VS Computer (Deterministic AI)
1.  **Set Easy Mode**: Choose Play Mode "vs Computer" and Difficulty "Easy".
2.  **Make Placement**: Click on any grid cell. Show how the computer responds almost instantly with a random card coordinates selection.
3.  **Demonstrate the Strategic AI (Hard Mode)**:
    *   Toggle the Difficulty dropdown to **Hard**.
    *   Set up a winning fork challenge: place your marks in the corner of row 1 (`Row 0, Col 0`) and corner of row 2 (`Row 1, Col 0`).
    *   Place a second consecutive tile. Point out that the Hard AI immediately reads the win-threat of `X` and places its `O` on the block location to secure its line.
    *   Demonstrate that the computer takes the high-value Center cell (`1,1`) first if it is open, and optimizes corners.

### Phase 3: Smart Back-Step (Undo Sequence)
1.  During "vs Computer" play, click the **Undo Move** action button.
2.  Draw the audience's attention to the board grid state:
    *   Point out that clicking Undo doesn't just undo one tile. It removes the AI's move *and* your original triggering move simultaneously.
    *   This ensures the board returns directly to your previous turn, preventing the user from executing moves out of order.
3.  Switch play mode to **Local 2-Player**. Make alternating entries (`X` then `O` then `X`).
4.  Click **Undo Move** and show that in PvP mode, it rolls back exactly 1 step at a time, allowing players to correct single mis-clicks.

### Phase 4: Atomic Scoreboard Synchronizations
1.  Complete a match (e.g., let `X` win on the grid).
2.  Show that the Scoreboard automatically records and increments the victory count for Player X under the concurrent session tally.
3.  Now click the **Reset Board** button. Show that the board grid wipes completely clean, but the Scoreboard retains the current active score totals intact.
4.  Finally, click the **Reset Scoreboard** button. Highlight that this clears the in-memory scorecard back to zero, resetting all tracking parameters.
