import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { z } from "zod";

const abilityScoresSchema = z.object({
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
});

const manifestSchema = z.object({
  id: z.string().min(1),
  shortCode: z.string().min(1),
  name: z.string().min(1),
  ruleset: z.string().min(1),
  category: z.enum(["core", "sourcebook", "setting", "campaign"]),
  licenseMode: z.enum(["open", "licensed", "custom"]),
  source: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().min(1),
  version: z.string().min(1),
  summary: z.string().min(1),
});

const spellRowSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    level: z.number().int().min(0),
    school: z.string().min(1),
    classes: z.array(z.string().min(1)).default([]),
    castingTime: z.string().min(1),
    range: z.string().min(1),
    duration: z.string().min(1),
    concentration: z.boolean().optional(),
    ritual: z.boolean().optional(),
    attackType: z.enum(["spellAttack", "save"]).optional(),
    saveAbility: z.enum(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]).optional(),
    cantripDamage: z.string().optional(),
    descriptionKey: z.string().min(1).optional(),
  })
  .passthrough();

const creatureRowSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    size: z.enum(["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"]),
    creatureType: z.string().min(1),
    challengeRating: z.string().min(1),
    armorClass: z.string().min(1),
    hitPoints: z.string().min(1),
    speed: z.string().min(1),
    abilityScores: abilityScoresSchema,
    skills: z.array(z.string().min(1)).default([]),
    senses: z.array(z.string().min(1)).default([]),
    languages: z.array(z.string().min(1)).default([]),
    features: z.array(z.string().min(1)).default([]),
    actions: z.array(z.string().min(1)).default([]),
    environment: z.array(z.string().min(1)).default([]),
    beastFormEligible: z.boolean().optional(),
    descriptionKey: z.string().min(1).optional(),
  })
  .passthrough();

const textUsageSchema = z.object({
  mode: z.enum(["verbatim", "non-verbatim"]),
  source: z.string().min(1),
  notes: z.string().min(1),
});

const textAuditSchema = z.object({
  fieldDefaults: z.object({
    spell: z
      .object({
        summary: textUsageSchema,
        effect: textUsageSchema,
      })
      .optional(),
    creature: z
      .object({
        summary: textUsageSchema,
        features: textUsageSchema,
        actions: textUsageSchema,
      })
      .optional(),
  }),
  descriptions: z.object({
    spells: z.record(textUsageSchema).default({}),
    creatures: z.record(textUsageSchema).default({}),
  }),
});

function readArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function flattenPayloadValue(value) {
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

function buildSearchText({ name, type, summary, tags, payload }) {
  return [name, type, summary, ...tags, ...flattenPayloadValue(payload)]
    .join(" ")
    .toLowerCase();
}

async function loadDescriptionPayload(packDir, folderName, descriptionKey) {
  if (!descriptionKey) {
    return {};
  }

  const folder = join(packDir, "descriptions", folderName);
  const jsonPath = join(folder, `${descriptionKey}.json`);

  if (await exists(jsonPath)) {
    const parsed = await readJson(jsonPath);

    if (typeof parsed === "string") {
      return { description: parsed.trim() };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`Description JSON must be a string or object: ${relative(process.cwd(), jsonPath)}`);
    }

    return parsed;
  }

  const markdownPath = join(folder, `${descriptionKey}.md`);

  if (await exists(markdownPath)) {
    const description = (await readFile(markdownPath, "utf8")).trim();

    if (!description) {
      throw new Error(`Description markdown is empty: ${relative(process.cwd(), markdownPath)}`);
    }

    return { description };
  }

  throw new Error(
    `Missing description file for key "${descriptionKey}" in ${relative(process.cwd(), join(folder, `${descriptionKey}.*`))}`,
  );
}

async function loadPackTextAudit(packDir) {
  const auditPath = join(packDir, "textAudit.json");

  if (!(await exists(auditPath))) {
    throw new Error(`Missing text audit file: ${relative(process.cwd(), auditPath)}`);
  }

  return textAuditSchema.parse(await readJson(auditPath));
}

function validateFieldDefaultCoverage(packDir, textAudit, { hasSpells, hasCreatures }) {
  const auditPath = relative(process.cwd(), join(packDir, "textAudit.json"));

  if (hasSpells && !textAudit.fieldDefaults.spell) {
    throw new Error(`Missing spell field defaults in ${auditPath}`);
  }

  if (hasCreatures && !textAudit.fieldDefaults.creature) {
    throw new Error(`Missing creature field defaults in ${auditPath}`);
  }
}

function validateDescriptionAuditCoverage(packDir, folderName, rows, textAudit) {
  const auditPath = relative(process.cwd(), join(packDir, "textAudit.json"));
  const descriptionAudit = folderName === "spells" ? textAudit.descriptions.spells : textAudit.descriptions.creatures;
  const referencedKeys = new Set(rows.map((row) => row.descriptionKey).filter(Boolean));

  for (const descriptionKey of referencedKeys) {
    if (!descriptionAudit[descriptionKey]) {
      throw new Error(`Missing text audit entry for description key "${descriptionKey}" in ${auditPath}`);
    }
  }

  for (const descriptionKey of Object.keys(descriptionAudit)) {
    if (!referencedKeys.has(descriptionKey)) {
      throw new Error(`Orphan text audit entry for description key "${descriptionKey}" in ${auditPath}`);
    }
  }
}

function buildEntry(manifest, type, row, payload, tags) {
  return {
    slug: row.slug,
    sourceId: manifest.id,
    type,
    name: row.name,
    ruleset: manifest.ruleset,
    source: manifest.source,
    license: manifest.license,
    attribution: manifest.attribution,
    summary: row.summary,
    searchText: buildSearchText({
      name: row.name,
      type,
      summary: row.summary,
      tags,
      payload,
    }),
    payload,
  };
}

async function readPackEntries(packDir) {
  const manifestPath = join(packDir, "manifest.json");
  const manifest = manifestSchema.parse(await readJson(manifestPath));
  const entries = [];

  const spellsPath = join(packDir, "spells.json");
  const creaturesPath = join(packDir, "creatures.json");
  const hasSpells = await exists(spellsPath);
  const hasCreatures = await exists(creaturesPath);
  const textAudit = hasSpells || hasCreatures ? await loadPackTextAudit(packDir) : null;

  if (textAudit) {
    validateFieldDefaultCoverage(packDir, textAudit, {
      hasSpells,
      hasCreatures,
    });
  }

  if (hasSpells) {
    const spellRows = z.array(spellRowSchema).parse(await readJson(spellsPath));
    validateDescriptionAuditCoverage(packDir, "spells", spellRows, textAudit);

    for (const row of spellRows) {
      const { slug: _slug, name: _name, summary: _summary, tags = [], descriptionKey, ...payload } = row;
      const descriptionPayload = await loadDescriptionPayload(packDir, "spells", descriptionKey);
      entries.push(buildEntry(manifest, "spell", row, { ...payload, ...descriptionPayload }, tags));
    }
  }

  if (hasCreatures) {
    const creatureRows = z.array(creatureRowSchema).parse(await readJson(creaturesPath));
    validateDescriptionAuditCoverage(packDir, "creatures", creatureRows, textAudit);

    for (const row of creatureRows) {
      const { slug: _slug, name: _name, summary: _summary, tags = [], descriptionKey, ...payload } = row;
      const descriptionPayload = await loadDescriptionPayload(packDir, "creatures", descriptionKey);
      entries.push(buildEntry(manifest, "creature", row, { ...payload, ...descriptionPayload }, tags));
    }
  }

  return {
    manifest,
    entries,
  };
}

function assertUniqueSlugs(entries) {
  const seen = new Map();

  for (const entry of entries) {
    const existing = seen.get(entry.slug);

    if (existing) {
      throw new Error(`Duplicate compendium slug "${entry.slug}" across content packs (${existing} and ${entry.sourceId})`);
    }

    seen.set(entry.slug, entry.sourceId);
  }
}

async function loadAllPacks(inputDir) {
  const directories = (await readdir(inputDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(inputDir, entry.name))
    .sort((left, right) => left.localeCompare(right));

  const packs = [];

  for (const packDir of directories) {
    const manifestPath = join(packDir, "manifest.json");

    if (!(await exists(manifestPath))) {
      continue;
    }

    packs.push(await readPackEntries(packDir));
  }

  const manifests = packs.map((entry) => entry.manifest).sort((left, right) => left.id.localeCompare(right.id));
  const entries = packs
    .flatMap((entry) => entry.entries)
    .sort((left, right) => left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug));

  assertUniqueSlugs(entries);

  return {
    buildVersion: manifests.map((manifest) => `${manifest.id}@${manifest.version}`).join("|"),
    packs: manifests,
    entries,
  };
}

async function main() {
  const inputDir = resolve(readArg("--input-dir", "content/packs"));
  const outputFile = resolve(readArg("--output-file", "shared/data/generated/contentPackBuild.generated.json"));
  const build = await loadAllPacks(inputDir);

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(build, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
