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
}

describe("content pack build script", () => {
  it("reproduces the committed generated build and preserves description joins", () => {
    const tempDir = makeTempDir("content-pack-build-");
    const outputFile = join(tempDir, "generated.json");
    const built = runGenerator(join(REPO_ROOT, "content", "packs"), outputFile);

    expect(built).toEqual(generatedBuild);
    const fireBolt = built.entries.find((entry: { slug: string }) => entry.slug === "fire-bolt");
    const sleep = built.entries.find((entry: { slug: string }) => entry.slug === "sleep");

    expect(fireBolt.payload.description).toContain("magical flame");
    expect(sleep.payload.higherLevel).toContain("higher-level slot");
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
});
