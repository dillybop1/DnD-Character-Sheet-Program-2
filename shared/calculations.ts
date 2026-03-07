import {
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_MAGIC_SLOTS,
  SKILL_TO_ABILITY,
  getArmorTemplate,
  getBackgroundTemplate,
  getClassTemplate,
  getFeatTemplate,
  resolveFeatEffects,
  sanitizeFeatState,
  getSubclassTemplate,
  getSpeciesTemplate,
  getWeaponTemplate,
} from "./data/reference";
import { spellRecordFromCompendium } from "./data/compendiumSeed";
import { CORE_OPEN_SOURCE_ID } from "./data/contentSources";
import { deriveLegacyLoadout, listInventoryEntries, normalizeInventory } from "./inventory";
import type {
  AbilityName,
  AbilityScores,
  CasterType,
  CharacterRecord,
  DerivedSpellcastingLine,
  DerivedSpellSummary,
  DerivedSheetState,
  Effect,
  HomebrewEntry,
  ProficiencyLevel,
  SkillName,
  SpellRecord,
} from "./types";
import { SKILL_NAMES } from "./types";

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
      const skill = effect.target as SkillName;
      next[skill] = next[skill] === "expertise" ? "expertise" : "proficient";
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

function derivePassiveSkills(skills: Record<SkillName, number>, effects: Effect[]) {
  return Object.fromEntries(
    SKILL_NAMES.map((skill) => {
      const passiveBonus = effects
        .filter((effect) => effect.type === "passive_skill_bonus" && effect.target === skill)
        .reduce((total, effect) => total + (effect.value ?? 0), 0);

      return [skill, 10 + skills[skill] + passiveBonus];
    }),
  ) as Record<SkillName, number>;
}

function collectSelectedHomebrew(record: CharacterRecord, homebrewEntries: HomebrewEntry[]) {
  return homebrewEntries.filter((entry) => record.homebrewIds.includes(entry.id));
}

function computeArmorClass(armorId: string | null, shieldEquipped: boolean, dexterityModifier: number, effects: Effect[]) {
  const armor = getArmorTemplate(armorId);
  const overrideFormula = effects.find((effect) => effect.type === "set_base_ac_formula");
  const acBonus = effects
    .filter((effect) => effect.type === "ac_bonus" && typeof effect.value === "number")
    .reduce((total, effect) => total + (effect.value ?? 0), 0);

  if (overrideFormula?.target === "unarmored") {
    return 10 + dexterityModifier + (shieldEquipped ? 2 : 0) + acBonus;
  }

  const dexContribution = armor.ignoresDexterity
    ? 0
    : armor.dexterityCap === null
      ? dexterityModifier
      : Math.min(dexterityModifier, armor.dexterityCap);

  return armor.baseArmorClass + dexContribution + (shieldEquipped ? 2 : 0) + acBonus;
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
      ...record.bonusSpellIds,
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
      classes: [],
    };
  });
}

function deriveBonusSpellcastingAbility(record: CharacterRecord, featIds: string[]) {
  if (!featIds.includes("magic-initiate") || !record.bonusSpellClassId.trim()) {
    return null;
  }

  const bonusSpellClass = getClassTemplate(record.bonusSpellClassId);
  return bonusSpellClass.spellcastingAbility;
}

function deriveBonusSpellcastingLine(
  record: CharacterRecord,
  featIds: string[],
  primarySpellcastingAbility: AbilityName | null,
  abilityModifiers: Record<AbilityName, number>,
  profBonus: number,
): DerivedSpellcastingLine | null {
  if (!featIds.includes("magic-initiate") || !record.bonusSpellClassId.trim() || record.bonusSpellIds.length === 0) {
    return null;
  }

  const bonusSpellClass = getClassTemplate(record.bonusSpellClassId);
  const bonusSpellcastingAbility = bonusSpellClass.spellcastingAbility;

  if (!bonusSpellcastingAbility || bonusSpellcastingAbility === primarySpellcastingAbility) {
    return null;
  }

  return {
    sourceId: bonusSpellClass.id,
    sourceLabel: `Magic Initiate (${bonusSpellClass.name})`,
    spellcastingAbility: bonusSpellcastingAbility,
    spellAttackBonus: abilityModifiers[bonusSpellcastingAbility] + profBonus,
    spellSaveDC: 8 + profBonus + abilityModifiers[bonusSpellcastingAbility],
    spellIds: Array.from(new Set(record.bonusSpellIds)),
  };
}

export function calculateDerivedState(record: CharacterRecord, homebrewEntries: HomebrewEntry[] = []): DerivedSheetState {
  const classTemplate = getClassTemplate(record.classId);
  const subclassTemplate = getSubclassTemplate(record.classId, record.subclass, record.enabledSourceIds);
  const backgroundTemplate = getBackgroundTemplate(record.backgroundId);
  const speciesTemplate = getSpeciesTemplate(record.speciesId);
  const activeHomebrewEntries = collectSelectedHomebrew(record, homebrewEntries);
  const featState = sanitizeFeatState(record.featIds, record.featSelections, {
    classId: record.classId,
    skillProficiencies: record.skillProficiencies,
  });
  const featTemplates = featState.featIds
    .map((featId) => getFeatTemplate(featId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const effects = [
    ...featState.featIds.flatMap((featId) =>
      resolveFeatEffects(featId, featState.featSelections, {
        classId: record.classId,
        skillProficiencies: record.skillProficiencies,
      }),
    ),
    ...activeHomebrewEntries.flatMap((entry) => entry.effects),
  ];
  const inventory = normalizeInventory(record);
  const legacyLoadout = deriveLegacyLoadout(inventory);
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
  const passiveSkills = derivePassiveSkills(skills, effects);

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
  const bonusHitPointsPerLevel = effects
    .filter((effect) => effect.type === "hp_bonus_per_level")
    .reduce((total, effect) => total + (effect.value ?? 0), 0);
  const initiativeBonus = effects
    .filter((effect) => effect.type === "initiative_bonus")
    .reduce((total, effect) => total + (effect.value ?? 0), 0);

  const maxHitPoints =
    classTemplate.hitDie +
    abilityModifiers.constitution +
    Math.max(0, level - 1) * (averageHitDieGain(classTemplate.hitDie) + abilityModifiers.constitution) +
    bonusHitPoints +
    bonusHitPointsPerLevel * level;

  const spellcastingAbilityEffect = [...effects].reverse().find((effect) => effect.type === "set_spellcasting_ability");
  const spellcastingAbility =
    (spellcastingAbilityEffect?.target as AbilityName | undefined) ??
    classTemplate.spellcastingAbility ??
    deriveBonusSpellcastingAbility(record, featState.featIds);
  const spellAbilityModifier = spellcastingAbility ? abilityModifiers[spellcastingAbility] : null;
  const bonusSpellcasting = deriveBonusSpellcastingLine(
    record,
    featState.featIds,
    spellcastingAbility,
    abilityModifiers,
    profBonus,
  );
  const knownSpells = buildSpellSummaries(record, effects);
  const slotProgression = deriveSpellSlots(level, classTemplate.casterType);

  const weaponEntries = legacyLoadout.weaponIds
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
    adjustedAbilities,
    abilityModifiers,
    savingThrows,
    skills,
    passiveSkills,
    armorClass: computeArmorClass(legacyLoadout.armorId, legacyLoadout.shieldEquipped, abilityModifiers.dexterity, effects),
    initiative: abilityModifiers.dexterity + initiativeBonus,
    size: speciesTemplate.size,
    speed: speciesTemplate.speed + speedBonus,
    hitPointsMax: maxHitPoints,
    hitDiceMax: level,
    equippedArmorId: legacyLoadout.armorId,
    shieldEquipped: legacyLoadout.shieldEquipped,
    spellcasting: {
      ...slotProgression,
      spellcastingAbility,
      spellAttackBonus: spellAbilityModifier === null ? null : spellAbilityModifier + profBonus,
      spellSaveDC: spellAbilityModifier === null ? null : 8 + profBonus + spellAbilityModifier,
      bonusSpellcasting,
      knownSpells,
      preparedSpells: knownSpells.filter(
        (spell) => spell.level > 0 && (record.preparedSpellIds.includes(spell.id) || record.bonusSpellIds.includes(spell.id)),
      ),
    },
    weaponEntries,
    inventoryEntries: listInventoryEntries(record),
    classFeatures: [
      ...classTemplate.featureSummary,
      ...(subclassTemplate?.featureSummary ?? []),
      ...activeHomebrewEntries.filter((entry) => entry.type === "feature").map((entry) => entry.name),
      record.notes.classFeatures,
    ].filter(Boolean),
    backgroundFeatures: [...backgroundTemplate.featureSummary, record.notes.backgroundFeatures].filter(Boolean),
    speciesTraits: [
      ...speciesTemplate.featureSummary,
      ...activeHomebrewEntries.filter((entry) => entry.type === "speciesTrait").map((entry) => entry.name),
      record.notes.speciesTraits,
    ].filter(Boolean),
    feats: [
      ...featTemplates.map((entry) => entry.name),
      ...activeHomebrewEntries.filter((entry) => entry.type === "feat").map((entry) => entry.name),
      record.notes.feats,
    ].filter(Boolean),
    activeEffects: activeHomebrewEntries
      .filter((entry) => entry.type === "item" || entry.type === "spell")
      .map((entry) => entry.name),
  };
}
