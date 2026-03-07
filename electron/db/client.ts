import { join } from "node:path";
import { count } from "drizzle-orm";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { COMPENDIUM_SEED } from "../../shared/data/compendiumSeed";
import * as schema from "./schema";

const MIGRATIONS = [
  {
    id: "0001_initial",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        class_id TEXT NOT NULL,
        species_id TEXT NOT NULL,
        level INTEGER NOT NULL,
        record TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS character_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS character_spells (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS character_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS character_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS homebrew_entries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        summary TEXT NOT NULL,
        record TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS compendium_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        ruleset TEXT NOT NULL,
        source TEXT NOT NULL,
        license TEXT NOT NULL,
        attribution TEXT NOT NULL,
        summary TEXT NOT NULL,
        search_text TEXT NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS compendium_entries_fts USING fts5(
        name,
        search_text,
        content='compendium_entries',
        content_rowid='id'
      );

      CREATE TRIGGER IF NOT EXISTS compendium_entries_ai AFTER INSERT ON compendium_entries BEGIN
        INSERT INTO compendium_entries_fts(rowid, name, search_text)
        VALUES (new.id, new.name, new.search_text);
      END;

      CREATE TRIGGER IF NOT EXISTS compendium_entries_ad AFTER DELETE ON compendium_entries BEGIN
        INSERT INTO compendium_entries_fts(compendium_entries_fts, rowid, name, search_text)
        VALUES('delete', old.id, old.name, old.search_text);
      END;

      CREATE TRIGGER IF NOT EXISTS compendium_entries_au AFTER UPDATE ON compendium_entries BEGIN
        INSERT INTO compendium_entries_fts(compendium_entries_fts, rowid, name, search_text)
        VALUES('delete', old.id, old.name, old.search_text);
        INSERT INTO compendium_entries_fts(rowid, name, search_text)
        VALUES (new.id, new.name, new.search_text);
      END;
    `,
  },
];

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DatabaseContext {
  sqlite: Database.Database;
  db: AppDatabase;
  databasePath: string;
}

function applyMigrations(sqlite: Database.Database) {
  sqlite.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const appliedIds = new Set(
    sqlite
      .prepare("SELECT id FROM schema_migrations")
      .all()
      .map((row) => String((row as { id: string }).id)),
  );
  const insertMigration = sqlite.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");

  for (const migration of MIGRATIONS) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    const transaction = sqlite.transaction(() => {
      sqlite.exec(migration.sql);
      insertMigration.run(migration.id, new Date().toISOString());
    });

    transaction();
  }
}

async function seedCompendiumIfEmpty(context: DatabaseContext) {
  const [{ value }] = await context.db.select({ value: count() }).from(schema.compendiumEntries);

  if (value > 0) {
    return;
  }

  await context.db.insert(schema.compendiumEntries).values(COMPENDIUM_SEED);
}

let cachedContext: DatabaseContext | null = null;

export async function getDatabaseContext(userDataPath: string) {
  if (cachedContext) {
    return cachedContext;
  }

  const databasePath = join(userDataPath, "dnd-character-sheet.sqlite");
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  applyMigrations(sqlite);

  const db = drizzle(sqlite, { schema });
  cachedContext = { sqlite, db, databasePath };
  await seedCompendiumIfEmpty(cachedContext);

  return cachedContext;
}
