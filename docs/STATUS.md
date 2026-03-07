# Status Snapshot

- Last updated: `2026-03-06 21:39 America/New_York`
- Active branch: `main` (local git repo initialized, no remote yet)
- Current milestone: `M3`
- Current task ID: `M3-01`
- Last completed task: `M6-01`

## Next 3 Actions

1. Expand the compendium seed into a fuller SRD/open dataset and define a repeatable import step.
2. Keep the new structural sheet layout in sync with any new compendium-driven data fields as they land.
3. Add a GitHub remote manually because `gh` is not installed on this machine.

## Blockers / Open Questions

- `gh` is not installed on this machine, so GitHub remote creation and initial push are still manual.
- The starter compendium is intentionally small; a fuller SRD ingestion pass is still pending.
- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- The sheet now follows the reference page's structure, but ornamental polish and print-tuning are still deferred to `M6-02`.

## Files Expected To Change Next

- `docs/CHECKLIST.md`
- `docs/STATUS.md`
- `shared/data/**/*`
- `electron/db/**/*`
- `src/lib/api.ts`
- `src/components/SheetPreview.tsx`

## Commands To Run First

```bash
npm install
npm run dev
```
