# Status Snapshot

- Last updated: `2026-03-06 23:26 America/New_York`
- Active branch: `main` (local git repo initialized, no remote yet)
- Current milestone: `M6`
- Current task ID: `M6-02`
- Last completed task: `M7-03`

## Next 3 Actions

1. Start the ornamental polish pass on the sheet now that the structural layout, inventory flow, and linked references are materially broader.
2. Tune spacing, panel density, and decorative treatment so the screen view moves closer to the reference without sacrificing live readability.
3. Add a GitHub remote manually because `gh` is not installed on this machine.

## Blockers / Open Questions

- `gh` is not installed on this machine, so GitHub remote creation and initial push are still manual.
- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- The rules engine now covers full casters, half casters, pact magic, homebrew-granted spells, and a broader equipment catalog, but the compendium content is still smaller than the eventual v1 surface.
- The sheet now follows the reference page's structure and has broader item references, but ornamental polish and print-tuning are still deferred to `M6-02`.
- Source-aware content packaging is now in place, but actual non-core books remain unimplemented until licensed content packages are added.
- Packaged builds still fall back to the default Electron icon because no custom icon asset has been added yet.

## Files Expected To Change Next

- `build/`
- `docs/CHECKLIST.md`
- `docs/STATUS.md`
- `src/components/SheetPreview.tsx`
- `src/styles/app.css`

## Commands To Run First

```bash
npm install
npm run dev
```
