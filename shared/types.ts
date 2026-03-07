export const ABILITY_NAMES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export const SKILL_NAMES = [
  "acrobatics",
  "animalHandling",
  "arcana",
  "athletics",
  "deception",
  "history",
  "insight",
  "intimidation",
  "investigation",
  "medicine",
  "nature",
  "perception",
  "performance",
  "persuasion",
  "religion",
  "sleightOfHand",
  "stealth",
  "survival",
] as const;

export type AbilityName = (typeof ABILITY_NAMES)[number];
export type SkillName = (typeof SKILL_NAMES)[number];
export type ProficiencyLevel = "none" | "proficient" | "expertise";
export type CasterType = "none" | "full" | "half" | "pact";
export type InventoryItemKind = "weapon" | "armor" | "gear";
export type ContentSourceId = string;
export type ContentSourceKind = "core" | "sourcebook" | "setting" | "campaign";
export type ContentSourceAvailability = "installed" | "planned";

export interface ContentSource {
  id: ContentSourceId;
  shortCode: string;
  name: string;
  ruleset: string;
  category: ContentSourceKind;
  availability: ContentSourceAvailability;
  licenseMode: "open" | "licensed" | "custom";
  summary: string;
}

export type EffectType =
  | "ability_bonus"
  | "ac_bonus"
  | "speed_bonus"
  | "hp_bonus"
  | "grant_save_proficiency"
  | "grant_skill_proficiency"
  | "grant_expertise"
  | "grant_spell"
  | "set_base_ac_formula"
  | "set_spellcasting_ability"
  | "resource_max_bonus";

export interface Effect {
  id: string;
  type: EffectType;
  target?: AbilityName | SkillName | string;
  value?: number;
  note?: string;
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface WeaponTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  damage: string;
  damageType: string;
  finesse?: boolean;
  ranged?: boolean;
  notes?: string;
}

export interface ArmorTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  baseArmorClass: number;
  dexterityCap: number | null;
  ignoresDexterity?: boolean;
  notes?: string;
}

export interface GearTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  category: "shield" | "gear" | "tool" | "focus";
  equipable?: boolean;
  armorClassBonus?: number;
  notes?: string;
}

export interface ClassTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  hitDie: number;
  saveProficiencies: AbilityName[];
  spellcastingAbility: AbilityName | null;
  casterType: CasterType;
  featureSummary: string[];
}

export interface SpeciesTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  speed: number;
  featureSummary: string[];
}

export interface BackgroundTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  featureSummary: string[];
}

export interface SpellRecord {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  level: number;
  school: string;
  summary: string;
  classes: string[];
  castingTime?: string;
  range?: string;
  duration?: string;
  concentration?: boolean;
  ritual?: boolean;
  attackType?: "spellAttack" | "save";
  cantripDamage?: string;
}

export interface NotesBlock {
  classFeatures: string;
  speciesTraits: string;
  feats: string;
}

export interface InventoryItemRecord {
  id: string;
  templateType: InventoryItemKind;
  templateId: string;
  quantity: number;
  equipped: boolean;
  notes?: string;
}

export interface CharacterRecord {
  id: string;
  name: string;
  enabledSourceIds: ContentSourceId[];
  classId: string;
  speciesId: string;
  backgroundId: string;
  level: number;
  abilities: AbilityScores;
  skillProficiencies: Partial<Record<SkillName, ProficiencyLevel>>;
  inventory?: InventoryItemRecord[];
  armorId: string | null;
  shieldEquipped: boolean;
  weaponIds: string[];
  spellIds: string[];
  preparedSpellIds: string[];
  homebrewIds: string[];
  notes: NotesBlock;
  currentHitPoints: number;
  tempHitPoints: number;
  hitDiceSpent: number;
  inspiration: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderInput {
  name: string;
  enabledSourceIds: ContentSourceId[];
  classId: string;
  speciesId: string;
  backgroundId: string;
  level: number;
  abilities: AbilityScores;
  skillProficiencies: Partial<Record<SkillName, ProficiencyLevel>>;
  inventory?: InventoryItemRecord[];
  armorId: string | null;
  shieldEquipped: boolean;
  weaponIds: string[];
  spellIds: string[];
  preparedSpellIds: string[];
  homebrewIds: string[];
  notes: NotesBlock;
  inspiration: boolean;
}

export type CompendiumType =
  | "class"
  | "species"
  | "background"
  | "spell"
  | "weapon"
  | "armor"
  | "rule"
  | "feat";

export interface CompendiumEntry {
  id?: number;
  slug: string;
  sourceId: ContentSourceId;
  type: CompendiumType;
  name: string;
  ruleset: string;
  source: string;
  license: string;
  attribution: string;
  summary: string;
  searchText: string;
  payload: Record<string, unknown>;
}

export interface HomebrewEntry {
  id: string;
  name: string;
  type: "feat" | "feature" | "item" | "spell" | "speciesTrait";
  summary: string;
  effects: Effect[];
  createdAt: string;
  updatedAt: string;
}

export interface DerivedWeaponEntry {
  id: string;
  name: string;
  attackBonus: number;
  damage: string;
  notes?: string;
}

export interface DerivedInventoryEntry {
  id: string;
  kind: InventoryItemKind;
  name: string;
  quantity: number;
  equipped: boolean;
  notes?: string;
  referenceSlug?: string;
}

export interface DerivedSpellSummary {
  slotMode: "none" | "standard" | "pact";
  spellAttackBonus: number | null;
  spellSaveDC: number | null;
  spellSlotsMax: number[];
  pactSlotsMax: number;
  pactSlotLevel: number | null;
  knownSpells: SpellRecord[];
  preparedSpells: SpellRecord[];
}

export interface DerivedSheetState {
  proficiencyBonus: number;
  abilityModifiers: Record<AbilityName, number>;
  savingThrows: Record<AbilityName, number>;
  skills: Record<SkillName, number>;
  armorClass: number;
  initiative: number;
  speed: number;
  hitPointsMax: number;
  hitDiceMax: number;
  equippedArmorId: string | null;
  shieldEquipped: boolean;
  spellcasting: DerivedSpellSummary;
  weaponEntries: DerivedWeaponEntry[];
  inventoryEntries: DerivedInventoryEntry[];
  classFeatures: string[];
  speciesTraits: string[];
  feats: string[];
  activeEffects: string[];
}

export interface CharacterSummary {
  id: string;
  name: string;
  classId: string;
  speciesId: string;
  level: number;
  updatedAt: string;
}

export interface JsonExportV1 {
  version: 1;
  exportedAt: string;
  character: CharacterRecord;
}

export interface AppInfo {
  appVersion: string;
  databasePath: string;
}

export interface SearchInput {
  query: string;
  type?: CompendiumType;
  sourceIds?: ContentSourceId[];
}

export interface DndApi {
  app: {
    getInfo: () => Promise<AppInfo>;
  };
  characters: {
    list: () => Promise<CharacterSummary[]>;
    get: (id: string) => Promise<CharacterRecord | null>;
    save: (record: CharacterRecord) => Promise<CharacterRecord>;
    create: (input: BuilderInput) => Promise<CharacterRecord>;
    delete: (id: string) => Promise<void>;
    exportJson: (id: string) => Promise<string | null>;
    exportPdf: (id: string) => Promise<string | null>;
  };
  builder: {
    createFromWizard: (input: BuilderInput) => Promise<CharacterRecord>;
  };
  compendium: {
    search: (input: SearchInput) => Promise<CompendiumEntry[]>;
    get: (slug: string) => Promise<CompendiumEntry | null>;
  };
  homebrew: {
    list: () => Promise<HomebrewEntry[]>;
    save: (entry: HomebrewEntry) => Promise<HomebrewEntry>;
    delete: (id: string) => Promise<void>;
  };
}
