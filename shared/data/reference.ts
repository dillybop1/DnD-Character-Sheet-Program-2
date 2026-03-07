import type {
  AbilityName,
  ArmorTemplate,
  BackgroundTemplate,
  ClassTemplate,
  SpeciesTemplate,
  WeaponTemplate,
} from "../types";

export const SKILL_TO_ABILITY: Record<string, AbilityName> = {
  acrobatics: "dexterity",
  animalHandling: "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  sleightOfHand: "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
};

export const CLASSES: ClassTemplate[] = [
  {
    id: "fighter",
    name: "Fighter",
    hitDie: 10,
    saveProficiencies: ["strength", "constitution"],
    spellcastingAbility: null,
    casterType: "none",
    featureSummary: ["Second Wind", "Fighting Style", "Weapon Mastery"],
  },
  {
    id: "wizard",
    name: "Wizard",
    hitDie: 6,
    saveProficiencies: ["intelligence", "wisdom"],
    spellcastingAbility: "intelligence",
    casterType: "full",
    featureSummary: ["Arcane Recovery", "Spellcasting", "Ritual Casting"],
  },
  {
    id: "cleric",
    name: "Cleric",
    hitDie: 8,
    saveProficiencies: ["wisdom", "charisma"],
    spellcastingAbility: "wisdom",
    casterType: "full",
    featureSummary: ["Divine Order", "Channel Divinity", "Spellcasting"],
  },
  {
    id: "rogue",
    name: "Rogue",
    hitDie: 8,
    saveProficiencies: ["dexterity", "intelligence"],
    spellcastingAbility: null,
    casterType: "none",
    featureSummary: ["Sneak Attack", "Expertise", "Cunning Action"],
  },
];

export const SPECIES: SpeciesTemplate[] = [
  {
    id: "human",
    name: "Human",
    speed: 30,
    featureSummary: ["Resourceful", "Skilled", "Versatile"],
  },
  {
    id: "elf",
    name: "Elf",
    speed: 30,
    featureSummary: ["Darkvision", "Fey Ancestry", "Keen Senses"],
  },
  {
    id: "dwarf",
    name: "Dwarf",
    speed: 30,
    featureSummary: ["Darkvision", "Dwarven Toughness", "Stonecunning"],
  },
];

export const BACKGROUNDS: BackgroundTemplate[] = [
  {
    id: "acolyte",
    name: "Acolyte",
    featureSummary: ["Temple Service", "Two skill proficiencies", "Starting gear"],
  },
  {
    id: "sage",
    name: "Sage",
    featureSummary: ["Research focus", "Two skill proficiencies", "Starting gear"],
  },
  {
    id: "soldier",
    name: "Soldier",
    featureSummary: ["Battle training", "Two skill proficiencies", "Starting gear"],
  },
];

export const ARMORS: ArmorTemplate[] = [
  {
    id: "unarmored",
    name: "Unarmored",
    baseArmorClass: 10,
    dexterityCap: null,
    notes: "10 + Dexterity modifier",
  },
  {
    id: "leather",
    name: "Leather Armor",
    baseArmorClass: 11,
    dexterityCap: null,
    notes: "11 + Dexterity modifier",
  },
  {
    id: "scale-mail",
    name: "Scale Mail",
    baseArmorClass: 14,
    dexterityCap: 2,
    notes: "14 + Dexterity modifier (max 2)",
  },
  {
    id: "chain-mail",
    name: "Chain Mail",
    baseArmorClass: 16,
    dexterityCap: 0,
    ignoresDexterity: true,
    notes: "Flat AC 16",
  },
];

export const WEAPONS: WeaponTemplate[] = [
  {
    id: "longsword",
    name: "Longsword",
    damage: "1d8",
    damageType: "slashing",
    notes: "Versatile (1d10)",
  },
  {
    id: "dagger",
    name: "Dagger",
    damage: "1d4",
    damageType: "piercing",
    finesse: true,
    notes: "Finesse, light, thrown",
  },
  {
    id: "shortbow",
    name: "Shortbow",
    damage: "1d6",
    damageType: "piercing",
    ranged: true,
    notes: "Ammunition, two-handed",
  },
  {
    id: "quarterstaff",
    name: "Quarterstaff",
    damage: "1d6",
    damageType: "bludgeoning",
    notes: "Versatile (1d8)",
  },
  {
    id: "mace",
    name: "Mace",
    damage: "1d6",
    damageType: "bludgeoning",
  },
];

export const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

export function getClassTemplate(classId: string) {
  return CLASSES.find((entry) => entry.id === classId) ?? CLASSES[0];
}

export function getSpeciesTemplate(speciesId: string) {
  return SPECIES.find((entry) => entry.id === speciesId) ?? SPECIES[0];
}

export function getBackgroundTemplate(backgroundId: string) {
  return BACKGROUNDS.find((entry) => entry.id === backgroundId) ?? BACKGROUNDS[0];
}

export function getArmorTemplate(armorId: string | null) {
  return ARMORS.find((entry) => entry.id === (armorId ?? "unarmored")) ?? ARMORS[0];
}

export function getWeaponTemplate(weaponId: string) {
  return WEAPONS.find((entry) => entry.id === weaponId);
}
