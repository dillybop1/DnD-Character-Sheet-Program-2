# D&D Character Sheet

Offline-first `Electron + React + TypeScript` desktop app for building, storing, and exporting dynamic D&D character sheets on macOS and Windows.

## Current State

- App foundation is scaffolded for Electron, Vite, React, TypeScript, SQLite, Drizzle, and a `tsup`-based main/preload build pipeline.
- The repo includes committed handoff docs in [`docs/PLAN.md`](/Users/dylanumphress/DnD Chatacter Sheet 2/docs/PLAN.md), [`docs/CHECKLIST.md`](/Users/dylanumphress/DnD Chatacter Sheet 2/docs/CHECKLIST.md), [`docs/STATUS.md`](/Users/dylanumphress/DnD Chatacter Sheet 2/docs/STATUS.md), and [`docs/DECISIONS.md`](/Users/dylanumphress/DnD Chatacter Sheet 2/docs/DECISIONS.md).
- The app currently supports:
  - Local character storage
  - Guided character creation/editing
  - Core derived sheet math
  - A structural sheet preview that follows the reference page's layout hierarchy
  - A larger versioned compendium for classes, species, backgrounds, spells, weapons, armor, feats, and rules
  - Basic homebrew effect storage
  - JSON export and window-based PDF export
- `npm run dev` now provides a stable browser-backed HMR workflow using a localStorage mock of the preload API when Electron is not present.
- Verified commands currently passing:
  - `npm run dev`
  - `npm run typecheck`
  - `npm run test`
  - `npm run lint`
  - `npm run build`

## Setup

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run pack
```

## Live Development

`npm run dev` starts Vite on `http://localhost:5173` and uses a browser-backed mock of `window.dndApi`. Character data and homebrew entries persist in browser `localStorage`, so you can live-edit the UI and rules logic without waiting on Electron startup.

The current sheet preview is in the "structural fidelity" stage: it now follows the reference sheet's major panel layout, but final ornamental polish and print-perfect tuning are still deferred to `M6-02`.

Desktop packaging remains the validation path for the native shell:

```bash
npm run build
```

## Cross-Machine Workflow

1. `git pull`
2. Read [`docs/STATUS.md`](/Users/dylanumphress/DnD Chatacter Sheet 2/docs/STATUS.md)
3. Read [`docs/CHECKLIST.md`](/Users/dylanumphress/DnD Chatacter Sheet 2/docs/CHECKLIST.md)
4. Checkout the branch listed in `docs/STATUS.md`
5. Run the `Commands to run first` block from `docs/STATUS.md`

Before you stop on any machine:

1. Update `docs/CHECKLIST.md`
2. Update `docs/STATUS.md`
3. Commit the docs with the code change
4. Push the branch

## Branching

- `main` is the stable branch
- Use short-lived branches:
  - `feat/...`
  - `chore/...`
  - `docs/...`

## Release Targets

- macOS: `dmg`
- Windows: `nsis`

## GitHub Remote

This repo is prepared for a private GitHub remote, but creating/pushing the remote still depends on local GitHub authentication. After `git init`, either use `gh repo create` or add your remote manually:

```bash
git remote add origin <your-private-github-url>
git push -u origin main
```
