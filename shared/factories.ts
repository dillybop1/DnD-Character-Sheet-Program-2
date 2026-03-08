import { calculateDerivedState } from "./calculations";
import { resolveEnabledSourceIds } from "./data/contentSources";
import { normalizeSubclassSelection, sanitizeFeatState } from "./data/reference";
import { deriveLegacyLoadout, normalizeInventory } from "./inventory";
import { normalizeSheetProfile, normalizeTrackedResources } from "./sheetTracking";
import { normalizePactSlotsRemaining, normalizeSpellSlotsRemaining } from "./spellSlots";
import type { BuilderInput, CharacterRecord, HomebrewEntry } from "./types";

function clampNonNegative(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function clampDeathSaveMark(value: number) {
  return Math.max(0, Math.min(3, clampNonNegative(value)));
}

function normalizeStringArray(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeStringArrayRecord(values: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, entries]) => [key, normalizeStringArray(entries ?? [])] as const)
      .filter(([, entries]) => entries.length > 0),
  );
}

export function buildCharacterFromInput(input: BuilderInput, homebrewEntries: HomebrewEntry[] = []): CharacterRecord {
  const now = new Date().toISOString();
  const enabledSourceIds = resolveEnabledSourceIds(input.enabledSourceIds);
  const inventory = normalizeInventory(input);
  const legacyLoadout = deriveLegacyLoadout(inventory);
  const featState = sanitizeFeatState(normalizeStringArray(input.featIds), normalizeStringArrayRecord(input.featSelections), {
    classId: input.classId,
    skillProficiencies: input.skillProficiencies,
  });

  const draft: CharacterRecord = {
    id: crypto.randomUUID(),
    name: input.name,
    enabledSourceIds,
    classId: input.classId,
    subclass: normalizeSubclassSelection(input.classId, input.subclass, enabledSourceIds),
    speciesId: input.speciesId,
    backgroundId: input.backgroundId,
    level: input.level,
    abilities: input.abilities,
    skillProficiencies: input.skillProficiencies,
    inventory,
    armorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    weaponIds: legacyLoadout.weaponIds,
    featIds: featState.featIds,
    featSelections: featState.featSelections,
    bonusSpellClassId: input.bonusSpellClassId.trim(),
    bonusSpellIds: normalizeStringArray(input.bonusSpellIds),
    spellIds: input.spellIds,
    preparedSpellIds: input.preparedSpellIds,
    spellSlotsRemaining: [...input.spellSlotsRemaining],
    pactSlotsRemaining: input.pactSlotsRemaining === undefined ? undefined : clampNonNegative(input.pactSlotsRemaining),
    homebrewIds: input.homebrewIds,
    notes: input.notes,
    sheetProfile: normalizeSheetProfile(input.sheetProfile),
    trackedResources: normalizeTrackedResources(input.trackedResources),
    currentHitPoints: clampNonNegative(input.currentHitPoints),
    tempHitPoints: clampNonNegative(input.tempHitPoints),
    hitDiceSpent: clampNonNegative(input.hitDiceSpent),
    deathSaves: {
      successes: clampDeathSaveMark(input.deathSaves.successes),
      failures: clampDeathSaveMark(input.deathSaves.failures),
    },
    inspiration: input.inspiration,
    createdAt: now,
    updatedAt: now,
  };

  const derived = calculateDerivedState(draft, homebrewEntries);
  draft.currentHitPoints = Math.min(draft.currentHitPoints, derived.hitPointsMax);
  draft.hitDiceSpent = Math.min(draft.hitDiceSpent, derived.hitDiceMax);
  draft.spellSlotsRemaining = normalizeSpellSlotsRemaining(draft.spellSlotsRemaining, derived.spellcasting.spellSlotsMax);
  draft.pactSlotsRemaining = normalizePactSlotsRemaining(draft.pactSlotsRemaining, derived.spellcasting.pactSlotsMax);
  return draft;
}
