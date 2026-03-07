import { calculateDerivedState } from "./calculations";
import type { BuilderInput, CharacterRecord, HomebrewEntry } from "./types";

export function buildCharacterFromInput(input: BuilderInput, homebrewEntries: HomebrewEntry[] = []): CharacterRecord {
  const now = new Date().toISOString();

  const draft: CharacterRecord = {
    id: crypto.randomUUID(),
    name: input.name,
    classId: input.classId,
    speciesId: input.speciesId,
    backgroundId: input.backgroundId,
    level: input.level,
    abilities: input.abilities,
    skillProficiencies: input.skillProficiencies,
    armorId: input.armorId,
    shieldEquipped: input.shieldEquipped,
    weaponIds: input.weaponIds,
    spellIds: input.spellIds,
    preparedSpellIds: input.preparedSpellIds,
    homebrewIds: input.homebrewIds,
    notes: input.notes,
    currentHitPoints: 1,
    tempHitPoints: 0,
    hitDiceSpent: 0,
    inspiration: input.inspiration,
    createdAt: now,
    updatedAt: now,
  };

  const derived = calculateDerivedState(draft, homebrewEntries);
  draft.currentHitPoints = derived.hitPointsMax;
  return draft;
}
