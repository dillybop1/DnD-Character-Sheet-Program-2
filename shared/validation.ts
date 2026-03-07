import { z } from "zod";
import { DEFAULT_ENABLED_SOURCE_IDS } from "./data/contentSources";
import { ABILITY_NAMES, SKILL_NAMES } from "./types";

const proficiencyLevelSchema = z.enum(["none", "proficient", "expertise"]);

export const abilityScoresSchema = z.object(
  Object.fromEntries(ABILITY_NAMES.map((ability) => [ability, z.number().int().min(1).max(30)])),
);

export const notesSchema = z.object({
  classFeatures: z.string(),
  speciesTraits: z.string(),
  feats: z.string(),
});

export const builderInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  enabledSourceIds: z.array(z.string().min(1)).min(1).default(DEFAULT_ENABLED_SOURCE_IDS),
  classId: z.string().min(1),
  speciesId: z.string().min(1),
  backgroundId: z.string().min(1),
  level: z.number().int().min(1).max(20),
  abilities: abilityScoresSchema,
  skillProficiencies: z
    .object(Object.fromEntries(SKILL_NAMES.map((skill) => [skill, proficiencyLevelSchema.optional()])))
    .partial(),
  armorId: z.string().nullable(),
  shieldEquipped: z.boolean(),
  weaponIds: z.array(z.string()),
  spellIds: z.array(z.string()),
  preparedSpellIds: z.array(z.string()),
  homebrewIds: z.array(z.string()),
  notes: notesSchema,
  inspiration: z.boolean(),
});

export const effectSchema = z.object({
  id: z.string(),
  type: z.enum([
    "ability_bonus",
    "ac_bonus",
    "speed_bonus",
    "hp_bonus",
    "grant_save_proficiency",
    "grant_skill_proficiency",
    "grant_expertise",
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
  currentHitPoints: z.number().int(),
  tempHitPoints: z.number().int(),
  hitDiceSpent: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
