# Status Snapshot

- Last updated: `2026-03-08 13:32 America/New_York`
- Active branch: `main` (tracking `origin/main` at `https://github.com/dillybop1/DnD-Character-Sheet-Program-2.git`)
- Current milestone: `unassigned`
- Current task ID: `unassigned`
- Last completed task: `M12-04`

## Next 3 Actions

1. Manually spot-check PDF/print output once after the latest `M12-04` correction so export preserves the same desktop grid layout the saved-sheet route uses in-app.
2. Record any remaining print-specific regressions before opening another milestone.
3. Scope the next milestone only after deciding whether the next gap is additional visual parity work or a return to content/product expansion.

## Blockers / Open Questions

- A direct Electron-shell hot-run path is still blocked by Electron 35 resolving `require("electron")` to the installed binary path during local CLI runs, so the supported live workflow is browser-backed Vite dev.
- Product direction is now explicit: keep character navigation inside one Electron window and do not add a second native BrowserWindow for the sheet view.
- The routed workflow split is now in place: app launch lands on `/characters`, saved characters open a dedicated `/characters/:id` sheet route, and edits/new drafts use `/characters/new` plus `/characters/:id/edit`.
- Fresh `npm install` under global Node `24.13.0` + Python `3.14` still fails because `better-sqlite3` falls back to `node-gyp`, but `npx -y -p node@22 -p npm@10 npm run <script>` remains a working fallback without changing the global install.
- The published release path is now explicit: `v0.1.0` is a private beta that ships unsigned on macOS and Windows.
- This shell can still run the release verification flow without changing the global Node install by using `npx -y -p node@22 -p npm@10 npm run <script>`.
- The clean release commit (`7ffcbfd`) and tag (`v0.1.0`) are already on `origin/main`.
- The private GitHub release for `v0.1.0` is now published with the verified macOS and Windows installer assets attached.
- `docs/RELEASE_BODY_v0.1.0.md` remains as the source text used for the published private-beta release notes.
- Spell slot tracking is now first-class saved state: standard and pact slot counts persist on the character, both routed character surfaces can update them, legacy/imported records backfill safely, and the sheet/export summary now shows remaining/max slot values instead of only maxima.
- `M10-02` and `M10-03` are now complete: spells and beast/creature entries can ship from repo-managed content packs under `content/packs/`, `npm run content:build` regenerates the merged pack dataset, browser dev + Electron sync both consume that generated JSON, and creatures are now a first-class compendium type alongside the richer spell payloads.
- `M10-04` is now complete: `CharacterRecord` and `BuilderInput` both persist `sheetProfile` plus `trackedResources`, defaults/backfills normalize older saves safely, builder round-trips preserve those values even before the saved-sheet UI edits them, and regression coverage now proves language/currency/resource normalization works.
- `M10-05` is now complete: the saved-sheet route renders a dedicated two-page shell through `SavedSheetBook`, desktop keeps both pages visible, narrow widths switch through explicit page navigation, and print/PDF output now forces page-one/page-two separation while leaving the builder preview untouched.
- `M10-06` is now complete: page 1 has a real saved-sheet overview shell around the core preview, the saved-sheet route supports inline `Edit Sheet` mode for `sheetProfile` plus bounded `trackedResources`, and page-two summary cards preview unsaved field edits before they are persisted.
- `M10-07` is now complete: page 2 renders a real spell table with level/range/save-casting-duration-concentration data, the spell inspector previews full pack-provided text on hover/focus and click-to-pin, and the old generic notes-style spell placeholder is gone.
- `M10-08` is now complete: saved sheets now expose live tracked-resource controls, bounded short-rest and long-rest buttons, inline play-state fields for hit points / temp HP / hit dice / death saves / inspiration, and rest actions reset only the explicitly supported state instead of pretending to implement every 2024 class feature.
- `M11-01` is now complete: the saved-sheet route opens a dedicated polish milestone, the handoff docs now point to manual QA next, narrow-width resource and action controls stack more cleanly, and print output strips saved-sheet action chrome while preserving the current tracked values as static sheet data.
- `M11-02` now has an automated smoke test in `tests/savedSheetRoute.smoke.test.tsx` that renders the real saved-sheet route through the browser localStorage API, covering route load, page navigation state, spell inspector pinning, and bounded short-rest persistence before the remaining manual packaged/print checks.
- `M11-02` is now complete: the saved-sheet route passed the manual browser-dev and packaged-build checks, and the one QA adjustment from that pass removed the previous 0-HP rest-button gate so rest actions remain player-controlled even when a character is at 0 hit points.
- `M11-03` is now complete: the QA feedback was resolved, the handoff docs now open the next visual milestone instead of stalling on post-QA cleanup, and the saved-sheet route keeps the automated smoke test plus manual packaged/print checks as its regression gate.
- `M12-01` is now complete: the on-screen saved-sheet workspace no longer renders as translucent dark app chrome and instead uses a dedicated light paper canvas for the sheet card, nav tabs, pages, panels, rows, and edit controls while leaving the underlying route behavior untouched.
- `M12-02` is now complete: page 2 now renders as a worksheet-style spellbook surface with a dedicated spellcasting header, spell-slot ledger, lined spell table, and tighter right-rail detail/profile blocks instead of generic summary cards.
- `M12-03` is now complete: page 1 once again leads with the reference-style `SheetPreview` body as the main core sheet surface, the extra quick-overview block above it is gone, and the saved-sheet-specific controls now sit below the sheet instead of replacing it.
- `M12-04` is now complete: print/PDF output now preserves the saved-sheet route's desktop grid layout instead of collapsing into the narrow stacked fallback, the Electron PDF export explicitly honors CSS page sizing, and longer page-two spell tables can still paginate without flattening the whole page into one mobile-style column.
- Product direction is now explicit: page 1 should keep the reference-style sheet as the main saved-sheet body, while page 2 continues to use the worksheet-style spellbook layout. The unwanted extra page-one "Core Sheet" overview layer should not return.
- `M12` is now complete from the implementation side; the remaining recommendation before opening `M13` is one manual export spot-check on the latest build rather than another planned code slice inside this milestone.
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
- On `2026-03-08`, the feature baseline was re-verified on this machine with `typecheck`, `test`, `lint`, and `build:win-local` under temporary Node `22.x`; `release:verify-local` still hits the default `npm run build` symlink-privilege path here, so the machine-safe Windows baseline remains the per-command flow.
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
- `package.json` now includes `npm run release:verify-local`, but this Windows shell still relies on the explicit local validation commands when the default build path runs into `winCodeSign` symlink privileges.
- `M10-01` is now complete: saved characters persist spell slot usage across the editor, the saved-sheet route, imports, and sheet/export output.
- The exact 2024 rest-rule surface is still intentionally bounded: the app now resets pact slots, standard slots, hit points, hit point dice, death saves, temp HP, and configured short-rest / long-rest resources where appropriate, but it does not automate class-specific recovery beyond those shared tracked fields and does not hard-block rests at 0 HP on the saved-sheet route.
- The corrected `M12-03` page-one direction and the follow-up `M12-04` PDF-layout fix were re-verified on `2026-03-08` with `typecheck`, `test`, `lint`, and `build:win-local` under temporary Node `22.x`.

## Files Expected To Change Next

- `docs/STATUS.md`
- `docs/CHECKLIST.md`
- `docs/PLAN.md`
- `docs/DECISIONS.md`

## Commands To Run First

```bash
cat .nvmrc
npx -y node@22 -v
npx -y -p node@22 -p npm@10 npm run content:build
npx -y -p node@22 -p npm@10 npm run typecheck
npx -y -p node@22 -p npm@10 npm run test
npx -y -p node@22 -p npm@10 npm run lint
npx -y -p node@22 -p npm@10 npm run build:win-local
```
