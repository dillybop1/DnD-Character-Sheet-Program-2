# Decisions

## DEC-001

- Date: `2026-03-07`
- Context: The product needs a downloadable desktop experience with a dense, exact-style sheet layout and offline local storage.
- Decision: Use `Electron + React + TypeScript` with local SQLite storage.
- Consequences: One codebase can target macOS and Windows, but packaging and native module support need explicit verification.

## DEC-002

- Date: `2026-03-07`
- Context: Work will continue across multiple machines and sessions.
- Decision: Keep `PLAN`, `CHECKLIST`, `STATUS`, and `DECISIONS` docs committed in the repo and update `CHECKLIST` plus `STATUS` in every meaningful work session.
- Consequences: Handoffs stay deterministic, but the docs become part of the required workflow.

## DEC-003

- Date: `2026-03-07`
- Context: The sheet should feel like the reference image without copying official D&D branding/assets.
- Decision: Use original art direction and CSS-driven ornamentation while preserving the same high-level section structure.
- Consequences: The v1 UI can ship more safely, but it will need bespoke visual polish instead of borrowed assets.

## DEC-004

- Date: `2026-03-07`
- Context: The original Vite/Electron plugin path produced a reliable packaged build but unstable local dev behavior.
- Decision: Keep Vite for the renderer and move the Electron main/preload build to `tsup`, with Electron Builder handling packaging.
- Consequences: The production path is explicit and easier to debug, and it remains the primary validation path for native-shell behavior.

## DEC-005

- Date: `2026-03-07`
- Context: Electron 35 local CLI runs on this machine resolve `require("electron")` to the installed binary path instead of the runtime API, which blocks a direct hot-run desktop loop.
- Decision: Make `npm run dev` a browser-backed Vite HMR workflow with a mock `dndApi` implementation backed by `localStorage`, while keeping `npm run build` as the desktop validation path.
- Consequences: Day-to-day UI and rules work now has a stable live loop, but native shell behavior still requires build/package validation.

## DEC-006

- Date: `2026-03-07`
- Context: The reference sheet layout is core product information architecture, not just late-stage visual polish.
- Decision: Pull the structural sheet recreation ahead of deeper compendium work, then defer ornamental polish and print-perfect tuning to a later `M6-02` pass.
- Consequences: The app's data and layout can now evolve together against the real page structure, but some visual details will intentionally remain unfinished until export constraints stabilize.
