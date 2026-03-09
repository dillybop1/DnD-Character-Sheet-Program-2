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

## DEC-036

- Date: `2026-03-08`
- Context: The saved-sheet route now has enough persisted play-state to support manual rests, but fully encoding every 2024 recovery edge case would exceed the intended scope of `M10-08`.
- Decision: Keep rest behavior bounded to shared tracked state only: `Short Rest` resets pact slots, short-rest resources, and stale death saves when the character has at least 1 HP; `Long Rest` restores HP to max, clears temp HP, restores all hit point dice and spell slots, clears death saves, and resets all non-manual tracked resources. Spending hit point dice during a short rest remains a manual player action.
- Consequences: The app now supports useful at-table recovery flows without a universal feature engine, but class-specific recovery exceptions and automated short-rest healing remain explicit future work rather than hidden assumptions.

## DEC-037

- Date: `2026-03-08`
- Context: `M10` completed the two-page saved-sheet redesign, but the route still needed a polish pass for print/mobile behavior and a clear QA handoff before more feature work could start responsibly.
- Decision: Open `M11` as a short saved-sheet polish and validation milestone, starting with print/mobile cleanup for the saved-sheet interaction chrome and treating manual route validation as the explicit next task before new features.
- Consequences: A future machine now lands on concrete QA work instead of an unassigned post-redesign state, but additional feature expansion waits until the saved-sheet route is manually signed off.

## DEC-038

- Date: `2026-03-08`
- Context: `M11-02` needed repeatable regression coverage for the new saved-sheet route, but adding a heavier browser automation stack before the route was manually signed off would have added tool churn on top of the actual QA work.
- Decision: Start automated QA with a Vitest + `jsdom` smoke test that renders the real saved-sheet route through the browser localStorage API and covers route load, page navigation state, spell inspector pinning, and bounded short-rest persistence. Leave print/PDF output and true packaged-window behavior as explicit manual checks for the same task.
- Consequences: The repo now has a cheap saved-sheet regression guard without adding a second test framework, but packaged-Electron behavior and print fidelity still require human validation before `M11-02` can close.

## DEC-039

- Date: `2026-03-08`
- Context: The first saved-sheet QA pass passed cleanly except for one UX request: the route's short-rest / long-rest buttons should stay available even when the tracked current HP is `0`, instead of encoding an extra rules gate in the sheet UI.
- Decision: Remove the saved-sheet route's 0-HP rest-button gate and treat rest actions as player-controlled sheet operations. The bounded reset logic stays the same; only the availability gate and explanatory copy were removed.
- Consequences: The sheet no longer blocks a player from applying a rest while the character is at `0` HP, which matches the intended low-friction tracking UX, but the app continues to avoid claiming full 2024 rules automation.

## DEC-040

- Date: `2026-03-08`
- Context: The saved-sheet route is now functionally complete and manually validated, but the live on-screen experience still lagged the reference because page 1 and page 2 were being framed through the app's dark translucent panel language instead of a dedicated sheet canvas.
- Decision: Open `M12` as a visual parity milestone and start by moving the saved-sheet route itself onto a light paper workspace before attempting finer worksheet-style restructuring inside page 1 and page 2.
- Consequences: The route now reads more like a sheet and less like a generic dashboard on screen, which makes the next parity work more incremental, but the page interiors still need deeper worksheet-style layout passes to match the reference more closely.

## DEC-041

- Date: `2026-03-08`
- Context: The saved-sheet route had both the reference-style page-one sheet and an added quick-overview layer above it, which blurred which surface was supposed to be the real main sheet.
- Decision: Treat the reference-style page-one `SheetPreview` layout as the actual main core sheet and remove the extra top-of-page overview layer instead of replacing the sheet itself.
- Consequences: Page 1 fidelity now anchors on the existing reference-style sheet body, while saved-sheet-only controls have to live adjacent to or below that body rather than displacing it.

## DEC-042

- Date: `2026-03-08`
- Context: Page 2 already had the right saved-sheet behaviors, but its layout still read like a set of generic dashboard cards rather than the spellbook worksheet shown in the reference.
- Decision: Rebuild page 2 around worksheet-style primitives: a spellcasting header, explicit spell-slot ledger, lined spell table, and tighter right-rail detail/profile blocks, while keeping the existing hover/pin inspector and tracked-resource behavior intact.
- Consequences: The spellbook page now reads much closer to the spreadsheet reference without needing a rules-model rewrite, and the remaining visual work shifts to keeping page 1 faithful to the reference-style sheet while retuning print around the lighter two-page shell.

## DEC-043

- Date: `2026-03-08`
- Context: A prior `M12-03` pass started replacing page 1 with custom worksheet sections, but that diverged from the requested layout because the user actually wants the reference-style page-one sheet back as the main body.
- Decision: Reverse that replacement, restore the reference-style `SheetPreview` body as the primary page-one layout, and keep the page-one edit/rest/resource surfaces outside the sheet instead of inserting a separate summary layer above it.
- Consequences: The saved-sheet route intentionally stays mixed: page 1 is the direct reference-style sheet body, page 2 is the worksheet-style spellbook surface, and the remaining `M12` work is now about print/PDF tuning around that corrected combination.

## DEC-044

- Date: `2026-03-08`
- Context: The previous print pass still let the export path pick up the app's responsive collapse rules, so the PDF switched to a narrow stacked/mobile-style layout even when the live saved-sheet route was rendering in its full desktop grid.
- Decision: In print/PDF output, disable the saved-sheet container-query collapse, explicitly restore the desktop grid templates for the reference sheet and worksheet spellbook, and set Electron PDF export to honor the CSS page size directly.
- Consequences: PDF export now tracks the in-app sheet layout much more closely instead of reflowing into stacked cards and one-column tables, while the remaining verification step is a manual visual export spot-check rather than another structural CSS rewrite.

## DEC-045

- Date: `2026-03-08`
- Context: The latest packaged PDF spot-check still looked janky enough that continued print-system iteration would pull focus away from higher-value content and product work.
- Decision: Stop treating print/PDF polish as an active milestone gate. Keep the current PDF export as a best-effort utility for now, defer further print-system work until a final-release go/no-go pass, and leave open the option to simplify or drop that export path if it still is not worth the complexity then.
- Consequences: `M12-05` is no longer the task that blocks the roadmap, `M13` can return to non-print content/product expansion immediately, and current docs should stop presenting PDF fidelity as the near-term focus. Interim builds may still have a rough PDF export experience, and that roughness is now an accepted tradeoff instead of a current blocker.

## DEC-046

- Date: `2026-03-08`
- Context: With print work deferred, the first `M13` slice needed to increase day-to-day value quickly without reopening a larger schema rewrite or licensing-sensitive sourcebook plan.
- Decision: Start `M13` with a bounded expansion of the existing open SRD spell pack, focusing first on under-served class-filtered spell lists such as Druid, Ranger, and Paladin while staying inside the current repo-managed pack pipeline.
- Consequences: The builder and compendium now get a more useful class-spell baseline immediately, the content-pack workflow proves it can keep broadening canonical data without code-model churn, and the next content decision can focus on whether to keep deepening spell/creature breadth or extend pack management to more compendium types.

## DEC-047

- Date: `2026-03-08`
- Context: After `M13-02`, the creature/beast pack still had only a minimal handful of entries, which limited druid-form-style browsing and left the current repo-managed pack workflow underused on the creature side.
- Decision: Keep the next `M13` slice inside the same repo-managed content-pack pipeline and broaden the open creature pack with a denser starter beast baseline spanning land, swim, and fly options before taking on a wider compendium-type migration.
- Consequences: Creature browsing now has a more useful beast baseline without a schema change, the content-pack workflow is now exercised on both spell and creature breadth, and the next roadmap decision can focus on whether to keep expanding pack breadth or move more compendium types into repo-managed sources.

## DEC-048

- Date: `2026-03-08`
- Context: After the first `M13` spell expansion, the divine/primal lists were healthier, but the current pack still left Bard / Sorcerer / Warlock / Wizard noticeably thinner than the rest of the builder's spell surface.
- Decision: Keep `M13-04` inside the existing spell pack schema and add another bounded round of low-level arcane/control staples rather than opening a new pack type immediately.
- Consequences: The current repo-managed spell pack now feels more balanced across caster families without any schema churn, but the next roadmap choice remains open between more current-pack breadth and a broader pack-type migration.

## DEC-049

- Date: `2026-03-08`
- Context: After the beast expansion, creature browsing was still effectively a druid-form-only surface because the pack had no starter non-beast opponents or reference creatures.
- Decision: Keep the next `M13` slice inside the current `creatures.json` schema and add a small non-beast baseline across multiple creature types instead of designing a separate enemy/reference subsystem first.
- Consequences: The compendium now has a more useful starter creature baseline for browsing and lookup without any schema churn, but richer encounter-facing creature coverage still depends on future content breadth rather than a new model.

## DEC-050

- Date: `2026-03-08`
- Context: After the recent breadth passes, the current pack had far more entries than long-form descriptions, which made the compendium detail panel and saved-sheet spell inspector feel thinner than the content counts implied.
- Decision: Keep `M13-06` inside the existing pack schema and deepen joined description coverage for the most-used current spell and creature entries before opening another architectural milestone.
- Consequences: The current pack pipeline now proves it can add richer detail text as well as raw entry counts, and the next roadmap choice can stay pragmatic: either keep densifying the current packs or move on to a broader pack-type migration.

## DEC-051

- Date: `2026-03-08`
- Context: The app now ships more rules/reference prose from both static seed files and repo-managed content packs, and the user wants exact official wording whenever the product claims to show source text.
- Decision: Treat verbatim official text as allowed only for open or otherwise explicitly licensed sources, keep a repo-visible inventory of every shipped non-verbatim rules/reference text surface, and require repo-managed pack descriptions to carry a matching `textAudit.json` entry so paraphrases cannot be added silently.
- Consequences: The repo now distinguishes exact-source text from app-authored browse/support copy more honestly, current SRD joined descriptions are explicitly documented as paraphrases until replaced, and future content additions must update both the audit/inventory docs and the pack metadata instead of slipping in undocumented non-verbatim text.

## DEC-052

- Date: `2026-03-09`
- Context: The source-text policy was in place, but the current joined SRD spell and creature descriptions were still paraphrases even though those are the surfaces where the app most directly presents rules text to the user.
- Decision: Replace the current joined SRD 5.2.1 spell and creature description files with exact official SRD wording, and treat the remaining static summaries/effects/features/actions as documented browse copy rather than pretending they are the canonical rules text.
- Consequences: The saved-sheet spell inspector and compendium detail view now present exact open SRD wording for the joined spell/creature description surfaces, the pack audit can mark those files as `verbatim`, and the next architecture decision shifts to whether other open static compendium types need their own exact-text detail surfaces instead of more summary strings.

## DEC-053

- Date: `2026-03-09`
- Context: `M13-08` proved the exact-text policy on the spell/creature description surfaces, but most remaining open compendium types still rely on compact `summary` and support-copy fields that drive search results, browse cards, and builder-facing reference copy.
- Decision: Keep those compact summary/support fields as documented non-verbatim browse copy, and add exact open text only through separate detail surfaces when the product needs canonical wording. Prioritize `armor`, `weapon`, and `gear` next because equipment is less coupled to rules automation than feats, backgrounds, or broader rules text.
- Consequences: The repo no longer treats "make it exact" as a blanket instruction to rewrite every summary string, the non-verbatim inventory remains honest for browse/support surfaces, and the next implementation slice is a bounded open-equipment exact-detail path rather than a repo-wide summary replacement.

## DEC-054

- Date: `2026-03-09`
- Context: The compendium already had a generic payload model and detail panel, but seeded equipment entries still exposed only compact browse summaries even after `DEC-053` chose separate exact-detail surfaces as the next path.
- Decision: Add a bounded starter set of exact open SRD equipment text through separate `officialText` payload fields sourced from a dedicated `shared/data/openEquipmentOfficialText.ts` file, and update the compendium detail view to render long-form `officialText` / `description` fields as their own sections instead of flattening them into the generic detail grid.
- Consequences: The compendium can now show exact open wording for starter `armor`, `weapon`, and `gear` entries without sacrificing the shorter browse-summary layer, seeded exact-source equipment text now has a dedicated home in the repo, and the next slice can broaden that bounded equipment coverage rather than reopening the architecture again immediately.

## DEC-055

- Date: `2026-03-09`
- Context: After the broader starter-equipment pass, the remaining equipment gaps were less important than proving whether the same additive exact-text model works for another static seed type.
- Decision: Close the equipment-only branch point by moving the next exact-text slice to seeded core `rule` entries rather than continuing to widen starter equipment indefinitely.
- Consequences: The roadmap is no longer ambiguous after `M13-11`, the additive `officialText` pattern is now validated beyond equipment, and the next decision can narrow to other open static seed types such as backgrounds or feats instead of circling back to more armor/weapon/gear rows by default.

## DEC-056

- Date: `2026-03-09`
- Context: The repo already had seeded rules glossary entries for common math and combat references, but those entries still exposed only compact non-verbatim summaries even after the source-text policy and equipment exact-text work landed.
- Decision: Add a bounded exact open SRD rules-glossary layer through a dedicated `shared/data/openRuleOfficialText.ts` file and attach those `officialText` payloads to the current seeded `rule` entries without rewriting their browse-summary fields.
- Consequences: The compendium can now show exact open wording for `Armor Class`, `Proficiency Bonus`, `Initiative`, `Saving Throws`, `Skills`, `Spell Attack Bonus`, `Spell Save DC`, `Hit Dice`, `Rests`, and `Weapon Attacks`, the non-verbatim inventory stays honest for the shorter summaries, and the next exact-text roadmap choice can focus on whether open backgrounds or open feats deserve the same treatment.

## DEC-057

- Date: `2026-03-09`
- Context: After the rules-glossary pass, the next open seeded surfaces still under discussion were backgrounds and feats, but feats remain more tightly coupled to automation messaging, support-level labels, and bounded choice UX than backgrounds do.
- Decision: Choose open backgrounds as the next additive exact-text surface before touching feats.
- Consequences: The roadmap keeps moving on a structurally simpler seed type first, the additive `officialText` pattern now covers another descriptive surface beyond equipment and rules, and the remaining feats question can be evaluated separately instead of being bundled into this pass.

## DEC-058

- Date: `2026-03-09`
- Context: The repo already had seeded `Acolyte`, `Sage`, and `Soldier` background entries, but they still exposed only compact browse summaries plus app-authored theme/support fields even though all three backgrounds are open SRD content.
- Decision: Add a bounded exact open SRD background layer through a dedicated `shared/data/openBackgroundOfficialText.ts` file and attach those `officialText` payloads to the current seeded background entries without rewriting their browse-summary or theme/support fields.
- Consequences: The compendium can now show exact open wording for the current seeded backgrounds, the non-verbatim inventory remains honest for the shorter browse/theme fields, and the next exact-text decision can narrow to whether feats deserve the same additive treatment or should wait for a broader feat-data pass.

## DEC-059

- Date: `2026-03-09`
- Context: After the backgrounds pass, feats were the most obvious remaining seeded open surface, but the current feat payloads are dominated by app-authored support-level labels, automation-status messaging, prerequisite shorthand, and bounded choice summaries rather than simple descriptive browse text.
- Decision: Defer additive exact-source feat text until a broader feat-data / automation pass can give canonical feat wording its own clean surface without colliding with the current support-copy model.
- Consequences: The repo now has an explicit reason not to make feats the next exact-text slice, the non-verbatim inventory remains honest for current feat summaries/support copy, and the next roadmap choice can focus on whether to keep expanding exact-text coverage at all or return to broader content/product scope.

## DEC-060

- Date: `2026-03-09`
- Context: After the bounded equipment, rules, and background passes, the repo had already proven the additive exact-text model on the main open static seed surfaces that are easiest to support cleanly.
- Decision: Pause further exact-text expansion for now and shift the active roadmap back to broader compendium breadth and product value.
- Consequences: The exact-text initiative now has an explicit stop point instead of sprawling into every remaining seed type, feat exact text stays deferred until a broader feat-data pass exists, and the next implementation slices can prioritize more useful spell/creature/reference coverage again.

## DEC-061

- Date: `2026-03-09`
- Context: Once the roadmap shifted back to breadth, the creature pack was still much thinner than the spell pack and still lacked several common low-level non-beast encounter/reference types.
- Decision: Use the next bounded `M13` breadth pass on another creature-pack expansion, specifically adding single-size low-level SRD encounter entries across missing non-beast creature types instead of reopening a schema discussion for variable-size Humanoids.
- Consequences: The creature pack now covers a broader cross-section of encounter browsing use cases without changing schemas, the pack summary/build metadata now reflects general creature content rather than only beasts, and the next roadmap choice can be a clean creatures-versus-spells breadth decision rather than another exact-text debate.

## DEC-062

- Date: `2026-03-09`
- Context: After the latest creature expansion, the creature pack was materially healthier, but the spell pack still stopped at level 2 and remained the more visible day-to-day gap for builder and compendium use.
- Decision: Return the next bounded breadth pass to spells rather than continuing straight into another creature batch.
- Consequences: The roadmap now has an explicit post-creature target, spell breadth can open higher-level utility/control/damage coverage instead of staying capped at low levels, and the next implementation slice can stay inside the existing pack workflow without reopening exact-text scope.

## DEC-063

- Date: `2026-03-09`
- Context: Once the roadmap returned to spells, the highest-value gap was not more cantrips or more level 1/2 filler but the lack of any common level 3 staples across arcane, divine, and primal lists.
- Decision: Use the next spell slice on a bounded first tranche of common SRD level 3 spells: `call-lightning`, `counterspell`, `dispel-magic`, `fireball`, `fly`, `hypnotic-pattern`, `plant-growth`, `revivify`, and `spirit-guardians`.
- Consequences: The repo-managed spell pack now opens level 3 coverage without changing schemas, class-filtered spell browsing is materially broader across every supported caster family, and the next roadmap choice can be a clean decision between another spell tranche and a swing back to creatures.

## DEC-064

- Date: `2026-03-09`
- Context: After the first level 3 spell tranche landed, the spell pack was much healthier, but weaker Paladin, Ranger, Cleric, and some shared utility lists still lagged more than the creature pack's remaining marginal gaps.
- Decision: Stay on spells for one more bounded pass rather than switching straight back to creatures.
- Consequences: The roadmap now has an explicit second spell-breadth decision, the next slice can target utility/support coverage instead of repeating damage/control picks, and the repo avoids oscillating between pack types without closing the clearest remaining spell gap first.

## DEC-065

- Date: `2026-03-09`
- Context: Once the roadmap stayed on spells, the best follow-up was not another arcane blaster pass but a level 3 utility/support tranche that materially lifts weaker divine, primal, and shared lists.
- Decision: Use the next spell slice on `create-food-and-water`, `daylight`, `magic-circle`, `meld-into-stone`, `nondetection`, `remove-curse`, `sending`, `speak-with-plants`, `water-walk`, and `wind-wall`.
- Consequences: The repo-managed spell pack now covers a much broader cross-section of exploration, communication, warding, travel, and terrain-control use cases without any schema change, Paladin and Ranger lists are materially less thin, and the next roadmap choice can be a clean decision between a third spell slice and a swing back to creatures.

## DEC-066

- Date: `2026-03-09`
- Context: After the second level 3 spell pass, a user-reported `Chill Touch` mismatch showed that the spell pack's exact-text retrofit had not kept up with the pack's later spell-growth work, and the inspect UI still led with shorter app-authored summary/effect copy even when exact long-form text existed.
- Decision: Temporarily reopen spell exact-text cleanup before the next breadth decision, retrofit every current spell-pack entry that can be matched to verified official open spell text, and make inspect surfaces prefer that long-form text over the shorter non-verbatim summary/effect/features/actions layer whenever it exists. Keep any unmatched spell explicitly documented rather than fabricating or silently paraphrasing exact text.
- Consequences: The current spell pack now carries joined exact open description text for nearly every shipped spell entry instead of only the earlier small subset, the compendium detail view and saved-sheet spell inspection path are less likely to present paraphrase as canonical text, and the remaining exception (`thorn-whip`) stays visible in repo policy/inventory docs until a verified open exact source is found.

## DEC-067

- Date: `2026-03-09`
- Context: Once the spell exact-text retrofit was closed, the roadmap still needed to choose between immediately returning to creatures or continuing on spells. The current pack still had no level 4 coverage at all, while the only remaining spell exact-text exception was already explicit and bounded.
- Decision: Stay on spells for the next breadth slice rather than swinging back to creatures immediately.
- Consequences: The roadmap now treats the documented `thorn-whip` exception as a bounded note instead of a blocker, spell breadth keeps moving into more player-visible territory, and the next slice can open level 4 coverage without reopening schema or policy questions.

## DEC-068

- Date: `2026-03-09`
- Context: After two level 3 passes, the most useful next spell expansion was not another low-level fill-in but a first bounded level 4 tranche that improves weaker Paladin, Ranger, and Warlock lists while also adding high-traffic mobility, warding, tracking, and transformation staples.
- Decision: Use the next spell slice on `aura-of-life`, `banishment`, `charm-monster`, `conjure-woodland-beings`, `death-ward`, `dimension-door`, `freedom-of-movement`, `greater-invisibility`, `locate-creature`, `polymorph`, and `stoneskin`.
- Consequences: The repo-managed spell pack now opens level 4 coverage with a defensible first tranche that broadens multiple class lists at once, the generated content build and verbatim spell-description coverage both expand in the same pass, and the next roadmap choice can cleanly decide between another level 4 spell pass and a swing back to creatures.

## DEC-069

- Date: `2026-03-09`
- Context: After the first level 4 spell tranche landed, the spell pack finally had level 4 coverage, but it was still materially thinner than the lower-level spell baseline and still the more visible player-facing content gap compared with adding another bounded creature slice immediately.
- Decision: Stay on spells for one more bounded level 4 pass rather than swinging straight back to creatures.
- Consequences: The roadmap now treats the second level 4 spell slice as an intentional follow-through instead of open-ended drift, the remaining documented `thorn-whip` exception stays a bounded note rather than a blocker, and the next spell pass can target battlefield control, divination, and area-shaping utility that the first tranche did not cover.

## DEC-070

- Date: `2026-03-09`
- Context: Once the roadmap stayed on spells, the highest-value follow-up was not another movement/defense tranche but a complementary level 4 slice that broadens battlefield control, divination, terrain shaping, and cleanup options across Bard, Cleric, Druid, Sorcerer, Warlock, and Wizard lists.
- Decision: Use the next spell slice on `blight`, `confusion`, `control-water`, `divination`, `dominate-beast`, `guardian-of-faith`, `hallucinatory-terrain`, `ice-storm`, `otilukes-resilient-sphere`, and `wall-of-fire`.
- Consequences: The repo-managed spell pack now reaches a healthier level 4 baseline without changing schemas, exact joined spell-description coverage expands in the same pass to `84` of `85` current spell-pack entries, and the next roadmap choice can more cleanly decide between a third level 4 spell pass and a deliberate swing back to creatures.

## DEC-071

- Date: `2026-03-09`
- Context: After the second level 4 spell tranche landed, the spell pack was materially stronger, but the remaining open level 4 pool still contained several shared or iconic scouting, summoning, control, and damage spells that offered more day-to-day player value than switching back to creatures immediately.
- Decision: Stay on spells for one more bounded level 4 pass rather than swinging back to creatures after the second tranche.
- Consequences: The roadmap now treats the third level 4 spell slice as a deliberate follow-through on the remaining high-value open spell pool, the only documented exact-text exception stays a bounded `thorn-whip` note instead of a blocker, and the next pass can narrow the leftover spell gap down to a small niche cleanup set instead of another broad baseline hole.

## DEC-072

- Date: `2026-03-09`
- Context: Once the roadmap stayed on spells again, the best next slice was not to spend effort on the remaining niche storage or sanctum spells first, but to cover the remaining shared or iconic level 4 entries that still matter in live play and compendium inspection.
- Decision: Use the next spell slice on `arcane-eye`, `compulsion`, `conjure-minor-elementals`, `evards-black-tentacles`, `fire-shield`, `giant-insect`, `mordenkainens-faithful-hound`, `phantasmal-killer`, `stone-shape`, and `vitriolic-sphere`.
- Consequences: The repo-managed spell pack now reaches `95` spells without any schema change, exact joined spell-description coverage expands in the same pass to `94` of `95` current spell-pack entries, and the next roadmap choice is cleaner: either finish the small remaining niche level 4 cleanup (`fabricate`, `leomunds-secret-chest`, `mordenkainens-private-sanctum`) or swing back to creatures.

## DEC-073

- Date: `2026-03-09`
- Context: After the third level 4 spell tranche landed, only three open level 4 spells remained. The user explicitly stated that creatures are a low priority, so the post-tranche choice was no longer between equal breadth targets.
- Decision: Finish the remaining niche level 4 spell cleanup rather than pivoting to creatures.
- Consequences: The roadmap now treats a complete open level 4 spell baseline as the immediate goal, creature work stays deprioritized by user preference, and the next decision point can move up a level instead of bouncing back to incomplete level 4 coverage later.

## DEC-074

- Date: `2026-03-09`
- Context: Once the roadmap stayed on spells again, the remaining level 4 gap was narrow and clearly defined: `fabricate`, `leomunds-secret-chest`, and `mordenkainens-private-sanctum`.
- Decision: Use the next spell slice on `fabricate`, `leomunds-secret-chest`, and `mordenkainens-private-sanctum`.
- Consequences: The repo-managed spell pack now closes its current open level 4 baseline at `98` spells, exact joined spell-description coverage expands to `97` of `98` current spell-pack entries, and the next roadmap choice is no longer "finish level 4 or not" but "open level 5 or stop expanding spells for now."

## DEC-075

- Date: `2026-03-09`
- Context: With the open level 4 baseline complete, the next choice was whether to pause spell expansion or open level 5. The user explicitly wants to continue on spells and keeps creatures as a lower-priority surface.
- Decision: Open level 5 instead of pausing spell expansion or pivoting back to creatures.
- Consequences: The roadmap now treats level 5 as the active bounded spell-breadth target, creature work remains deprioritized by user preference, and the next slice can focus on the highest-traffic shared level 5 staples rather than reopening lower-level cleanup.

## DEC-076

- Date: `2026-03-09`
- Context: Once level 5 was chosen, the first slice needed to favor broad player-facing value rather than niche narrative spells. The strongest first tranche was a mix of recovery, divination, travel, battlefield control, and iconic finishers spread across Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, and Wizard lists.
- Decision: Use the first level 5 spell slice on `bigbys-hand`, `cone-of-cold`, `greater-restoration`, `hold-monster`, `mass-cure-wounds`, `raise-dead`, `scrying`, `teleportation-circle`, `wall-of-force`, and `wall-of-stone`.
- Consequences: The repo-managed spell pack now reaches `108` spells, exact joined spell-description coverage expands to `107` of `108` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v15`, and the next roadmap choice becomes "stay on spells for another level 5 slice or pause spell expansion after the first level 5 tranche."

