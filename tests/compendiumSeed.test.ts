import { describe, expect, it } from "vitest";
import {
  COMPENDIUM_IMPORT_VERSION,
  COMPENDIUM_SEED,
  findCompendiumEntry,
  listCompendiumEntries,
  listCompendiumSpells,
  searchCompendiumSeed,
  spellRecordFromCompendium,
} from "../shared/data/compendiumSeed";

describe("compendium seed", () => {
  it("exposes a materially larger versioned dataset", () => {
    expect(COMPENDIUM_IMPORT_VERSION).toBeTruthy();
    expect(COMPENDIUM_SEED.length).toBeGreaterThan(40);
    expect(findCompendiumEntry("fighter")?.type).toBe("class");
    expect(findCompendiumEntry("misty-step")?.type).toBe("spell");
    expect(findCompendiumEntry("alert")?.type).toBe("feat");
    expect(findCompendiumEntry("plate")?.type).toBe("armor");
    expect(findCompendiumEntry("rapier")?.type).toBe("weapon");
    expect(findCompendiumEntry("arcane-focus")?.type).toBe("gear");
    expect(listCompendiumEntries("gear").length).toBeGreaterThan(10);
  });

  it("supports local search and structured spell lookup", () => {
    const spellResults = searchCompendiumSeed({
      query: "radiant cleric",
      type: "spell",
    });

    expect(spellResults.some((entry) => entry.slug === "guiding-bolt")).toBe(true);
    expect(spellResults.some((entry) => entry.slug === "sacred-flame")).toBe(true);

    expect(spellRecordFromCompendium("fire-bolt")).toMatchObject({
      id: "fire-bolt",
      name: "Fire Bolt",
      level: 0,
      classes: ["Sorcerer", "Wizard"],
      attackType: "spellAttack",
    });

    const gearResults = searchCompendiumSeed({
      query: "rope torches rations",
      type: "gear",
    });

    expect(gearResults.some((entry) => entry.slug === "dungeoneers-pack")).toBe(true);
    expect(gearResults.some((entry) => entry.slug === "explorers-pack")).toBe(true);
  });

  it("filters spells by class list for the builder workflow", () => {
    const warlockSpells = listCompendiumSpells(undefined, "Warlock").map((entry) => entry.slug);
    const rangerSpells = listCompendiumSpells(undefined, "Ranger").map((entry) => entry.slug);

    expect(warlockSpells).toContain("eldritch-blast");
    expect(warlockSpells).toContain("hex");
    expect(warlockSpells).not.toContain("guiding-bolt");

    expect(rangerSpells).toContain("hunters-mark");
    expect(rangerSpells).toContain("cure-wounds");
    expect(rangerSpells).not.toContain("magic-missile");
  });
});
