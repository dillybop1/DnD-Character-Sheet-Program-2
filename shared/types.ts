export const ABILITY_NAMES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

export const CREATURE_SIZES = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
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

export const PASSIVE_SKILL_NAMES = ["insight", "investigation", "perception"] as const;

export type AbilityName = (typeof ABILITY_NAMES)[number];
export type SkillName = (typeof SKILL_NAMES)[number];
export type PassiveSkillName = (typeof PASSIVE_SKILL_NAMES)[number];
export type CreatureSize = (typeof CREATURE_SIZES)[number];
export type ProficiencyLevel = "none" | "proficient" | "expertise";
export type CasterType = "none" | "full" | "half" | "pact";
export type InventoryItemKind = "weapon" | "armor" | "gear";
export type FeatChoiceKind = "skill" | "ability" | "expertise";
export type FeatSupportLevel = "derived" | "partial" | "reference";
export type SpellAttackType = "spellAttack" | "save";
export type TrackedResourceDisplay = "checkboxes" | "counter";
export type TrackedResourceRecovery = "manual" | "shortRest" | "longRest";
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
  | "hp_bonus_per_level"
  | "initiative_bonus"
  | "grant_save_proficiency"
  | "grant_skill_proficiency"
  | "grant_expertise"
  | "passive_skill_bonus"
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

export interface DeathSaveTrack {
  successes: number;
  failures: number;
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

export interface SubclassTemplate {
  id: string;
  classId: string;
  sourceId: ContentSourceId;
  name: string;
  summary: string;
  featureSummary: string[];
}

export interface SpeciesTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  size: CreatureSize;
  speed: number;
  featureSummary: string[];
}

export interface BackgroundStartingInventoryEntry {
  templateType: InventoryItemKind;
  templateId: string;
  quantity?: number;
  equipped?: boolean;
}

export interface BackgroundTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  theme: string;
  featureSummary: string[];
  suggestedSkills: SkillName[];
  startingInventory: BackgroundStartingInventoryEntry[];
}

export interface FeatTemplate {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  summary: string;
  benefits: string[];
  effects: Effect[];
  supportLevel: FeatSupportLevel;
  automationStatus?: string;
  choiceGroups?: Array<{
    id: string;
    label: string;
    description: string;
    choiceType: FeatChoiceKind;
    minChoices: number;
    maxChoices: number;
    options: string[];
  }>;
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
  attackType?: SpellAttackType;
  saveAbility?: AbilityName;
  cantripDamage?: string;
  description?: string;
  higherLevel?: string;
}

export interface SpellCompendiumPayload extends Record<string, unknown> {
  level: number;
  school: string;
  classes: string[];
  castingTime: string;
  range: string;
  duration: string;
  concentration?: boolean;
  ritual?: boolean;
  attackType?: SpellAttackType;
  saveAbility?: AbilityName;
  cantripDamage?: string;
  damage?: string;
  healing?: string;
  effect?: string;
  description?: string;
  higherLevel?: string;
}

export interface CreatureCompendiumPayload extends Record<string, unknown> {
  size: CreatureSize;
  creatureType: string;
  challengeRating: string;
  armorClass: string;
  hitPoints: string;
  speed: string;
  abilityScores: AbilityScores;
  skills?: string[];
  senses?: string[];
  languages?: string[];
  features?: string[];
  actions?: string[];
  environment?: string[];
  beastFormEligible?: boolean;
  description?: string;
}

export interface CreatureRecord {
  id: string;
  sourceId: ContentSourceId;
  name: string;
  size: CreatureSize;
  creatureType: string;
  challengeRating: string;
  armorClass: string;
  hitPoints: string;
  speed: string;
  abilityScores: AbilityScores;
  skills: string[];
  senses: string[];
  languages: string[];
  features: string[];
  actions: string[];
  environment: string[];
  beastFormEligible: boolean;
  description?: string;
}

export interface ContentPackManifest {
  id: ContentSourceId;
  shortCode: string;
  name: string;
  ruleset: string;
  category: ContentSourceKind;
  licenseMode: ContentSource["licenseMode"];
  source: string;
  license: string;
  attribution: string;
  version: string;
  summary: string;
}

export interface GeneratedContentPackBuild {
  buildVersion: string;
  packs: ContentPackManifest[];
  entries: CompendiumEntry[];
}

export interface NotesBlock {
  classFeatures: string;
  backgroundFeatures: string;
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

export interface CurrencyWallet {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface SheetProfile {
  appearance: string;
  alignment: string;
  languages: string[];
  equipmentNotes: string;
  currencies: CurrencyWallet;
}

export interface TrackedResource {
  id: string;
  label: string;
  current: number;
  max: number;
  display: TrackedResourceDisplay;
  recovery: TrackedResourceRecovery;
  referenceSlug?: string;
  notes?: string;
}

export interface CharacterRecord {
  id: string;
  name: string;
  enabledSourceIds: ContentSourceId[];
  classId: string;
  subclass: string;
  speciesId: string;
  backgroundId: string;
  level: number;
  abilities: AbilityScores;
  skillProficiencies: Partial<Record<SkillName, ProficiencyLevel>>;
  inventory?: InventoryItemRecord[];
  armorId: string | null;
  shieldEquipped: boolean;
  weaponIds: string[];
  featIds: string[];
  featSelections: Record<string, string[]>;
  bonusSpellClassId: string;
  bonusSpellIds: string[];
  spellIds: string[];
  preparedSpellIds: string[];
  spellSlotsRemaining: number[];
  pactSlotsRemaining?: number;
  homebrewIds: string[];
  notes: NotesBlock;
  sheetProfile: SheetProfile;
  trackedResources: TrackedResource[];
  currentHitPoints: number;
  tempHitPoints: number;
  hitDiceSpent: number;
  deathSaves: DeathSaveTrack;
  inspiration: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderInput {
  name: string;
  enabledSourceIds: ContentSourceId[];
  classId: string;
  subclass: string;
  speciesId: string;
  backgroundId: string;
  level: number;
  abilities: AbilityScores;
  skillProficiencies: Partial<Record<SkillName, ProficiencyLevel>>;
  inventory?: InventoryItemRecord[];
  armorId: string | null;
  shieldEquipped: boolean;
  weaponIds: string[];
  featIds: string[];
  featSelections: Record<string, string[]>;
  bonusSpellClassId: string;
  bonusSpellIds: string[];
  spellIds: string[];
  preparedSpellIds: string[];
  spellSlotsRemaining: number[];
  pactSlotsRemaining?: number;
  homebrewIds: string[];
  notes: NotesBlock;
  sheetProfile: SheetProfile;
  trackedResources: TrackedResource[];
  currentHitPoints: number;
  tempHitPoints: number;
  hitDiceSpent: number;
  deathSaves: DeathSaveTrack;
  inspiration: boolean;
}

export type CompendiumType =
  | "class"
  | "subclass"
  | "species"
  | "background"
  | "spell"
  | "creature"
  | "weapon"
  | "armor"
  | "gear"
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

export interface DerivedSpellcastingLine {
  sourceId: string;
  sourceLabel: string;
  spellcastingAbility: AbilityName;
  spellAttackBonus: number;
  spellSaveDC: number;
  spellIds: string[];
}

export interface DerivedSpellSummary {
  slotMode: "none" | "standard" | "pact";
  spellcastingAbility: AbilityName | null;
  spellAttackBonus: number | null;
  spellSaveDC: number | null;
  bonusSpellcasting: DerivedSpellcastingLine | null;
  spellSlotsMax: number[];
  pactSlotsMax: number;
  pactSlotLevel: number | null;
  spellSlotsRemaining: number[];
  pactSlotsRemaining: number;
  knownSpells: SpellRecord[];
  preparedSpells: SpellRecord[];
}

export interface DerivedSheetState {
  proficiencyBonus: number;
  adjustedAbilities: AbilityScores;
  abilityModifiers: Record<AbilityName, number>;
  savingThrows: Record<AbilityName, number>;
  skills: Record<SkillName, number>;
  passiveSkills: Record<SkillName, number>;
  armorClass: number;
  initiative: number;
  size: CreatureSize;
  speed: number;
  hitPointsMax: number;
  hitDiceMax: number;
  equippedArmorId: string | null;
  shieldEquipped: boolean;
  spellcasting: DerivedSpellSummary;
  weaponEntries: DerivedWeaponEntry[];
  inventoryEntries: DerivedInventoryEntry[];
  classFeatures: string[];
  backgroundFeatures: string[];
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
  runtime: "browser-dev" | "electron";
  storageKind: "localStorage" | "sqlite";
  isPackaged: boolean;
  platform: string;
  userDataPath: string;
}

export interface SearchInput {
  query: string;
  type?: CompendiumType;
  sourceIds?: ContentSourceId[];
}

export interface DndApi {
  app: {
    getInfo: () => Promise<AppInfo>;
    revealDatabaseFile: () => Promise<boolean>;
  };
  characters: {
    list: () => Promise<CharacterSummary[]>;
    get: (id: string) => Promise<CharacterRecord | null>;
    save: (record: CharacterRecord) => Promise<CharacterRecord>;
    create: (input: BuilderInput) => Promise<CharacterRecord>;
    delete: (id: string) => Promise<void>;
    importJson: () => Promise<CharacterRecord | null>;
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
