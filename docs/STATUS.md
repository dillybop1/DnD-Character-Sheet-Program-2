# Status Snapshot

- Last updated: `2026-03-07 23:19 America/New_York`
- Active branch: `main` (tracking `origin/main` at `https://github.com/dillybop1/DnD-Character-Sheet-Program-2.git`)
- Current milestone: `M9`
- Current task ID: `M9-03`
- Last completed task: `M9-02`

## Next 3 Actions

1. Create the private GitHub release entry for the already-pushed tag `v0.1.0`.
2. Attach the verified DMG and NSIS installer artifacts to that release.
3. Close `M9-03` once the release notes call out the unsigned macOS/Windows caveat and the installers are available to testers.

## Blockers / Open Questions

- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- Product direction is now explicit: keep character navigation inside one Electron window and do not add a second native BrowserWindow for the sheet view.
- The routed workflow split is now in place: app launch lands on `/characters`, saved characters open a dedicated `/characters/:id` sheet route, and edits/new drafts use `/characters/new` plus `/characters/:id/edit`.
- Fresh `npm install` under global Node `24.13.0` + Python `3.14` still fails because `better-sqlite3` falls back to `node-gyp`, but `npx -y -p node@22 -p npm@10 npm run release:verify-local` now passes on this machine as a working fallback.
- The release path is now explicit: `v0.1.0` is a private beta that will ship unsigned on macOS and Windows, so signing/notarization is no longer the gating decision for this milestone.
- This shell can still run the release verification flow without changing the global Node install by using `npx -y -p node@22 -p npm@10 npm run <script>`.
- The clean release commit (`7ffcbfd`) and tag (`v0.1.0`) are already on `origin/main`.
- This shell can push through Git + macOS keychain, but it does not have `gh`, `hub`, or an exposed GitHub API token for creating the GitHub release entry itself.
- `docs/RELEASE_BODY_v0.1.0.md` now contains the prepared private-beta release text for the manual GitHub release form.
- The rules engine now covers full casters, half casters, pact magic, homebrew-granted spells, and a broader equipment catalog, but the compendium content is still smaller than the eventual v1 surface.
- The sheet now follows the reference page's structure, renders persistent vitals, and has completed the `M6-02` readability/print-tuning pass that the packaged export flow now relies on.
- The latest `M6-02` pass tightened the masthead into a dedicated emblem column, added stronger section-header/banner hierarchy, and reduced print density so the exported sheet is closer to a deliberate one-page layout.
- The restored-window clipping issue was caused by layouts keying off viewport breakpoints while the sidebar reduced the real content width; `app.css` now adds `app-shell__main` container queries plus missing `min-width: 0` shrink constraints so the renderer reflows correctly when the app is not maximized.
- The narrow-sheet ability cards now switch to canonical short labels (`STR`, `DEX`, `CON`, etc.) plus shorter save-row copy based on the ability-grid width, which is cleaner than word-wrapping full labels inside cramped cards.
- Subclasses now exist as seeded compendium entries with summaries and feature lists, the builder normalizes new saves to canonical subclass ids, and the sheet can open a linked subclass reference while folding seeded subclass features into the class-feature panel.
- Feats now save as canonical compendium ids on the character, the builder exposes a real feat picker with reference links, and the sheet links chosen feats directly instead of relying only on a freeform notes field.
- Background support now includes persisted background-feature notes, a dedicated sheet panel seeded from the selected background, and builder-side suggested-skill actions based on the background compendium payload.
- Homebrew display routing is cleaner now: `feature`, `speciesTrait`, and `feat` homebrew entries land in the matching sheet sections, while only item/spell-style homebrew entries remain grouped as generic active effects.
- The seeded feat set now has explicit templates and starter mechanics: `Alert` adds initiative automatically, `Tough` adds max HP per level automatically, and `Magic Initiate` now has bounded spell-selection support across native and non-caster classes.
- `Magic Initiate` still stores a selected spell-list class plus feat-granted spell ids, but the derived spell model can now surface a separate feat spellcasting line when those spells use a different ability than the character's primary spellcasting line.
- Background guidance now lives in the shared template model instead of only the compendium payload, so selected backgrounds can seed themes, suggested skills, and idempotent starting gear directly into the builder's inventory workflow.
- The bounded homebrew editor now exposes initiative bonuses and per-level hit point bonuses in addition to the earlier supported effect types, which makes it capable of representing a broader slice of feat/item-style homebrew without code changes.
- Characters can now round-trip through JSON import as well as export. The shared parser accepts both the app's wrapped export payload and a raw character record, and the builder/library UI loads the imported record immediately after it is saved locally.
- Characters now persist bounded `featSelections`, and the starter feat set includes configurable builder-driven choices for `Skilled` and `Resilient` that map into the existing effect engine without introducing a fully generic feat-rules system yet.
- Feat templates can now expose multiple independent choice groups, which is enough to support starter multi-choice feats like `Skill Expert` while keeping the stored selection shape flat and backward-compatible with the earlier bounded feat work.
- The sheet's Feats panel now surfaces the selected configurable feat choices directly, so previews and exports no longer hide the actual picks behind only the feat name.
- Feat legality now runs at the feat level as well as the choice level: the builder disables impossible configurable feats, and shared sanitizers strip stale invalid feat ids/selections when class or skill changes make them unsatisfiable.
- The current feat-legality model is still deliberately bounded to the seeded configurable feats; it is not yet a universal prerequisite engine for every feat pattern in the wider ruleset.
- The starter feat catalog is broader now: `Mobile` applies derived speed automatically, `Athlete` applies its chosen +1 ability bonus automatically, and `Observant` now applies its chosen +1 ability bonus plus passive Investigation / Perception bonuses while leaving lip-reading clearly marked as reference-only.
- Feat templates now carry an explicit support level (`Derived`, `Partial`, `Reference`), and the builder surfaces that support messaging directly so feat automation expectations are clearer without forcing users into the compendium detail view every time.
- Passive skill scores are now first-class derived data and render on the sheet in a compact `Passive Senses` panel, which also makes the new `passive_skill_bonus` effect available to the bounded homebrew editor.
- `npm run pack:win-local` and `npm run build:win-local` both succeed again on this machine, and the latest installer now includes the passive-sense + native-caster `Magic Initiate` work plus the new JSON import action for manual validation.
- Character library, compendium, and homebrew lists now render readable metadata labels instead of raw ids, and the previous mojibake punctuation has been removed from the renderer copy.
- Custom app icon assets now live in `build/` as a checked-in SVG source plus generated `png` / `ico` outputs, and Electron packaging/runtime are wired to use them instead of the default Electron icon.
- The packaged blank-window bug was caused by Vite emitting absolute `/assets/...` paths for `file://` loads; `vite.config.ts` now uses `base: "./"` and the rebuilt local Windows installer/package completes with relative asset paths.
- The route split preserved the existing one-window export/reference workflow: roster import happens on the landing route, the saved-sheet route still supports JSON/PDF export plus compendium links, and the editor route keeps the live preview and linked reference panel.
- Source-aware content packaging is now in place, but actual non-core books remain unimplemented until licensed content packages are added.
- The default `npm run build` path still stalls on this machine when `electron-builder` extracts `winCodeSign` symlinks without the needed privilege / Developer Mode, while the local Windows validation path remains `npm run pack:win-local` plus `npm run build:win-local` when the existing installer output file is not locked by the environment.
- Windows NSIS installer validation has now passed manually on this machine for create/save/reopen, JSON export/import, PDF export, and reinstall-over-existing-data persistence.
- The latest local `M6-02` pass keeps the compact weapons/cantrips layout legible by labeling stacked table fields in narrow sheet widths, and the print stylesheet now avoids splitting key sheet panels as aggressively.
- The current `M6-02` pass also balances `Class & Subclass Features` columns by weighted text length instead of a raw midpoint split, and print output now hides blank offense filler rows while avoiding breaks inside notes items and subsections.
- The latest local `M6-02` pass also makes the lower notes panels intentionally compact instead of treating every notes block as a large lined page, and tightens masthead/vitals spacing so the sheet uses vertical space more efficiently without changing the data shown.
- The current local `M6-02` pass restructures the top-right spellcasting summary into labeled detail rows and gives the long `Class & Subclass Features` list a denser text treatment, so verbose builds stay more legible and print more predictably.
- The latest local `M6-02` pass also compresses the `Weapons & Damage Cantrips` table into a denser presentation and turns `Carried Gear` into a compact two-column equipment list with lighter metadata, which helps equipment-heavy characters stay closer to one page.
- The current local `M6-02` pass also tightens the left-rail `Skills` metrics and converts the `Weapons` / `Armors` loadout section from wrapped inline links into compact lists, so martial/equipment-heavy builds waste less space on the sheet's left column.
- The latest local `M6-02` pass also makes the badge/summary panels more uniform and trims print-only spacing in those top metric rows, so the upper sheet reads more consistently and wastes less paper height.
- The latest local `M6-02` pass also separates manual notes from structured feature/background/species/feat lists on the sheet, and restructures the spellcasting summary into compact scan-friendly cells so the saved-sheet route reads more clearly before final print tuning.
- The latest local `M6-02` pass also gives the dedicated saved-sheet route a clearer workspace header with save metadata, route-level actions, and a compact snapshot grid, while feat-based secondary spellcasting now lists the actual bonus spell names in both the top summary and Feats panel.
- The latest local `M6-02` pass also adds a density-aware sheet mode for heavy spell/equipment/feature builds and marks the long weapons/features/feats/gear panels as splittable in print, so exported pages compact more aggressively and paginate with fewer forced all-or-nothing panel breaks.
- The latest local validation pass also expands `Settings` into a more useful runtime/storage diagnostics surface with packaged-state details, user-data/database paths, and a `Reveal Database File` action, which should make installer and persistence checks less manual.
- Manual packaged macOS validation has now passed for install/launch, runtime diagnostics, create-save-reopen, roster -> sheet -> edit routing, JSON export, PDF export, and reinstall-over-existing-data persistence, so `M8-01` is closed.
- Manual packaged Windows validation has also passed for create/save/reopen, JSON export/import, PDF export, and reinstall-over-existing-data persistence, so release risk is now about signing/distribution rather than core functionality.
- `docs/RELEASE.md` now carries the concrete `v0.1.0` candidate summary, build baseline, release gaps, and publish checklist so the release path is no longer implicit.
- `docs/RELEASE.md` now also records the chosen private-beta distribution strategy: unsigned macOS + unsigned Windows, with expected trust warnings for testers.
- `package.json` now includes `npm run release:verify-local`, and that full flow has passed locally through the temporary Node `22.x` `npx` fallback path.

## Files Expected To Change Next

- `docs/RELEASE.md`
- `docs/RELEASE_BODY_v0.1.0.md`
- `docs/STATUS.md`
- `docs/CHECKLIST.md`

## Commands To Run First

```bash
cat .nvmrc
cat .node-version
npx -y node@22 -v
npx -y -p node@22 -p npm@10 npm run release:verify-local
```
