# Decisions

## DEC-001

- Date: `2026-03-07`
- Context: The product needs a downloadable desktop experience with a dense, exact-style sheet layout and offline local storage.
- Decision: Use `Electron + React + TypeScript` with local SQLite storage.
- Consequences: One codebase can target macOS and Windows, but packaging and native module support need explicit verification.

## DEC-002

- Date: `2026-03-07`
- Context: Work will continue across multiple machines and sessions.
- Decision: Keep `PLAN`, `CHECKLIST`, `STATUS`, and `DECISIONS` docs committed in the repo and update `CHECKLIST` plus `STATUS` in every meaningful work session.
- Consequences: Handoffs stay deterministic, but the docs become part of the required workflow.

## DEC-003

- Date: `2026-03-07`
- Context: The sheet should feel like the reference image without copying official D&D branding/assets.
- Decision: Use original art direction and CSS-driven ornamentation while preserving the same high-level section structure.
- Consequences: The v1 UI can ship more safely, but it will need bespoke visual polish instead of borrowed assets.

## DEC-004

- Date: `2026-03-07`
- Context: The original Vite/Electron plugin path produced a reliable packaged build but unstable local dev behavior.
- Decision: Keep Vite for the renderer and move the Electron main/preload build to `tsup`, with Electron Builder handling packaging.
- Consequences: The production path is explicit and easier to debug, and it remains the primary validation path for native-shell behavior.

## DEC-005

- Date: `2026-03-07`
- Context: Electron 35 local CLI runs on this machine resolve `require("electron")` to the installed binary path instead of the runtime API, which blocks a direct hot-run desktop loop.
- Decision: Make `npm run dev` a browser-backed Vite HMR workflow with a mock `dndApi` implementation backed by `localStorage`, while keeping `npm run build` as the desktop validation path.
- Consequences: Day-to-day UI and rules work now has a stable live loop, but native shell behavior still requires build/package validation.

## DEC-006

- Date: `2026-03-07`
- Context: The reference sheet layout is core product information architecture, not just late-stage visual polish.
- Decision: Pull the structural sheet recreation ahead of deeper compendium work, then defer ornamental polish and print-perfect tuning to a later `M6-02` pass.
- Consequences: The app's data and layout can now evolve together against the real page structure, but some visual details will intentionally remain unfinished until export constraints stabilize.

## DEC-007

- Date: `2026-03-07`
- Context: The original compendium was a tiny inline seed with no import versioning, which made growth and repeatable updates awkward.
- Decision: Move to a versioned shared compendium manifest with normalized entries and sync it idempotently into SQLite on app startup.
- Consequences: Browser dev and desktop builds now share the same larger dataset and can update local compendium content safely, but manifest version bumps become part of content changes.

## DEC-008

- Date: `2026-03-06`
- Context: Future support for books such as `Tasha's Cauldron of Everything` or `Exploring Eberron` should not require redesigning the core character model.
- Decision: Add a source registry, source metadata on templates and compendium entries, and per-character enabled source profiles now while the content surface is still small.
- Consequences: Later books can be added as separate content packages with filtering and licensing boundaries, but the app now has to keep source metadata synchronized across shared data, UI helpers, and persistence.

## DEC-009

- Date: `2026-03-06`
- Context: Compendium references are useful only if players can open them without losing the character-building context.
- Decision: Add an in-context reference panel on the character workspace and route compendium entries by slug so sheet and builder interactions can open a matching reference immediately.
- Consequences: The character workflow is more self-contained and the dedicated compendium page can still open linked entries directly, but UI components now carry explicit reference-link behavior.

## DEC-010

- Date: `2026-03-06`
- Context: Updated 2024 class support needs more than one spell-slot progression family, but the saved character shape should stay stable for future books and migrations.
- Decision: Model spellcasting progression by class `casterType` (`none`, `full`, `half`, `pact`) and derive a uniform spell summary that can represent both standard slots and pact slots.
- Consequences: Paladin, Ranger, and Warlock progression now fit the same calculation pipeline without changing stored character records, but multiclass spell-slot blending and class-specific exceptions remain out of scope for v1.

## DEC-011

- Date: `2026-03-06`
- Context: A global unfiltered spell picker and single-effect homebrew editor were too loose for real character building once more classes were added.
- Decision: Restrict manual spell selection to class-filtered compendium lists and let one homebrew entry compose multiple supported effects in the editor.
- Consequences: The builder is more accurate and less noisy for players, but off-list spell access now flows through explicit homebrew grants instead of an unrestricted spell checkbox list.

## DEC-012

- Date: `2026-03-06`
- Context: Equipment state needed to move beyond a single armor id, a shield boolean, and a weapon id array without breaking already-saved local characters.
- Decision: Introduce a normalized inventory array with quantity and equipped state, and derive the legacy loadout fields from it during the transition period.
- Consequences: The builder and sheet can now show richer equipment state while older saves still load, but both the inventory model and the legacy loadout fields must stay synchronized until a later cleanup/migration pass.

## DEC-013

- Date: `2026-03-06`
- Context: Once the inventory editor supported normalized gear, most non-armor items still felt second-class because only shields had consistent compendium coverage and direct references.
- Decision: Promote `gear` to a first-class compendium type, expand the open equipment dataset across armor, weapons, and gear, and give gear inventory rows direct reference slugs.
- Consequences: The builder, sheet, and compendium now expose a broader and more consistent equipment surface, but the template ids and compendium slugs now need to stay aligned for every seeded item.

## DEC-014

- Date: `2026-03-07`
- Context: The final sheet still rendered a dead `Subclass` placeholder, but full subclass rules/content would meaningfully expand v1 scope.
- Decision: Store a lightweight subclass/archetype field on the character record and render it on the builder + sheet without adding subclass-specific derived mechanics yet.
- Consequences: The presentation layer no longer ships with a fake placeholder, and players can label their character more completely, but subclass features and rule-driven subclass content still remain an explicit future expansion.

## DEC-015

- Date: `2026-03-07`
- Context: Leaving subclass as freeform text would quickly create inconsistent saved values and make later subclass-driven UI/data cleanup harder.
- Decision: Replace the freeform subclass input with a class-filtered dropdown backed by canonical option ids, while still preserving unmatched legacy values long enough to load and re-save older records safely.
- Consequences: New records now store normalized subclass selections and the builder UX is tighter, but the current subclass list is still a curated starter set rather than a full compendium-driven subclass catalog.

## DEC-016

- Date: `2026-03-07`
- Context: Subclass labels on the sheet were useful, but keeping them outside the compendium and derived state would leave the reference flow incomplete and make the feature panel underrepresent the character.
- Decision: Promote subclasses to a first-class compendium type with seeded summaries plus feature lists, and merge known subclass feature summaries into the sheet's class-feature column without adding subclass-specific mechanical overrides yet.
- Consequences: The builder, sheet, and compendium now share one canonical subclass catalog and reference path, but deeper subclass mechanics remain deferred until a later rules-engine expansion.

## DEC-017

- Date: `2026-03-07`
- Context: Backgrounds and feats were split awkwardly between labels, freeform notes, and homebrew toggles, which made the saved character shape underspecified and caused the sheet to dump unrelated homebrew names into the Feats panel.
- Decision: Add canonical `featIds` plus persisted background feature notes to the character record, surface feat selection through the seeded compendium, and route homebrew feat / feature / species-trait names into the matching derived sheet sections instead of treating every active homebrew entry as a generic feat-like note.
- Consequences: Characters now carry cleaner structured feat/background data and the sheet panels better reflect the character's actual content, but feat mechanics and deeper background automation remain separate future work.

## DEC-018

- Date: `2026-03-07`
- Context: Once feats were structured character data, leaving all seeded feats as descriptive-only made the picker look more complete than the rules layer really was.
- Decision: Add explicit feat templates and automate only the starter feat mechanics that fit the existing effect engine cleanly (`Alert`, `Tough`), while marking `Magic Initiate` as reference-only until the app has spell-choice UX for feat-granted magic.
- Consequences: Selected feats now affect initiative and hit points where expected without inventing brittle partial support for spell-granting feats, but the feat system is intentionally still a starter subset rather than a full feat-rules engine.

## DEC-019

- Date: `2026-03-07`
- Context: After `Alert` and `Tough` were automated, `Magic Initiate` was the only seeded starter feat still behaving like dead metadata, but the sheet can only represent one active spellcasting ability line cleanly.
- Decision: Add bounded `Magic Initiate` support only for non-caster classes by storing a selected spell-list class plus feat-granted spell ids, and explicitly defer caster-class + multi-spellcasting-ability support until the sheet/model can represent it honestly.
- Consequences: Fighters, rogues, and similar non-casters can now use `Magic Initiate` meaningfully in the current app, but caster classes with the feat still remain reference-only to avoid incorrect derived spell math.

## DEC-020

- Date: `2026-03-07`
- Context: Background guidance was split between compendium payload strings and builder-only UI, which made it descriptive but not actionable and risked the background metadata drifting out of sync.
- Decision: Promote seeded background guidance into the shared `BackgroundTemplate` model, including theme, suggested skills, and bounded starting inventory, then let the builder merge that starting gear into tracked inventory idempotently.
- Consequences: Backgrounds now do real work in the builder and the compendium/background metadata stay aligned, but the seeded starting gear remains a curated starter set rather than a full rules-exact equipment package.

## DEC-021

- Date: `2026-03-07`
- Context: The feat system had starter automation for fixed feats, but any feat with player choices would either stay dead metadata or require a much larger generic feat-rules system.
- Decision: Add a bounded `featSelections` record to saved characters and support only starter configurable feats whose choices compile cleanly into the existing effect engine, starting with `Skilled` and `Resilient`.
- Consequences: The app now supports a meaningful first slice of configurable feats without pretending to handle every feat pattern, but more complex feats still need either dedicated UX or a broader choice/rules model later.

## DEC-022

- Date: `2026-03-07`
- Context: Single-group feat choices worked for `Skilled` and `Resilient`, but additional starter feats such as `Skill Expert` need more than one independent choice without just flattening everything into a brittle ad hoc UI.
- Decision: Let feat templates expose multiple bounded choice groups while keeping the saved `featSelections` shape flat per feat, using group-specific option ids where needed so multi-group feats can still compile down into the existing effect engine.
- Consequences: The builder can now support richer starter feats like `Skill Expert` without a second schema migration, but the model is still intentionally bounded and does not yet represent every possible feat prerequisite or choice constraint from the full ruleset.

## DEC-023

- Date: `2026-03-07`
- Context: Once configurable feats existed, the sheet still only showed feat names, which hid the player's actual choices unless they reopened the builder.
- Decision: Surface the selected configurable feat choice labels directly in the sheet's Feats panel instead of leaving those choices implicit.
- Consequences: The sheet is now a truer readout of the character and exported previews stay more self-explanatory, but the display remains a compact summary rather than a full feat-rules breakdown.

## DEC-024

- Date: `2026-03-07`
- Context: Choice-level feat filtering prevented illegal `Skilled`, `Resilient`, and `Skill Expert` options, but the builder could still leave the feat itself selected after class or skill changes made the feat impossible to satisfy at all.
- Decision: Centralize feat-level legality checks in shared reference helpers and run that same sanitizer in builder state, record normalization, derived calculations, and sheet display.
- Consequences: The feat picker now disables impossible starter feats and stale invalid feat ids/selections self-heal automatically, but the legality model is still intentionally bounded to the starter configurable feats rather than a universal feat-prerequisite engine.

## DEC-025

- Date: `2026-03-07`
- Context: The feat picker had a stable bounded-choice model, but the seeded feat set was still narrow enough that it understated what the current rules engine could already support and gave no quick visual signal about partial versus fully derived support.
- Decision: Expand the starter feat catalog with a small set of additional feats that fit the existing engine honestly (`Mobile`, `Athlete`, `Observant`) and add explicit feat support-level messaging in the builder instead of pretending every selected feat is equally automated.
- Consequences: Players now get a broader and clearer feat surface without a bigger rules-engine rewrite, but some feat benefits intentionally remain labeled as partial/reference support until the sheet/model grows to represent them fully.

## DEC-026

- Date: `2026-03-07`
- Context: `Observant` had been marked as only partially supported because the derived sheet model had no passive-skill surface, even though passive awareness is a bounded rules concept the app can represent cleanly.
- Decision: Add passive skill values to the derived state, expose them on the sheet as a compact `Passive Senses` panel, and model `Observant` through explicit passive Investigation / Perception bonuses while keeping lip-reading reference-only.
- Consequences: The rules engine, sheet, compendium payload, and homebrew effect model can now represent passive skill bonuses honestly, but the app still does not attempt to encode broader table-driven sensory rules beyond those bounded passive values.

## DEC-027

- Date: `2026-03-07`
- Context: `Magic Initiate` was supported only for non-casters because the sheet model exposed a single spell attack / save DC line, which made native casters with a different feat spell list ability impossible to represent honestly.
- Decision: Keep the existing primary spellcasting line, but add one bounded secondary feat spellcasting line for `Magic Initiate` only when the chosen spell list uses a different ability than the character's current primary spellcasting line.
- Consequences: Native casters can now use `Magic Initiate` without corrupting their class spellcasting math, and feat-granted cantrips can show the correct attack/DC values, but the app still avoids a broader multiclass or arbitrary multi-source spellcasting architecture.

## DEC-028

- Date: `2026-03-07`
- Context: The bounded homebrew editor still hid `initiative_bonus` and `hp_bonus_per_level` even though the rules engine already used those effect types safely for seeded feat mechanics such as `Alert` and `Tough`.
- Decision: Expose `initiative_bonus` and `hp_bonus_per_level` in the homebrew editor, while still keeping unsupported internal types such as `resource_max_bonus` hidden until the app can represent them honestly.
- Consequences: Users can now create a broader but still defensible range of homebrew feat/item effects without touching code, but the homebrew editor remains intentionally narrower than the full internal effect union.

## DEC-029

- Date: `2026-03-07`
- Context: The app could export a character to JSON, but there was no first-class way to bring that file back in on another machine or after reinstalling, which weakened the packaged-app backup/recovery story.
- Decision: Add a bounded JSON import path that accepts both the app's wrapped export format and raw character records, then route imported data through the normal record parser and save path so legacy backfills and local persistence rules stay centralized.
- Consequences: Single-character transfer and restore now work through the normal UI on both browser-dev and packaged builds, but import intentionally remains per-character and does not attempt to merge or restore the full local database in one step.

## DEC-030

- Date: `2026-03-07`
- Context: The current embedded character workspace is functional, but the intended UX is roster-first launch plus a clearer separation between reading a finished sheet and editing a character, without adding native multi-window complexity.
- Decision: Keep one Electron window and split the character workflow into routed pages: a roster home on app launch, a dedicated in-app character sheet page for existing characters, and a creator/editor page with a live preview at the bottom. Preserve existing edit capability by routing sheet-page edit actions back into the creator/editor flow instead of opening a second native window.
- Consequences: The app's navigation will better match the intended player journey and stay simpler to manage than multiple BrowserWindows, but the current `/characters` page will need to be decomposed into smaller route-oriented pages/components before final sheet polish and packaging signoff.

## DEC-031

- Date: `2026-03-08`
- Context: The app already persisted hit points, hit dice, death saves, and inspiration, but spell slots still existed only as derived maxima, which made the dedicated saved-sheet route weak for actual play and left exports unable to reflect current slot usage.
- Decision: Persist remaining standard and pact spell slots on the character record, backfill legacy/imported records to the current maxima during parsing, and surface that tracked state in both the creator/editor route and the saved-sheet route while showing remaining/max values on the sheet preview/export.
- Consequences: Saved sheets now support actual spell-slot tracking without leaving the main route flow, and older records upgrade safely without a database migration, but broader rest automation and generic limited-use resource support remain separate future work.

## DEC-032

- Date: `2026-03-08`
- Context: The app now needs a much denser saved-sheet experience inspired by a two-page spreadsheet-style layout, but rewriting the builder and roster at the same time would blur the milestone and slow handoffs.
- Decision: Keep the redesign saved-sheet-first on `/characters/:id`, and leave the existing builder/editor route in place until the new sheet data model and page structure settle.
- Consequences: The next milestone slices can focus on the two-page read/play surface without reworking the whole app at once, but some sheet-only fields will need to be editable outside the current builder flow.

## DEC-033

- Date: `2026-03-08`
- Context: The inline TypeScript spell seed had become the bottleneck for richer spell metadata, future book growth, and creature/beast support.
- Decision: Move spells and creatures into repo-managed content packs under `content/packs`, validate them through `npm run content:build`, generate a merged JSON dataset for browser/Electron consumption, and keep SQLite sync/search pointed at that generated compendium data.
- Consequences: Larger rules content now has a repeatable import path and can add keyed long-form descriptions without bloating character records, but pack authors must regenerate the merged dataset whenever canonical content changes.

## DEC-034

- Date: `2026-03-08`
- Context: The target sheet needs room for manual edits and notes, but a persistent freehand annotation/highlight layer would add much more interaction and storage complexity than the current saved-sheet route can absorb safely.
- Decision: Keep the first redesign pass bounded to structured sheet fields, inline text notes, and explicit trackable resources rather than freehand drawing/highlighting.
- Consequences: The saved-sheet route can gain practical manual editing sooner and with less persistence risk, but exact spreadsheet-style markup remains a future enhancement instead of part of the first redesign cut.

## DEC-035

- Date: `2026-03-08`
- Context: The new sheet should support short-rest / long-rest controls and charge tracking, but a broad 2024 automation engine would materially expand scope before the redesigned data model even exists.
- Decision: Sequence `M10` as UI/data-model first: add generic tracked resources and only bounded rest/reset behavior for explicitly configured state before attempting universal class-feature automation.
- Consequences: The redesigned sheet can support real at-table tracking sooner, but deeper rules automation remains intentionally deferred until after the two-page surface and persistence model are in place.
