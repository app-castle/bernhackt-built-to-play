# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Tauri Backend

The `src-tauri` directory contains the Rust backend that wraps the React frontend in a native desktop window. Besides Tauri's boilerplate `greet` command, it runs a background **keystroke activity tracker**:

- A global input hook (via the [`rdev`](https://crates.io/crates/rdev) crate) listens for key-press events system-wide, regardless of which window has focus. It only detects *that* a key was pressed — never *which* key — so no key identity is ever read, stored, or transmitted.
- Every 5 seconds, the accumulated count is emitted to the frontend as a `keystroke-batch` event (`{ count: number }`).
- On the frontend, [`useKeystrokeTraining`](src/hooks/keystrokes.ts) subscribes to that event, accumulates the counts, and every 30 seconds flushes them as a "training intensity" value (capped at 500) to `POST /pets/training` — driving the pet-training game mechanic from the user's real typing activity. The hook is a no-op outside of Tauri (e.g. the plain Vite dev server in a browser).

**Platform notes:** the hook works out of the box on Windows. On macOS it requires the user to grant Accessibility permissions (System Settings), or it silently receives no events. On Linux it only works under X11 — Wayland sessions block global key listening, so it fails silently there too. It's desktop-only; there's no mobile implementation.

## Building the Project

Prerequisites: [Node.js](https://nodejs.org/), and Rust + platform dependencies set up per the **[official Tauri prerequisites guide](https://tauri.app/start/prerequisites/)** (e.g. the Rust toolchain, and WebView2 on Windows / Xcode CLT on macOS / webkit2gtk on Linux).

Install dependencies:

```bash
npm install
```

Run in development mode (hot-reloads the frontend, launches the Tauri window):

```bash
npm run tauri dev
```

Build a production bundle (installer/executable) for the current platform:

```bash
npm run tauri build
```

This runs `npm run build` (TypeScript check + Vite build) to produce the frontend bundle, then compiles the Rust backend and packages both into a native app under `src-tauri/target/release/bundle/`.
