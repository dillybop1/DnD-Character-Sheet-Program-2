import { calculateDerivedState } from "../../shared/calculations";
import { listCompendiumSpells } from "../../shared/data/compendiumSeed";
import { DEFAULT_ENABLED_SOURCE_IDS, resolveEnabledSourceIds } from "../../shared/data/contentSources";
import { getClassTemplate, sanitizeFeatState } from "../../shared/data/reference";
import { buildCharacterFromInput } from "../../shared/factories";
import { createInventoryItem, deriveLegacyLoadout, normalizeInventory } from "../../shared/inventory";
import { createDefaultSheetProfile, normalizeSheetProfile, normalizeTrackedResources } from "../../shared/sheetTracking";
import { normalizePactSlotsRemaining, normalizeSpellSlotsRemaining } from "../../shared/spellSlots";
import { ABILITY_NAMES } from "../../shared/types";
import type {
  AbilityName,
  AbilityScores,
  BuilderInput,
  CharacterRecord,
  ContentSourceId,
  HomebrewEntry,
  ProficiencyLevel,
  SkillName,
} from "../../shared/types";

export const STANDARD_ABILITY_ARRAY = [15, 14, 13, 12, 10, 8] as const;
export interface ClassStarterSpellSelection {
  spellIds: string[];
  preparedSpellIds: string[];
}

function createEmptyAbilityScores(): AbilityScores {
  return {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  };
}

export function areSameAbilityScores(left: AbilityScores, right: AbilityScores) {
  return ABILITY_NAMES.every((ability) => left[ability] === right[ability]);
}

export function buildStandardAbilityScores(order: AbilityName[]): AbilityScores {
  const normalizedOrder = Array.from(new Set([...order, ...ABILITY_NAMES])).slice(0, ABILITY_NAMES.length);
  const abilityScores = createEmptyAbilityScores();

  normalizedOrder.forEach((ability, index) => {
    abilityScores[ability] = STANDARD_ABILITY_ARRAY[index] ?? STANDARD_ABILITY_ARRAY[STANDARD_ABILITY_ARRAY.length - 1];
  });

  return abilityScores;
}

export function buildClassStandardAbilityScores(classId: string) {
  return buildStandardAbilityScores(getClassTemplate(classId).standardAbilityOrder);
}

function readSpellLevel(payload: Record<string, unknown>) {
  return typeof payload.level === "number" ? payload.level : 0;
}

function normalizeUniqueStringSet(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function normalizeSkillProficiencyEntries(
  values: Partial<Record<SkillName, ProficiencyLevel>>,
) {
  return Object.entries(values)
    .filter(([, level]) => level && level !== "none")
    .sort(([leftSkill], [rightSkill]) => leftSkill.localeCompare(rightSkill));
}

export function areSameSkillProficiencies(
  left: Partial<Record<SkillName, ProficiencyLevel>>,
  right: Partial<Record<SkillName, ProficiencyLevel>>,
) {
  const normalizedLeft = normalizeSkillProficiencyEntries(left);
  const normalizedRight = normalizeSkillProficiencyEntries(right);

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every(
      ([leftSkill, leftLevel], index) =>
        leftSkill === normalizedRight[index]?.[0] && leftLevel === normalizedRight[index]?.[1],
    )
  );
}

export function mergeSuggestedSkillProficiencies(
  current: Partial<Record<SkillName, ProficiencyLevel>>,
  suggestedSkills: SkillName[],
) {
  return {
    ...current,
    ...Object.fromEntries(
      suggestedSkills.map((skill) => [skill, current[skill] === "expertise" ? "expertise" : "proficient"]),
    ),
  } as Partial<Record<SkillName, ProficiencyLevel>>;
}

export function areSameSpellSelections(
  leftSpellIds: string[],
  leftPreparedSpellIds: string[],
  rightSpellIds: string[],
  rightPreparedSpellIds: string[],
) {
  const normalizedLeftSpellIds = normalizeUniqueStringSet(leftSpellIds);
  const normalizedRightSpellIds = normalizeUniqueStringSet(rightSpellIds);
  const normalizedLeftPreparedSpellIds = normalizeUniqueStringSet(leftPreparedSpellIds);
  const normalizedRightPreparedSpellIds = normalizeUniqueStringSet(rightPreparedSpellIds);

  return (
    normalizedLeftSpellIds.length === normalizedRightSpellIds.length &&
    normalizedLeftSpellIds.every((spellId, index) => spellId === normalizedRightSpellIds[index]) &&
    normalizedLeftPreparedSpellIds.length === normalizedRightPreparedSpellIds.length &&
    normalizedLeftPreparedSpellIds.every((spellId, index) => spellId === normalizedRightPreparedSpellIds[index])
  );
}

export function buildClassStarterSpellSelection(
  classId: string,
  enabledSourceIds: ContentSourceId[],
): ClassStarterSpellSelection {
  const classTemplate = getClassTemplate(classId);

  if (classTemplate.spellcastingAbility === null || classTemplate.starterSpellIds.length === 0) {
    return {
      spellIds: [],
      preparedSpellIds: [],
    };
  }

  const availableSpellsById = new Map(
    listCompendiumSpells(enabledSourceIds, classTemplate.name).map((entry) => [entry.slug, entry] as const),
  );
  const spellIds = classTemplate.starterSpellIds.filter((spellId) => availableSpellsById.has(spellId));
  const preparedSpellIds = spellIds.filter((spellId) => {
    const entry = availableSpellsById.get(spellId);
    return entry ? readSpellLevel(entry.payload) > 0 : false;
  });

  return {
    spellIds,
    preparedSpellIds,
  };
}

export function buildClassStarterSkillProficiencies(classId: string) {
  return Object.fromEntries(
    getClassTemplate(classId).starterSkillIds.map((skill) => [skill, "proficient"]),
  ) as Partial<Record<SkillName, ProficiencyLevel>>;
}

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
    abilities: buildClassStandardAbilityScores("fighter"),
    skillProficiencies: buildClassStarterSkillProficiencies("fighter"),
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
