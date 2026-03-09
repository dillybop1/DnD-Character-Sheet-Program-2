import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import generatedBuild from "../shared/data/generated/contentPackBuild.generated.json";

const REPO_ROOT = process.cwd();
const SCRIPT_PATH = join(REPO_ROOT, "scripts", "build-content-packs.mjs");

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runGenerator(inputDir: string, outputFile: string) {
  execFileSync(process.execPath, [SCRIPT_PATH, "--input-dir", inputDir, "--output-file", outputFile], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });

  return JSON.parse(readFileSync(outputFile, "utf8"));
}

function makeTempDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function writeBaseManifest(root: string, packId = "srd-5.2.1") {
  writeJson(join(root, packId, "manifest.json"), {
    id: packId,
    shortCode: "SRD 5.2.1",
    name: "System Reference Document 5.2.1",
    ruleset: "2024",
    category: "core",
    licenseMode: "open",
    source: "SRD / Free Rules",
    license: "CC-BY-4.0 / Open Content",
    attribution: "Wizards of the Coast open rules content",
    version: "test-v1",
    summary: "Temporary test pack.",
  });

  writeJson(join(root, packId, "textAudit.json"), {
    fieldDefaults: {
      spell: {
        summary: {
          mode: "non-verbatim",
          source: "Test audit summary",
          notes: "Temporary spell summary audit metadata.",
        },
        effect: {
          mode: "non-verbatim",
          source: "Test audit effect",
          notes: "Temporary spell effect audit metadata.",
        },
      },
      creature: {
        summary: {
          mode: "non-verbatim",
          source: "Test audit summary",
          notes: "Temporary creature summary audit metadata.",
        },
        features: {
          mode: "non-verbatim",
          source: "Test audit features",
          notes: "Temporary creature feature audit metadata.",
        },
        actions: {
          mode: "non-verbatim",
          source: "Test audit actions",
          notes: "Temporary creature action audit metadata.",
        },
      },
    },
    descriptions: {
      spells: {},
      creatures: {},
    },
  });
}

describe("content pack build script", () => {
  it("reproduces the committed generated build and preserves description joins", () => {
    const tempDir = makeTempDir("content-pack-build-");
    const outputFile = join(tempDir, "generated.json");
    const built = runGenerator(join(REPO_ROOT, "content", "packs"), outputFile);

    expect(built).toEqual(generatedBuild);
    const fireBolt = built.entries.find((entry: { slug: string }) => entry.slug === "fire-bolt");
    const arcaneEye = built.entries.find((entry: { slug: string }) => entry.slug === "arcane-eye");
    const banishment = built.entries.find((entry: { slug: string }) => entry.slug === "banishment");
    const bigbysHand = built.entries.find((entry: { slug: string }) => entry.slug === "bigbys-hand");
    const blight = built.entries.find((entry: { slug: string }) => entry.slug === "blight");
    const chillTouch = built.entries.find((entry: { slug: string }) => entry.slug === "chill-touch");
    const charmMonster = built.entries.find((entry: { slug: string }) => entry.slug === "charm-monster");
    const coneOfCold = built.entries.find((entry: { slug: string }) => entry.slug === "cone-of-cold");
    const divination = built.entries.find((entry: { slug: string }) => entry.slug === "divination");
    const evardsBlackTentacles = built.entries.find((entry: { slug: string }) => entry.slug === "evards-black-tentacles");
    const fabricate = built.entries.find((entry: { slug: string }) => entry.slug === "fabricate");
    const greaterRestoration = built.entries.find((entry: { slug: string }) => entry.slug === "greater-restoration");
    const leomundsSecretChest = built.entries.find((entry: { slug: string }) => entry.slug === "leomunds-secret-chest");
    const mordenkainensPrivateSanctum = built.entries.find((entry: { slug: string }) => entry.slug === "mordenkainens-private-sanctum");
    const phantasmalKiller = built.entries.find((entry: { slug: string }) => entry.slug === "phantasmal-killer");
    const scrying = built.entries.find((entry: { slug: string }) => entry.slug === "scrying");
    const sleep = built.entries.find((entry: { slug: string }) => entry.slug === "sleep");
    const invisibility = built.entries.find((entry: { slug: string }) => entry.slug === "invisibility");
    const sending = built.entries.find((entry: { slug: string }) => entry.slug === "sending");
    const teleportationCircle = built.entries.find((entry: { slug: string }) => entry.slug === "teleportation-circle");
    const vitriolicSphere = built.entries.find((entry: { slug: string }) => entry.slug === "vitriolic-sphere");
    const wallOfForce = built.entries.find((entry: { slug: string }) => entry.slug === "wall-of-force");
    const wallOfFire = built.entries.find((entry: { slug: string }) => entry.slug === "wall-of-fire");
    const ghoul = built.entries.find((entry: { slug: string }) => entry.slug === "ghoul");

    expect(fireBolt.payload.description).toContain("You hurl a mote of fire");
    expect(arcaneEye.payload.description).toContain("Invisible, invulnerable eye");
    expect(banishment.payload.description).toContain("harmless demiplane");
    expect(banishment.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(bigbysHand.payload.description).toContain("Large hand of shimmering magical energy");
    expect(bigbysHand.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(blight.payload.description).toContain("8d8 Necrotic damage");
    expect(blight.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(chillTouch.payload.description).toContain("Channeling the chill of the grave");
    expect(charmMonster.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(coneOfCold.payload.description).toContain("8d8 Cold damage");
    expect(coneOfCold.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(divination.payload.description).toContain("You ask one question");
    expect(evardsBlackTentacles.payload.description).toContain("Restrained condition");
    expect(fabricate.payload.description).toContain("raw materials into products");
    expect(greaterRestoration.payload.description).toContain("1 Exhaustion level");
    expect(leomundsSecretChest.payload.description).toContain("Ethereal Plane");
    expect(mordenkainensPrivateSanctum.payload.description).toContain("Nothing can teleport into or out of the warded area.");
    expect(mordenkainensPrivateSanctum.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(phantasmalKiller.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(scrying.payload.description).toContain("Secondhand (heard of the target) +5");
    expect(sleep.payload.description).toContain("Each creature of your choice in a 5-foot-radius Sphere");
    expect(sleep.payload.higherLevel).toBeUndefined();
    expect(invisibility.payload.description).toContain("has the Invisible condition");
    expect(sending.payload.description).toContain("25 words or fewer");
    expect(teleportationCircle.payload.description).toContain("permanent teleportation circle");
    expect(vitriolicSphere.payload.description).toContain("10d4 Acid damage");
    expect(vitriolicSphere.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(wallOfForce.payload.description).toContain("Nothing can physically pass through the wall.");
    expect(wallOfFire.payload.description).toContain("You create a wall of fire");
    expect(wallOfFire.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(ghoul.payload.description).toContain("Multiattack. The ghoul makes two Bite attacks.");
  });

  it("rejects duplicate slugs across packs", () => {
    const tempDir = makeTempDir("content-pack-duplicates-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir, "pack-a");
    writeBaseManifest(tempDir, "pack-b");
    writeJson(join(tempDir, "pack-a", "spells.json"), [
      {
        slug: "duplicate-spell",
        name: "Duplicate Spell A",
        summary: "First copy.",
        tags: ["test"],
        level: 0,
        school: "Evocation",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "30 feet",
        duration: "Instantaneous",
      },
    ]);
    writeJson(join(tempDir, "pack-b", "spells.json"), [
      {
        slug: "duplicate-spell",
        name: "Duplicate Spell B",
        summary: "Second copy.",
        tags: ["test"],
        level: 0,
        school: "Evocation",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "30 feet",
        duration: "Instantaneous",
      },
    ]);

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/Duplicate compendium slug "duplicate-spell"/);
  });

  it("rejects rows that are missing required spell fields", () => {
    const tempDir = makeTempDir("content-pack-missing-field-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir);
    writeJson(join(tempDir, "srd-5.2.1", "spells.json"), [
      {
        slug: "broken-spell",
        name: "Broken Spell",
        summary: "Missing casting time.",
        tags: ["test"],
        level: 0,
        school: "Evocation",
        classes: ["Wizard"],
        range: "30 feet",
        duration: "Instantaneous",
      },
    ]);

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/castingTime/i);
  });

  it("rejects missing description files when a row references one", () => {
    const tempDir = makeTempDir("content-pack-missing-description-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir);
    writeJson(join(tempDir, "srd-5.2.1", "textAudit.json"), {
      fieldDefaults: {
        spell: {
          summary: {
            mode: "non-verbatim",
            source: "Test audit summary",
            notes: "Temporary spell summary audit metadata.",
          },
          effect: {
            mode: "non-verbatim",
            source: "Test audit effect",
            notes: "Temporary spell effect audit metadata.",
          },
        },
        creature: {
          summary: {
            mode: "non-verbatim",
            source: "Test audit summary",
            notes: "Temporary creature summary audit metadata.",
          },
          features: {
            mode: "non-verbatim",
            source: "Test audit features",
            notes: "Temporary creature feature audit metadata.",
          },
          actions: {
            mode: "non-verbatim",
            source: "Test audit actions",
            notes: "Temporary creature action audit metadata.",
          },
        },
      },
      descriptions: {
        spells: {
          "missing-text": {
            mode: "non-verbatim",
            source: "Test audit description",
            notes: "Temporary spell description audit metadata.",
          },
        },
        creatures: {},
      },
    });
    writeJson(join(tempDir, "srd-5.2.1", "spells.json"), [
      {
        slug: "described-spell",
        name: "Described Spell",
        summary: "Points to a missing file.",
        tags: ["test"],
        level: 1,
        school: "Divination",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "Self",
        duration: "1 minute",
        descriptionKey: "missing-text",
      },
    ]);

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/Missing description file for key "missing-text"/);
  });

  it("rejects missing text audit entries when a row references a description file", () => {
    const tempDir = makeTempDir("content-pack-missing-text-audit-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir);
    mkdirSync(join(tempDir, "srd-5.2.1", "descriptions", "spells"), { recursive: true });
    writeJson(join(tempDir, "srd-5.2.1", "spells.json"), [
      {
        slug: "audited-spell",
        name: "Audited Spell",
        summary: "Has a description file but no audit entry.",
        tags: ["test"],
        level: 1,
        school: "Divination",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "Self",
        duration: "1 minute",
        descriptionKey: "audited-spell",
      },
    ]);
    writeFileSync(join(tempDir, "srd-5.2.1", "descriptions", "spells", "audited-spell.md"), "Temporary spell text.", "utf8");

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/Missing text audit entry for description key "audited-spell"/);
  });
});
