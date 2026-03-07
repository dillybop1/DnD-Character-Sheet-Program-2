import { describe, expect, it } from "vitest";
import {
  COMPENDIUM_IMPORT_VERSION,
  COMPENDIUM_SEED,
  findCompendiumEntry,
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
      attackType: "spellAttack",
    });
  });
});
