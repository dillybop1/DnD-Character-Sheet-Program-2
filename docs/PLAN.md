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
- Source-aware content architecture so later books can be added as repo-managed content packs instead of rewriting core models, with explicit provenance between exact open/licensed text and app-authored summary copy
- Compact compendium browse summaries can remain app-authored, while exact open/licensed wording should flow through dedicated detail text surfaces when the app intends to present canonical source text
- Inspect surfaces that have exact open/licensed long-form text should prefer that text over shorter app-authored summary/effect copy, and any remaining summary-only exceptions should stay explicitly documented
- Feat support/automation copy should remain separate from any future exact-source feat wording, and exact feat detail should wait until a broader feat-data pass instead of being forced into the current bounded summary model
- The exact-text foundation is now broad enough for the current milestone, so active roadmap work should favor compendium breadth and product value over expanding `officialText` to every remaining seeded surface
- With the current open level 9 baseline now complete, pause raw spell-breadth expansion and prioritize spell usability end-to-end; after the compendium browse/filter pass, URL-stable browse state, builder-side spell selection pass, cross-surface handoff, detail-side linked navigation, builder feat selection pass, typed non-spell compendium browse pass, builder equipment selection pass, tracked-inventory manager pass, focused loadout-manager pass, configurable feat-choice pass, six bounded saved-sheet automation passes, two narrow subclass-aware automation passes, a first action-level recovery pass, a first pool-spender pass, a first hit-die action pass, a first direct healing-pool workflow, a first self-only class-heal workflow, a first self-only temporary-HP workflow, tracked-resource triage, a page-one recovery handoff, a bounded spellbook browse/filter pass, a bounded spell-detail navigation pass, builder onboarding and class-ready starting presets, a combined quick-start setup pass, a bounded starter-spell recommendation pass, a bounded starter-skill recommendation pass, a bounded roster search/filter/sort pass, and a bounded roster action-management pass, decide next whether to keep polishing launch/creation flow, pivot back to another non-print surface, reopen lower-priority creature work, or leave deferred print work untouched
- Basic homebrew entries with bounded effects
- JSON backup/export and a provisional print/PDF export path, with further print polish deferred until a final-release go/no-go pass
- Persistent saved-character play-state tracking for spell slots and vitals
- Repo-managed spell and creature/beast packs that compile into the shared compendium dataset before SQLite sync
- Original fantasy art direction inspired by the reference sheet

## Non-Goals

- Cloud sync or user accounts
- Multiclassing in v1
- External imports from third-party tools
- DM/campaign management
- Bundled verbatim proprietary D&D book text without explicit license, or copied branding/assets
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
- Compendium ingestion: repo-managed content packs compiled into generated JSON and synced idempotently into SQLite
- Content packaging: shared source registry plus repo-managed pack manifests and per-character enabled source profiles
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
- `M10`: content-pack expansion plus a saved-sheet-first two-page redesign with bounded play-state and resource UX
- `M11`: saved-sheet polish, manual QA follow-through, and next-milestone handoff after the M10 redesign
- `M12`: saved-sheet visual parity pass focused on a lighter worksheet-like on-screen presentation while keeping the reference-style page-one sheet as the main core body and removing the extra top-of-page overview layer
- `M13`: non-print content/product expansion while further print/PDF-system work is deferred until the final-release gate

## Current M13 Focus

- The worksheet-first saved-sheet simplification pass is now live on `/characters/:id`, and the remaining layout-lock toolbar/navigator chrome has been removed from that dedicated route.
- The saved-sheet route now behaves like the worksheet surface itself:
  - the old route-level quick-reference, snapshot, and in-route reference chrome is gone
  - page-one play-state and tracked-resource interactions now live inside the Character Worksheet
  - page two stays focused on spell slots, recovery, the spell table, and spell detail inspection
  - the dedicated saved-sheet route no longer shows the `LockedSheetViewport` toolbar or sheet navigator, while the builder preview still keeps those controls
- The saved-sheet route also keeps its page-switch controls aligned with the actual worksheet layout now:
  - the page nav stays in the markup, while CSS decides when the narrow single-page route needs it
  - `/characters/:id` no longer keys page navigation availability off raw `window.innerWidth`, which avoids losing page switching when the content column is narrow inside a wider app window
- The saved-sheet route now also reaches the parchment faster:
  - the duplicated page-one character summary and created/updated timestamps are gone from the top of the dedicated route
  - worksheet headers are more compact while keeping the route actions and status copy available
- The current follow-up is another decision task: choose whether to keep polishing the worksheet-first route after the header-compaction pass or pivot to a different non-print surface.

## Acceptance Criteria

- A fresh clone on another machine can identify the current branch, milestone, task, and first command in under five minutes.
- The app opens to a roster-first home page that lists saved characters and offers open/create actions.
- One character can be created, saved locally, reopened, edited, and exported.
- Opening an existing character navigates to a dedicated in-app sheet page, and editing stays in the same Electron window.
- Creating a new character navigates to a dedicated creator/editor page with a live sheet preview at the bottom.
- Derived values update immediately when level, ability scores, armor, weapons, or spellcasting fields change.
- The main sheet mirrors the approved reference page's major section layout while using original art treatment.
- The final saved-sheet route keeps the reference-style page-one sheet as the main core body, removes the extra page-one overview layer above it, and pairs that with the worksheet-style page-two spellbook layout.
- Sheet entries can deep-link into the compendium.
- Homebrew entries can be created and stored locally.
- Future books can be added as new content sources without changing the base character record shape.
- The app can build for macOS and Windows from the same codebase.
- A validated `v0.1.0` candidate can be traced to concrete build commands, expected artifacts, and a documented release/signing checklist.
- Saved characters persist current spell slot state, and the editor, saved-sheet route, and exported sheet all show remaining versus maximum slots consistently.
- Repo-managed content packs can regenerate the browser/Electron compendium dataset deterministically, and that dataset already includes richer spell metadata plus first-class creature/beast entries.
- The repo documents which shipped rules/reference prose is non-verbatim, repo-managed pack descriptions cannot be added without a matching audit entry, and compact browse summaries remain distinct from any exact-source detail surfaces.
