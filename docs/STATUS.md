# Status Snapshot

- Last updated: `2026-03-06 22:07 America/New_York`
- Active branch: `main` (local git repo initialized, no remote yet)
- Current milestone: `M3`
- Current task ID: `M3-02`
- Last completed task: `M2-02`

## Next 3 Actions

1. Add deep-links from the sheet preview and related character surfaces into matching compendium entries.
2. Start with high-value links: spells, weapons, armor, and rules-math labels such as Armor Class and Proficiency Bonus.
3. Add a GitHub remote manually because `gh` is not installed on this machine.

## Blockers / Open Questions

- `gh` is not installed on this machine, so GitHub remote creation and initial push are still manual.
- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- The sheet now follows the reference page's structure, but ornamental polish and print-tuning are still deferred to `M6-02`.
- The compendium now contains a materially larger open-content dataset, but sheet-level navigation into it is still pending.
- Source-aware content packaging is now in place, but actual non-core books remain unimplemented until licensed content packages are added.

## Files Expected To Change Next

- `docs/CHECKLIST.md`
- `docs/STATUS.md`
- `src/App.tsx`
- `src/components/SheetPreview.tsx`
- `src/pages/CharactersPage.tsx`
- `src/pages/CompendiumPage.tsx`

## Commands To Run First

```bash
npm install
npm run dev
```
