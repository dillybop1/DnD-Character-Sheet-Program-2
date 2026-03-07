import { z } from "zod";
import { DEFAULT_ENABLED_SOURCE_IDS } from "./data/contentSources";
import type { CharacterRecord } from "./types";
import { ABILITY_NAMES, SKILL_NAMES } from "./types";

const proficiencyLevelSchema = z.enum(["none", "proficient", "expertise"]);

export const abilityScoresSchema = z.object(
  Object.fromEntries(ABILITY_NAMES.map((ability) => [ability, z.number().int().min(1).max(30)])),
);

export const notesSchema = z.object({
  classFeatures: z.string(),
  backgroundFeatures: z.string().optional().default(""),
  speciesTraits: z.string(),
  feats: z.string(),
});

export const deathSaveTrackSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
});

export const inventoryItemSchema = z.object({
  id: z.string(),
  templateType: z.enum(["weapon", "armor", "gear"]),
  templateId: z.string().min(1),
  quantity: z.number().int().min(1),
  equipped: z.boolean(),
  notes: z.string().optional(),
});

export const builderInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  enabledSourceIds: z.array(z.string().min(1)).min(1).default(DEFAULT_ENABLED_SOURCE_IDS),
  classId: z.string().min(1),
  subclass: z.string().trim().max(80).optional().default(""),
  speciesId: z.string().min(1),
  backgroundId: z.string().min(1),
  level: z.number().int().min(1).max(20),
  abilities: abilityScoresSchema,
  skillProficiencies: z
    .object(Object.fromEntries(SKILL_NAMES.map((skill) => [skill, proficiencyLevelSchema.optional()])))
    .partial(),
  inventory: z.array(inventoryItemSchema).optional(),
  armorId: z.string().nullable(),
  shieldEquipped: z.boolean(),
  weaponIds: z.array(z.string()),
  featIds: z.array(z.string()).optional().default([]),
  featSelections: z.record(z.array(z.string())).optional().default({}),
  bonusSpellClassId: z.string().optional().default(""),
  bonusSpellIds: z.array(z.string()).optional().default([]),
  spellIds: z.array(z.string()),
  preparedSpellIds: z.array(z.string()),
  homebrewIds: z.array(z.string()),
  notes: notesSchema,
  currentHitPoints: z.number().int().min(0),
  tempHitPoints: z.number().int().min(0),
  hitDiceSpent: z.number().int().min(0),
  deathSaves: deathSaveTrackSchema.optional().default({
    successes: 0,
    failures: 0,
  }),
  inspiration: z.boolean(),
});

export const effectSchema = z.object({
  id: z.string(),
  type: z.enum([
    "ability_bonus",
    "ac_bonus",
    "speed_bonus",
    "hp_bonus",
    "hp_bonus_per_level",
    "initiative_bonus",
    "grant_save_proficiency",
    "grant_skill_proficiency",
    "grant_expertise",
    "passive_skill_bonus",
    "grant_spell",
    "set_base_ac_formula",
    "set_spellcasting_ability",
    "resource_max_bonus",
  ]),
  target: z.string().optional(),
  value: z.number().optional(),
  note: z.string().optional(),
});

export const homebrewEntrySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(80),
  type: z.enum(["feat", "feature", "item", "spell", "speciesTrait"]),
  summary: z.string().trim().min(1).max(280),
  effects: z.array(effectSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const characterRecordSchema = builderInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const jsonExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  character: characterRecordSchema,
});

export function parseCharacterRecord(input: unknown): CharacterRecord {
  return characterRecordSchema.parse(input) as unknown as CharacterRecord;
}

export function parseCharacterImport(input: unknown): CharacterRecord {
  const wrapped = jsonExportSchema.safeParse(input);

  if (wrapped.success) {
    return wrapped.data.character as unknown as CharacterRecord;
  }

  return parseCharacterRecord(input);
}
