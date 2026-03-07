import {
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_MAGIC_SLOTS,
  SKILL_TO_ABILITY,
  getArmorTemplate,
  getClassTemplate,
  getSpeciesTemplate,
  getWeaponTemplate,
} from "./data/reference";
import { spellRecordFromCompendium } from "./data/compendiumSeed";
import { CORE_OPEN_SOURCE_ID } from "./data/contentSources";
import type {
  AbilityName,
  AbilityScores,
  CasterType,
  CharacterRecord,
  DerivedSpellSummary,
  DerivedSheetState,
  Effect,
  HomebrewEntry,
  ProficiencyLevel,
  SkillName,
  SpellRecord,
} from "./types";

function clampLevel(level: number) {
  return Math.max(1, Math.min(20, level || 1));
}

export function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number) {
  return 2 + Math.floor((clampLevel(level) - 1) / 4);
}

function applyAbilityBonuses(abilities: AbilityScores, effects: Effect[]) {
  const next = { ...abilities };

  for (const effect of effects) {
    if (effect.type !== "ability_bonus" || !effect.target || effect.value === undefined) {
      continue;
    }

    const ability = effect.target as AbilityName;
    next[ability] += effect.value;
  }

  return next;
}

function deriveSkillProficiencies(
  skillProficiencies: CharacterRecord["skillProficiencies"],
  effects: Effect[],
) {
  const next = { ...skillProficiencies };

  for (const effect of effects) {
    if (!effect.target) {
      continue;
    }

    if (effect.type === "grant_skill_proficiency") {
      next[effect.target as SkillName] = "proficient";
    }

    if (effect.type === "grant_expertise") {
      next[effect.target as SkillName] = "expertise";
    }
  }

  return next;
}

function deriveSaveProficiencies(record: CharacterRecord, effects: Effect[]) {
  const classTemplate = getClassTemplate(record.classId);
  const saveProficiencies = new Set<AbilityName>(classTemplate.saveProficiencies);

  for (const effect of effects) {
    if (effect.type === "grant_save_proficiency" && effect.target) {
      saveProficiencies.add(effect.target as AbilityName);
    }
  }

  return saveProficiencies;
}

function proficiencyMultiplier(level: ProficiencyLevel) {
  if (level === "expertise") {
    return 2;
  }

  if (level === "proficient") {
    return 1;
  }

  return 0;
}

function collectEffects(record: CharacterRecord, homebrewEntries: HomebrewEntry[]) {
  return homebrewEntries
    .filter((entry) => record.homebrewIds.includes(entry.id))
    .flatMap((entry) => entry.effects);
}

function computeArmorClass(record: CharacterRecord, dexterityModifier: number, effects: Effect[]) {
  const armor = getArmorTemplate(record.armorId);
  const overrideFormula = effects.find((effect) => effect.type === "set_base_ac_formula");
  const acBonus = effects
    .filter((effect) => effect.type === "ac_bonus" && typeof effect.value === "number")
    .reduce((total, effect) => total + (effect.value ?? 0), 0);

  if (overrideFormula?.target === "unarmored") {
    return 10 + dexterityModifier + (record.shieldEquipped ? 2 : 0) + acBonus;
  }

  const dexContribution = armor.ignoresDexterity
    ? 0
    : armor.dexterityCap === null
      ? dexterityModifier
      : Math.min(dexterityModifier, armor.dexterityCap);

  return armor.baseArmorClass + dexContribution + (record.shieldEquipped ? 2 : 0) + acBonus;
}

function averageHitDieGain(hitDie: number) {
  return Math.floor(hitDie / 2) + 1;
}

function deriveSpellSlots(level: number, casterType: CasterType): Pick<
  DerivedSpellSummary,
  "slotMode" | "spellSlotsMax" | "pactSlotsMax" | "pactSlotLevel"
> {
  if (casterType === "full") {
    return {
      slotMode: "standard",
      spellSlotsMax: FULL_CASTER_SLOTS[level] ?? [],
      pactSlotsMax: 0,
      pactSlotLevel: null,
    };
  }

  if (casterType === "half") {
    return {
      slotMode: "standard",
      spellSlotsMax: HALF_CASTER_SLOTS[level] ?? [],
      pactSlotsMax: 0,
      pactSlotLevel: null,
    };
  }

  if (casterType === "pact") {
    const pactProgression = PACT_MAGIC_SLOTS[level];
    return {
      slotMode: "pact",
      spellSlotsMax: [],
      pactSlotsMax: pactProgression?.slots ?? 0,
      pactSlotLevel: pactProgression?.slotLevel ?? null,
    };
  }

  return {
    slotMode: "none",
    spellSlotsMax: [],
    pactSlotsMax: 0,
    pactSlotLevel: null,
  };
}

function buildSpellSummaries(record: CharacterRecord, effects: Effect[]): SpellRecord[] {
  const spellIds = Array.from(
    new Set([
      ...record.spellIds,
      ...effects
        .filter((effect) => effect.type === "grant_spell" && Boolean(effect.target))
        .map((effect) => effect.target as string),
    ]),
  );

  return spellIds.map((spellId) => {
    const compendiumSpell = spellRecordFromCompendium(spellId);

    if (compendiumSpell) {
      return compendiumSpell;
    }

    return {
      id: spellId,
      sourceId: CORE_OPEN_SOURCE_ID,
      name: spellId,
      level: 0,
      school: "Unknown",
      summary: "Custom spell entry.",
    };
  });
}

export function calculateDerivedState(record: CharacterRecord, homebrewEntries: HomebrewEntry[] = []): DerivedSheetState {
  const classTemplate = getClassTemplate(record.classId);
  const speciesTemplate = getSpeciesTemplate(record.speciesId);
  const effects = collectEffects(record, homebrewEntries);
  const adjustedAbilities = applyAbilityBonuses(record.abilities, effects);
  const abilityModifiers = {
    strength: abilityModifier(adjustedAbilities.strength),
    dexterity: abilityModifier(adjustedAbilities.dexterity),
    constitution: abilityModifier(adjustedAbilities.constitution),
    intelligence: abilityModifier(adjustedAbilities.intelligence),
    wisdom: abilityModifier(adjustedAbilities.wisdom),
    charisma: abilityModifier(adjustedAbilities.charisma),
  };

  const level = clampLevel(record.level);
  const profBonus = proficiencyBonus(level);
  const saveProficiencies = deriveSaveProficiencies(record, effects);
  const skillProficiencies = deriveSkillProficiencies(record.skillProficiencies, effects);
  const skills = Object.fromEntries(
    Object.entries(SKILL_TO_ABILITY).map(([skillName, ability]) => {
      const proficiency = proficiencyMultiplier(skillProficiencies[skillName as SkillName] ?? "none");
      return [skillName, abilityModifiers[ability] + profBonus * proficiency];
    }),
  ) as DerivedSheetState["skills"];

  const savingThrows = Object.fromEntries(
    Object.entries(abilityModifiers).map(([abilityName, modifier]) => [
      abilityName,
      modifier + (saveProficiencies.has(abilityName as AbilityName) ? profBonus : 0),
    ]),
  ) as DerivedSheetState["savingThrows"];

  const speedBonus = effects
    .filter((effect) => effect.type === "speed_bonus")
    .reduce((total, effect) => total + (effect.value ?? 0), 0);

  const bonusHitPoints = effects
    .filter((effect) => effect.type === "hp_bonus")
    .reduce((total, effect) => total + (effect.value ?? 0), 0);

  const maxHitPoints =
    classTemplate.hitDie +
    abilityModifiers.constitution +
    Math.max(0, level - 1) * (averageHitDieGain(classTemplate.hitDie) + abilityModifiers.constitution) +
    bonusHitPoints;

  const spellcastingAbilityEffect = effects.find((effect) => effect.type === "set_spellcasting_ability");
  const spellcastingAbility = (spellcastingAbilityEffect?.target as AbilityName | undefined) ?? classTemplate.spellcastingAbility;
  const spellAbilityModifier = spellcastingAbility ? abilityModifiers[spellcastingAbility] : null;
  const knownSpells = buildSpellSummaries(record, effects);
  const slotProgression = deriveSpellSlots(level, classTemplate.casterType);

  const weaponEntries = record.weaponIds
    .map((weaponId) => getWeaponTemplate(weaponId))
    .filter((weapon): weapon is NonNullable<typeof weapon> => Boolean(weapon))
    .map((weapon) => {
      const usesDexterity = weapon.ranged || weapon.finesse;
      const attackAbility = usesDexterity
        ? Math.max(abilityModifiers.dexterity, abilityModifiers.strength)
        : abilityModifiers.strength;
      const attackBonus = attackAbility + profBonus;
      const damageBonus = usesDexterity
        ? Math.max(abilityModifiers.dexterity, abilityModifiers.strength)
        : abilityModifiers.strength;

      return {
        id: weapon.id,
        name: weapon.name,
        attackBonus,
        damage: `${weapon.damage} + ${damageBonus} ${weapon.damageType}`,
        notes: weapon.notes,
      };
    });

  return {
    proficiencyBonus: profBonus,
    abilityModifiers,
    savingThrows,
    skills,
    armorClass: computeArmorClass(record, abilityModifiers.dexterity, effects),
    initiative: abilityModifiers.dexterity,
    speed: speciesTemplate.speed + speedBonus,
    hitPointsMax: maxHitPoints,
    hitDiceMax: level,
    spellcasting: {
      ...slotProgression,
      spellAttackBonus: spellAbilityModifier === null ? null : spellAbilityModifier + profBonus,
      spellSaveDC: spellAbilityModifier === null ? null : 8 + profBonus + spellAbilityModifier,
      knownSpells,
      preparedSpells: knownSpells.filter((spell) => record.preparedSpellIds.includes(spell.id)),
    },
    weaponEntries,
    classFeatures: [...classTemplate.featureSummary, record.notes.classFeatures].filter(Boolean),
    speciesTraits: [...speciesTemplate.featureSummary, record.notes.speciesTraits].filter(Boolean),
    feats: record.notes.feats ? [record.notes.feats] : [],
    activeEffects: homebrewEntries
      .filter((entry) => record.homebrewIds.includes(entry.id))
      .map((entry) => entry.name),
  };
}
