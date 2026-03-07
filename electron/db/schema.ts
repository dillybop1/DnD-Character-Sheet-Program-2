import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { CharacterRecord, CompendiumType, HomebrewEntry } from "../../shared/types";

export const schemaMigrations = sqliteTable("schema_migrations", {
  id: text("id").primaryKey(),
  appliedAt: text("applied_at").notNull(),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  classId: text("class_id").notNull(),
  speciesId: text("species_id").notNull(),
  level: integer("level").notNull(),
  record: text("record", { mode: "json" }).$type<CharacterRecord>().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const characterItems = sqliteTable("character_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: text("character_id").notNull(),
  payload: text("payload").notNull(),
});

export const characterSpells = sqliteTable("character_spells", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: text("character_id").notNull(),
  payload: text("payload").notNull(),
});

export const characterFeatures = sqliteTable("character_features", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: text("character_id").notNull(),
  payload: text("payload").notNull(),
});

export const characterResources = sqliteTable("character_resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: text("character_id").notNull(),
  payload: text("payload").notNull(),
});

export const homebrewEntries = sqliteTable("homebrew_entries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  summary: text("summary").notNull(),
  record: text("record", { mode: "json" }).$type<HomebrewEntry>().notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const compendiumEntries = sqliteTable("compendium_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  sourceId: text("source_id").notNull(),
  type: text("type").$type<CompendiumType>().notNull(),
  name: text("name").notNull(),
  ruleset: text("ruleset").notNull(),
  source: text("source").notNull(),
  license: text("license").notNull(),
  attribution: text("attribution").notNull(),
  summary: text("summary").notNull(),
  searchText: text("search_text").notNull(),
  payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
