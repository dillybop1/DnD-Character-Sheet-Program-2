# D&D Character Sheet

Offline-first `Electron + React + TypeScript` desktop app for building, storing, and exporting dynamic D&D character sheets on macOS and Windows.

## Current State

- App foundation is scaffolded for Electron, Vite, React, TypeScript, SQLite, Drizzle, and a `tsup`-based main/preload build pipeline.
- The repo includes committed handoff docs in [`docs/PLAN.md`](docs/PLAN.md), [`docs/CHECKLIST.md`](docs/CHECKLIST.md), [`docs/STATUS.md`](docs/STATUS.md), and [`docs/DECISIONS.md`](docs/DECISIONS.md).
- The app currently supports:
  - Local character storage
  - Guided character creation/editing
  - Core derived sheet math
  - A structural sheet preview that follows the reference page's layout hierarchy
  - A larger versioned compendium for classes, subclasses, species, backgrounds, spells, weapons, armor, feats, and rules
  - Structured feat selection plus background feature support on saved characters and the sheet preview
  - Starter feat mechanics for `Alert` and `Tough`, plus bounded `Magic Initiate` support across native and non-caster classes with a separate feat spellcasting line when needed
  - Configurable feat choices for starter feats such as `Skilled`, `Resilient`, and multi-group `Skill Expert`
  - Expanded starter feat coverage with `Mobile`, `Athlete`, and `Observant`, including explicit derived/partial support messaging in the builder plus passive-sense automation where the sheet model can represent it honestly
  - Sheet-preview feat summaries now surface the selected configurable feat choices instead of only the feat names
  - The feat picker now disables impossible configurable feats and automatically removes stale feat ids/selections when class or skill changes make them unsatisfiable
  - Background guidance with suggested skills and idempotent starting-gear application into tracked inventory
  - Source-aware content architecture for future rulebook packages
  - In-context reference links from the character workspace into the compendium
  - A bounded homebrew effect editor and storage path, including passive skills, initiative bonuses, and per-level hit point bonuses
  - JSON import/export for per-character backup and cross-machine transfer, plus window-based PDF export
- `npm run dev` now provides a stable browser-backed HMR workflow using a localStorage mock of the preload API when Electron is not present.
- Verified commands currently passing on this Windows machine:
  - `npm run dev`
  - `npm run typecheck`
  - `npm run test`
  - `npm run lint`
  - `npm run pack:win-local`
  - `npm run build:win-local`
- Manual Windows packaged-app checks now pass for create/save/reopen, JSON export/import, PDF export, and reinstall-over-existing-data behavior. The remaining installer validation gap is macOS on a real Mac.

## Setup

```bash
npm install
npm run dev
```

Use Node `22.x` on development machines. Newer Node versions can force a local `better-sqlite3` rebuild that fails on some Windows/Python combinations.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run pack
npm run build:win-local
npm run pack:win-local
```

## Live Development

`npm run dev` starts Vite on `http://localhost:5173` and uses a browser-backed mock of `window.dndApi`. Character data and homebrew entries persist in browser `localStorage`, so you can live-edit the UI and rules logic without waiting on Electron startup.

The current sheet preview is in the "structural fidelity" stage: it now follows the reference sheet's major panel layout, but final ornamental polish and print-perfect tuning are still deferred to `M6-02`.

The content model is also source-aware now: characters persist an enabled source profile, and templates plus compendium entries carry source metadata so later books can be added as separate packages.

Desktop packaging remains the validation path for the native shell:

```bash
npm run build
```

If Windows packaging is blocked by local `winCodeSign` symlink privileges, use the local validation scripts instead:

```bash
npm run pack:win-local
npm run build:win-local
```

## Cross-Machine Workflow

1. `git pull`
2. Read [`docs/STATUS.md`](docs/STATUS.md)
3. Read [`docs/CHECKLIST.md`](docs/CHECKLIST.md)
4. Checkout the branch listed in `docs/STATUS.md`
5. Run the `Commands to run first` block from `docs/STATUS.md`

Before you stop on any machine:

1. Update `docs/CHECKLIST.md`
2. Update `docs/STATUS.md`
3. Commit the docs with the code change
4. Push the branch

Use the character workspace `Export JSON` and `Import JSON` actions when you want to move an individual character between machines without copying the whole local app data store.

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
