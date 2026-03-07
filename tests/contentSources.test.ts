import { describe, expect, it } from "vitest";
import { DEFAULT_ENABLED_SOURCE_IDS, listContentSources, resolveEnabledSourceIds } from "../shared/data/contentSources";
import { listArmorTemplates, listBackgroundTemplates, listClassTemplates, listSpeciesTemplates, listWeaponTemplates } from "../shared/data/reference";
import { createDefaultBuilderInput } from "../src/lib/editor";

describe("content source architecture", () => {
  it("stores a source profile on new character drafts", () => {
    const draft = createDefaultBuilderInput();

    expect(draft.enabledSourceIds).toEqual(DEFAULT_ENABLED_SOURCE_IDS);
  });

  it("filters available content through installed sources", () => {
    const onlyInstalledSources = resolveEnabledSourceIds(["tashas-cauldron-of-everything"]);

    expect(onlyInstalledSources).toEqual(DEFAULT_ENABLED_SOURCE_IDS);
    expect(listContentSources().some((source) => source.id === "exploring-eberron")).toBe(true);
    expect(listClassTemplates(onlyInstalledSources).length).toBeGreaterThan(0);
    expect(listSpeciesTemplates(onlyInstalledSources).length).toBeGreaterThan(0);
    expect(listBackgroundTemplates(onlyInstalledSources).length).toBeGreaterThan(0);
    expect(listArmorTemplates(onlyInstalledSources).length).toBeGreaterThan(0);
    expect(listWeaponTemplates(onlyInstalledSources).length).toBeGreaterThan(0);
  });
});
