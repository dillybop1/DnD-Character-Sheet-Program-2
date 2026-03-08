# Product Goal

Create a downloadable `Mac + Windows` app that lets players build, store, and export dynamic D&D character sheets with an exact-style fantasy layout, linked rules references, and offline local persistence.

## V1 Scope

- `Electron + React + TypeScript` desktop app
- Offline-first local persistence with SQLite
- Roster-first home page with character library plus open/create entry points
- Dedicated in-app character sheet page plus a creator/editor page with live preview
- Dynamic calculations for AC, modifiers, saves, skills, HP, spell attack, spell DC, hit dice, and spell slots
- Structural sheet layout that matches the approved reference page's information hierarchy before final art polish
- Linked SRD/open compendium with search and detail views
- Source-aware content architecture so later books can be added as new content packages instead of rewriting core models
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
- Single-window route flow in React Router:
  - `/` roster home
  - `/characters/new` creator
  - `/characters/:id` dedicated sheet view
  - `/characters/:id/edit` creator/editor reuse for existing characters
  - `/compendium`, `/homebrew`, `/settings`
- Desktop shell: Electron
- Main/preload build pipeline: `tsup`
- Local live development: browser-backed Vite HMR with a mock `dndApi` fallback
- Persistence: SQLite via `better-sqlite3`
- ORM: Drizzle
- Shared domain layer: TypeScript types and calculation engine in `shared/`
- Compendium ingestion: versioned shared manifest synced idempotently into SQLite
- Content packaging: shared source registry plus per-character enabled source profiles
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
- `M5`: roster-first character workflow, guided builder/editor, and character library
- `M6`: exact-style sheet structure and dynamic bindings
- `M7`: spells, inventory, features, homebrew application
- `M8`: print/PDF export, ornamental polish, QA, packaging verification
- `M9`: release readiness, signing/notarization strategy, and publish handoff

## Acceptance Criteria

- A fresh clone on another machine can identify the current branch, milestone, task, and first command in under five minutes.
- The app opens to a roster-first home page that lists saved characters and offers open/create actions.
- One character can be created, saved locally, reopened, edited, and exported.
- Opening an existing character navigates to a dedicated in-app sheet page, and editing stays in the same Electron window.
- Creating a new character navigates to a dedicated creator/editor page with a live sheet preview at the bottom.
- Derived values update immediately when level, ability scores, armor, weapons, or spellcasting fields change.
- The main sheet mirrors the approved reference page's major section layout while using original art treatment.
- Sheet entries can deep-link into the compendium.
- Homebrew entries can be created and stored locally.
- Future books can be added as new content sources without changing the base character record shape.
- The app can build for macOS and Windows from the same codebase.
- A validated `v0.1.0` candidate can be traced to concrete build commands, expected artifacts, and a documented release/signing checklist.
