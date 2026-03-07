import type { CompendiumEntry, CompendiumType, SearchInput, SpellRecord } from "../types";
import { CORE_OPEN_SOURCE_ID, DEFAULT_ENABLED_SOURCE_IDS, isSourceEnabled } from "./contentSources";
import { FEATS, SUBCLASSES, getBackgroundTemplate, getClassTemplate, getFeatChoiceLabel, getFeatSupportLabel, getGearTemplate } from "./reference";

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

const SUBCLASS_DRAFTS: CompendiumDraft[] = SUBCLASSES.map((subclass) => {
  const classTemplate = getClassTemplate(subclass.classId);

  return {
    slug: subclass.id,
    type: "subclass",
    name: subclass.name,
    summary: subclass.summary,
    tags: ["subclass", classTemplate.name.toLowerCase(), ...subclass.featureSummary.map((feature) => feature.toLowerCase())],
    payload: {
      class: classTemplate.name,
      keyFeatures: subclass.featureSummary,
    },
  };
});

const FEAT_DRAFTS: CompendiumDraft[] = FEATS.map((feat) => ({
  slug: feat.id,
  type: "feat",
  name: feat.name,
  summary: feat.summary,
  tags: ["feat", getFeatSupportLabel(feat.supportLevel).toLowerCase(), ...feat.benefits.map((benefit) => benefit.toLowerCase())],
  payload: {
    prerequisites: "None",
    support: getFeatSupportLabel(feat.supportLevel),
    benefits: feat.benefits,
    automation: feat.automationStatus ?? "Reference only",
    choiceSummary:
      feat.choiceGroups && feat.choiceGroups.length > 0
        ? feat.choiceGroups
            .map(
              (group) =>
                `${group.label}: choose ${group.maxChoices === group.minChoices ? group.maxChoices : `up to ${group.maxChoices}`}`,
            )
            .join("; ")
        : undefined,
    choiceOptions: feat.choiceGroups?.flatMap((group) => group.options.map((option) => getFeatChoiceLabel(feat.id, option))),
  },
}));

function backgroundStartingGearLabels(backgroundId: string) {
  return getBackgroundTemplate(backgroundId).startingInventory.map((entry) => {
    const label = getGearTemplate(entry.templateId)?.name ?? entry.templateId;
    return entry.quantity && entry.quantity > 1 ? `${label} x${entry.quantity}` : label;
  });
}

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
  ...SUBCLASS_DRAFTS,
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
      theme: getBackgroundTemplate("acolyte").theme,
      suggestedSkills: ["Insight", "Religion"],
      featureSummary: getBackgroundTemplate("acolyte").featureSummary,
      startingGear: backgroundStartingGearLabels("acolyte"),
    },
  },
  {
    slug: "sage",
    type: "background",
    name: "Sage",
    summary: "A research-driven background suited to lorekeepers, scribes, and learned travelers.",
    tags: ["research", "lore", "study", "intelligence", "books"],
    payload: {
      theme: getBackgroundTemplate("sage").theme,
      suggestedSkills: ["Arcana", "History"],
      featureSummary: getBackgroundTemplate("sage").featureSummary,
      startingGear: backgroundStartingGearLabels("sage"),
    },
  },
  {
    slug: "soldier",
    type: "background",
    name: "Soldier",
    summary: "A martial upbringing centered on drills, chain of command, and battlefield discipline.",
    tags: ["battle", "military", "discipline", "strength", "war"],
    payload: {
      theme: getBackgroundTemplate("soldier").theme,
      suggestedSkills: ["Athletics", "Intimidation"],
      featureSummary: getBackgroundTemplate("soldier").featureSummary,
      startingGear: backgroundStartingGearLabels("soldier"),
    },
  },
  {
    slug: "fire-bolt",
    type: "spell",
    name: "Fire Bolt",
    summary: "A ranged attack cantrip that deals fire damage and scales with character level.",
    tags: ["cantrip", "evocation", "attack", "wizard", "sorcerer", "arcane", "fire"],
    payload: {
      level: 0,
      school: "Evocation",
      classes: ["Sorcerer", "Wizard"],
      castingTime: "Action",
      range: "120 feet",
      duration: "Instantaneous",
      attackType: "spellAttack",
      cantripDamage: "1d10 fire",
    },
  },
  {
    slug: "vicious-mockery",
    type: "spell",
    name: "Vicious Mockery",
    summary: "A cutting insult that deals psychic damage and hinders the target's next attack.",
    tags: ["cantrip", "enchantment", "bard", "psychic", "save"],
    payload: {
      level: 0,
      school: "Enchantment",
      classes: ["Bard"],
      castingTime: "Action",
      range: "60 feet",
      duration: "Instantaneous",
      attackType: "save",
      saveAbility: "Wisdom",
      cantripDamage: "1d6 psychic",
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
    slug: "druidcraft",
    type: "spell",
    name: "Druidcraft",
    summary: "A primal utility cantrip for small natural omens and minor sensory effects.",
    tags: ["cantrip", "transmutation", "druid", "primal", "utility"],
    payload: {
      level: 0,
      school: "Transmutation",
      classes: ["Druid"],
      castingTime: "Action",
      range: "30 feet",
      duration: "Instantaneous",
    },
  },
  {
    slug: "guidance",
    type: "spell",
    name: "Guidance",
    summary: "A support cantrip that boosts a future check with a small divine bonus.",
    tags: ["cantrip", "support", "cleric", "druid", "divine", "primal", "check bonus"],
    payload: {
      level: 0,
      school: "Divination",
      classes: ["Cleric", "Druid"],
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
    tags: ["cantrip", "utility", "bard", "warlock", "wizard", "arcane", "spectral hand"],
    payload: {
      level: 0,
      school: "Conjuration",
      classes: ["Bard", "Warlock", "Wizard"],
      castingTime: "Action",
      range: "30 feet",
      duration: "1 minute",
    },
  },
  {
    slug: "eldritch-blast",
    type: "spell",
    name: "Eldritch Blast",
    summary: "A force cantrip that fires a ranged beam and scales into multiple blasts with level.",
    tags: ["cantrip", "evocation", "warlock", "force", "spell attack"],
    payload: {
      level: 0,
      school: "Evocation",
      classes: ["Warlock"],
      castingTime: "Action",
      range: "120 feet",
      duration: "Instantaneous",
      attackType: "spellAttack",
      cantripDamage: "1d10 force",
    },
  },
  {
    slug: "light",
    type: "spell",
    name: "Light",
    summary: "A utility cantrip that causes an object to emit bright light for an extended period.",
    tags: ["cantrip", "utility", "bard", "cleric", "sorcerer", "wizard", "illumination"],
    payload: {
      level: 0,
      school: "Evocation",
      classes: ["Bard", "Cleric", "Sorcerer", "Wizard"],
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
    tags: ["level 1", "evocation", "sorcerer", "wizard", "force", "reliable damage"],
    payload: {
      level: 1,
      school: "Evocation",
      classes: ["Sorcerer", "Wizard"],
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
    tags: ["level 1", "abjuration", "sorcerer", "wizard", "armor class", "defense"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Sorcerer", "Wizard"],
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
    tags: ["level 1", "healing", "bard", "cleric", "druid", "paladin", "ranger", "support", "abjuration"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger"],
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
    tags: ["level 1", "healing", "bard", "cleric", "druid", "bonus action", "support"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Bard", "Cleric", "Druid"],
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
    tags: ["level 1", "buff", "cleric", "paladin", "concentration", "support"],
    payload: {
      level: 1,
      school: "Enchantment",
      classes: ["Cleric", "Paladin"],
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
    tags: ["level 1", "divination", "bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "warlock", "wizard", "ritual", "utility"],
    payload: {
      level: 1,
      school: "Divination",
      classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"],
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
    tags: ["level 1", "enchantment", "bard", "sorcerer", "wizard", "control", "incapacitate"],
    payload: {
      level: 1,
      school: "Enchantment",
      classes: ["Bard", "Sorcerer", "Wizard"],
      castingTime: "Action",
      range: "90 feet",
      duration: "1 minute",
    },
  },
  {
    slug: "hex",
    type: "spell",
    name: "Hex",
    summary: "A curse that adds extra damage to attacks and hampers one chosen ability.",
    tags: ["level 1", "enchantment", "warlock", "curse", "concentration"],
    payload: {
      level: 1,
      school: "Enchantment",
      classes: ["Warlock"],
      castingTime: "Bonus Action",
      range: "90 feet",
      duration: "Concentration, up to 1 hour",
      concentration: true,
    },
  },
  {
    slug: "hunters-mark",
    type: "spell",
    name: "Hunter's Mark",
    summary: "A tracking-focused mark that boosts weapon pressure against one chosen target.",
    tags: ["level 1", "divination", "ranger", "weapon damage", "concentration"],
    payload: {
      level: 1,
      school: "Divination",
      classes: ["Ranger"],
      castingTime: "Bonus Action",
      range: "90 feet",
      duration: "Concentration, up to 1 hour",
      concentration: true,
    },
  },
  {
    slug: "shield-of-faith",
    type: "spell",
    name: "Shield of Faith",
    summary: "A protective ward that boosts a creature's Armor Class while concentration holds.",
    tags: ["level 1", "abjuration", "cleric", "paladin", "armor class", "concentration"],
    payload: {
      level: 1,
      school: "Abjuration",
      classes: ["Cleric", "Paladin"],
      castingTime: "Bonus Action",
      range: "60 feet",
      duration: "Concentration, up to 10 minutes",
      concentration: true,
      effect: "+2 bonus to Armor Class",
    },
  },
  {
    slug: "misty-step",
    type: "spell",
    name: "Misty Step",
    summary: "A short-range teleport that provides rapid repositioning as a bonus action.",
    tags: ["level 2", "conjuration", "sorcerer", "warlock", "wizard", "mobility", "teleport"],
    payload: {
      level: 2,
      school: "Conjuration",
      classes: ["Sorcerer", "Warlock", "Wizard"],
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
    slug: "studded-leather",
    type: "armor",
    name: "Studded Leather Armor",
    summary: "A stronger light armor option that still fully rewards high Dexterity.",
    tags: ["light armor", "armor class", "dexterity"],
    payload: {
      category: "Light",
      baseArmorClass: 12,
      dexterityCap: null,
      notes: "12 + Dexterity modifier",
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
    slug: "breastplate",
    type: "armor",
    name: "Breastplate",
    summary: "A medium armor choice that balances protection with some Dexterity contribution.",
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
    slug: "plate",
    type: "armor",
    name: "Plate Armor",
    summary: "A premier heavy armor option with a strong fixed Armor Class.",
    tags: ["heavy armor", "armor class", "flat ac"],
    payload: {
      category: "Heavy",
      baseArmorClass: 18,
      dexterityCap: 0,
      ignoresDexterity: true,
      notes: "Flat AC 18",
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
    slug: "rapier",
    type: "weapon",
    name: "Rapier",
    summary: "A precise finesse weapon for Dexterity-focused melee attacks.",
    tags: ["martial weapon", "melee", "piercing", "finesse"],
    payload: {
      damage: "1d8",
      damageType: "piercing",
      properties: ["Finesse"],
      range: "Melee",
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
    slug: "light-crossbow",
    type: "weapon",
    name: "Light Crossbow",
    summary: "A ranged weapon with solid damage and slower reload cadence.",
    tags: ["simple weapon", "ranged", "piercing", "ammunition", "loading"],
    payload: {
      damage: "1d8",
      damageType: "piercing",
      properties: ["Ammunition", "Loading", "Two-Handed"],
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
    slug: "spear",
    type: "weapon",
    name: "Spear",
    summary: "A simple weapon that works in melee and as a thrown backup.",
    tags: ["simple weapon", "melee", "piercing", "thrown", "versatile"],
    payload: {
      damage: "1d6",
      damageType: "piercing",
      properties: ["Thrown", "Versatile (1d8)"],
      range: "20/60",
    },
  },
  {
    slug: "warhammer",
    type: "weapon",
    name: "Warhammer",
    summary: "A dependable martial bludgeoning weapon with versatile damage.",
    tags: ["martial weapon", "melee", "bludgeoning", "versatile"],
    payload: {
      damage: "1d8",
      damageType: "bludgeoning",
      properties: ["Versatile (1d10)"],
      range: "Melee",
    },
  },
  {
    slug: "greatsword",
    type: "weapon",
    name: "Greatsword",
    summary: "A heavy two-handed weapon built for strong melee damage.",
    tags: ["martial weapon", "melee", "slashing", "heavy", "two-handed"],
    payload: {
      damage: "2d6",
      damageType: "slashing",
      properties: ["Heavy", "Two-Handed"],
      range: "Melee",
    },
  },
  {
    slug: "explorers-pack",
    type: "gear",
    name: "Explorer's Pack",
    summary: "A travel-ready bundle of common adventuring supplies for overland or dungeon use.",
    tags: ["pack", "gear", "travel", "adventuring"],
    payload: {
      category: "Pack",
      contents: ["Bedroll", "Mess kit", "Tinderbox", "Torches", "Rations", "Waterskin", "Hempen Rope"],
      notes: "Starter travel supplies and utility basics.",
    },
  },
  {
    slug: "burglars-pack",
    type: "gear",
    name: "Burglar's Pack",
    summary: "A compact kit aimed at infiltration, careful scouting, and urban utility.",
    tags: ["pack", "gear", "stealth", "utility", "infiltration"],
    payload: {
      category: "Pack",
      contents: ["Ball bearings", "String", "Bell", "Candles", "Crowbar", "Hammer", "Piton"],
      notes: "Compact infiltration supplies with string, candles, and utility tools.",
    },
  },
  {
    slug: "dungeoneers-pack",
    type: "gear",
    name: "Dungeoneer's Pack",
    summary: "A subterranean exploration kit that leans into rope, light, and simple survival gear.",
    tags: ["pack", "gear", "dungeon", "rope", "torches", "rations"],
    payload: {
      category: "Pack",
      contents: ["Crowbar", "Hammer", "Piton", "Torches", "Tinderbox", "Rations", "Waterskin", "Hempen Rope"],
      notes: "Underground exploration basics with rope, torches, and rations.",
    },
  },
  {
    slug: "priests-pack",
    type: "gear",
    name: "Priest's Pack",
    summary: "A devotional travel pack built around ritual supplies and everyday camp basics.",
    tags: ["pack", "gear", "divine", "ritual", "travel"],
    payload: {
      category: "Pack",
      contents: ["Blanket", "Candles", "Tinderbox", "Alms box", "Incense", "Vestments", "Rations", "Waterskin"],
      notes: "Religious travel kit with blanket, candles, incense, and vestments.",
    },
  },
  {
    slug: "thieves-tools",
    type: "gear",
    name: "Thieves' Tools",
    summary: "A precision toolkit for manipulating locks, traps, and similar mechanisms.",
    tags: ["tool", "gear", "locks", "traps", "utility"],
    payload: {
      category: "Tool",
      use: "Lockpicking and trap work",
      notes: "A common precision toolkit for locks and traps.",
    },
  },
  {
    slug: "holy-symbol",
    type: "gear",
    name: "Holy Symbol",
    summary: "A divine emblem that can serve as a spellcasting focus for faith-based casters.",
    tags: ["focus", "divine", "cleric", "paladin", "gear"],
    payload: {
      category: "Focus",
      equipable: true,
      use: "Divine spellcasting focus",
      notes: "Divine spellcasting focus.",
    },
  },
  {
    slug: "arcane-focus",
    type: "gear",
    name: "Arcane Focus",
    summary: "A wand, staff, crystal, orb, or similar item used to channel arcane magic.",
    tags: ["focus", "arcane", "wizard", "sorcerer", "warlock", "gear"],
    payload: {
      category: "Focus",
      equipable: true,
      forms: ["Crystal", "Orb", "Rod", "Staff", "Wand"],
      notes: "Arcane focus such as a wand, orb, rod, staff, or crystal.",
    },
  },
  {
    slug: "component-pouch",
    type: "gear",
    name: "Component Pouch",
    summary: "A pouch of common spell components that stands in for many material needs.",
    tags: ["focus", "spellcasting", "arcane", "primal", "divine", "gear"],
    payload: {
      category: "Focus",
      equipable: true,
      use: "General spell component storage",
      notes: "Arcane or general spell components.",
    },
  },
  {
    slug: "spellbook",
    type: "gear",
    name: "Spellbook",
    summary: "A wizard's written collection of spells and primary reference for prepared casting.",
    tags: ["focus", "wizard", "spellcasting", "book", "gear"],
    payload: {
      category: "Focus",
      equipable: true,
      use: "Wizard spell reference",
      notes: "A wizard's primary spell reference.",
    },
  },
  {
    slug: "druidic-focus",
    type: "gear",
    name: "Druidic Focus",
    summary: "A primal focus such as mistletoe, a totem, or a carved wooden staff.",
    tags: ["focus", "druid", "primal", "gear"],
    payload: {
      category: "Focus",
      equipable: true,
      forms: ["Sprig of mistletoe", "Totem", "Wooden staff", "Yew wand"],
      notes: "Primal focus such as mistletoe, a totem, or a wooden staff.",
    },
  },
  {
    slug: "musical-instrument",
    type: "gear",
    name: "Musical Instrument",
    summary: "A performance instrument that can also anchor bardic spellcasting.",
    tags: ["focus", "bard", "performance", "gear"],
    payload: {
      category: "Focus",
      equipable: true,
      use: "Bardic performance and spellcasting focus",
      notes: "A performance instrument that can also serve as a bardic focus.",
    },
  },
  {
    slug: "healers-kit",
    type: "gear",
    name: "Healer's Kit",
    summary: "A field-treatment pouch with bandages and salves for emergency stabilization.",
    tags: ["tool", "gear", "healing", "stabilize"],
    payload: {
      category: "Tool",
      use: "Emergency field treatment",
      notes: "Bandages and salves used to stabilize a dying creature.",
    },
  },
  {
    slug: "herbalism-kit",
    type: "gear",
    name: "Herbalism Kit",
    summary: "A set of tools for gathering herbs and preparing natural remedies.",
    tags: ["tool", "gear", "herbs", "remedies"],
    payload: {
      category: "Tool",
      use: "Gathering herbs and preparing remedies",
      notes: "Tools for collecting herbs and preparing remedies.",
    },
  },
  {
    slug: "rope-hempen",
    type: "gear",
    name: "Hempen Rope",
    summary: "A standard 50-foot rope used for climbing, hauling, and general travel utility.",
    tags: ["gear", "rope", "climbing", "travel"],
    payload: {
      category: "Adventuring Gear",
      quantity: "50 feet",
      notes: "50 feet of rope for climbing and travel.",
    },
  },
  {
    slug: "torch",
    type: "gear",
    name: "Torch",
    summary: "A basic handheld flame source for lighting dark corridors and campsites.",
    tags: ["gear", "light", "exploration", "travel"],
    payload: {
      category: "Adventuring Gear",
      use: "Portable light source",
      notes: "A simple portable light source for dark environments.",
    },
  },
  {
    slug: "rations",
    type: "gear",
    name: "Rations",
    summary: "Compact preserved food carried to support travel away from settlements.",
    tags: ["gear", "food", "travel", "survival"],
    payload: {
      category: "Adventuring Gear",
      use: "Travel food",
      notes: "Trail food meant to support a day of travel.",
    },
  },
  {
    slug: "waterskin",
    type: "gear",
    name: "Waterskin",
    summary: "A simple container for carrying drinking water on the road or in the wilds.",
    tags: ["gear", "travel", "survival", "water"],
    payload: {
      category: "Adventuring Gear",
      use: "Portable water storage",
      notes: "Portable water storage for travel and camp.",
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
  ...FEAT_DRAFTS,
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

function readStringArray(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function spellMatchesClassName(entry: CompendiumEntry, className?: string) {
  if (!className) {
    return true;
  }

  return readStringArray(entry.payload, "classes").includes(className);
}

export const COMPENDIUM_IMPORT_VERSION = "2026-03-07-open-starter-v13";

export const COMPENDIUM_SEED: CompendiumEntry[] = COMPENDIUM_DRAFTS.map(toCompendiumEntry).sort(compareEntries);

const COMPENDIUM_BY_SLUG = new Map(COMPENDIUM_SEED.map((entry) => [entry.slug, entry] as const));

export function listCompendiumEntries(type?: CompendiumType, enabledSourceIds = DEFAULT_ENABLED_SOURCE_IDS) {
  const sourceFilteredEntries = COMPENDIUM_SEED.filter((entry) => isSourceEnabled(entry.sourceId, enabledSourceIds));
  return type ? sourceFilteredEntries.filter((entry) => entry.type === type) : sourceFilteredEntries;
}

export function listCompendiumSpells(
  enabledSourceIds = DEFAULT_ENABLED_SOURCE_IDS,
  className?: string,
) {
  return listCompendiumEntries("spell", enabledSourceIds).filter((entry) => spellMatchesClassName(entry, className));
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
    classes: readStringArray(entry.payload, "classes"),
    castingTime: readString(entry.payload, "castingTime"),
    range: readString(entry.payload, "range"),
    duration: readString(entry.payload, "duration"),
    concentration: Boolean(entry.payload.concentration),
    ritual: Boolean(entry.payload.ritual),
    attackType,
    cantripDamage: readString(entry.payload, "cantripDamage"),
  };
}
