# Non-Verbatim Text Inventory

This file records shipped user-facing rules/reference prose that is not exact source text.

## Repo-Managed Pack Content

- [content/packs/srd-5.2.1/spells.json](../content/packs/srd-5.2.1/spells.json): `summary` and short `effect` prose are app-authored browse copy and are not exact SRD quotations. `216` current spell-pack entries now have joined `descriptionKey` files marked `verbatim`, but `thorn-whip` still has no verified joined exact-description source in the open D&D Beyond Free Rules spell page and therefore still falls back to this non-verbatim browse/support copy.
- [content/packs/srd-5.2.1/creatures.json](../content/packs/srd-5.2.1/creatures.json): `summary`, `features`, and `actions` prose are app-authored browse copy and are not exact SRD/stat-block quotations.
- [content/packs/srd-5.2.1/textAudit.json](../content/packs/srd-5.2.1/textAudit.json): the field defaults above remain marked `non-verbatim`, while the current `216` spell and `6` creature joined `descriptionKey` files are marked `verbatim` and therefore are not part of this inventory.

## Shared Seeded Reference Text

- [shared/data/compendiumSeed.ts](../shared/data/compendiumSeed.ts): manual class, species, background, armor, weapon, gear, rule, and feat `summary` strings plus descriptive payload notes are app-authored non-verbatim compendium browse copy. The companion [shared/data/openBackgroundOfficialText.ts](../shared/data/openBackgroundOfficialText.ts), [shared/data/openEquipmentOfficialText.ts](../shared/data/openEquipmentOfficialText.ts), and [shared/data/openRuleOfficialText.ts](../shared/data/openRuleOfficialText.ts) now provide exact open SRD `officialText` payloads for bounded background, equipment, and core-rule slices, so those summary fields remain in this inventory rather than being silently treated as canonical text.
- [shared/data/reference.ts](../shared/data/reference.ts): subclass summaries, feat summaries, benefit labels, automation-status strings, choice-group descriptions, background themes/feature summaries, and equipment note strings are app-authored non-verbatim support copy and should stay separate from any future verbatim detail text surfaces.

## Maintenance Rule

- Add a line here any time new non-verbatim user-facing rules/reference prose ships.
- For pack descriptions joined through `descriptionKey`, also add or update the matching audit entry in that pack's `textAudit.json`.
