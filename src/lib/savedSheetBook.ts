import { getBackgroundTemplate, getClassTemplate, getSpeciesTemplate, getSubclassLabel } from "../../shared/data/reference";
import { normalizeSheetProfile, normalizeTrackedResources } from "../../shared/sheetTracking";
import type { CharacterRecord, CurrencyWallet, DerivedSheetState, SheetProfile, TrackedResource } from "../../shared/types";

export type SavedSheetPageId = "page-1" | "page-2";

export interface SavedSheetEditorDraft {
  sheetProfile: SheetProfile;
  trackedResources: TrackedResource[];
}

export const SAVED_SHEET_PAGES: Array<{
  id: SavedSheetPageId;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "page-1",
    label: "Page 1",
    title: "Core Sheet",
    description: "Identity, vitals, features, equipment, and the reference layout preview.",
  },
  {
    id: "page-2",
    label: "Page 2",
    title: "Spells & Notes",
    description: "Spellbook, sheet profile, and saved play-state scaffolding.",
  },
];

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function formatSavedSheetSpellSlotSummary(derived: DerivedSheetState) {
  if (derived.spellcasting.slotMode === "pact") {
    if (derived.spellcasting.pactSlotsMax === 0 || derived.spellcasting.pactSlotLevel === null) {
      return "Pact slots pending";
    }

    return `${derived.spellcasting.pactSlotsRemaining}/${derived.spellcasting.pactSlotsMax} at level ${derived.spellcasting.pactSlotLevel}`;
  }

  if (derived.spellcasting.spellSlotsMax.length === 0) {
    return "None";
  }

  return derived.spellcasting.spellSlotsMax
    .map((slotMax, index) => `L${index + 1}:${derived.spellcasting.spellSlotsRemaining[index] ?? slotMax}/${slotMax}`)
    .join(" ");
}

export function formatSavedSheetCurrencySummary(currencies: CurrencyWallet) {
  const labels = ([
    ["pp", currencies.pp],
    ["gp", currencies.gp],
    ["ep", currencies.ep],
    ["sp", currencies.sp],
    ["cp", currencies.cp],
  ] as const)
    .filter(([, value]) => value > 0)
    .map(([label, value]) => `${value} ${label.toUpperCase()}`);

  return labels.length > 0 ? labels.join(" | ") : "No coins tracked";
}

export function parseSavedSheetLanguages(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

export function createSavedSheetEditorDraft(character: CharacterRecord): SavedSheetEditorDraft {
  return {
    sheetProfile: normalizeSheetProfile(character.sheetProfile),
    trackedResources: normalizeTrackedResources(character.trackedResources),
  };
}

export function createSavedSheetTrackedResource(nextIndex: number): TrackedResource {
  const labelIndex = nextIndex + 1;

  return {
    id: `tracked-resource-draft-${labelIndex}-${Date.now()}`,
    label: `Resource ${labelIndex}`,
    current: 1,
    max: 1,
    display: "checkboxes",
    recovery: "manual",
  };
}

export function buildSavedSheetPageOneSummary(character: CharacterRecord, derived: DerivedSheetState) {
  const classLabel = getClassTemplate(character.classId).name;
  const speciesLabel = getSpeciesTemplate(character.speciesId).name;
  const backgroundLabel = getBackgroundTemplate(character.backgroundId).name;
  const subclassLabel = character.subclass
    ? getSubclassLabel(character.classId, character.subclass, character.enabledSourceIds)
    : "No subclass";
  const carriedGear = derived.inventoryEntries.filter((entry) => entry.kind === "gear");

  return {
    headline: `Level ${character.level} ${classLabel}`,
    classLabel,
    speciesLabel,
    backgroundLabel,
    subclassLabel,
    armorClass: `${derived.armorClass}`,
    hitPoints: `${character.currentHitPoints}/${derived.hitPointsMax}`,
    initiative: formatSignedValue(derived.initiative),
    speed: `${derived.speed} ft`,
    size: derived.size,
    proficiencyBonus: formatSignedValue(derived.proficiencyBonus),
    passivePerception: `${derived.passiveSkills.perception}`,
    spellLine:
      derived.spellcasting.spellSaveDC === null
        ? derived.spellcasting.bonusSpellcasting?.sourceLabel ?? "None"
        : `DC ${derived.spellcasting.spellSaveDC}`,
    slotSummary: formatSavedSheetSpellSlotSummary(derived),
    hitDice: `${character.hitDiceSpent}/${derived.hitDiceMax} spent`,
    deathSaves: `${character.deathSaves.successes} success, ${character.deathSaves.failures} failure`,
    inspiration: character.inspiration ? "Marked" : "Open",
    weaponCount: derived.weaponEntries.length,
    gearCount: carriedGear.length,
    featureCount: derived.classFeatures.length + derived.backgroundFeatures.length + derived.speciesTraits.length + derived.feats.length,
    trackedResourceCount: character.trackedResources.length,
  };
}

export function buildSavedSheetPageTwoSummary(character: CharacterRecord, derived: DerivedSheetState) {
  const knownSpells = derived.spellcasting.knownSpells;
  const preparedSpells = derived.spellcasting.preparedSpells;
  const cantripCount = knownSpells.filter((spell) => spell.level === 0).length;
  const leveledSpellCount = knownSpells.length - cantripCount;

  return {
    knownSpellCount: knownSpells.length,
    preparedSpellCount: preparedSpells.length,
    cantripCount,
    leveledSpellCount,
    slotSummary: formatSavedSheetSpellSlotSummary(derived),
    spellNames: knownSpells.map((spell) => spell.name),
    preparedSpellNames: preparedSpells.map((spell) => spell.name),
    appearance: character.sheetProfile.appearance.trim() || "No appearance notes yet.",
    alignment: character.sheetProfile.alignment.trim() || "Unset",
    languages: character.sheetProfile.languages.length > 0 ? character.sheetProfile.languages.join(", ") : "No languages tracked",
    equipmentNotes: character.sheetProfile.equipmentNotes.trim() || "No equipment notes yet.",
    currencySummary: formatSavedSheetCurrencySummary(character.sheetProfile.currencies),
    trackedResources: character.trackedResources,
  };
}
