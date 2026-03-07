# Status Snapshot

- Last updated: `2026-03-06 22:56 America/New_York`
- Active branch: `main` (local git repo initialized, no remote yet)
- Current milestone: `M7`
- Current task ID: `M7-03`
- Last completed task: `M7-02`

## Next 3 Actions

1. Expand the equipment/reference catalog beyond the current starter gear so the new inventory editor has more useful choices.
2. Add more item-level detail and compendium coverage now that equipped-state inventory is wired through the sheet and calculations.
3. Add a GitHub remote manually because `gh` is not installed on this machine.

## Blockers / Open Questions

- `gh` is not installed on this machine, so GitHub remote creation and initial push are still manual.
- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- The rules engine now covers full casters, half casters, pact magic, homebrew-granted spells, and equipped-state inventory, but the spell/inventory compendium content is still materially smaller than the eventual v1 surface.
- The builder now has a real inventory editor with quantities and equipped state, but non-weapon/non-armor item coverage and item-specific references are still a starter subset.
- The sheet now follows the reference page's structure, but ornamental polish and print-tuning are still deferred to `M6-02`.
- Source-aware content packaging is now in place, but actual non-core books remain unimplemented until licensed content packages are added.

## Files Expected To Change Next

- `docs/CHECKLIST.md`
- `docs/STATUS.md`
- `shared/data/compendiumSeed.ts`
- `shared/inventory.ts`
- `src/pages/CharactersPage.tsx`
- `shared/data/reference.ts`

## Commands To Run First

```bash
npm install
npm run dev
```
