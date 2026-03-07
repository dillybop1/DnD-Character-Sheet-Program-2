import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { resolveEnabledSourceIds } from "../../shared/data/contentSources";
import { buildCharacterFromInput } from "../../shared/factories";
import { builderInputSchema, characterRecordSchema, homebrewEntrySchema, parseCharacterRecord } from "../../shared/validation";
import type {
  BuilderInput,
  CharacterRecord,
  CharacterSummary,
  CompendiumEntry,
  HomebrewEntry,
  SearchInput,
} from "../../shared/types";
import type { DatabaseContext } from "./client";
import { characters, compendiumEntries, homebrewEntries } from "./schema";

function toCharacterSummary(record: CharacterRecord): CharacterSummary {
  return {
    id: record.id,
    name: record.name,
    classId: record.classId,
    speciesId: record.speciesId,
    level: record.level,
    updatedAt: record.updatedAt,
  };
}

export async function listCharacters(context: DatabaseContext) {
  const rows = await context.db.select().from(characters).orderBy(desc(characters.updatedAt));
  return rows.map((row) => toCharacterSummary(parseCharacterRecord(row.record) as CharacterRecord));
}

export async function getCharacter(context: DatabaseContext, id: string) {
  const [row] = await context.db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return row ? (parseCharacterRecord(row.record) as CharacterRecord) : null;
}

export async function listHomebrew(context: DatabaseContext) {
  const rows = await context.db.select().from(homebrewEntries).orderBy(desc(homebrewEntries.updatedAt));
  return rows.map((row) => row.record);
}

async function getApplicableHomebrew(context: DatabaseContext, homebrewIds: string[]) {
  const allHomebrew = await listHomebrew(context);
  return allHomebrew.filter((entry) => homebrewIds.includes(entry.id));
}

export async function createCharacter(context: DatabaseContext, input: BuilderInput) {
  const parsed = builderInputSchema.parse(input) as unknown as BuilderInput;
  const homebrew = await getApplicableHomebrew(context, parsed.homebrewIds);
  const record = buildCharacterFromInput(parsed, homebrew);
  return saveCharacter(context, record);
}

export async function saveCharacter(context: DatabaseContext, record: CharacterRecord) {
  const now = new Date().toISOString();
  const parsed = characterRecordSchema.parse({
    ...record,
    updatedAt: now,
  }) as unknown as CharacterRecord;

  await context.db
    .insert(characters)
    .values({
      id: parsed.id,
      name: parsed.name,
      classId: parsed.classId,
      speciesId: parsed.speciesId,
      level: parsed.level,
      record: parsed,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    })
    .onConflictDoUpdate({
      target: characters.id,
      set: {
        name: parsed.name,
        classId: parsed.classId,
        speciesId: parsed.speciesId,
        level: parsed.level,
        record: parsed,
        updatedAt: parsed.updatedAt,
      },
    });

  return parsed;
}

export async function deleteCharacter(context: DatabaseContext, id: string) {
  await context.db.delete(characters).where(eq(characters.id, id));
}

export async function searchCompendium(context: DatabaseContext, input: SearchInput) {
  const normalizedQuery = input.query.trim();
  const sourceIds = resolveEnabledSourceIds(input.sourceIds);

  if (!normalizedQuery) {
    const sourceFilter = inArray(compendiumEntries.sourceId, sourceIds);
    const rows = input.type
      ? await context.db
          .select()
          .from(compendiumEntries)
          .where(and(eq(compendiumEntries.type, input.type), sourceFilter))
          .orderBy(asc(compendiumEntries.name))
          .limit(50)
      : await context.db
          .select()
          .from(compendiumEntries)
          .where(sourceFilter)
          .orderBy(asc(compendiumEntries.name))
          .limit(50);

    return rows.map((entry): CompendiumEntry => ({
      id: entry.id,
      slug: entry.slug,
      sourceId: entry.sourceId,
      type: entry.type,
      name: entry.name,
      ruleset: entry.ruleset,
      source: entry.source,
      license: entry.license,
      attribution: entry.attribution,
      summary: entry.summary,
      searchText: entry.searchText,
      payload: entry.payload,
    }));
  }

  const queryTerms = normalizedQuery
    .split(/\s+/)
    .map((term) => `${term.replaceAll('"', "")}*`)
    .join(" ");

  const conditions = ["compendium_entries_fts MATCH ?"];
  const parameters: Array<string> = [queryTerms];

  if (input.type) {
    conditions.push("c.type = ?");
    parameters.push(input.type);
  }

  if (sourceIds.length > 0) {
    conditions.push(`c.source_id IN (${sourceIds.map(() => "?").join(", ")})`);
    parameters.push(...sourceIds);
  }

  const statement = context.sqlite.prepare(`
    SELECT c.*
    FROM compendium_entries c
    JOIN compendium_entries_fts f ON c.id = f.rowid
    WHERE ${conditions.join(" AND ")}
    ORDER BY c.name ASC
    LIMIT 50
  `);

  const rows = statement.all(...parameters) as Array<{
    id: number;
    slug: string;
    source_id: string;
    type: CompendiumEntry["type"];
    name: string;
    ruleset: string;
    source: string;
    license: string;
    attribution: string;
    summary: string;
    search_text: string;
    payload: string | Record<string, unknown>;
  }>;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sourceId: row.source_id,
    type: row.type,
    name: row.name,
    ruleset: row.ruleset,
    source: row.source,
    license: row.license,
    attribution: row.attribution,
    summary: row.summary,
    searchText: row.search_text,
    payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
  }));
}

export async function getCompendiumEntry(context: DatabaseContext, slug: string) {
  const [row] = await context.db
    .select()
    .from(compendiumEntries)
    .where(eq(compendiumEntries.slug, slug))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    sourceId: row.sourceId,
    type: row.type,
    name: row.name,
    ruleset: row.ruleset,
    source: row.source,
    license: row.license,
    attribution: row.attribution,
    summary: row.summary,
    searchText: row.searchText,
    payload: row.payload,
  };
}

export async function saveHomebrew(context: DatabaseContext, entry: HomebrewEntry) {
  const now = new Date().toISOString();
  const parsed = homebrewEntrySchema.parse({
    ...entry,
    updatedAt: now,
  }) as unknown as HomebrewEntry;

  await context.db
    .insert(homebrewEntries)
    .values({
      id: parsed.id,
      name: parsed.name,
      type: parsed.type,
      summary: parsed.summary,
      record: parsed,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    })
    .onConflictDoUpdate({
      target: homebrewEntries.id,
      set: {
        name: parsed.name,
        type: parsed.type,
        summary: parsed.summary,
        record: parsed,
        updatedAt: parsed.updatedAt,
      },
    });

  return parsed;
}

export async function deleteHomebrew(context: DatabaseContext, id: string) {
  await context.db.delete(homebrewEntries).where(eq(homebrewEntries.id, id));
}
