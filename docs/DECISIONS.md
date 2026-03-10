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

## DEC-077

- Date: `2026-03-09`
- Context: After the first level 5 tranche landed, the spell pack still had a substantial open level 5 pool and the user had not changed direction on creatures. The stronger immediate value was another bounded spell pass rather than pausing or reopening a low-priority surface.
- Decision: Stay on spells for another bounded level 5 slice rather than pausing spell expansion or pivoting back to creatures.
- Consequences: The roadmap now treats a second level 5 spell tranche as an intentional follow-through, keeps creatures deprioritized by user preference, and lets the next spell slice focus on shared divination, coordination, protection, and traversal value instead of drifting into ad hoc leftovers.

## DEC-078

- Date: `2026-03-09`
- Context: Once the roadmap stayed on spells again, the best next level 5 tranche was not a pile of Wizard-only damage spells but a bounded slice that raised weaker divine and primal lists while still adding broad player-facing utility and control.
- Decision: Use the second level 5 spell slice on `commune`, `commune-with-nature`, `contact-other-plane`, `dispel-evil-and-good`, `dominate-person`, `geas`, `legend-lore`, `planar-binding`, `rarys-telepathic-bond`, and `tree-stride`.
- Consequences: The repo-managed spell pack now reaches `118` spells, exact joined spell-description coverage expands to `117` of `118` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v16`, and the next roadmap choice becomes "stay on spells for a third level 5 slice or pause spell expansion after the second level 5 tranche."

## DEC-079

- Date: `2026-03-09`
- Context: After the second level 5 tranche landed, the spell pack still had a meaningful remaining open level 5 pool and the user had not redirected priority away from spells. The more useful next move was another bounded spell pass rather than pausing expansion or pivoting to low-priority creatures.
- Decision: Stay on spells for a third bounded level 5 slice rather than pausing spell expansion or reopening a creature pass.
- Consequences: The roadmap now treats a third level 5 tranche as an intentional follow-through, keeps creatures deprioritized by user preference, and lets the next slice target the combat- and infiltration-heavy remainder of the open level 5 pool instead of drifting into ad hoc leftovers.

## DEC-080

- Date: `2026-03-09`
- Context: Once the roadmap stayed on spells again, the best third level 5 slice was a bounded mix of summoning, poison pressure, illusion, nightmare utility, and telekinetic control rather than only niche support leftovers or another pure Wizard-heavy cleanup pass.
- Decision: Use the third level 5 spell slice on `animate-objects`, `cloudkill`, `conjure-elemental`, `contagion`, `dream`, `flame-strike`, `insect-plague`, `mislead`, `seeming`, and `telekinesis`.
- Consequences: The repo-managed spell pack now reaches `128` spells, exact joined spell-description coverage expands to `127` of `128` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v17`, and the next roadmap choice becomes "stay on spells for a fourth level 5 slice or pause spell expansion after the third level 5 tranche."

## DEC-081

- Date: `2026-03-09`
- Context: After the third level 5 tranche landed, the spell pack had only a small remaining open tail and the user still wanted to keep investing in spells rather than pausing or reopening creatures.
- Decision: Finish the remaining open level 5 tail rather than pausing spell expansion or pivoting back to a lower-priority creature pass.
- Consequences: The roadmap now treats the small final level 5 cleanup as intentional follow-through, keeps creatures deprioritized by user preference, and lets the spell pack close its current open level 5 baseline before opening a new level.

## DEC-082

- Date: `2026-03-09`
- Context: Once the roadmap chose to finish level 5, the best final slice was a bounded cleanup set that closed the remaining utility, warding, resurrection, memory, and companion gaps instead of drifting into a mixed or arbitrary tail.
- Decision: Use the final level 5 cleanup on `antilife-shell`, `awaken`, `creation`, `hallow`, `modify-memory`, `passwall`, `reincarnate`, and `summon-dragon`.
- Consequences: The repo-managed spell pack now reaches `136` spells, exact joined spell-description coverage expands to `135` of `136` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v18`, and the next roadmap choice becomes "open level 6 or pause spell expansion after the completed open level 5 baseline."

## DEC-083

- Date: `2026-03-09`
- Context: With the current open level 5 baseline complete, the next choice was whether to pause spell expansion or open level 6. The user explicitly chose to continue on spells while keeping creatures lower priority.
- Decision: Open level 6 instead of pausing spell expansion or pivoting back to creatures.
- Consequences: The roadmap now treats level 6 as the active bounded spell-breadth target, keeps creatures deprioritized by user preference, and lets the next slice focus on the highest-traffic shared level 6 staples rather than stalling after finished level 5 cleanup.

## DEC-084

- Date: `2026-03-09`
- Context: Once level 6 was chosen, the strongest first tranche was a broad, player-facing mix of iconic arcane damage, anti-magic defense, top-end healing, feast buffs, mass control, sight, and wall pressure rather than niche narrative-only leftovers.
- Decision: Use the first level 6 spell slice on `blade-barrier`, `chain-lightning`, `disintegrate`, `globe-of-invulnerability`, `heal`, `heroes-feast`, `mass-suggestion`, `sunbeam`, `true-seeing`, and `wall-of-ice`.
- Consequences: The repo-managed spell pack now reaches `146` spells, exact joined spell-description coverage expands to `145` of `146` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v19`, and the next roadmap choice becomes "stay on level 6 for another slice or pause spell expansion after the first level 6 tranche."

## DEC-085

- Date: `2026-03-09`
- Context: After the first level 6 tranche landed, the spell pack still had substantial open level 6 breadth and the user had not redirected priority away from spells. The stronger immediate value was another bounded spell pass rather than pausing or pivoting back to low-priority creatures.
- Decision: Stay on level 6 for another bounded spell slice rather than pausing spell expansion or reopening a creature pass.
- Consequences: The roadmap now treats a second level 6 tranche as intentional follow-through, keeps creatures deprioritized by user preference, and lets the next slice target divine or primal travel, warding, attrition, and battlefield-shaping value instead of drifting into ad hoc leftovers.

## DEC-086

- Date: `2026-03-09`
- Context: Once the roadmap stayed on level 6 again, the strongest next tranche was not more pure arcane nukes but a bounded mix of divine or primal traversal, sanctified warding, necrotic attrition, petrification, and terrain control that materially broadened Cleric and Druid value.
- Decision: Use the second level 6 spell slice on `eyebite`, `find-the-path`, `flesh-to-stone`, `forbiddance`, `harm`, `move-earth`, `transport-via-plants`, `wall-of-thorns`, `wind-walk`, and `word-of-recall`.
- Consequences: The repo-managed spell pack now reaches `156` spells, exact joined spell-description coverage expands to `155` of `156` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v20`, and the next roadmap choice becomes "stay on level 6 for a third slice or pause spell expansion after the second level 6 tranche."

## DEC-087

- Date: `2026-03-09`
- Context: After the second level 6 tranche landed, the spell pack had only a small remaining open tail and the user still wanted to keep investing in spells rather than pausing or reopening creatures.
- Decision: Finish the remaining open level 6 tail rather than pausing spell expansion or pivoting back to a lower-priority creature pass.
- Consequences: The roadmap now treats the small final level 6 cleanup as intentional follow-through, keeps creatures deprioritized by user preference, and lets the spell pack close its current open level 6 baseline before opening a new level.

## DEC-088

- Date: `2026-03-09`
- Context: Once the roadmap chose to finish level 6, the best final slice was a bounded cleanup set that closed the remaining arcane, undead, warding, extraplanar, and illusion gaps instead of drifting into a mixed or arbitrary tail.
- Decision: Use the final level 6 cleanup on `circle-of-death`, `conjure-fey`, `contingency`, `create-undead`, `guards-and-wards`, `magic-jar`, `planar-ally`, and `programmed-illusion`.
- Consequences: The repo-managed spell pack now reaches `164` spells, exact joined spell-description coverage expands to `163` of `164` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v21`, and the next roadmap choice becomes "open level 7 or pause spell expansion after the completed open level 6 baseline."

## DEC-089

- Date: `2026-03-09`
- Context: With the current open level 6 baseline complete, the next choice was whether to pause spell expansion or open level 7. The user explicitly chose to keep pushing spells rather than pausing or pivoting back to low-priority creatures.
- Decision: Open level 7 instead of pausing spell expansion or reopening a creature pass.
- Consequences: The roadmap now treats level 7 as the active bounded spell-breadth target, keeps creatures deprioritized by user preference, and lets the next slice focus on the highest-traffic shared level 7 staples rather than stalling after the completed level 6 cleanup.

## DEC-090

- Date: `2026-03-09`
- Context: Once level 7 was chosen, the strongest first tranche was a broad, player-facing mix of travel, force control, lethal finishing pressure, and top-end recovery rather than a niche illusion- or wizard-only cleanup pass.
- Decision: Use the first level 7 spell slice on `delayed-blast-fireball`, `etherealness`, `finger-of-death`, `fire-storm`, `forcecage`, `plane-shift`, `regenerate`, `resurrection`, `reverse-gravity`, and `teleport`.
- Consequences: The repo-managed spell pack now reaches `174` spells, exact joined spell-description coverage expands to `173` of `174` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v22`, and the next roadmap choice becomes "stay on level 7 for another slice or pause spell expansion after the first level 7 tranche."

## DEC-091

- Date: `2026-03-09`
- Context: After the first level 7 tranche landed, only one bounded remaining open level 7 pool remained and the user still prioritized spells over creatures.
- Decision: Finish the remaining open level 7 tail rather than pausing spell expansion or pivoting back to a lower-priority creature pass.
- Consequences: The roadmap now treats the final level 7 cleanup as intentional follow-through, keeps creatures deprioritized by user preference, and lets the spell pack close its current open level 7 baseline before opening a new level.

## DEC-092

- Date: `2026-03-09`
- Context: Once the roadmap chose to finish level 7, the best final slice was a bounded cleanup set that closed the remaining celestial, glyph, illusion, mansion, and duplicate gaps instead of drifting into a mixed or arbitrary tail.
- Decision: Use the final level 7 cleanup on `conjure-celestial`, `divine-word`, `mirage-arcane`, `mordenkainens-magnificent-mansion`, `mordenkainens-sword`, `prismatic-spray`, `project-image`, `sequester`, `simulacrum`, and `symbol`.
- Consequences: The repo-managed spell pack now reaches `184` spells, exact joined spell-description coverage expands to `183` of `184` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v23`, and the next roadmap choice becomes "open level 8 or pause spell expansion after the completed open level 7 baseline."

## DEC-093

- Date: `2026-03-09`
- Context: With the current open level 7 baseline complete, the next choice was whether to pause spell expansion or open level 8. The user explicitly chose to continue on spells rather than pausing or pivoting back to low-priority creatures.
- Decision: Open level 8 instead of pausing spell expansion or reopening a creature pass.
- Consequences: The roadmap now treats level 8 as the active bounded spell-breadth target, keeps creatures deprioritized by user preference, and lets the next slice focus on the highest-traffic shared level 8 staples rather than stalling after the completed level 7 cleanup.

## DEC-094

- Date: `2026-03-09`
- Context: Once level 8 was chosen, the strongest first tranche was a broad, player-facing mix of anti-magic defense, domination, catastrophe, radiant warding, battlefield pressure, maze control, and iconic high-end finishers rather than a narrower narrative-only or utility-only pass.
- Decision: Use the first level 8 spell slice on `animal-shapes`, `antimagic-field`, `control-weather`, `dominate-monster`, `earthquake`, `holy-aura`, `incendiary-cloud`, `maze`, `power-word-stun`, and `sunburst`.
- Consequences: The repo-managed spell pack now reaches `194` spells, exact joined spell-description coverage expands to `193` of `194` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v24`, and the next roadmap choice becomes "stay on level 8 for another slice or pause spell expansion after the first level 8 tranche."

## DEC-095

- Date: `2026-03-09`
- Context: After the first level 8 tranche landed, only one bounded remaining open level 8 pool remained and the user explicitly asked to finish all level 8 spells rather than preserving another bounded slice.
- Decision: Finish the remaining open level 8 tail rather than pausing spell expansion or pivoting back to a lower-priority creature pass.
- Consequences: The roadmap now treats the final level 8 cleanup as intentional follow-through, keeps creatures deprioritized by user preference, and lets the spell pack close its current open level 8 baseline before opening a new level.

## DEC-096

- Date: `2026-03-09`
- Context: Once the roadmap chose to finish level 8, the best final slice was a bounded cleanup set that closed the remaining attraction, psychic, clone, demiplane, truth, mind-shield, and tsunami gaps instead of drifting into a mixed or arbitrary tail.
- Decision: Use the final level 8 cleanup on `antipathy-sympathy`, `befuddlement`, `clone`, `demiplane`, `glibness`, `mind-blank`, and `tsunami`.
- Consequences: The repo-managed spell pack now reaches `201` spells, exact joined spell-description coverage expands to `200` of `201` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v25`, and the next roadmap choice becomes "open level 9 or pause spell expansion after the completed open level 8 baseline."

## DEC-097

- Date: `2026-03-09`
- Context: With the current open level 8 baseline complete, the next choice was whether to pause spell expansion or open level 9. The user explicitly asked to continue and then to implement all level 9 spells at once instead of preserving another bounded tranche.
- Decision: Open level 9 and treat the entire remaining open level 9 pool as one pass rather than splitting it into smaller slices.
- Consequences: The roadmap now treats level 9 as an explicit all-at-once closeout instead of another staged tranche, keeps creatures deprioritized by user preference, and lets the spell pack close its current open spell baseline instead of stalling after level 8.

## DEC-098

- Date: `2026-03-09`
- Context: Once level 9 was chosen as an all-at-once pass, the best implementation was to close the whole remaining open top-end spell pool in one bounded slice rather than leave a partial apex baseline.
- Decision: Use the level 9 closeout on `astral-projection`, `foresight`, `gate`, `imprisonment`, `mass-heal`, `meteor-swarm`, `power-word-heal`, `power-word-kill`, `prismatic-wall`, `shapechange`, `storm-of-vengeance`, `time-stop`, `true-polymorph`, `true-resurrection`, `weird`, and `wish`.
- Consequences: The repo-managed spell pack now reaches `217` spells, exact joined spell-description coverage expands to `216` of `217` current spell-pack entries, the generated content build version advances to `srd-5.2.1@2026-03-09-m13-v26`, and the next roadmap choice becomes "pause spell expansion or open the next non-print priority after the completed open level 9 baseline."

## DEC-099

- Date: `2026-03-09`
- Context: With the current open level 9 baseline complete, spell expansion no longer had another open level target, and the next choice was between drifting into lower-priority content work or making the now-large spell library easier to use in-product.
- Decision: Pause raw spell-breadth expansion and use the next non-print slice on spell-compendium UX instead of reopening lower-priority creature work or print work.
- Consequences: The roadmap now treats the spell baseline as materially complete for the moment, keeps the exact-text policy stable, and directs immediate effort toward browse/select usability where the larger spell library would otherwise feel blunt and clipped.

## DEC-100

- Date: `2026-03-09`
- Context: Once the roadmap pivoted to spell-compendium UX, the highest-value first slice was making the spell library fully browsable and filterable in the existing compendium page instead of inventing a new spell-specific surface.
- Decision: Remove the generic empty-search clipping for typed spell browse, add spell quick filters (`class`, `level`, `school`, `concentration`, `ritual`), and expose richer spell metadata directly in the compendium list rows.
- Consequences: The compendium can now browse the full spell library instead of a clipped subset, the `217`-spell baseline is materially easier to navigate, and the next roadmap choice becomes "deepen compendium UX further or shift to another high-value non-print surface."

## DEC-101

- Date: `2026-03-09`
- Context: After the first compendium UX pass landed, the spell library was more navigable but the browse state was still ephemeral, which made filters and search easy to lose on refresh and impossible to share as a stable view.
- Decision: Stay on compendium UX for one more bounded slice and make browse state durable/shareable before pivoting to another surface.
- Consequences: The roadmap now treats compendium state persistence as part of usability follow-through, keeps the spell/content baseline stable, and avoids diffusing immediately into unrelated work while the new browse flow still drops context too easily.

## DEC-102

- Date: `2026-03-09`
- Context: Once the repo chose a second compendium UX slice, the highest-value move was to make the existing compendium page URL-driven rather than invent another local-only state model or a separate saved-search feature.
- Decision: Move compendium query/type/spell-filter state into URL search params, preserve that state when selecting an entry, and add a bounded reset control to clear the browse state intentionally.
- Consequences: Compendium browse state now survives refresh/share, spell browse context is preserved when opening a detail entry, regression coverage now exercises URL-driven compendium behavior directly, and the next roadmap choice becomes "keep deepening compendium UX or shift that momentum into another high-value surface."

## DEC-103

- Date: `2026-03-09`
- Context: After the compendium browse state became durable/shareable, the spell library was materially easier to inspect, but the builder still exposed the same large spell baseline through long flat checkbox runs that were much harder to use in day-to-day character setup.
- Decision: Shift the next non-print slice from further compendium-only polish to builder spell UX instead of drifting into more compendium tweaks, lower-priority creature work, or reopened print work.
- Consequences: The roadmap now treats builder spell selection as the highest-leverage next surface, keeps the exact-text/source policy stable, and frames the next implementation around spell selection/management rather than more passive browsing alone.

## DEC-104

- Date: `2026-03-09`
- Context: Once the repo chose builder spell UX as the next slice, the highest-value bounded move was to replace the builder's flat spell checkbox wall with a reusable grouped spell browser instead of layering ad hoc filters onto the existing repeated cantrip/leveled lists.
- Decision: Add a reusable builder spell browser with search, level/school filters, selected/unselected/ready browse modes, grouped level sections, richer in-row spell metadata, and local filter reset on spell-list scope changes; use it for both the class spell list and the Magic Initiate spell list, and make the main spell panel span extra width in the builder grid.
- Consequences: Builder spell selection now scales better against the current spell baseline, selected and ready states are visible directly in the list, Magic Initiate gets the same browse affordances without a second implementation, and the next roadmap choice becomes "deepen builder spell UX further or improve cross-surface reference handoff."

## DEC-105

- Date: `2026-03-09`
- Context: After the builder spell browser landed, the local reference panels in the builder and saved sheet were still disconnected from the full compendium because `Open Full Compendium View` only jumped to `/compendium?slug=...` and immediately dropped the user's character context.
- Decision: Shift the next non-print slice from more local builder/compendium polish to cross-surface reference handoff so full-compendium jumps preserve where the user came from.
- Consequences: The roadmap now treats cross-surface continuity as the next leverage point, keeps the spell/content baseline stable, and avoids diffusing into more isolated local-surface tweaks while linked reference jumps still feel one-way.

## DEC-106

- Date: `2026-03-09`
- Context: Once the repo chose cross-surface reference handoff, the highest-value bounded move was to carry character context into the compendium route itself rather than invent a separate modal or secondary reference page.
- Decision: When the builder or saved sheet opens the full compendium from a linked local reference, pass a typed `slug` + `type` deep link plus bounded return context, preserve that return context while the compendium mutates local browse state, and surface a clear `Back to Builder` or `Back to Sheet` action in the compendium.
- Consequences: Full compendium jumps now retain a usable path back to the originating character surface, typed linked-entry deep links narrow the landing view more intelligently than `slug` alone, route-level regression coverage now exercises the return handoff, and the next roadmap choice becomes "deepen cross-surface reference UX further or return to local builder/compendium polish."

## DEC-107

- Date: `2026-03-09`
- Context: After the initial handoff pass landed, full-compendium jumps no longer dropped the builder or sheet return path, but the detail view still felt like a dead end because users could inspect one linked entry and then had to bounce back to the left list manually to continue through adjacent or explicit related references.
- Decision: Stay on cross-surface reference UX for one more bounded slice instead of immediately pivoting back to local builder/compendium polish.
- Consequences: The roadmap now treats detail-side navigation continuity as part of finishing the cross-surface handoff, keeps the spell/content baseline stable, and avoids leaving the new compendium return path half-finished.

## DEC-108

- Date: `2026-03-09`
- Context: Once the repo chose a second bounded cross-surface reference slice, the highest-value move was to add detail-side adjacent and related-entry navigation inside the existing full compendium page rather than inventing another reference surface or a deeper route model.
- Decision: Add a `Browse Nearby` section driven by the current displayed results plus a `Related Entries` section driven by explicit payload `relatedEntries`, and make those jumps preserve the existing builder or sheet return handoff while updating the typed compendium deep link.
- Consequences: Users can move across adjacent or explicitly related references without losing their way back to the originating character surface, rule entries can now jump directly into linked item or spell details, route-level regression coverage now exercises that deeper navigation path, and the next roadmap choice becomes "keep deepening cross-surface reference UX or return to builder/compendium polish."

## DEC-109

- Date: `2026-03-10`
- Context: After the detail-side compendium navigation pass landed, cross-surface reference browsing was materially healthier, but the builder still exposed feat selection through a flat checkbox wall with support and constraint messaging scattered across repeated rows.
- Decision: Return to local builder/compendium polish instead of taking a third cross-surface navigation slice, and treat builder feat selection as the next bounded usability pass.
- Consequences: The roadmap now closes the cross-surface reference loop at a reasonable point, keeps the spell/content baseline stable, and focuses the next implementation on the weakest remaining local builder browse flow rather than extending navigation for its own sake.

## DEC-110

- Date: `2026-03-10`
- Context: Once the repo chose builder feat UX as the next slice, the highest-value bounded move was to replace the builder's flat feat checkbox wall with a reusable feat browser instead of layering one-off search or sort helpers onto the existing row list.
- Decision: Add a dedicated feat browser with search, support-level filtering, selected/unselected/blocked browse modes, grouped support sections, visible automation and constraint copy, and local filter reset on class or source scope changes; keep configurable feat choice cards as their own follow-up surface below the browser.
- Consequences: Builder feat selection now scales better against the current feat baseline, blocked feat requirements remain legible without reading every row, the feat surface now aligns more closely with the newer spell-browser interaction model, and the next roadmap choice becomes "keep deepening local builder/compendium polish or shift to another non-print surface."

## DEC-111

- Date: `2026-03-10`
- Context: After the builder feat browser landed, the weakest remaining local browse flow was back in the compendium because only spells had real typed quick filters while feats, rules, creatures, and equipment still relied mostly on broad text search plus source labels.
- Decision: Stay on local compendium polish for one more bounded slice instead of reopening cross-surface navigation work or diffusing immediately into another builder-only surface.
- Consequences: The roadmap now treats typed non-spell compendium browse as the next leverage point, keeps the underlying content and source-text policy stable, and avoids another navigation-heavy slice before the core browse surface is consistently usable.

## DEC-112

- Date: `2026-03-10`
- Context: Once the repo chose a non-spell compendium pass, the highest-value bounded move was to reuse metadata already present in seeded and packed entries rather than adding a new schema or another type-specific filter system for each compendium section.
- Decision: Add a generic typed quick-filter lane for non-spell compendium views based on existing metadata such as feat support, creature type, subclass class, background theme, class caster type, and equipment or rule category, and enrich non-spell list rows with type-appropriate browse metadata instead of only showing the source label.
- Consequences: Feats, creatures, rules, subclasses, classes, and equipment are materially easier to scan without raw text search alone, the compendium browse state remains URL-driven with one consistent filter model, and the next roadmap choice becomes "keep deepening local compendium polish or shift to another surface."

## DEC-113

- Date: `2026-03-10`
- Context: After the typed non-spell compendium pass landed, the compendium had reached a reasonable local-polish stopping point, but the builder still exposed equipment selection through flat grouped chip walls that scaled poorly once the seeded armor, weapon, and gear baseline grew.
- Decision: Shift the next non-print slice from more compendium polish to builder equipment or inventory UX instead of diffusing into another browse-only pass or reopening cross-surface navigation.
- Consequences: The roadmap now treats builder equipment flow as the next leverage point, keeps the compendium stable for the moment, and focuses the next implementation on a higher-frequency builder interaction rather than another inspection-only surface.

## DEC-114

- Date: `2026-03-10`
- Context: Once the repo chose builder equipment UX as the next slice, the highest-value bounded move was to replace the add-equipment chip wall with a reusable equipment browser instead of layering search helpers onto three separate chip groups.
- Decision: Add a searchable builder equipment browser with type and category filters, tracked/untracked/equipped browse modes, visible tracked-state metadata, and local filter reset on source-scope changes; keep the existing inventory list and loadout controls as the follow-up surface below it.
- Consequences: Adding equipment now scales better against the current armor, weapon, and gear baseline, tracked or equipped state is visible before the user adds another copy, the equipment surface aligns more closely with the newer spell and feat browser patterns, and the next roadmap choice becomes "keep deepening builder equipment/inventory UX or shift to another surface."

## DEC-115

- Date: `2026-03-10`
- Context: After the builder equipment browser landed, the add flow was materially healthier, but the tracked inventory directly below it still relied on a flat list with no local browse tools once a character had accumulated enough armor, weapons, and gear.
- Decision: Stay on builder inventory UX for one more bounded slice instead of pivoting away immediately or reopening compendium polish.
- Consequences: The roadmap now treats tracked-inventory management as the next leverage point, keeps the new equipment browser intact as the entry path, and focuses the next implementation on the second half of the same builder workflow rather than splitting attention across surfaces.

## DEC-116

- Date: `2026-03-10`
- Context: Once the repo chose tracked-inventory management as the next slice, the highest-value bounded move was to replace the flat tracked list with a filterable inventory manager instead of only adding sort buttons or another summary row.
- Decision: Add a browsable inventory manager with search, kind and category filters, equipped-state browse modes, grouped item sections, and the existing quantity/equip/reference/remove controls embedded directly in the filtered rows; keep higher-level loadout summaries as the next follow-up surface.
- Consequences: Managing tracked gear now scales better after the user adds items, the builder's equipment workflow stays consistent from selection through maintenance, and the next roadmap choice becomes "keep deepening builder inventory/loadout UX or shift to another surface."

## DEC-117

- Date: `2026-03-10`
- Context: After the tracked-inventory manager landed, the builder's add and manage flows were materially healthier, but changing the active armor, shield, or weapon loadout still required drilling into the broader inventory browser even for the most combat-relevant decisions.
- Decision: Stay on builder loadout UX for one more bounded slice instead of pivoting away immediately or reopening compendium polish.
- Consequences: The roadmap now treats direct loadout control as the next leverage point, keeps the new equipment and inventory browsers intact as the underlying workflow, and focuses the next implementation on the final high-frequency activation layer rather than diffusing into another surface.

## DEC-118

- Date: `2026-03-10`
- Context: Once the repo chose loadout UX as the next slice, the highest-value bounded move was to add a focused summary manager for equipped armor, shield, and active weapons instead of layering a few extra quick actions into the broader inventory browser.
- Decision: Add a top-level loadout manager above the tracked inventory so combat-relevant gear can be changed directly from one summary surface while reusing the existing reference and equip-state actions.
- Consequences: The builder now exposes a clearer active-loadout surface without duplicating the full inventory-management view, armor/shield/weapon changes no longer require scanning the larger inventory list first, and the next roadmap choice becomes "keep deepening builder loadout/inventory UX or shift to another surface."

## DEC-119

- Date: `2026-03-10`
- Context: After the focused loadout manager landed, the builder's equipment workflow had reached a reasonable local-polish stopping point because adding items, managing tracked inventory, and activating combat-relevant gear were all now coherent, but configurable feat choices still lived in ad hoc cards below the newer feat browser.
- Decision: Shift the next non-print slice away from builder equipment/loadout polish and into builder feat-configuration UX instead of diffusing into more inventory tweaks or pivoting immediately to a different surface.
- Consequences: The roadmap now treats configurable feat choices as the next leverage point inside the builder, keeps the equipment flow stable for now, and narrows the next implementation to the remaining rough edge inside the broader feat workflow rather than reopening compendium or print work.

## DEC-120

- Date: `2026-03-10`
- Context: Once the repo chose feat-configuration UX as the next slice, the highest-value bounded move was to replace the ad hoc configurable-feat checkbox stacks with a reusable choice browser instead of layering tiny filter or sort tweaks onto each feat card separately.
- Decision: Add a dedicated feat-choice browser with search, selected/available/unavailable browse modes, clearer group counts, unavailable-choice visibility, and direct reference access for each configurable feat.
- Consequences: Configurable feat setup now scales more like the newer spell, feat, equipment, inventory, and loadout browsers, users can understand why options are unavailable without the UI silently hiding them, and the next roadmap choice becomes "keep deepening builder configuration UX or shift to another surface."

## DEC-121

- Date: `2026-03-10`
- Context: After the configurable feat-choice pass landed, the builder had reached a reasonable local-polish stopping point, but the next direct user ask was deeper sheet automation for at-table play state rather than another builder or compendium browse refinement.
- Decision: Shift the next non-print slice away from builder-only polish and into saved-sheet automation, starting with class-resource charges and live at-table state.
- Consequences: The roadmap now treats saved-sheet automation as the next leverage point, keeps the improved builder and compendium browse flows stable for the moment, and narrows the next implementation to high-frequency play-state interactions rather than more construction-only UX.

## DEC-122

- Date: `2026-03-10`
- Context: Once the repo chose saved-sheet automation as the next slice, the highest-value bounded move was to automate class resources that players spend repeatedly during play instead of trying to solve every derived number or every class feature in one pass.
- Decision: Add a first saved-sheet automation pass that auto-generates supported class resource rows for Barbarian Rage and Druid Wild Shape, preserves their state alongside manual tracked resources, and supports bounded short-rest `+1` plus long-rest full recovery from the live sheet controls.
- Consequences: Max HP remains derived automatically from the existing calculation pipeline, Rage and Wild Shape no longer require manual tracker setup before use, the saved-sheet route becomes materially more usable at the table, and the next roadmap choice becomes "keep expanding saved-sheet automation or stop after this first class-resource pass."

## DEC-123

- Date: `2026-03-10`
- Context: After the first automation pass landed, the next direct user direction was to keep expanding saved-sheet automation rather than pivot back to builder polish, compendium polish, homebrew, creatures, or deferred print work.
- Decision: Stay on saved-sheet automation for one more bounded slice instead of pivoting away after the first class-resource pass.
- Consequences: The roadmap now keeps its focus on at-table play-state leverage, the saved-sheet route remains the next automation surface instead of another construction-only workflow, and the follow-up implementation should still stay within class resources that fit the current tracked-counter model cleanly.

## DEC-124

- Date: `2026-03-10`
- Context: Once the repo chose a second saved-sheet automation slice, the highest-value bounded move was to automate more common class resources that map cleanly onto the existing tracked-resource controls and rest-recovery model.
- Decision: Add Bardic Inspiration, Cleric and Paladin Channel Divinity, Fighter Second Wind and Action Surge, and Paladin Lay on Hands as automated tracked resources, while letting Bardic Inspiration read the derived Charisma modifier when it is available.
- Consequences: More classes now get live at-table spend or restore controls without any manual tracker setup, the saved-sheet route covers a materially broader set of high-frequency class charges and pools, and more complex features such as spell-slot manipulation or rest features that do not fit the current counter model remain explicit future work instead of being approximated badly.

## DEC-125

- Date: `2026-03-10`
- Context: After the second automation pass landed, the next remaining high-value gap was still on the saved-sheet route because spell slots were visible there but not directly adjustable, and the remaining obvious magic-resource trackers were tied to that same at-table surface.
- Decision: Stay on saved-sheet automation for one more bounded slice instead of pivoting away after the second class-resource pass.
- Consequences: The roadmap now keeps the focus on at-table play-state leverage, the next implementation can unlock more useful live tracking without inventing another surface, and lower-priority pivots stay deferred until the saved-sheet automation surface reaches a more coherent stopping point.

## DEC-126

- Date: `2026-03-10`
- Context: Once the repo chose a third saved-sheet automation slice, the highest-value bounded move was to add direct spell-slot controls on the saved sheet and cover the remaining obvious magic-resource trackers for the current class baseline.
- Decision: Add saved-sheet `Use` / `+1` controls for standard and pact spell slots, and auto-generate Wizard Arcane Recovery, Sorcerer Sorcery Points, and Warlock Magical Cunning alongside the earlier automated class-resource rows.
- Consequences: Players can now spend or restore spell slots directly from the saved-sheet route instead of treating slot values as read-only summary text, the current class baseline covers more of the obvious magic-resource trackers without manual setup, and more complex spell-slot recovery features remain bounded manual flows until a deeper slot-recovery automation pass is justified.

## DEC-127

- Date: `2026-03-10`
- Context: After the third automation pass landed, the next direct user direction was still to keep expanding saved-sheet automation rather than pivoting back to builder polish, compendium polish, homebrew, creatures, or deferred print work.
- Decision: Stay on saved-sheet automation for one more bounded slice instead of pivoting away after the spell-slot and magic-resource pass.
- Consequences: The roadmap keeps its focus on at-table play-state leverage, the next implementation can stay on the same saved-sheet surface, and the remaining obvious long-rest counters can be covered before deciding whether the work is turning into a deeper rest-feature system.

## DEC-128

- Date: `2026-03-10`
- Context: Once the repo chose a fourth saved-sheet automation slice, the highest-value bounded move was to cover the remaining obvious long-rest class counters that still fit the existing tracked-resource controls and rest model without inventing deeper feature-specific recovery logic.
- Decision: Add Cleric Divine Intervention, Fighter Indomitable, Ranger Favored Enemy, Sorcerer Innate Sorcery, and Warlock Contact Patron as automated tracked resources alongside the earlier saved-sheet automation rows.
- Consequences: More classes now get live at-table counters without manual tracker setup, the saved-sheet route covers a broader share of the current supported class baseline honestly, and deeper systems such as feature-specific spell-slot recovery or more conditional rest interactions remain explicit future work instead of being approximated badly.

## DEC-129

- Date: `2026-03-10`
- Context: After the fourth automation pass landed, the next direct user direction was still to keep expanding saved-sheet automation rather than pivot back to builder polish, compendium polish, homebrew, creatures, or deferred print work.
- Decision: Stay on saved-sheet automation for one more bounded slice instead of pivoting away after the fourth class-resource pass.
- Consequences: The roadmap keeps its focus on at-table play-state leverage, the next implementation can stay on the same saved-sheet surface, and a few remaining bounded rest counters can be covered before deciding whether the work is turning into subclass or deeper recovery automation.

## DEC-130

- Date: `2026-03-10`
- Context: Once the repo chose a fifth saved-sheet automation slice, the highest-value bounded move was to cover the remaining class-rest counters that still fit the existing tracked-resource controls cleanly without needing a deeper feature engine.
- Decision: Add Druid Wild Resurgence, Ranger Tireless, Ranger Nature's Veil, and Sorcerer Sorcerous Restoration as automated tracked resources alongside the earlier saved-sheet automation rows.
- Consequences: More at-table rest counters now appear automatically on the saved sheet, the current supported class baseline is broader without extra UI work, and deeper systems such as subclass-specific automation or feature logic that mutates other resources remain explicit future work instead of being approximated badly.

## DEC-131

- Date: `2026-03-10`
- Context: After the fifth automation pass landed, the next direct user direction was still to keep expanding saved-sheet automation rather than pivot back to builder polish, compendium polish, homebrew, creatures, or deferred print work.
- Decision: Stay on saved-sheet automation for one more bounded slice instead of pivoting away after the fifth class-resource pass.
- Consequences: The roadmap keeps its focus on at-table play-state leverage, the next implementation can stay on the same saved-sheet surface, and the last small set of obvious general-class counters can be covered before any future work would need subclass-specific or deeper feature automation.

## DEC-132

- Date: `2026-03-10`
- Context: Once the repo chose a sixth saved-sheet automation slice, the highest-value bounded move was to cover the final obvious general-class counters that still fit the existing tracked-resource controls cleanly without subclass logic or resource-mutation automation.
- Decision: Add Paladin Faithful Steed and Rogue Stroke of Luck as automated tracked resources alongside the earlier saved-sheet automation rows.
- Consequences: The saved-sheet route now covers the last obvious general-class counter features for the current class baseline without extra UI work, and any further automation expansion would need to cross into subclass-specific behavior or deeper feature engines instead of staying inside the current bounded model.

## DEC-133

- Date: `2026-03-10`
- Context: After the last obvious general-class counter pass landed, the next user direction was still to keep pushing saved-sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Reopen saved-sheet automation around a narrow subclass-aware counter pass instead of stopping outright or jumping straight into a deeper recovery and mutation engine.
- Consequences: The roadmap can keep moving on the saved-sheet surface without pretending every next feature needs a full engine, and the next implementation should stay bounded to subclass features that still behave like honest counters with standard rest recovery.

## DEC-134

- Date: `2026-03-10`
- Context: Once the repo chose a first subclass-aware automation slice, the highest-value bounded move was to cover the clearest subclass resources in the current supported baseline that still fit the existing tracked-resource controls cleanly.
- Decision: Add Battle Master Superiority Dice and Light Domain Warding Flare as automated tracked resources alongside the earlier saved-sheet automation rows.
- Consequences: The saved-sheet route now supports a first narrow layer of subclass-aware automation without new UI primitives, while broader subclass systems and features that mutate other resources remain explicit future work instead of being approximated badly.

## DEC-135

- Date: `2026-03-10`
- Context: After the first subclass-aware automation pass landed, the next user direction was still to keep pushing saved-sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Stay on one more narrow subclass-aware automation slice instead of jumping straight into a broader subclass or mutation engine.
- Consequences: The roadmap can keep moving on the saved-sheet surface without pretending the next step needs a full subclass system, and the next implementation should stay bounded to another supported open subclass feature that still behaves like an honest counter with standard rest recovery.

## DEC-136

- Date: `2026-03-10`
- Context: Once the repo chose a second subclass-aware automation slice, the clearest remaining open subclass feature in the current supported baseline that still fit the existing tracked-resource model was Circle of the Land Natural Recovery.
- Decision: Add Circle of the Land Natural Recovery as an automated tracked resource alongside the earlier saved-sheet automation rows.
- Consequences: The saved-sheet route now supports another open subclass rest feature without new UI primitives, while deeper spell-slot mutation flows and broader subclass systems remain explicit future work instead of being approximated badly.

## DEC-137

- Date: `2026-03-10`
- Context: After the second subclass-aware automation pass landed, the user direction was still to keep digging into sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Reopen the roadmap around bounded action-level recovery and mutation features instead of stopping automation at passive counters or drifting into another unrelated surface.
- Consequences: The next implementation can focus on existing supported features that already have honest tracked uses but still need direct recovery actions, while a broader subclass system, timing-enforced rest engine, and more conditional feature logic remain explicitly out of scope.

## DEC-138

- Date: `2026-03-10`
- Context: Once the roadmap reopened action-level recovery work, the highest-value bounded move on the existing saved-sheet surface was to make Wizard Arcane Recovery, Circle of the Land Natural Recovery, Warlock Magical Cunning, and Sorcerer Sorcerous Restoration actually perform their recoveries instead of only exposing passive counters and notes.
- Decision: Add a page-two recovery-action layer on the saved-sheet spellbook page, with bounded slot-selection for Arcane Recovery and Natural Recovery plus one-click restoration for Magical Cunning and Sorcerous Restoration.
- Consequences: Players can now trigger these supported recovery features directly from the saved sheet without leaving the at-table route or doing manual slot math, while broader pool spenders, stricter rest-timing enforcement, and more feature-specific mutation systems remain explicit future work instead of being approximated badly.

## DEC-139

- Date: `2026-03-10`
- Context: After the first action-level recovery pass landed, the next direct user direction was still to keep expanding saved-sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Stay on one more bounded mutation slice and target tracked pools that are currently awkward to use because they still require repeated single-step clicks.
- Consequences: The roadmap keeps its focus on at-table play-state leverage, the next implementation can stay on the existing saved-sheet surface, and broader feature engines or unrelated pivots remain deferred until the current mutation layer has a cleaner stopping point.

## DEC-140

- Date: `2026-03-10`
- Context: Once the roadmap chose a first pool-spender pass, the highest-value bounded move on the existing saved-sheet surface was to make larger counter pools such as Lay on Hands and Sorcery Points practical to adjust in real play without forcing repeated `Use` or `+1` clicks.
- Decision: Add direct multi-point spend or restore controls to the saved-sheet tracked-resource panel for larger counter resources, backed by bounded clamped resource-delta helpers instead of a broader feature-specific engine.
- Consequences: Players can now manage larger tracked pools much faster on the saved sheet, the app gains another honest layer of at-table mutation automation without overpromising feature semantics it does not encode, and deeper pool workflows such as hit-dice spending or spell-point conversion remain explicit future work instead of being approximated badly.

## DEC-141

- Date: `2026-03-10`
- Context: After the first pool-spender pass landed, the user direction was still to keep pushing sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Stay on one more bounded mutation slice and target Hit Dice next instead of stopping automation or drifting into a broader rest engine.
- Consequences: The roadmap stays focused on high-frequency at-table actions, the next implementation can deepen the existing saved-sheet rest surface without inventing a die roller or stricter rest-timing system, and broader pool workflows remain explicit future work instead of being approximated badly.

## DEC-142

- Date: `2026-03-10`
- Context: Once the roadmap chose a hit-die action pass, the highest-value bounded move on the existing saved-sheet surface was to make short-rest healing practical without pretending the app could or should automate exact die-by-die rolling.
- Decision: Add direct Hit Dice spend actions plus an average-heal shortcut to the saved-sheet rest panel, while keeping exact rolled healing available through the existing manual HP field.
- Consequences: Players can now manage short-rest Hit Dice use directly on the saved sheet, average healing is available as an honest bounded shortcut, and the app still avoids overpromising a full dice roller or deeper rest-engine semantics it does not encode.

## DEC-143

- Date: `2026-03-10`
- Context: After the first hit-die action pass landed, the user direction was still to keep pushing sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Stay on one more bounded mutation slice and target a direct healing-pool workflow next instead of stopping after the hit-die pass or drifting into a broader rest engine.
- Consequences: The roadmap stays focused on high-frequency at-table actions, the next implementation can deepen an existing tracked-resource surface without inventing target selection or condition systems, and broader pool semantics remain explicit future work instead of being approximated badly.

## DEC-144

- Date: `2026-03-10`
- Context: Once the roadmap chose a direct healing-pool workflow, the highest-value bounded move on the existing saved-sheet surface was to make Paladin Lay on Hands actually heal the current character instead of only decrementing the counter.
- Decision: Add a `Heal HP` action to the saved-sheet Lay on Hands row that reuses the existing amount input, restores current HP, and spends the same amount from the Lay on Hands pool, while leaving Poisoned removal and broader target-side effects manual.
- Consequences: Players can now use Lay on Hands as a real healing workflow on the saved sheet, the app gains another honest layer of at-table automation without overpromising a full target/effect engine, and more complex pool-backed features remain explicit future work instead of being approximated badly.

## DEC-145

- Date: `2026-03-10`
- Context: After the first direct healing-pool workflow landed, the user direction was still to keep pushing sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Stay on one more bounded self-only action slice and target Fighter Second Wind next instead of opening broader target semantics or stopping automation outright.
- Consequences: The roadmap stays focused on high-frequency at-table actions, the next implementation can reuse the existing saved-sheet resource-row surface, and broader target-side or effect-specific semantics remain explicit future work instead of being approximated badly.

## DEC-146

- Date: `2026-03-10`
- Context: Once the roadmap chose a self-only class-heal workflow, the highest-value bounded move on the existing saved-sheet surface was to make Fighter Second Wind actually heal the current character instead of only decrementing the counter.
- Decision: Add an `Average Heal` action to the saved-sheet Second Wind row that spends one use and applies a bounded average shortcut for the feature's self-heal, while leaving Tactical Mind and Tactical Shift manual.
- Consequences: Fighters can now use Second Wind as a real self-healing workflow on the saved sheet, the app gains another honest layer of at-table automation without overpromising a full dice roller or broader fighter action engine, and more complex class-action semantics remain explicit future work instead of being approximated badly.

## DEC-147

- Date: `2026-03-10`
- Context: After the first self-only class-heal workflow landed, the user direction was still to keep pushing sheet automation rather than pivot back to builder polish, compendium work, homebrew, creatures, or deferred print work.
- Decision: Stay on one more bounded self-only action slice and target Ranger Tireless next instead of opening broader target semantics or stopping automation outright.
- Consequences: The roadmap stays focused on high-frequency at-table actions, the next implementation can reuse the existing saved-sheet resource-row surface, and broader target-side or effect-specific semantics remain explicit future work instead of being approximated badly.

## DEC-148

- Date: `2026-03-10`
- Context: Once the roadmap chose a self-only temporary-HP workflow, the highest-value bounded move on the existing saved-sheet surface was to make Ranger Tireless actually grant temporary HP instead of only decrementing the counter.
- Decision: Add an `Average Temp HP` action to the saved-sheet Tireless row that spends one use and applies a bounded average shortcut for the feature's temporary HP gain, while leaving exhaustion reduction manual.
- Consequences: Rangers can now use Tireless as a real temporary-HP workflow on the saved sheet, the app gains another honest layer of at-table automation without overpromising an exhaustion engine or broader ranger action system, and more complex feature semantics remain explicit future work instead of being approximated badly.

## DEC-149

- Date: `2026-03-10`
- Context: After the first self-only temporary-HP workflow landed, the saved-sheet route had reached a reasonable stopping point for bounded mutation automation, and the weakest remaining problem had become usability: the expanded play-state surface now forced players to scan a long flat tracked-resource list.
- Decision: Stop the deeper mutation branch at the current bounded layer and pivot the next slice to saved-sheet usability polish instead of opening broader target semantics, stricter rest engines, or another unrelated surface.
- Consequences: The roadmap now treats the saved-sheet play-state surface as a UX problem before it becomes a deeper rules-engine problem, the current automation baseline remains honest and bounded, and the next implementation should improve scanability rather than add more feature semantics.

## DEC-150

- Date: `2026-03-10`
- Context: Once the roadmap pivoted to saved-sheet usability polish, the highest-value bounded move on the existing play-state surface was to make tracked resources scannable now that many automated rows can coexist with manual rows.
- Decision: Add tracked-resource triage on the saved-sheet route: surface `Needs Attention` rows first, collapse full `Ready` rows behind an explicit reveal on page 1, and keep page 2 focused on changed resources rather than mirroring one long flat list.
- Consequences: Players can find spent or partially used resources faster during play, the current automation breadth becomes more usable without reopening deeper mutation semantics, and the next roadmap choice becomes "keep polishing saved-sheet usability or pivot to another non-print surface."

## DEC-151

- Date: `2026-03-10`
- Context: After the first tracked-resource triage pass landed, the saved-sheet route was easier to scan, but rest flow still felt split because page 1 held the rest controls while recovery actions for spell slots or resource restoration still lived only on page 2.
- Decision: Stay on saved-sheet usability for one more bounded handoff slice instead of drifting back into deeper automation or another unrelated surface.
- Consequences: The roadmap now treats cross-page play-state handoff as the next leverage point, the current bounded automation baseline stays unchanged, and the next implementation should reduce cross-page scanning instead of inventing new recovery semantics.

## DEC-152

- Date: `2026-03-10`
- Context: Once the roadmap chose a recovery handoff slice, the highest-value bounded move on the existing play-state surface was to surface page-two recovery readiness directly on page one where rests already happen.
- Decision: Add page-one recovery highlights plus a direct handoff into the page-two recovery section, while keeping the actual recovery actions and slot-selection workflow on page 2.
- Consequences: Players no longer have to remember that a ready recovery action exists on another page before resting or continuing play, the rest surface and recovery surface now feel connected without duplicating controls, and the next roadmap choice becomes "keep polishing saved-sheet usability or pivot to another non-print surface."

## DEC-153

- Date: `2026-03-10`
- Context: After the recovery handoff pass landed, page-one and page-two play-state surfaces were more connected, but the page-two spellbook still relied on one unfiltered spell table even though the saved-sheet route now expects more at-table browsing than a static export surface.
- Decision: Stay on saved-sheet usability for one more bounded spellbook pass instead of drifting back into deeper automation or another unrelated surface.
- Consequences: The roadmap keeps the current play-state focus without reopening rules scope, and the next implementation should improve page-two spell browsing rather than adding more feature semantics.

## DEC-154

- Date: `2026-03-10`
- Context: Once the roadmap chose a spellbook usability slice, the highest-value bounded move on page 2 was to make the spell table easier to scan without turning the saved-sheet route into another full compendium or builder browser.
- Decision: Add local spell-table search plus bounded `All` / `Prepared` / `Cantrips` / `Leveled` filters on the saved-sheet spellbook page, and keep the inspector aligned to the currently visible filtered rows.
- Consequences: Players can find the right spell text faster during play, page-two browsing scales better for spell-heavy characters, and the saved-sheet spellbook becomes more usable without adding another persisted browse-state system or reopening deeper automation work.

## DEC-155

- Date: `2026-03-10`
- Context: After the first spellbook browse/filter pass landed, page-two browsing scaled better, but the detail rail still depended heavily on hovering back across the table or pinning exact rows whenever the player wanted to step through nearby visible spells.
- Decision: Stay on saved-sheet usability for one more bounded spell-detail navigation slice instead of drifting back into deeper automation or another unrelated surface.
- Consequences: The roadmap keeps the current saved-sheet focus without reopening rules scope, and the next implementation should improve local spell-detail traversal inside the existing filtered table rather than expanding automation or inventing another browse system.

## DEC-156

- Date: `2026-03-10`
- Context: Once the roadmap chose a spell-detail navigation slice, the highest-value bounded move on page 2 was to let the inspector traverse the currently visible filtered spell rows directly instead of making users bounce between table hover state and pinned detail state.
- Decision: Add bounded `Previous Spell` / `Next Spell` controls plus visible row-position context to the saved-sheet spell inspector, and scope that navigation strictly to the current filtered spell rows.
- Consequences: Players can step through nearby visible spells without losing the current filter context, the page-two inspector becomes more usable as an at-table reading surface, and the saved-sheet route still avoids turning into a full compendium or persisted browse-state system.

## DEC-157

- Date: `2026-03-10`
- Context: After the saved-sheet spell-detail navigation pass landed, the user asked for class-based standard ability arrays during character creation rather than another worksheet-only refinement, so the highest-value next move shifted back to the builder onboarding flow.
- Decision: Pivot from saved-sheet polish to a bounded builder onboarding slice centered on class-ready starting ability presets instead of silently stretching the saved-sheet branch again.
- Consequences: The roadmap now treats builder onboarding as the next leverage point, the current saved-sheet usability baseline stays intact, and the next implementation should improve new-character setup rather than reopening deeper automation or another play-state-only pass.

## DEC-158

- Date: `2026-03-10`
- Context: Once the roadmap chose a builder onboarding slice, the highest-value bounded move was to make the standard `15 / 14 / 13 / 12 / 10 / 8` spread class-aware without forcing silent overwrites every time the player changes classes.
- Decision: Add app-authored class standard arrays to the shared class templates, use the fighter recommendation as the default new-draft baseline, auto-carry those presets across class changes only while the draft still matches the prior class recommendation, and expose a one-click `Apply {Class} Standard Array` action in the builder for explicit reapplication later.
- Consequences: New drafts start from a class-appropriate quick-start spread, changing class early in creation feels more intentional, manual ability edits are preserved unless the player explicitly reapplies the current class preset, and the feature stays clearly in the app-authored recommendation layer rather than being confused with official rules text.

## DEC-159

- Date: `2026-03-10`
- Context: After the first class standard-array pass landed, the builder already had seeded background skill and starting-gear suggestions, but they still lived behind separate controls and left early setup feeling fragmented.
- Decision: Stay on builder onboarding for one more bounded quick-start setup slice instead of immediately pivoting away from the creation flow.
- Consequences: The roadmap keeps the current onboarding focus without reopening a larger builder rewrite, and the next implementation should reduce the number of separate setup actions needed for a coherent new draft.

## DEC-160

- Date: `2026-03-10`
- Context: Once the roadmap chose a quick-start onboarding slice, the highest-value bounded move was to combine the new class standard-array preset with the existing background skill and starting-gear suggestions rather than inventing another independent recommendation system.
- Decision: Add a one-click builder quick-start action that applies the current class standard array plus the current background's suggested skills and seeded starting gear, while preserving the separate background and ability controls for manual adjustment.
- Consequences: New drafts can reach a coherent starting state much faster, the onboarding recommendations now feel like one deliberate setup path rather than three disconnected controls, and the feature still stays in the app-authored recommendation layer instead of claiming to model official starting packages exhaustively.

## DEC-161

- Date: `2026-03-10`
- Context: After the combined quick-start pass landed, caster drafts still dropped straight from onboarding into a large seeded spell list with no equivalent starter package, so the creation flow remained uneven between spellcasting and non-spell setup.
- Decision: Stay on builder onboarding for one more bounded starter-spell slice instead of pivoting away immediately after the quick-start setup pass.
- Consequences: The roadmap keeps the current creation-flow focus without reopening a larger builder rewrite, and the next implementation should make seeded spell selection feel as intentional as the new ability, skill, and gear onboarding actions.

## DEC-162

- Date: `2026-03-10`
- Context: Once the roadmap chose a starter-spell onboarding slice, the highest-value bounded move was to add app-authored spell recommendations for seeded class lists without turning the builder into an enforced spell-choice wizard or silently overwriting later manual edits.
- Decision: Add class-based starter spell packages to the shared class templates, auto-carry them across class changes only while the draft still matches the prior starter package, expose an explicit `Apply {Class} Starter Spells` action in the builder, and fold the same package into the broader quick-start setup action for caster drafts.
- Consequences: Caster onboarding now has a coherent seeded opening package, quick-start setup covers the most common early builder decisions in one pass, and the feature stays clearly in the app-authored recommendation layer instead of being confused with official class spell-preparation rules.

## DEC-163

- Date: `2026-03-10`
- Context: After the starter-spell pass landed, early caster onboarding was materially better, but fresh class changes and quick-start setup still inherited the original fighter-oriented skill defaults unless the player fixed the skill grid manually.
- Decision: Stay on builder onboarding for one more bounded starter-skill slice instead of pivoting away immediately after the starter-spell pass.
- Consequences: The roadmap keeps the current creation-flow focus without reopening a broader builder rewrite, and the next implementation should make the skill grid feel as intentional as the new ability, gear, and spell onboarding actions.

## DEC-164

- Date: `2026-03-10`
- Context: Once the roadmap chose a starter-skill onboarding slice, the highest-value bounded move was to add app-authored class skill recommendations without turning the builder into a rigid class-skill legality wizard or silently overwriting later manual skill edits.
- Decision: Add class-based starter skill packages to the shared class templates, auto-carry them across class changes only while the draft still matches the prior starter skill package, expose an explicit `Apply {Class} Starter Skills` action in the builder, and fold the same package into the broader quick-start setup action.
- Consequences: Fresh class changes no longer feel anchored to stale default skills, quick-start setup now covers class skills alongside background skills, and the feature stays clearly in the app-authored recommendation layer instead of claiming to model official class-skill choice rules exhaustively.

## DEC-165

- Date: `2026-03-10`
- Context: After the starter-skill onboarding pass landed, the builder had class-ready ability, gear, spell, and skill presets, so another onboarding tweak would have been diminishing returns while the launch roster still behaved like a flat recent-only list.
- Decision: Pivot the next bounded slice from builder onboarding to roster usability instead of silently stretching the creation-flow branch again.
- Consequences: The roadmap now treats the roster landing page as the next leverage point, the new-character onboarding baseline stays intact, and the next implementation should improve launch-page scanning rather than reopening more builder presets immediately.

## DEC-166

- Date: `2026-03-10`
- Context: Once the roadmap chose a roster-usability slice, the highest-value bounded move was to make the launch roster easier to scan without inventing new persistence, query APIs, or another routed browse surface.
- Decision: Add local search, class/species filters, sort controls, resettable browse state, and a filtered empty state to the character roster page while leaving the underlying `characters.list()` contract and route structure unchanged.
- Consequences: The roster can now scale beyond a flat recent-only list, launch-page character lookup is materially faster for larger local libraries, and the app gains a more useful home surface without taking on another persistence or URL-state system prematurely.

## DEC-167

- Date: `2026-03-10`
- Context: After the first roster browse pass landed, the launch page was easier to scan, but export and delete still required leaving the roster and opening another route first.
- Decision: Stay on roster usability for one more bounded launch-page management slice instead of pivoting away immediately after the first browse/filter/sort pass.
- Consequences: The roadmap now treats roster management friction as worth resolving before moving on, the current search/filter/sort baseline stays intact, and the next implementation should improve launch-page actions rather than reopen another surface prematurely.

## DEC-168

- Date: `2026-03-10`
- Context: Once the roadmap chose a roster-management slice, the highest-value bounded move was to surface the existing JSON export and delete actions directly on roster cards without changing persistence shape or adding another confirmation/modal system.
- Decision: Add per-character JSON export and delete actions to the roster cards, with inline pending-action state and top-level message feedback, while keeping PDF export and deeper management flows on the dedicated sheet/editor routes.
- Consequences: The roster is now a more complete launch and management surface, common character-library tasks no longer require a detour into the sheet or builder, and the app still avoids expanding the roster into a heavier multi-step management workflow.

## DEC-169

- Date: `2026-03-10`
- Context: After the roster-management pass landed, the user explicitly redirected the next slice back to the saved-sheet route and asked for `/characters/:id` to behave like the worksheet itself rather than a dashboard wrapped around it.
- Decision: Pivot the next bounded slice away from further roster work and reopen the saved-sheet route as a worksheet-first simplification pass instead.
- Consequences: The roadmap now treats the saved-sheet route as the highest-value non-print surface again, the roster remains at its current browse-plus-management baseline, and the next implementation should strip route chrome and relocate live page-one interactions onto the worksheet rather than adding more launch-page management features.

