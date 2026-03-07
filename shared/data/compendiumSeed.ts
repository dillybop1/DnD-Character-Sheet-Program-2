import type { CompendiumEntry, CompendiumType, SearchInput, SpellRecord } from "../types";
import { CORE_OPEN_SOURCE_ID, DEFAULT_ENABLED_SOURCE_IDS, isSourceEnabled } from "./contentSources";

interface CompendiumDraft {
  slug: string;
  type: CompendiumType;
  name: string;
  summary: string;
  tags: string[];
  payload: Record<string, unknown>;
}

const OPEN_CONTENT_META = {
  ruleset: "2024",
  source: "SRD / Free Rules",
  license: "CC-BY-4.0 / Open Content",
  attribution: "Wizards of the Coast open rules content",
} as const;

const COMPENDIUM_DRAFTS: CompendiumDraft[] = [
  {
    slug: "fighter",
    type: "class",
    name: "Fighter",
    summary: "A martial class built around reliable weapons, armor, and front-line durability.",
    tags: ["martial", "weapons", "armor", "second wind", "fighting style", "weapon mastery"],
    payload: {
      hitDie: 10,
      role: "Martial defender / striker",
      primaryAbilities: ["Strength", "Dexterity", "Constitution"],
      saveProficiencies: ["Strength", "Constitution"],
      spellcastingAbility: null,
      casterType: "none",
      keyFeatures: ["Second Wind", "Fighting Style", "Weapon Mastery"],
    },
  },
  {
    slug: "bard",
    type: "class",
    name: "Bard",
    summary: "A Charisma-based full caster blending support magic, skill mastery, and adaptable utility.",
    tags: ["arcane", "full caster", "charisma", "bardic inspiration", "expertise"],
    payload: {
      hitDie: 8,
      role: "Support / skill expert",
      primaryAbilities: ["Charisma", "Dexterity", "Constitution"],
      saveProficiencies: ["Dexterity", "Charisma"],
      spellcastingAbility: "Charisma",
      casterType: "full",
      keyFeatures: ["Bardic Inspiration", "Spellcasting", "Expertise"],
    },
  },
  {
    slug: "wizard",
    type: "class",
    name: "Wizard",
    summary: "An Intelligence-based full caster with broad spell access and strong utility.",
    tags: ["arcane", "full caster", "spellbook", "ritual casting", "intelligence"],
    payload: {
      hitDie: 6,
      role: "Arcane control / utility caster",
      primaryAbilities: ["Intelligence", "Constitution", "Dexterity"],
      saveProficiencies: ["Intelligence", "Wisdom"],
      spellcastingAbility: "Intelligence",
      casterType: "full",
      keyFeatures: ["Spellcasting", "Arcane Recovery", "Ritual Casting"],
    },
  },
  {
    slug: "cleric",
    type: "class",
    name: "Cleric",
    summary: "A Wisdom-based divine caster that combines support magic, resilience, and strong utility.",
    tags: ["divine", "full caster", "healing", "wisdom", "channel divinity"],
    payload: {
      hitDie: 8,
      role: "Support / durable caster",
      primaryAbilities: ["Wisdom", "Constitution", "Strength"],
      saveProficiencies: ["Wisdom", "Charisma"],
      spellcastingAbility: "Wisdom",
      casterType: "full",
      keyFeatures: ["Spellcasting", "Divine Order", "Channel Divinity"],
    },
  },
  {
    slug: "druid",
    type: "class",
    name: "Druid",
    summary: "A Wisdom-based full caster centered on primal magic, shapeshifting, and battlefield flexibility.",
    tags: ["primal", "full caster", "wisdom", "wild shape", "nature"],
    payload: {
      hitDie: 8,
      role: "Primal control / utility caster",
      primaryAbilities: ["Wisdom", "Constitution", "Dexterity"],
      saveProficiencies: ["Intelligence", "Wisdom"],
      spellcastingAbility: "Wisdom",
      casterType: "full",
      keyFeatures: ["Primal Order", "Spellcasting", "Wild Shape"],
    },
  },
  {
    slug: "paladin",
    type: "class",
    name: "Paladin",
    summary: "A durable half caster mixing weapons, armor, healing, and Charisma-driven divine magic.",
    tags: ["divine", "half caster", "charisma", "lay on hands", "weapon mastery"],
    payload: {
      hitDie: 10,
      role: "Divine defender / support",
      primaryAbilities: ["Strength", "Charisma", "Constitution"],
      saveProficiencies: ["Wisdom", "Charisma"],
      spellcastingAbility: "Charisma",
      casterType: "half",
      keyFeatures: ["Lay on Hands", "Spellcasting", "Weapon Mastery"],
    },
  },
  {
    slug: "ranger",
    type: "class",
    name: "Ranger",
    summary: "A mobile half caster combining martial pressure, exploration tools, and Wisdom-based magic.",
    tags: ["primal", "half caster", "wisdom", "favored enemy", "weapon mastery"],
    payload: {
      hitDie: 10,
      role: "Skirmisher / explorer",
      primaryAbilities: ["Dexterity", "Wisdom", "Constitution"],
      saveProficiencies: ["Strength", "Dexterity"],
      spellcastingAbility: "Wisdom",
      casterType: "half",
      keyFeatures: ["Favored Enemy", "Spellcasting", "Weapon Mastery"],
    },
  },
  {
    slug: "rogue",
    type: "class",
    name: "Rogue",
    summary: "A precision-focused expert who relies on mobility, skills, and opportunistic damage.",
    tags: ["expert", "stealth", "sneak attack", "dexterity", "cunning action"],
    payload: {
      hitDie: 8,
      role: "Skill expert / skirmisher",
      primaryAbilities: ["Dexterity", "Constitution", "Charisma"],
      saveProficiencies: ["Dexterity", "Intelligence"],
      spellcastingAbility: null,
      casterType: "none",
      keyFeatures: ["Sneak Attack", "Expertise", "Cunning Action"],
    },
  },
  {
    slug: "sorcerer",
    type: "class",
    name: "Sorcerer",
    summary: "A Charisma-based full caster that leans into raw magical output and flexible spell shaping.",
    tags: ["arcane", "full caster", "charisma", "innate sorcery", "sorcery points"],
    payload: {
      hitDie: 6,
      role: "Arcane striker / flexible caster",
      primaryAbilities: ["Charisma", "Constitution", "Dexterity"],
      saveProficiencies: ["Constitution", "Charisma"],
      spellcastingAbility: "Charisma",
      casterType: "full",
      keyFeatures: ["Innate Sorcery", "Spellcasting", "Sorcery Points"],
    },
  },
  {
    slug: "warlock",
    type: "class",
    name: "Warlock",
    summary: "A Charisma-based pact caster with short-rest spell slots, invocations, and reliable ranged pressure.",
    tags: ["arcane", "pact magic", "charisma", "eldritch invocations", "short rest"],
    payload: {
      hitDie: 8,
      role: "Ranged striker / pact caster",
      primaryAbilities: ["Charisma", "Constitution", "Dexterity"],
      saveProficiencies: ["Wisdom", "Charisma"],
      spellcastingAbility: "Charisma",
      casterType: "pact",
      keyFeatures: ["Pact Magic", "Eldritch Invocations", "Magical Cunning"],
    },
  },
  {
    slug: "human",
    type: "species",
    name: "Human",
    summary: "Adaptable adventurers with flexible talents and broad utility.",
    tags: ["adaptable", "resourceful", "skilled", "versatile", "30 speed"],
    payload: {
      speed: 30,
      size: "Medium",
      traits: ["Resourceful", "Skilled", "Versatile"],
    },
  },
  {
    slug: "elf",
    type: "species",
    name: "Elf",
    summary: "Graceful wanderers known for sharp senses, fey resilience, and agility.",
    tags: ["darkvision", "keen senses", "fey ancestry", "30 speed"],
    payload: {
      speed: 30,
      size: "Medium",
      traits: ["Darkvision", "Fey Ancestry", "Keen Senses"],
    },
  },
  {
    slug: "dwarf",
    type: "species",
    name: "Dwarf",
    summary: "Stout adventurers with durability, darkvision, and deep traditional knowledge.",
    tags: ["darkvision", "dwarven toughness", "stonecunning", "30 speed"],
    payload: {
      speed: 30,
      size: "Medium",
      traits: ["Darkvision", "Dwarven Toughness", "Stonecunning"],
    },
  },
  {
    slug: "acolyte",
    type: "background",
    name: "Acolyte",
    summary: "A religious or scholarly origin shaped by service, ritual, and temple life.",
    tags: ["temple", "religion", "service", "wisdom", "study"],
    payload: {
      theme: "Religious scholar",
      suggestedSkills: ["Insight", "Religion"],
      featureSummary: ["Temple Service", "Two skill proficiencies", "Starting gear"],
    },
  },
  {
    slug: "sage",
    type: "background",
    name: "Sage",
    summary: "A research-driven background suited to lorekeepers, scribes, and learned travelers.",
    tags: ["research", "lore", "study", "intelligence", "books"],
    payload: {
      theme: "Lore scholar",
      suggestedSkills: ["Arcana", "History"],
      featureSummary: ["Research focus", "Two skill proficiencies", "Starting gear"],
    },
  },
  {
    slug: "soldier",
    type: "background",
    name: "Soldier",
    summary: "A martial upbringing centered on drills, chain of command, and battlefield discipline.",
    tags: ["battle", "military", "discipline", "strength", "war"],
    payload: {
      theme: "Battle-tested veteran",
      suggestedSkills: ["Athletics", "Intimidation"],
      featureSummary: ["Battle training", "Two skill proficiencies", "Starting gear"],
    },
  },
  {
    slug: "fire-bolt",
    type: "spell",
    name: "Fire Bolt",
    summary: "A ranged attack cantrip that deals fire damage and scales with character level.",
    tags: ["cantrip", "evocation", "attack", "wizard", "arcane", "fire"],
    payload: {
      level: 0,
      school: "Evocation",
      classes: ["Wizard"],
      castingTime: "Action",
      range: "120 feet",
      duration: "Instantaneous",
      attackType: "spellAttack",
      cantripDamage: "1d10 fire",
    },
  },
  {
    slug: "sacred-flame",
    type: "spell",
    name: "Sacred Flame",
    summary: "A radiant cantrip that forces a saving throw instead of a spell attack roll.",
    tags: ["cantrip", "radiant", "save", "cleric", "divine"],
    payload: {
      level: 0,
      school: "Evocation",
      classes: ["Cleric"],
      castingTime: "Action",
      range: "60 feet",
      duration: "Instantaneous",
      attackType: "save",
      saveAbility: "Dexterity",
      cantripDamage: "1d8 radiant",
    },
  },
  {
    slug: "guidance",
    type: "spell",
    name: "Guidance",
    summary: "A support cantrip that boosts a future check with a small divine bonus.",
    tags: ["cantrip", "support", "cleric", "divine", "check bonus"],
    payload: {
      level: 0,
      school: "Divination",
      classes: ["Cleric"],
      castingTime: "Action",
      range: "Touch",
      duration: "Concentration, up to 1 minute",
      concentration: true,
    },
  },
  {
    slug: "mage-hand",
    type: "spell",
    name: "Mage Hand",
    summary: "A utility cantrip that creates a spectral hand for simple remote manipulation.",
    tags: ["cantrip", "utility", "wizard", "arcane", "spectral hand"],
    payload: {
      level: 0,
      school: "Conjuration",
      classes: ["Wizard"],
      castingTime: "Action",
      range: "30 feet",
      duration: "1 minute",
    },
  },
  {
    slug: "light",
    type: "spell",
    name: "Light",
    summary: "A utility cantrip that causes an object to emit bright light for an extended period.",
    tags: ["cantrip", "utility", "cleric", "wizard", "illumination"],
    payload: {
      level: 0,
      school: "Evocation",
      classes: ["Cleric", "Wizard"],
      castingTime: "Action",
      range: "Touch",
      duration: "1 hour",
    },
  },
  {
    slug: "magic-missile",
    type: "spell",
    name: "Magic Missile",
    summary: "A dependable arcane spell that creates force darts which do not rely on an attack roll.",
    tags: ["level 1", "evocation", "wizard", "force", "reliable damage"],
    payload: {
      level: 1,
      school: "Evocation",
      classes: ["Wizard"],
      castingTime: "Action",
      range: "120 feet",
      duration: "Instantaneous",
      damage: "3 darts of force",
    },
  },
  {
    slug: "mage-armor",
    type: "spell",
    name: "Mage Armor",
    summary: "A defensive spell that sets a stronger baseline AC for an unarmored target.",
    tags: ["level 1", "abjuration", "wizard", "armor class", "defense"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Wizard"],
      castingTime: "Action",
      range: "Touch",
      duration: "8 hours",
      effect: "Base AC becomes 13 + Dexterity modifier while unarmored",
    },
  },
  {
    slug: "cure-wounds",
    type: "spell",
    name: "Cure Wounds",
    summary: "A staple restorative spell that heals a creature through divine or primal magic.",
    tags: ["level 1", "healing", "cleric", "support", "abjuration"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Cleric"],
      castingTime: "Action",
      range: "Touch",
      duration: "Instantaneous",
      healing: "1d8 + spellcasting modifier",
    },
  },
  {
    slug: "healing-word",
    type: "spell",
    name: "Healing Word",
    summary: "A fast healing spell that restores a smaller amount of hit points at range.",
    tags: ["level 1", "healing", "cleric", "bonus action", "support"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Cleric"],
      castingTime: "Bonus Action",
      range: "60 feet",
      duration: "Instantaneous",
      healing: "1d4 + spellcasting modifier",
    },
  },
  {
    slug: "guiding-bolt",
    type: "spell",
    name: "Guiding Bolt",
    summary: "A ranged radiant spell attack that also helps the next allied attack land.",
    tags: ["level 1", "radiant", "cleric", "spell attack", "support damage"],
    payload: {
      level: 1,
      school: "Evocation",
      classes: ["Cleric"],
      castingTime: "Action",
      range: "120 feet",
      duration: "1 round rider",
      attackType: "spellAttack",
      damage: "4d6 radiant",
    },
  },
  {
    slug: "bless",
    type: "spell",
    name: "Bless",
    summary: "A concentration spell that increases allies' attack rolls and saving throws.",
    tags: ["level 1", "buff", "cleric", "concentration", "support"],
    payload: {
      level: 1,
      school: "Enchantment",
      classes: ["Cleric"],
      castingTime: "Action",
      range: "30 feet",
      duration: "Concentration, up to 1 minute",
      concentration: true,
    },
  },
  {
    slug: "detect-magic",
    type: "spell",
    name: "Detect Magic",
    summary: "A ritual-friendly utility spell for sensing the presence of magic nearby.",
    tags: ["level 1", "divination", "cleric", "wizard", "ritual", "utility"],
    payload: {
      level: 1,
      school: "Divination",
      classes: ["Cleric", "Wizard"],
      castingTime: "Action",
      range: "Self",
      duration: "Concentration, up to 10 minutes",
      concentration: true,
      ritual: true,
    },
  },
  {
    slug: "sleep",
    type: "spell",
    name: "Sleep",
    summary: "An arcane control spell that can knock weaker creatures unconscious.",
    tags: ["level 1", "enchantment", "wizard", "control", "incapacitate"],
    payload: {
      level: 1,
      school: "Enchantment",
      classes: ["Wizard"],
      castingTime: "Action",
      range: "90 feet",
      duration: "1 minute",
    },
  },
  {
    slug: "misty-step",
    type: "spell",
    name: "Misty Step",
    summary: "A short-range teleport that provides rapid repositioning as a bonus action.",
    tags: ["level 2", "conjuration", "wizard", "mobility", "teleport"],
    payload: {
      level: 2,
      school: "Conjuration",
      classes: ["Wizard"],
      castingTime: "Bonus Action",
      range: "Self",
      duration: "Instantaneous",
    },
  },
  {
    slug: "unarmored",
    type: "armor",
    name: "Unarmored",
    summary: "Standard defense when no armor is worn.",
    tags: ["armor", "base armor class", "10 plus dexterity"],
    payload: {
      category: "None",
      baseArmorClass: 10,
      dexterityCap: null,
      notes: "10 + Dexterity modifier",
    },
  },
  {
    slug: "leather",
    type: "armor",
    name: "Leather Armor",
    summary: "Light armor that fully adds Dexterity to Armor Class.",
    tags: ["light armor", "armor class", "dexterity"],
    payload: {
      category: "Light",
      baseArmorClass: 11,
      dexterityCap: null,
      notes: "11 + Dexterity modifier",
    },
  },
  {
    slug: "scale-mail",
    type: "armor",
    name: "Scale Mail",
    summary: "Medium armor that keeps some Dexterity contribution while favoring protection.",
    tags: ["medium armor", "armor class", "dexterity cap"],
    payload: {
      category: "Medium",
      baseArmorClass: 14,
      dexterityCap: 2,
      notes: "14 + Dexterity modifier (max 2)",
    },
  },
  {
    slug: "chain-mail",
    type: "armor",
    name: "Chain Mail",
    summary: "Heavy armor that provides a flat baseline Armor Class.",
    tags: ["heavy armor", "armor class", "flat ac"],
    payload: {
      category: "Heavy",
      baseArmorClass: 16,
      dexterityCap: 0,
      ignoresDexterity: true,
      notes: "Flat AC 16",
    },
  },
  {
    slug: "shield",
    type: "armor",
    name: "Shield",
    summary: "A hand-held defensive item that adds a direct bonus to Armor Class.",
    tags: ["shield", "armor class bonus", "defense"],
    payload: {
      category: "Shield",
      armorClassBonus: 2,
      notes: "+2 AC while equipped",
    },
  },
  {
    slug: "longsword",
    type: "weapon",
    name: "Longsword",
    summary: "A dependable martial melee weapon with versatile damage.",
    tags: ["martial weapon", "melee", "slashing", "versatile"],
    payload: {
      damage: "1d8",
      damageType: "slashing",
      properties: ["Versatile (1d10)"],
      range: "Melee",
    },
  },
  {
    slug: "dagger",
    type: "weapon",
    name: "Dagger",
    summary: "A light finesse weapon that also works well as a thrown backup option.",
    tags: ["simple weapon", "finesse", "light", "thrown", "piercing"],
    payload: {
      damage: "1d4",
      damageType: "piercing",
      properties: ["Finesse", "Light", "Thrown"],
      range: "20/60",
    },
  },
  {
    slug: "shortbow",
    type: "weapon",
    name: "Shortbow",
    summary: "A straightforward ranged weapon for Dexterity-based attacks.",
    tags: ["simple weapon", "ranged", "piercing", "ammunition"],
    payload: {
      damage: "1d6",
      damageType: "piercing",
      properties: ["Ammunition", "Two-Handed"],
      range: "80/320",
    },
  },
  {
    slug: "quarterstaff",
    type: "weapon",
    name: "Quarterstaff",
    summary: "A classic simple weapon with versatile bludgeoning damage.",
    tags: ["simple weapon", "melee", "bludgeoning", "versatile"],
    payload: {
      damage: "1d6",
      damageType: "bludgeoning",
      properties: ["Versatile (1d8)"],
      range: "Melee",
    },
  },
  {
    slug: "mace",
    type: "weapon",
    name: "Mace",
    summary: "A simple melee weapon with reliable bludgeoning damage.",
    tags: ["simple weapon", "melee", "bludgeoning"],
    payload: {
      damage: "1d6",
      damageType: "bludgeoning",
      properties: [],
      range: "Melee",
    },
  },
  {
    slug: "armor-class",
    type: "rule",
    name: "Armor Class",
    summary: "Armor Class measures how difficult a creature is to hit with attacks.",
    tags: ["combat", "defense", "armor", "shield", "dexterity"],
    payload: {
      category: "Combat",
      relatedEntries: ["chain-mail", "shield", "mage-armor"],
    },
  },
  {
    slug: "proficiency-bonus",
    type: "rule",
    name: "Proficiency Bonus",
    summary: "A level-based bonus applied to trained attacks, checks, spell attacks, and saves.",
    tags: ["core", "level scaling", "skills", "saving throws", "attacks"],
    payload: {
      category: "Core Math",
      relatedEntries: ["saving-throws", "skills", "spell-attack-bonus"],
    },
  },
  {
    slug: "initiative",
    type: "rule",
    name: "Initiative",
    summary: "Initiative usually starts with Dexterity and determines turn order in combat.",
    tags: ["combat", "dexterity", "turn order"],
    payload: {
      category: "Combat",
      relatedEntries: ["armor-class", "weapon-attacks"],
    },
  },
  {
    slug: "saving-throws",
    type: "rule",
    name: "Saving Throws",
    summary: "Saving throws resist harmful effects and can add proficiency when a class grants training.",
    tags: ["core", "defense", "abilities", "proficiency"],
    payload: {
      category: "Core Math",
      relatedEntries: ["proficiency-bonus", "skills"],
    },
  },
  {
    slug: "skills",
    type: "rule",
    name: "Skills",
    summary: "Skills combine an ability modifier with proficiency or expertise when trained.",
    tags: ["checks", "proficiency", "expertise", "abilities"],
    payload: {
      category: "Core Math",
      relatedEntries: ["proficiency-bonus", "saving-throws"],
    },
  },
  {
    slug: "spell-attack-bonus",
    type: "rule",
    name: "Spell Attack Bonus",
    summary: "Spell attack bonus combines proficiency with the class's spellcasting ability modifier.",
    tags: ["spellcasting", "combat", "proficiency", "caster math"],
    payload: {
      category: "Spellcasting",
      relatedEntries: ["spell-save-dc", "proficiency-bonus"],
    },
  },
  {
    slug: "spell-save-dc",
    type: "rule",
    name: "Spell Save DC",
    summary: "Spell save DC sets the target number for creatures resisting a caster's spells.",
    tags: ["spellcasting", "save", "dc", "caster math"],
    payload: {
      category: "Spellcasting",
      relatedEntries: ["spell-attack-bonus", "saving-throws"],
    },
  },
  {
    slug: "hit-dice",
    type: "rule",
    name: "Hit Dice",
    summary: "Hit Dice are tied to class level and fuel healing during short-rest recovery.",
    tags: ["rest", "healing", "class", "durability"],
    payload: {
      category: "Survivability",
      relatedEntries: ["rests"],
    },
  },
  {
    slug: "rests",
    type: "rule",
    name: "Rests",
    summary: "Rest rules manage recovery for hit points, hit dice, spell slots, and limited-use features.",
    tags: ["recovery", "short rest", "long rest", "resources"],
    payload: {
      category: "Survivability",
      relatedEntries: ["hit-dice", "spell-save-dc"],
    },
  },
  {
    slug: "weapon-attacks",
    type: "rule",
    name: "Weapon Attacks",
    summary: "Weapon attacks combine the relevant ability modifier with proficiency when trained.",
    tags: ["combat", "strength", "dexterity", "proficiency", "damage"],
    payload: {
      category: "Combat",
      relatedEntries: ["proficiency-bonus", "armor-class", "initiative"],
    },
  },
  {
    slug: "alert",
    type: "feat",
    name: "Alert",
    summary: "A feat for characters who want sharper reactions and a stronger initiative floor.",
    tags: ["feat", "initiative", "awareness", "combat"],
    payload: {
      prerequisites: "None",
      benefits: ["Improved initiative", "Harder to surprise in play-focused builds"],
    },
  },
  {
    slug: "tough",
    type: "feat",
    name: "Tough",
    summary: "A feat focused on additional durability and staying power.",
    tags: ["feat", "hit points", "survivability", "durable"],
    payload: {
      prerequisites: "None",
      benefits: ["Additional maximum hit points", "Reliable survivability boost"],
    },
  },
  {
    slug: "magic-initiate",
    type: "feat",
    name: "Magic Initiate",
    summary: "A feat that grants basic spellcasting access outside a character's normal class path.",
    tags: ["feat", "spellcasting", "cantrips", "utility"],
    payload: {
      prerequisites: "None",
      benefits: ["Learn cantrips", "Gain a low-level spell option"],
    },
  },
];

function flattenPayloadValue(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenPayloadValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => flattenPayloadValue(entry));
  }

  return [];
}

function buildSearchText(draft: CompendiumDraft) {
  return [
    draft.name,
    draft.type,
    draft.summary,
    ...draft.tags,
    ...flattenPayloadValue(draft.payload),
  ]
    .join(" ")
    .toLowerCase();
}

function toCompendiumEntry(draft: CompendiumDraft): CompendiumEntry {
  return {
    ...OPEN_CONTENT_META,
    slug: draft.slug,
    sourceId: CORE_OPEN_SOURCE_ID,
    type: draft.type,
    name: draft.name,
    summary: draft.summary,
    searchText: buildSearchText(draft),
    payload: draft.payload,
  };
}

function compareEntries(left: CompendiumEntry, right: CompendiumEntry) {
  return left.name.localeCompare(right.name);
}

function readString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" ? value : undefined;
}

export const COMPENDIUM_IMPORT_VERSION = "2026-03-06-open-starter-v3";

export const COMPENDIUM_SEED: CompendiumEntry[] = COMPENDIUM_DRAFTS.map(toCompendiumEntry).sort(compareEntries);

const COMPENDIUM_BY_SLUG = new Map(COMPENDIUM_SEED.map((entry) => [entry.slug, entry] as const));

export function listCompendiumEntries(type?: CompendiumType, enabledSourceIds = DEFAULT_ENABLED_SOURCE_IDS) {
  const sourceFilteredEntries = COMPENDIUM_SEED.filter((entry) => isSourceEnabled(entry.sourceId, enabledSourceIds));
  return type ? sourceFilteredEntries.filter((entry) => entry.type === type) : sourceFilteredEntries;
}

export function listCompendiumSpells(enabledSourceIds = DEFAULT_ENABLED_SOURCE_IDS) {
  return listCompendiumEntries("spell", enabledSourceIds);
}

export function findCompendiumEntry(slug: string) {
  return COMPENDIUM_BY_SLUG.get(slug) ?? null;
}

export function searchCompendiumSeed(input: SearchInput) {
  const filteredEntries = listCompendiumEntries(input.type, input.sourceIds ?? DEFAULT_ENABLED_SOURCE_IDS);
  const terms = input.query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return filteredEntries.slice(0, 50);
  }

  return filteredEntries
    .filter((entry) => {
      const haystack = `${entry.name} ${entry.summary} ${entry.searchText}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, 50);
}

export function spellRecordFromCompendium(slug: string): SpellRecord | null {
  const entry = findCompendiumEntry(slug);

  if (!entry || entry.type !== "spell") {
    return null;
  }

  const attackTypeValue = entry.payload.attackType;
  const attackType = attackTypeValue === "spellAttack" || attackTypeValue === "save" ? attackTypeValue : undefined;

  return {
    id: entry.slug,
    sourceId: entry.sourceId,
    name: entry.name,
    level: readNumber(entry.payload, "level") ?? 0,
    school: readString(entry.payload, "school") ?? "Unknown",
    summary: entry.summary,
    attackType,
    cantripDamage: readString(entry.payload, "cantripDamage"),
  };
}
