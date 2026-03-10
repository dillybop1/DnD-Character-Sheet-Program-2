import { ABILITY_NAMES, SKILL_NAMES } from "../types";
import type {
  AbilityName,
  ContentSourceId,
  ArmorTemplate,
  BackgroundTemplate,
  ClassTemplate,
  Effect,
  FeatTemplate,
  FeatSupportLevel,
  GearTemplate,
  ProficiencyLevel,
  SkillName,
  SpeciesTemplate,
  SubclassTemplate,
  WeaponTemplate,
} from "../types";
import { CORE_OPEN_SOURCE_ID, DEFAULT_ENABLED_SOURCE_IDS, isSourceEnabled } from "./contentSources";

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
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Fighter",
    hitDie: 10,
    saveProficiencies: ["strength", "constitution"],
    spellcastingAbility: null,
    casterType: "none",
    standardAbilityOrder: ["strength", "constitution", "dexterity", "wisdom", "intelligence", "charisma"],
    starterSkillIds: ["athletics", "perception"],
    starterSpellIds: [],
    featureSummary: ["Second Wind", "Fighting Style", "Weapon Mastery"],
  },
  {
    id: "bard",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Bard",
    hitDie: 8,
    saveProficiencies: ["dexterity", "charisma"],
    spellcastingAbility: "charisma",
    casterType: "full",
    standardAbilityOrder: ["charisma", "dexterity", "constitution", "wisdom", "intelligence", "strength"],
    starterSkillIds: ["performance", "persuasion"],
    starterSpellIds: ["vicious-mockery", "mage-hand", "healing-word", "cure-wounds", "faerie-fire", "heroism"],
    featureSummary: ["Bardic Inspiration", "Spellcasting", "Expertise"],
  },
  {
    id: "wizard",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Wizard",
    hitDie: 6,
    saveProficiencies: ["intelligence", "wisdom"],
    spellcastingAbility: "intelligence",
    casterType: "full",
    standardAbilityOrder: ["intelligence", "constitution", "dexterity", "wisdom", "charisma", "strength"],
    starterSkillIds: ["arcana", "investigation"],
    starterSpellIds: ["fire-bolt", "mage-hand", "magic-missile", "sleep", "mage-armor", "detect-magic"],
    featureSummary: ["Arcane Recovery", "Spellcasting", "Ritual Casting"],
  },
  {
    id: "cleric",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Cleric",
    hitDie: 8,
    saveProficiencies: ["wisdom", "charisma"],
    spellcastingAbility: "wisdom",
    casterType: "full",
    standardAbilityOrder: ["wisdom", "constitution", "dexterity", "charisma", "strength", "intelligence"],
    starterSkillIds: ["insight", "religion"],
    starterSpellIds: ["guidance", "sacred-flame", "bless", "cure-wounds", "guiding-bolt", "healing-word", "shield-of-faith"],
    featureSummary: ["Divine Order", "Channel Divinity", "Spellcasting"],
  },
  {
    id: "druid",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Druid",
    hitDie: 8,
    saveProficiencies: ["intelligence", "wisdom"],
    spellcastingAbility: "wisdom",
    casterType: "full",
    standardAbilityOrder: ["wisdom", "constitution", "dexterity", "intelligence", "charisma", "strength"],
    starterSkillIds: ["nature", "survival"],
    starterSpellIds: ["guidance", "shillelagh", "cure-wounds", "entangle", "faerie-fire", "goodberry"],
    featureSummary: ["Primal Order", "Spellcasting", "Wild Shape"],
  },
  {
    id: "paladin",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Paladin",
    hitDie: 10,
    saveProficiencies: ["wisdom", "charisma"],
    spellcastingAbility: "charisma",
    casterType: "half",
    standardAbilityOrder: ["strength", "charisma", "constitution", "wisdom", "dexterity", "intelligence"],
    starterSkillIds: ["athletics", "persuasion"],
    starterSpellIds: ["bless", "cure-wounds", "heroism", "shield-of-faith"],
    featureSummary: ["Lay on Hands", "Spellcasting", "Weapon Mastery"],
  },
  {
    id: "ranger",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Ranger",
    hitDie: 10,
    saveProficiencies: ["strength", "dexterity"],
    spellcastingAbility: "wisdom",
    casterType: "half",
    standardAbilityOrder: ["dexterity", "wisdom", "constitution", "strength", "intelligence", "charisma"],
    starterSkillIds: ["perception", "survival"],
    starterSpellIds: ["hunters-mark", "goodberry", "cure-wounds", "entangle", "fog-cloud"],
    featureSummary: ["Favored Enemy", "Spellcasting", "Weapon Mastery"],
  },
  {
    id: "rogue",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Rogue",
    hitDie: 8,
    saveProficiencies: ["dexterity", "intelligence"],
    spellcastingAbility: null,
    casterType: "none",
    standardAbilityOrder: ["dexterity", "constitution", "wisdom", "intelligence", "charisma", "strength"],
    starterSkillIds: ["perception", "stealth"],
    starterSpellIds: [],
    featureSummary: ["Sneak Attack", "Expertise", "Cunning Action"],
  },
  {
    id: "sorcerer",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Sorcerer",
    hitDie: 6,
    saveProficiencies: ["constitution", "charisma"],
    spellcastingAbility: "charisma",
    casterType: "full",
    standardAbilityOrder: ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],
    starterSkillIds: ["arcana", "persuasion"],
    starterSpellIds: ["fire-bolt", "ray-of-frost", "magic-missile", "sleep", "mage-armor", "burning-hands"],
    featureSummary: ["Innate Sorcery", "Spellcasting", "Sorcery Points"],
  },
  {
    id: "warlock",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Warlock",
    hitDie: 8,
    saveProficiencies: ["wisdom", "charisma"],
    spellcastingAbility: "charisma",
    casterType: "pact",
    standardAbilityOrder: ["charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength"],
    starterSkillIds: ["arcana", "deception"],
    starterSpellIds: ["eldritch-blast", "minor-illusion", "hex", "charm-person", "detect-magic"],
    featureSummary: ["Pact Magic", "Eldritch Invocations", "Magical Cunning"],
  },
];

export const SPECIES: SpeciesTemplate[] = [
  {
    id: "human",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Human",
    size: "Medium",
    speed: 30,
    featureSummary: ["Resourceful", "Skilled", "Versatile"],
  },
  {
    id: "elf",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Elf",
    size: "Medium",
    speed: 30,
    featureSummary: ["Darkvision", "Fey Ancestry", "Keen Senses"],
  },
  {
    id: "dwarf",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Dwarf",
    size: "Medium",
    speed: 30,
    featureSummary: ["Darkvision", "Dwarven Toughness", "Stonecunning"],
  },
];

export const SUBCLASSES: SubclassTemplate[] = [
  {
    id: "fighter-champion",
    classId: "fighter",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Champion",
    summary: "A straightforward martial specialist focused on dependable offense, athletic prowess, and critical hits.",
    featureSummary: ["Improved Critical", "Athletic Versatility", "Heroic Warrior"],
  },
  {
    id: "fighter-battle-master",
    classId: "fighter",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Battle Master",
    summary: "A tactical fighter who uses maneuvers and battlefield discipline to control fights.",
    featureSummary: ["Combat Maneuvers", "Superiority Dice", "Tactical Assessment"],
  },
  {
    id: "bard-college-of-lore",
    classId: "bard",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "College of Lore",
    summary: "A scholarly bard who leans into broad knowledge, cutting support magic, and flexible expertise.",
    featureSummary: ["Cutting Words", "Bonus Proficiencies", "Magical Secrets"],
  },
  {
    id: "bard-college-of-valor",
    classId: "bard",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "College of Valor",
    summary: "A battle-ready bard who supports allies from the front line with martial confidence.",
    featureSummary: ["Combat Inspiration", "Battle Magic", "Martial Training"],
  },
  {
    id: "wizard-school-of-evocation",
    classId: "wizard",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "School of Evocation",
    summary: "An offensive wizard tradition built around precise, reliable, high-impact arcane blasts.",
    featureSummary: ["Sculpt Spells", "Potent Cantrip", "Empowered Evocation"],
  },
  {
    id: "wizard-school-of-abjuration",
    classId: "wizard",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "School of Abjuration",
    summary: "A defensive wizard tradition centered on wards, countermeasures, and magical resilience.",
    featureSummary: ["Arcane Ward", "Projected Ward", "Improved Abjuration"],
  },
  {
    id: "cleric-life-domain",
    classId: "cleric",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Life Domain",
    summary: "A restorative cleric path that emphasizes healing, endurance, and protective miracles.",
    featureSummary: ["Disciple of Life", "Preserve Life", "Blessed Healer"],
  },
  {
    id: "cleric-light-domain",
    classId: "cleric",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Light Domain",
    summary: "A radiant cleric path that answers darkness with burning spells and bright defensive power.",
    featureSummary: ["Warding Flare", "Radiance of the Dawn", "Corona of Light"],
  },
  {
    id: "druid-circle-of-the-land",
    classId: "druid",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Circle of the Land",
    summary: "A terrain-attuned druid circle that deepens spell access and steadies primal recovery.",
    featureSummary: ["Bonus Circle Spells", "Natural Recovery", "Land's Stride"],
  },
  {
    id: "druid-circle-of-the-moon",
    classId: "druid",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Circle of the Moon",
    summary: "A shapechanging druid circle focused on durable Wild Shape forms and primal ferocity.",
    featureSummary: ["Combat Wild Shape", "Circle Forms", "Primal Strike"],
  },
  {
    id: "paladin-oath-of-devotion",
    classId: "paladin",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Oath of Devotion",
    summary: "A classic holy oath built around virtue, radiant conviction, and steadfast protection.",
    featureSummary: ["Sacred Weapon", "Turn the Unholy", "Aura of Devotion"],
  },
  {
    id: "paladin-oath-of-the-ancients",
    classId: "paladin",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Oath of the Ancients",
    summary: "A primal divine oath that defends light, life, and the natural world's enduring magic.",
    featureSummary: ["Nature's Wrath", "Turn the Faithless", "Aura of Warding"],
  },
  {
    id: "ranger-hunter",
    classId: "ranger",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Hunter",
    summary: "A focused slayer ranger that sharpens offensive choices against dangerous prey.",
    featureSummary: ["Hunter's Prey", "Defensive Tactics", "Multiattack"],
  },
  {
    id: "ranger-beast-master",
    classId: "ranger",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Beast Master",
    summary: "A ranger bonded to a loyal companion that fights and scouts as part of a two-creature team.",
    featureSummary: ["Primal Companion", "Coordinated Assault", "Bestial Bond"],
  },
  {
    id: "rogue-thief",
    classId: "rogue",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Thief",
    summary: "A nimble rogue focused on agility, fast item play, and impossible infiltration.",
    featureSummary: ["Fast Hands", "Second-Story Work", "Supreme Sneak"],
  },
  {
    id: "rogue-arcane-trickster",
    classId: "rogue",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Arcane Trickster",
    summary: "A stealthy rogue who mixes legerdemain with deceptive arcane tricks and ambush magic.",
    featureSummary: ["Mage Hand Legerdemain", "Sneaky Spellcasting", "Versatile Trickster"],
  },
  {
    id: "sorcerer-draconic-sorcery",
    classId: "sorcerer",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Draconic Sorcery",
    summary: "A bloodline sorcerer shaped by draconic power, resilience, and elemental expression.",
    featureSummary: ["Draconic Resilience", "Elemental Affinity", "Dragon Wings"],
  },
  {
    id: "sorcerer-wild-magic",
    classId: "sorcerer",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Wild Magic",
    summary: "A chaotic sorcerer whose magic surges unpredictably and bends fortune at key moments.",
    featureSummary: ["Wild Magic Surge", "Tides of Chaos", "Bend Luck"],
  },
  {
    id: "warlock-the-fiend",
    classId: "warlock",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "The Fiend",
    summary: "A warlock patronage path fueled by infernal power, ruthless survival, and punishing magic.",
    featureSummary: ["Dark One's Blessing", "Dark One's Own Luck", "Fiendish Resilience"],
  },
  {
    id: "warlock-the-archfey",
    classId: "warlock",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "The Archfey",
    summary: "A warlock patronage path built on fey glamour, escape tricks, and beguiling control.",
    featureSummary: ["Fey Presence", "Misty Escape", "Beguiling Defenses"],
  },
];

export const BACKGROUNDS: BackgroundTemplate[] = [
  {
    id: "acolyte",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Acolyte",
    theme: "Religious scholar",
    featureSummary: ["Temple Service", "Two skill proficiencies", "Starting gear"],
    suggestedSkills: ["insight", "religion"],
    startingInventory: [
      { templateType: "gear", templateId: "priests-pack" },
      { templateType: "gear", templateId: "holy-symbol", equipped: true },
      { templateType: "gear", templateId: "healers-kit" },
    ],
  },
  {
    id: "sage",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Sage",
    theme: "Lore scholar",
    featureSummary: ["Research focus", "Two skill proficiencies", "Starting gear"],
    suggestedSkills: ["arcana", "history"],
    startingInventory: [
      { templateType: "gear", templateId: "spellbook", equipped: true },
      { templateType: "gear", templateId: "component-pouch", equipped: true },
      { templateType: "gear", templateId: "explorers-pack" },
    ],
  },
  {
    id: "soldier",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Soldier",
    theme: "Battle-tested veteran",
    featureSummary: ["Battle training", "Two skill proficiencies", "Starting gear"],
    suggestedSkills: ["athletics", "intimidation"],
    startingInventory: [
      { templateType: "gear", templateId: "dungeoneers-pack" },
      { templateType: "gear", templateId: "rope-hempen" },
      { templateType: "gear", templateId: "torch", quantity: 2 },
    ],
  },
];

function createFeatEffects(...effects: Array<Omit<Effect, "id">>) {
  return effects.map((effect, index) => ({
    id: `${effect.type}-${index}`,
    ...effect,
  }));
}

function formatChoiceLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replaceAll("-", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

interface FeatChoiceContext {
  classId?: string;
  skillProficiencies?: Partial<Record<SkillName, ProficiencyLevel>>;
  featSelections?: Record<string, string[]>;
}

function skillProficiencyLevel(
  skill: SkillName,
  skillProficiencies: Partial<Record<SkillName, ProficiencyLevel>> = {},
) {
  return skillProficiencies[skill] ?? "none";
}

function normalizeChoiceSelections(selections: string[]) {
  return Array.from(new Set(selections.map((value) => value.trim()).filter(Boolean)));
}

function withCurrentFeatSelections(
  featId: string,
  featSelections: Record<string, string[]> | undefined,
  selections: string[],
) {
  return {
    ...(featSelections ?? {}),
    [featId]: selections,
  };
}

function tryChoiceCombinations(
  options: string[],
  choiceCount: number,
  onCombination: (combination: string[]) => boolean,
  startIndex = 0,
  combination: string[] = [],
): boolean {
  if (choiceCount === 0) {
    return onCombination(combination);
  }

  for (let index = startIndex; index <= options.length - choiceCount; index += 1) {
    combination.push(options[index]);

    if (tryChoiceCombinations(options, choiceCount - 1, onCombination, index + 1, combination)) {
      return true;
    }

    combination.pop();
  }

  return false;
}

function canSatisfyChoiceGroups(
  featId: string,
  groupIds: string[],
  context: FeatChoiceContext,
  currentSelections: string[],
): boolean {
  if (groupIds.length === 0) {
    return true;
  }

  const template = getFeatTemplate(featId);
  const [groupId, ...restGroupIds] = groupIds;
  const choiceGroup = template?.choiceGroups?.find((group) => group.id === groupId);

  if (!choiceGroup) {
    return canSatisfyChoiceGroups(featId, restGroupIds, context, currentSelections);
  }

  const availableOptions = listAvailableFeatChoiceOptions(featId, groupId, {
    ...context,
    featSelections: withCurrentFeatSelections(featId, context.featSelections, currentSelections),
  });

  if (availableOptions.length < choiceGroup.minChoices) {
    return false;
  }

  const maxChoices = Math.min(choiceGroup.maxChoices, availableOptions.length);

  for (let choiceCount = choiceGroup.minChoices; choiceCount <= maxChoices; choiceCount += 1) {
    if (
      tryChoiceCombinations(availableOptions, choiceCount, (combination) =>
        canSatisfyChoiceGroups(featId, restGroupIds, context, [...currentSelections, ...combination]),
      )
    ) {
      return true;
    }
  }

  return false;
}

export const FEATS: FeatTemplate[] = [
  {
    id: "alert",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Alert",
    summary: "A feat for characters who want sharper reactions and a stronger initiative floor.",
    benefits: ["Improved initiative", "Harder to surprise in play-focused builds"],
    effects: createFeatEffects({
      type: "initiative_bonus",
      value: 5,
    }),
    supportLevel: "derived",
    automationStatus: "Derived initiative bonus applies automatically.",
  },
  {
    id: "tough",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Tough",
    summary: "A feat focused on additional durability and staying power.",
    benefits: ["Additional maximum hit points", "Reliable survivability boost"],
    effects: createFeatEffects({
      type: "hp_bonus_per_level",
      value: 2,
    }),
    supportLevel: "derived",
    automationStatus: "Derived hit point bonus applies automatically.",
  },
  {
    id: "magic-initiate",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Magic Initiate",
    summary: "A feat that grants basic spellcasting access outside a character's normal class path.",
    benefits: ["Learn cantrips", "Gain a low-level spell option"],
    effects: [],
    supportLevel: "partial",
    automationStatus:
      "Choose a spell list and bonus spells in the builder; native casters keep a separate feat spellcasting line when the chosen list uses a different ability.",
  },
  {
    id: "mobile",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Mobile",
    summary: "A mobility feat for characters who want more battlefield speed and freedom of movement.",
    benefits: ["Speed increases by 10 feet", "Some movement benefits remain reference-only"],
    effects: createFeatEffects({
      type: "speed_bonus",
      value: 10,
    }),
    supportLevel: "partial",
    automationStatus: "Derived speed bonus applies automatically; other movement benefits remain reference-only.",
  },
  {
    id: "skilled",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Skilled",
    summary: "A feat for broadly capable characters who want extra training across several disciplines.",
    benefits: ["Gain proficiency in three skills", "Flexible skill-focused advancement"],
    effects: [],
    supportLevel: "derived",
    automationStatus: "Choose up to three skills in the builder to grant proficiency automatically.",
    choiceGroups: [
      {
        id: "skills",
        label: "Skill Choices",
        description: "Choose up to three skills to gain proficiency in.",
        choiceType: "skill",
        minChoices: 3,
        maxChoices: 3,
        options: [...SKILL_NAMES],
      },
    ],
  },
  {
    id: "resilient",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Resilient",
    summary: "A feat that hardens one saving throw while slightly improving the same ability score.",
    benefits: ["Increase one ability score by 1", "Gain proficiency in one saving throw"],
    effects: [],
    supportLevel: "derived",
    automationStatus: "Choose one ability in the builder to apply the save proficiency and +1 ability bonus.",
    choiceGroups: [
      {
        id: "ability",
        label: "Resilient Ability",
        description: "Choose one ability to increase by 1 and gain saving throw proficiency in.",
        choiceType: "ability",
        minChoices: 1,
        maxChoices: 1,
        options: [...ABILITY_NAMES],
      },
    ],
  },
  {
    id: "skill-expert",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Skill Expert",
    summary: "A feat for characters who want broader training plus deeper mastery in one specialty.",
    benefits: ["Increase one ability score by 1", "Gain proficiency in one skill", "Gain expertise in one skill"],
    effects: [],
    supportLevel: "derived",
    automationStatus: "Choose one ability, one skill proficiency, and one expertise skill in the builder.",
    choiceGroups: [
      {
        id: "ability",
        label: "Ability Increase",
        description: "Choose one ability to increase by 1.",
        choiceType: "ability",
        minChoices: 1,
        maxChoices: 1,
        options: ABILITY_NAMES.map((ability) => `ability:${ability}`),
      },
      {
        id: "skill",
        label: "New Skill Proficiency",
        description: "Choose one skill to gain proficiency in.",
        choiceType: "skill",
        minChoices: 1,
        maxChoices: 1,
        options: SKILL_NAMES.map((skill) => `skill:${skill}`),
      },
      {
        id: "expertise",
        label: "Expertise Skill",
        description: "Choose one skill to gain expertise in.",
        choiceType: "expertise",
        minChoices: 1,
        maxChoices: 1,
        options: SKILL_NAMES.map((skill) => `expertise:${skill}`),
      },
    ],
  },
  {
    id: "athlete",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Athlete",
    summary: "A feat that sharpens physical talent while leaving its movement tricks mostly to table play.",
    benefits: ["Increase Strength or Dexterity by 1", "Athletic movement benefits remain reference-only"],
    effects: [],
    supportLevel: "partial",
    automationStatus: "Choose Strength or Dexterity in the builder; the +1 ability bonus applies automatically while the movement benefits remain reference-only.",
    choiceGroups: [
      {
        id: "ability",
        label: "Athlete Ability",
        description: "Choose Strength or Dexterity to increase by 1.",
        choiceType: "ability",
        minChoices: 1,
        maxChoices: 1,
        options: ["strength", "dexterity"],
      },
    ],
  },
  {
    id: "observant",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Observant",
    summary: "A feat for perceptive or scholarly characters who want sharper passive awareness without forcing a larger sensory rules rewrite.",
    benefits: ["Increase Intelligence or Wisdom by 1", "Gain +5 passive Investigation", "Gain +5 passive Perception"],
    effects: createFeatEffects(
      {
        type: "passive_skill_bonus",
        target: "investigation",
        value: 5,
      },
      {
        type: "passive_skill_bonus",
        target: "perception",
        value: 5,
      },
    ),
    supportLevel: "partial",
    automationStatus:
      "Choose Intelligence or Wisdom in the builder; the +1 ability bonus plus passive Investigation and Perception bonuses apply automatically while lip-reading remains reference-only.",
    choiceGroups: [
      {
        id: "ability",
        label: "Observant Ability",
        description: "Choose Intelligence or Wisdom to increase by 1.",
        choiceType: "ability",
        minChoices: 1,
        maxChoices: 1,
        options: ["intelligence", "wisdom"],
      },
    ],
  },
];

export const ARMORS: ArmorTemplate[] = [
  {
    id: "unarmored",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Unarmored",
    baseArmorClass: 10,
    dexterityCap: null,
    notes: "10 + Dexterity modifier",
  },
  {
    id: "leather",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Leather Armor",
    baseArmorClass: 11,
    dexterityCap: null,
    notes: "11 + Dexterity modifier",
  },
  {
    id: "studded-leather",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Studded Leather Armor",
    baseArmorClass: 12,
    dexterityCap: null,
    notes: "12 + Dexterity modifier",
  },
  {
    id: "scale-mail",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Scale Mail",
    baseArmorClass: 14,
    dexterityCap: 2,
    notes: "14 + Dexterity modifier (max 2)",
  },
  {
    id: "breastplate",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Breastplate",
    baseArmorClass: 14,
    dexterityCap: 2,
    notes: "14 + Dexterity modifier (max 2)",
  },
  {
    id: "chain-mail",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Chain Mail",
    baseArmorClass: 16,
    dexterityCap: 0,
    ignoresDexterity: true,
    notes: "Flat AC 16",
  },
  {
    id: "plate",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Plate Armor",
    baseArmorClass: 18,
    dexterityCap: 0,
    ignoresDexterity: true,
    notes: "Flat AC 18",
  },
];

export const WEAPONS: WeaponTemplate[] = [
  {
    id: "longsword",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Longsword",
    damage: "1d8",
    damageType: "slashing",
    notes: "Versatile (1d10)",
  },
  {
    id: "dagger",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Dagger",
    damage: "1d4",
    damageType: "piercing",
    finesse: true,
    notes: "Finesse, light, thrown",
  },
  {
    id: "rapier",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Rapier",
    damage: "1d8",
    damageType: "piercing",
    finesse: true,
    notes: "Finesse",
  },
  {
    id: "shortbow",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Shortbow",
    damage: "1d6",
    damageType: "piercing",
    ranged: true,
    notes: "Ammunition, two-handed",
  },
  {
    id: "light-crossbow",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Light Crossbow",
    damage: "1d8",
    damageType: "piercing",
    ranged: true,
    notes: "Ammunition, loading, two-handed",
  },
  {
    id: "quarterstaff",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Quarterstaff",
    damage: "1d6",
    damageType: "bludgeoning",
    notes: "Versatile (1d8)",
  },
  {
    id: "mace",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Mace",
    damage: "1d6",
    damageType: "bludgeoning",
  },
  {
    id: "spear",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Spear",
    damage: "1d6",
    damageType: "piercing",
    notes: "Thrown, versatile (1d8)",
  },
  {
    id: "warhammer",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Warhammer",
    damage: "1d8",
    damageType: "bludgeoning",
    notes: "Versatile (1d10)",
  },
  {
    id: "greatsword",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Greatsword",
    damage: "2d6",
    damageType: "slashing",
    notes: "Heavy, two-handed",
  },
];

export const GEAR_ITEMS: GearTemplate[] = [
  {
    id: "shield",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Shield",
    category: "shield",
    equipable: true,
    armorClassBonus: 2,
    notes: "+2 Armor Class while equipped",
  },
  {
    id: "explorers-pack",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Explorer's Pack",
    category: "gear",
    notes: "Starter travel supplies and utility basics.",
  },
  {
    id: "burglars-pack",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Burglar's Pack",
    category: "gear",
    notes: "Compact infiltration supplies with string, candles, and utility tools.",
  },
  {
    id: "dungeoneers-pack",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Dungeoneer's Pack",
    category: "gear",
    notes: "Underground exploration basics with rope, torches, and rations.",
  },
  {
    id: "priests-pack",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Priest's Pack",
    category: "gear",
    notes: "Religious travel kit with blanket, candles, incense, and vestments.",
  },
  {
    id: "thieves-tools",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Thieves' Tools",
    category: "tool",
    notes: "A common precision toolkit for locks and traps.",
  },
  {
    id: "holy-symbol",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Holy Symbol",
    category: "focus",
    equipable: true,
    notes: "Divine spellcasting focus.",
  },
  {
    id: "arcane-focus",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Arcane Focus",
    category: "focus",
    equipable: true,
    notes: "Arcane focus such as a wand, orb, rod, staff, or crystal.",
  },
  {
    id: "component-pouch",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Component Pouch",
    category: "focus",
    equipable: true,
    notes: "Arcane or general spell components.",
  },
  {
    id: "spellbook",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Spellbook",
    category: "focus",
    equipable: true,
    notes: "A wizard's primary spell reference.",
  },
  {
    id: "druidic-focus",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Druidic Focus",
    category: "focus",
    equipable: true,
    notes: "Primal focus such as mistletoe, a totem, or a wooden staff.",
  },
  {
    id: "musical-instrument",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Musical Instrument",
    category: "focus",
    equipable: true,
    notes: "A performance instrument that can also serve as a bardic focus.",
  },
  {
    id: "healers-kit",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Healer's Kit",
    category: "tool",
    notes: "Bandages and salves used to stabilize a dying creature.",
  },
  {
    id: "herbalism-kit",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Herbalism Kit",
    category: "tool",
    notes: "Tools for collecting herbs and preparing remedies.",
  },
  {
    id: "rope-hempen",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Hempen Rope",
    category: "gear",
    notes: "50 feet of rope for climbing and travel.",
  },
  {
    id: "torch",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Torch",
    category: "gear",
    notes: "A simple portable light source for dark environments.",
  },
  {
    id: "rations",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Rations",
    category: "gear",
    notes: "Trail food meant to support a day of travel.",
  },
  {
    id: "waterskin",
    sourceId: CORE_OPEN_SOURCE_ID,
    name: "Waterskin",
    category: "gear",
    notes: "Portable water storage for travel and camp.",
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

export const HALF_CASTER_SLOTS: Record<number, number[]> = {
  1: [2],
  2: [2],
  3: [3],
  4: [3],
  5: [4, 2],
  6: [4, 2],
  7: [4, 3],
  8: [4, 3],
  9: [4, 3, 2],
  10: [4, 3, 2],
  11: [4, 3, 3],
  12: [4, 3, 3],
  13: [4, 3, 3, 1],
  14: [4, 3, 3, 1],
  15: [4, 3, 3, 2],
  16: [4, 3, 3, 2],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
};

export const PACT_MAGIC_SLOTS: Record<number, { slots: number; slotLevel: number }> = {
  1: { slots: 1, slotLevel: 1 },
  2: { slots: 2, slotLevel: 1 },
  3: { slots: 2, slotLevel: 2 },
  4: { slots: 2, slotLevel: 2 },
  5: { slots: 2, slotLevel: 3 },
  6: { slots: 2, slotLevel: 3 },
  7: { slots: 2, slotLevel: 4 },
  8: { slots: 2, slotLevel: 4 },
  9: { slots: 2, slotLevel: 5 },
  10: { slots: 2, slotLevel: 5 },
  11: { slots: 3, slotLevel: 5 },
  12: { slots: 3, slotLevel: 5 },
  13: { slots: 3, slotLevel: 5 },
  14: { slots: 3, slotLevel: 5 },
  15: { slots: 3, slotLevel: 5 },
  16: { slots: 3, slotLevel: 5 },
  17: { slots: 4, slotLevel: 5 },
  18: { slots: 4, slotLevel: 5 },
  19: { slots: 4, slotLevel: 5 },
  20: { slots: 4, slotLevel: 5 },
};

function filterByEnabledSources<T extends { sourceId: ContentSourceId }>(
  entries: T[],
  enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS,
) {
  return entries.filter((entry) => isSourceEnabled(entry.sourceId, enabledSourceIds));
}

function normalizeSubclassToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function findSubclassByValue(entries: SubclassTemplate[], subclassValue: string) {
  const normalizedValue = normalizeSubclassToken(subclassValue);

  return (
    entries.find((entry) => entry.id === subclassValue) ??
    entries.find((entry) => normalizeSubclassToken(entry.name) === normalizedValue) ??
    null
  );
}

export function listClassTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(CLASSES, enabledSourceIds);
}

export function listSpeciesTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(SPECIES, enabledSourceIds);
}

export function listSubclassTemplates(
  classId: string,
  enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS,
) {
  return filterByEnabledSources(SUBCLASSES, enabledSourceIds).filter((entry) => entry.classId === classId);
}

export function listBackgroundTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(BACKGROUNDS, enabledSourceIds);
}

export function listFeatTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(FEATS, enabledSourceIds);
}

export function listArmorTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(ARMORS, enabledSourceIds);
}

export function listWeaponTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(WEAPONS, enabledSourceIds);
}

export function listGearTemplates(enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS) {
  return filterByEnabledSources(GEAR_ITEMS, enabledSourceIds);
}

export function getClassTemplate(classId: string) {
  return CLASSES.find((entry) => entry.id === classId) ?? CLASSES[0];
}

export function getSubclassTemplate(
  classId: string,
  subclassValue: string,
  enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS,
) {
  if (!subclassValue.trim()) {
    return null;
  }

  return findSubclassByValue(listSubclassTemplates(classId, enabledSourceIds), subclassValue);
}

export function getSubclassLabel(
  classId: string,
  subclassValue: string,
  enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS,
) {
  const template =
    getSubclassTemplate(classId, subclassValue, enabledSourceIds) ??
    findSubclassByValue(filterByEnabledSources(SUBCLASSES, enabledSourceIds), subclassValue);
  return template?.name ?? subclassValue.trim();
}

export function normalizeSubclassSelection(
  classId: string,
  subclassValue: string,
  enabledSourceIds: ContentSourceId[] = DEFAULT_ENABLED_SOURCE_IDS,
) {
  return getSubclassTemplate(classId, subclassValue, enabledSourceIds)?.id ?? subclassValue.trim();
}

export function isKnownSubclassValue(subclassValue: string) {
  return Boolean(findSubclassByValue(SUBCLASSES, subclassValue));
}

export function getSpeciesTemplate(speciesId: string) {
  return SPECIES.find((entry) => entry.id === speciesId) ?? SPECIES[0];
}

export function getBackgroundTemplate(backgroundId: string) {
  return BACKGROUNDS.find((entry) => entry.id === backgroundId) ?? BACKGROUNDS[0];
}

export function getFeatTemplate(featId: string) {
  return FEATS.find((entry) => entry.id === featId) ?? null;
}

export function getFeatChoiceLabel(featId: string, optionId: string) {
  const template = getFeatTemplate(featId);
  const matchingGroup = template?.choiceGroups?.find((group) => group.options.includes(optionId));
  const normalizedOptionId = optionId.includes(":") ? optionId.split(":").slice(1).join(":") : optionId;

  if (!matchingGroup) {
    return formatChoiceLabel(normalizedOptionId);
  }

  return formatChoiceLabel(normalizedOptionId);
}

export function getFeatSupportLabel(level: FeatSupportLevel) {
  if (level === "derived") {
    return "Derived";
  }

  if (level === "partial") {
    return "Partial";
  }

  return "Reference";
}

export function isFeatSelectable(featId: string, context: FeatChoiceContext = {}) {
  const template = getFeatTemplate(featId);

  if (!template) {
    return false;
  }

  const choiceGroups = template.choiceGroups ?? [];

  if (choiceGroups.length === 0) {
    return true;
  }

  return canSatisfyChoiceGroups(
    featId,
    choiceGroups.map((group) => group.id),
    context,
    [],
  );
}

export function getFeatSelectionConstraintMessage(featId: string, context: FeatChoiceContext = {}) {
  if (isFeatSelectable(featId, context)) {
    return null;
  }

  if (featId === "skilled") {
    return "Needs at least three skills without proficiency.";
  }

  if (featId === "resilient") {
    return "Needs one saving throw your class does not already grant.";
  }

  if (featId === "skill-expert") {
    return "Needs at least one skill without proficiency.";
  }

  return "Current class or skill state cannot satisfy this feat's required choices.";
}

export function listFeatSelectionLabels(
  featId: string,
  featSelections: Record<string, string[]>,
  context: FeatChoiceContext = {},
) {
  return sanitizeFeatSelections(featId, featSelections[featId] ?? [], {
    ...context,
    featSelections,
  }).map((optionId) => getFeatChoiceLabel(featId, optionId));
}

export function listAvailableFeatChoiceOptions(
  featId: string,
  groupId: string,
  context: FeatChoiceContext = {},
) {
  const template = getFeatTemplate(featId);
  const choiceGroup = template?.choiceGroups?.find((group) => group.id === groupId);

  if (!choiceGroup) {
    return [];
  }

  if (featId === "skilled" && groupId === "skills") {
    return choiceGroup.options.filter(
      (option) => skillProficiencyLevel(option as SkillName, context.skillProficiencies) === "none",
    );
  }

  if (featId === "resilient" && groupId === "ability" && context.classId) {
    const saveProficiencies = new Set(getClassTemplate(context.classId).saveProficiencies);
    return choiceGroup.options.filter((option) => !saveProficiencies.has(option as AbilityName));
  }

  if (featId === "skill-expert" && groupId === "skill") {
    return choiceGroup.options.filter((option) => {
      const skill = option.split(":")[1] as SkillName;
      return skillProficiencyLevel(skill, context.skillProficiencies) === "none";
    });
  }

  if (featId === "skill-expert" && groupId === "expertise") {
    const selectedSkillOption = (context.featSelections?.[featId] ?? []).find((option) => option.startsWith("skill:"));
    const selectedSkill = selectedSkillOption?.split(":")[1] as SkillName | undefined;

    return choiceGroup.options.filter((option) => {
      const skill = option.split(":")[1] as SkillName;
      const level = skillProficiencyLevel(skill, context.skillProficiencies);

      if (level === "expertise") {
        return false;
      }

      return level === "proficient" || skill === selectedSkill;
    });
  }

  return choiceGroup.options;
}

export function sanitizeFeatSelections(featId: string, selections: string[], context: FeatChoiceContext = {}) {
  const template = getFeatTemplate(featId);
  const choiceGroups = template?.choiceGroups ?? [];

  if (choiceGroups.length === 0) {
    return [];
  }

  const normalizedSelections = normalizeChoiceSelections(selections);
  const nextSelections: string[] = [];

  for (const group of choiceGroups) {
    const allowedValues = new Set(
      listAvailableFeatChoiceOptions(featId, group.id, {
        ...context,
        featSelections: withCurrentFeatSelections(featId, context.featSelections, nextSelections),
      }),
    );
    const groupSelections = normalizedSelections.filter((value) => allowedValues.has(value)).slice(0, group.maxChoices);
    nextSelections.push(...groupSelections);
  }

  return nextSelections;
}

export function sanitizeAllFeatSelections(
  featIds: string[],
  featSelections: Record<string, string[]>,
  context: FeatChoiceContext = {},
) {
  return Object.fromEntries(
    featIds
      .map(
        (featId) =>
          [
            featId,
            sanitizeFeatSelections(featId, featSelections[featId] ?? [], {
              ...context,
              featSelections,
            }),
          ] as const,
      )
      .filter(([, selections]) => selections.length > 0),
  );
}

export function sanitizeFeatState(
  featIds: string[],
  featSelections: Record<string, string[]>,
  context: FeatChoiceContext = {},
) {
  const normalizedFeatIds = normalizeChoiceSelections(featIds);
  const nextFeatIds = normalizedFeatIds.filter((featId) =>
    isFeatSelectable(featId, {
      ...context,
      featSelections,
    }),
  );

  return {
    featIds: nextFeatIds,
    featSelections: sanitizeAllFeatSelections(nextFeatIds, featSelections, context),
  };
}

export function resolveFeatEffects(
  featId: string,
  featSelections: Record<string, string[]> = {},
  context: FeatChoiceContext = {},
): Effect[] {
  const template = getFeatTemplate(featId);

  if (!template) {
    return [];
  }

  const selectedOptions = sanitizeFeatSelections(featId, featSelections[featId] ?? [], {
    ...context,
    featSelections,
  });

  if (featId === "skilled") {
    return [
      ...template.effects,
      ...selectedOptions.map((skillId, index) => ({
        id: `${featId}-skill-${index}`,
        type: "grant_skill_proficiency" as const,
        target: skillId,
      })),
    ];
  }

  if (featId === "resilient") {
    const ability = selectedOptions[0];

    if (!ability) {
      return template.effects;
    }

    return [
      ...template.effects,
      {
        id: `${featId}-ability`,
        type: "ability_bonus" as const,
        target: ability,
        value: 1,
      },
      {
        id: `${featId}-save`,
        type: "grant_save_proficiency" as const,
        target: ability,
      },
    ];
  }

  if (featId === "athlete" || featId === "observant") {
    const ability = selectedOptions[0];

    if (!ability) {
      return template.effects;
    }

    return [
      ...template.effects,
      {
        id: `${featId}-ability`,
        type: "ability_bonus" as const,
        target: ability,
        value: 1,
      },
    ];
  }

  if (featId === "skill-expert") {
    const abilityChoice = selectedOptions.find((option) => option.startsWith("ability:"))?.split(":")[1];
    const skillChoice = selectedOptions.find((option) => option.startsWith("skill:"))?.split(":")[1];
    const expertiseChoice = selectedOptions.find((option) => option.startsWith("expertise:"))?.split(":")[1];

    return [
      ...template.effects,
      ...(abilityChoice
        ? [
            {
              id: `${featId}-ability`,
              type: "ability_bonus" as const,
              target: abilityChoice,
              value: 1,
            },
          ]
        : []),
      ...(skillChoice
        ? [
            {
              id: `${featId}-skill`,
              type: "grant_skill_proficiency" as const,
              target: skillChoice,
            },
          ]
        : []),
      ...(expertiseChoice
        ? [
            {
              id: `${featId}-expertise`,
              type: "grant_expertise" as const,
              target: expertiseChoice,
            },
          ]
        : []),
    ];
  }

  return template.effects;
}

export function getArmorTemplate(armorId: string | null) {
  return ARMORS.find((entry) => entry.id === (armorId ?? "unarmored")) ?? ARMORS[0];
}

export function getWeaponTemplate(weaponId: string) {
  return WEAPONS.find((entry) => entry.id === weaponId);
}

export function getGearTemplate(gearId: string) {
  return GEAR_ITEMS.find((entry) => entry.id === gearId);
}
