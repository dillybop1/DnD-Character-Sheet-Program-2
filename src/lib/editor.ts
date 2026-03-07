import { calculateDerivedState } from "../../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS, resolveEnabledSourceIds } from "../../shared/data/contentSources";
import { buildCharacterFromInput } from "../../shared/factories";
import type { BuilderInput, CharacterRecord, HomebrewEntry } from "../../shared/types";

export function createDefaultBuilderInput(): BuilderInput {
  return {
    name: "New Adventurer",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "fighter",
    speciesId: "human",
    backgroundId: "soldier",
    level: 1,
    abilities: {
      strength: 15,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 8,
    },
    skillProficiencies: {
      athletics: "proficient",
      perception: "proficient",
    },
    armorId: "chain-mail",
    shieldEquipped: true,
    weaponIds: ["longsword"],
    spellIds: [],
    preparedSpellIds: [],
    homebrewIds: [],
    notes: {
      classFeatures: "",
      speciesTraits: "",
      feats: "",
    },
    inspiration: false,
  };
}

export function builderInputFromCharacter(record: CharacterRecord): BuilderInput {
  return {
    name: record.name,
    enabledSourceIds: resolveEnabledSourceIds(record.enabledSourceIds),
    classId: record.classId,
    speciesId: record.speciesId,
    backgroundId: record.backgroundId,
    level: record.level,
    abilities: record.abilities,
    skillProficiencies: record.skillProficiencies,
    armorId: record.armorId,
    shieldEquipped: record.shieldEquipped,
    weaponIds: record.weaponIds,
    spellIds: record.spellIds,
    preparedSpellIds: record.preparedSpellIds,
    homebrewIds: record.homebrewIds,
    notes: record.notes,
    inspiration: record.inspiration,
  };
}

export function buildPreviewCharacter(
  draft: BuilderInput,
  existingRecord: CharacterRecord | null,
  homebrewEntries: HomebrewEntry[],
) {
  if (!existingRecord) {
    return buildCharacterFromInput(draft, homebrewEntries);
  }

  const nextRecord: CharacterRecord = {
    ...existingRecord,
    ...draft,
    enabledSourceIds: resolveEnabledSourceIds(draft.enabledSourceIds),
    abilities: { ...draft.abilities },
    skillProficiencies: { ...draft.skillProficiencies },
    notes: { ...draft.notes },
    weaponIds: [...draft.weaponIds],
    spellIds: [...draft.spellIds],
    preparedSpellIds: [...draft.preparedSpellIds],
    homebrewIds: [...draft.homebrewIds],
    updatedAt: new Date().toISOString(),
  };

  const derived = calculateDerivedState(nextRecord, homebrewEntries);

  return {
    ...nextRecord,
    currentHitPoints: Math.min(existingRecord.currentHitPoints, derived.hitPointsMax),
  };
}

export function humanizeLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

export function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
