# Status Snapshot

- Last updated: `2026-03-06 22:15 America/New_York`
- Active branch: `main` (local git repo initialized, no remote yet)
- Current milestone: `M4`
- Current task ID: `M4-02`
- Last completed task: `M3-02`

## Next 3 Actions

1. Extend derived math coverage beyond the starter fighter and wizard cases.
2. Add rules-engine support for more classes and a few controlled override edge cases without breaking the current sheet layout.
3. Add a GitHub remote manually because `gh` is not installed on this machine.

## Blockers / Open Questions

- `gh` is not installed on this machine, so GitHub remote creation and initial push are still manual.
- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- The sheet now follows the reference page's structure, but ornamental polish and print-tuning are still deferred to `M6-02`.
- Source-aware content packaging is now in place, but actual non-core books remain unimplemented until licensed content packages are added.
- The character workspace now has in-context compendium links, but the rules engine still only covers a starter subset of v1 classes and edge cases.

## Files Expected To Change Next

- `docs/CHECKLIST.md`
- `docs/STATUS.md`
- `shared/calculations.ts`
- `shared/data/reference.ts`
- `shared/data/compendiumSeed.ts`
- `tests/calculations.test.ts`

## Commands To Run First

```bash
npm install
npm run dev
```
