# ABB Tic-Tac-Toe Pro System

A professional, high-fidelity Tic-Tac-Toe gaming system engineered with clean design aesthetics, local state persistence, progressive CPU simulation algorithms, and a seamless responsive user interface.

---

## Technical Architecture

The application is built as a client-side Single Page Application (SPA):
- **Framework**: React with Vite for rapid interactive state rendering.
- **Styling**: Tailwind CSS for high-contrast color palettes and transitions.
- **Icons**: Lucide React.
- **Port Binding**: Standard configuration mapped to port 3000.

---

## Features

1. **Strategic AI Engine**:
   - Easy: Executes random moves on available squares.
   - Medium: Integrates random moves with block overrides.
   - Hard: Follows a designated strategic flow: Win check, opponent block check, center seizure, corner possession, and side selection files.
2. **Dual Game Playmodes**: Alternate between vs-Computer mode (Player X versus CPU O) and local 2-Player mode.
3. **Interactive Undo System**: Rolls back game state recursively to protect match integrity.
4. **Contrast Toggle**: Dynamic Light and Dark modes integrated seamlessly alongside the action controls.

---

## Development Setup

Verify Node.js is configured on your local workstation.

### Start the Development Server
```bash
npm run dev
```

### Build and Validate
To run linting checks and package the production bundle:
```bash
npm run lint
npm run build
```
Compiled static artifacts are generated directly in the dist directory.
