import { calculateDerivedState } from "../../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS, resolveEnabledSourceIds } from "../../shared/data/contentSources";
import { sanitizeFeatState } from "../../shared/data/reference";
import { buildCharacterFromInput } from "../../shared/factories";
import { createInventoryItem, deriveLegacyLoadout, normalizeInventory } from "../../shared/inventory";
import { createDefaultSheetProfile, normalizeSheetProfile, normalizeTrackedResources } from "../../shared/sheetTracking";
import { normalizePactSlotsRemaining, normalizeSpellSlotsRemaining } from "../../shared/spellSlots";
import type { BuilderInput, CharacterRecord, HomebrewEntry } from "../../shared/types";

function clampNonNegative(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function clampDeathSaveMark(value: number) {
  return Math.max(0, Math.min(3, clampNonNegative(value)));
}

function normalizeStringArrayRecord(values: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, entries]) => [
        key,
        Array.from(new Set((entries ?? []).map((entry) => entry.trim()).filter(Boolean))),
      ] as const)
      .filter(([, entries]) => entries.length > 0),
  );
}

export function createDefaultBuilderInput(): BuilderInput {
  const inventory = [
    createInventoryItem("armor", "chain-mail", { equipped: true }),
    createInventoryItem("gear", "shield", { equipped: true }),
    createInventoryItem("weapon", "longsword", { equipped: true }),
    createInventoryItem("gear", "explorers-pack", { quantity: 1 }),
  ];
  const legacyLoadout = deriveLegacyLoadout(inventory);
  const now = new Date().toISOString();
  const draft: BuilderInput = {
    name: "New Adventurer",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "fighter",
    subclass: "",
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
    featIds: [],
    featSelections: {},
    bonusSpellClassId: "",
    bonusSpellIds: [],
    spellIds: [],
    preparedSpellIds: [],
    spellSlotsRemaining: [],
    pactSlotsRemaining: undefined,
    homebrewIds: [],
    notes: {
      classFeatures: "",
      backgroundFeatures: "",
      speciesTraits: "",
      feats: "",
    },
    sheetProfile: createDefaultSheetProfile(),
    trackedResources: [],
    currentHitPoints: 0,
    tempHitPoints: 0,
    hitDiceSpent: 0,
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    inspiration: false,
  };

  const derived = calculateDerivedState({
    id: "preview-character",
    ...draft,
    createdAt: now,
    updatedAt: now,
  });

  return {
    ...draft,
    currentHitPoints: derived.hitPointsMax,
    spellSlotsRemaining: [...derived.spellcasting.spellSlotsMax],
    pactSlotsRemaining: derived.spellcasting.pactSlotsMax,
  };
}

export function builderInputFromCharacter(record: CharacterRecord): BuilderInput {
  const inventory = normalizeInventory(record);
  const legacyLoadout = deriveLegacyLoadout(inventory);
  const featState = sanitizeFeatState(record.featIds ?? [], normalizeStringArrayRecord(record.featSelections ?? {}), {
    classId: record.classId,
    skillProficiencies: record.skillProficiencies,
  });

  return {
    name: record.name,
    enabledSourceIds: resolveEnabledSourceIds(record.enabledSourceIds),
    classId: record.classId,
    subclass: record.subclass.trim(),
    speciesId: record.speciesId,
    backgroundId: record.backgroundId,
    level: record.level,
    abilities: record.abilities,
    skillProficiencies: record.skillProficiencies,
    inventory,
    armorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    weaponIds: legacyLoadout.weaponIds,
    featIds: featState.featIds,
    featSelections: featState.featSelections,
    bonusSpellClassId: record.bonusSpellClassId ?? "",
    bonusSpellIds: record.bonusSpellIds ?? [],
    spellIds: record.spellIds,
    preparedSpellIds: record.preparedSpellIds,
    spellSlotsRemaining: [...record.spellSlotsRemaining],
    pactSlotsRemaining: record.pactSlotsRemaining,
    homebrewIds: record.homebrewIds,
    notes: {
      ...record.notes,
      backgroundFeatures: record.notes.backgroundFeatures ?? "",
    },
    sheetProfile: normalizeSheetProfile(record.sheetProfile),
    trackedResources: normalizeTrackedResources(record.trackedResources),
    currentHitPoints: record.currentHitPoints,
    tempHitPoints: record.tempHitPoints,
    hitDiceSpent: record.hitDiceSpent,
    deathSaves: {
      successes: clampDeathSaveMark(record.deathSaves?.successes ?? 0),
      failures: clampDeathSaveMark(record.deathSaves?.failures ?? 0),
    },
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
  const featState = sanitizeFeatState(draft.featIds, normalizeStringArrayRecord(draft.featSelections), {
    classId: draft.classId,
    skillProficiencies: draft.skillProficiencies,
  });

  if (!existingRecord) {
    return buildCharacterFromInput(
      {
        ...draft,
        inventory,
        ...legacyLoadout,
        featIds: featState.featIds,
        featSelections: featState.featSelections,
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
    subclass: draft.subclass.trim(),
    inventory,
    armorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    notes: { ...draft.notes },
    weaponIds: [...legacyLoadout.weaponIds],
    featIds: [...featState.featIds],
    featSelections: featState.featSelections,
    bonusSpellClassId: draft.bonusSpellClassId.trim(),
    bonusSpellIds: [...draft.bonusSpellIds],
    spellIds: [...draft.spellIds],
    preparedSpellIds: [...draft.preparedSpellIds],
    spellSlotsRemaining: [...draft.spellSlotsRemaining],
    pactSlotsRemaining: draft.pactSlotsRemaining === undefined ? undefined : clampNonNegative(draft.pactSlotsRemaining),
    homebrewIds: [...draft.homebrewIds],
    sheetProfile: normalizeSheetProfile(draft.sheetProfile),
    trackedResources: normalizeTrackedResources(draft.trackedResources),
    currentHitPoints: clampNonNegative(draft.currentHitPoints),
    tempHitPoints: clampNonNegative(draft.tempHitPoints),
    hitDiceSpent: clampNonNegative(draft.hitDiceSpent),
    deathSaves: {
      successes: clampDeathSaveMark(draft.deathSaves.successes),
      failures: clampDeathSaveMark(draft.deathSaves.failures),
    },
    updatedAt: new Date().toISOString(),
  };

  const derived = calculateDerivedState(nextRecord, homebrewEntries);

  return {
    ...nextRecord,
    currentHitPoints: Math.min(nextRecord.currentHitPoints, derived.hitPointsMax),
    hitDiceSpent: Math.min(nextRecord.hitDiceSpent, derived.hitDiceMax),
    spellSlotsRemaining: normalizeSpellSlotsRemaining(nextRecord.spellSlotsRemaining, derived.spellcasting.spellSlotsMax),
    pactSlotsRemaining: normalizePactSlotsRemaining(nextRecord.pactSlotsRemaining, derived.spellcasting.pactSlotsMax),
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
