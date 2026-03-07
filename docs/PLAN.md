# Product Goal

Create a downloadable `Mac + Windows` app that lets players build, store, and export dynamic D&D character sheets with an exact-style fantasy layout, linked rules references, and offline local persistence.

## V1 Scope

- `Electron + React + TypeScript` desktop app
- Offline-first local persistence with SQLite
- Guided builder and editable character workspace
- Dynamic calculations for AC, modifiers, saves, skills, HP, spell attack, spell DC, hit dice, and spell slots
- Structural sheet layout that matches the approved reference page's information hierarchy before final art polish
- Linked SRD/open compendium with search and detail views
- Basic homebrew entries with bounded effects
- JSON backup/export and print/PDF export
- Original fantasy art direction inspired by the reference sheet

## Non-Goals

- Cloud sync or user accounts
- Multiclassing in v1
- External imports from third-party tools
- DM/campaign management
- Proprietary D&D book text or copied branding/assets
- Deep gameplay automation such as every timed effect or rest rule edge case

## Architecture

- Renderer: React + React Router + Vite
- Desktop shell: Electron
- Main/preload build pipeline: `tsup`
- Local live development: browser-backed Vite HMR with a mock `dndApi` fallback
- Persistence: SQLite via `better-sqlite3`
- ORM: Drizzle
- Shared domain layer: TypeScript types and calculation engine in `shared/`
- IPC surface:
  - `characters.list/create/get/save/delete/exportJson/exportPdf`
  - `builder.createFromWizard`
  - `compendium.search/get`
  - `homebrew.list/save/delete`
- Styling: custom parchment/fantasy UI with original CSS-driven ornamentation

## Milestones

- `M0`: repo bootstrap, git workflow docs, handoff files
- `M1`: Electron/Vite/React/TypeScript scaffold
- `M2`: SQLite schema, migration runner, preload bridge, persistence
- `M3`: starter compendium ingestion and linked search
- `M4`: core rules engine and unit tests
- `M5`: guided builder and character library
- `M6`: exact-style sheet structure and dynamic bindings
- `M7`: spells, inventory, features, homebrew application
- `M8`: print/PDF export, ornamental polish, QA, packaging verification

## Acceptance Criteria

- A fresh clone on another machine can identify the current branch, milestone, task, and first command in under five minutes.
- One character can be created, saved locally, reopened, edited, and exported.
- Derived values update immediately when level, ability scores, armor, weapons, or spellcasting fields change.
- The main sheet mirrors the approved reference page's major section layout while using original art treatment.
- Sheet entries can deep-link into the compendium.
- Homebrew entries can be created and stored locally.
- The app can build for macOS and Windows from the same codebase.
