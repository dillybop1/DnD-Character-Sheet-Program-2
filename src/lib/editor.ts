import { calculateDerivedState } from "../../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS, resolveEnabledSourceIds } from "../../shared/data/contentSources";
import { buildCharacterFromInput } from "../../shared/factories";
import { createInventoryItem, deriveLegacyLoadout, normalizeInventory } from "../../shared/inventory";
import type { BuilderInput, CharacterRecord, HomebrewEntry } from "../../shared/types";

export function createDefaultBuilderInput(): BuilderInput {
  const inventory = [
    createInventoryItem("armor", "chain-mail", { equipped: true }),
    createInventoryItem("gear", "shield", { equipped: true }),
    createInventoryItem("weapon", "longsword", { equipped: true }),
    createInventoryItem("gear", "explorers-pack", { quantity: 1 }),
  ];
  const legacyLoadout = deriveLegacyLoadout(inventory);

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
    inventory,
    armorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    weaponIds: legacyLoadout.weaponIds,
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
  const inventory = normalizeInventory(record);
  const legacyLoadout = deriveLegacyLoadout(inventory);

  return {
    name: record.name,
    enabledSourceIds: resolveEnabledSourceIds(record.enabledSourceIds),
    classId: record.classId,
    speciesId: record.speciesId,
    backgroundId: record.backgroundId,
    level: record.level,
    abilities: record.abilities,
    skillProficiencies: record.skillProficiencies,
    inventory,
    armorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    weaponIds: legacyLoadout.weaponIds,
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
  const inventory = normalizeInventory(draft);
  const legacyLoadout = deriveLegacyLoadout(inventory);

  if (!existingRecord) {
    return buildCharacterFromInput(
      {
        ...draft,
        inventory,
        ...legacyLoadout,
      },
      homebrewEntries,
    );
  }

  const nextRecord: CharacterRecord = {
    ...existingRecord,
    ...draft,
    enabledSourceIds: resolveEnabledSourceIds(draft.enabledSourceIds),
    abilities: { ...draft.abilities },
    skillProficiencies: { ...draft.skillProficiencies },
    inventory,
    armorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    notes: { ...draft.notes },
    weaponIds: [...legacyLoadout.weaponIds],
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
