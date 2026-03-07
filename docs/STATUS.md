# Status Snapshot

- Last updated: `2026-03-06 22:42 America/New_York`
- Active branch: `main` (local git repo initialized, no remote yet)
- Current milestone: `M7`
- Current task ID: `M7-02`
- Last completed task: `M7-01`

## Next 3 Actions

1. Expand equipment state beyond the current weapon/armor checklists so inventory can track more than a starter loadout.
2. Surface more equipped-item detail on the character workspace now that spell prep and homebrew workflows are less fragile.
3. Add a GitHub remote manually because `gh` is not installed on this machine.

## Blockers / Open Questions

- `gh` is not installed on this machine, so GitHub remote creation and initial push are still manual.
- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- The rules engine now covers full casters, half casters, pact magic, and homebrew-granted spells, but the spell/inventory compendium content is still materially smaller than the eventual v1 surface.
- The builder now filters manual spell selection by class and supports multi-effect bounded homebrew entries, but equipped-item management is still only a starter checklist flow.
- The sheet now follows the reference page's structure, but ornamental polish and print-tuning are still deferred to `M6-02`.
- Source-aware content packaging is now in place, but actual non-core books remain unimplemented until licensed content packages are added.

## Files Expected To Change Next

- `docs/CHECKLIST.md`
- `docs/STATUS.md`
- `shared/data/compendiumSeed.ts`
- `src/pages/CharactersPage.tsx`
- `shared/data/reference.ts`
- `shared/calculations.ts`

## Commands To Run First

```bash
npm install
npm run dev
```
