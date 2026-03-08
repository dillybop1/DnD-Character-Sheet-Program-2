import { describe, expect, it } from "vitest";
import {
  CONTENT_PACK_IMPORT_VERSION,
  COMPENDIUM_IMPORT_VERSION,
  COMPENDIUM_SEED,
  creatureRecordFromCompendium,
  findCompendiumEntry,
  listCompendiumCreatures,
  listCompendiumEntries,
  listCompendiumSpells,
  searchCompendiumSeed,
  spellRecordFromCompendium,
} from "../shared/data/compendiumSeed";

describe("compendium seed", () => {
  it("exposes a materially larger versioned dataset", () => {
    expect(COMPENDIUM_IMPORT_VERSION).toBeTruthy();
    expect(CONTENT_PACK_IMPORT_VERSION).toBeTruthy();
    expect(COMPENDIUM_SEED.length).toBeGreaterThan(40);
    expect(findCompendiumEntry("fighter")?.type).toBe("class");
    expect(findCompendiumEntry("fighter-champion")?.type).toBe("subclass");
    expect(findCompendiumEntry("misty-step")?.type).toBe("spell");
    expect(findCompendiumEntry("wolf")?.type).toBe("creature");
    expect(findCompendiumEntry("alert")?.type).toBe("feat");
    expect(findCompendiumEntry("mobile")?.type).toBe("feat");
    expect(findCompendiumEntry("athlete")?.type).toBe("feat");
    expect(findCompendiumEntry("observant")?.type).toBe("feat");
    expect(findCompendiumEntry("skilled")?.type).toBe("feat");
    expect(findCompendiumEntry("resilient")?.type).toBe("feat");
    expect(findCompendiumEntry("skill-expert")?.type).toBe("feat");
    expect(findCompendiumEntry("plate")?.type).toBe("armor");
    expect(findCompendiumEntry("rapier")?.type).toBe("weapon");
    expect(findCompendiumEntry("arcane-focus")?.type).toBe("gear");
    expect(listCompendiumEntries("gear").length).toBeGreaterThan(10);
    expect(listCompendiumEntries("creature").length).toBeGreaterThanOrEqual(4);
    expect(listCompendiumEntries("subclass").length).toBeGreaterThan(10);
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
      description: expect.stringContaining("magical flame"),
    });
    expect(spellRecordFromCompendium("sleep")?.higherLevel).toContain("higher-level slot");
    expect(spellRecordFromCompendium("sacred-flame")?.saveAbility).toBe("dexterity");

    const creatureResults = searchCompendiumSeed({
      query: "pack tactics beast",
      type: "creature",
    });

    expect(creatureResults.some((entry) => entry.slug === "wolf")).toBe(true);
    expect(listCompendiumCreatures(undefined, { beastOnly: true }).length).toBeGreaterThanOrEqual(4);
    expect(creatureRecordFromCompendium("wolf")).toMatchObject({
      id: "wolf",
      name: "Wolf",
      creatureType: "Beast",
      beastFormEligible: true,
    });

    const gearResults = searchCompendiumSeed({
      query: "rope torches rations",
      type: "gear",
    });

    expect(gearResults.some((entry) => entry.slug === "dungeoneers-pack")).toBe(true);
    expect(gearResults.some((entry) => entry.slug === "explorers-pack")).toBe(true);

    const subclassResults = searchCompendiumSeed({
      query: "champion fighter critical",
      type: "subclass",
    });

    expect(subclassResults.some((entry) => entry.slug === "fighter-champion")).toBe(true);
    expect(findCompendiumEntry("alert")?.payload.automation).toBe("Derived initiative bonus applies automatically.");
    expect(findCompendiumEntry("mobile")?.payload.support).toBe("Partial");
    expect(findCompendiumEntry("mobile")?.payload.automation).toContain("speed bonus");
    expect(findCompendiumEntry("athlete")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Strength", "Dexterity"]),
    );
    expect(findCompendiumEntry("observant")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Intelligence", "Wisdom"]),
    );
    expect(findCompendiumEntry("observant")?.payload.automation).toContain("passive Investigation and Perception bonuses apply automatically");
    expect(findCompendiumEntry("magic-initiate")?.payload.automation).toContain("separate feat spellcasting line");
    expect(findCompendiumEntry("skilled")?.payload.choiceSummary).toContain("choose 3");
    expect(findCompendiumEntry("resilient")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Strength", "Dexterity", "Wisdom"]),
    );
    expect(findCompendiumEntry("skill-expert")?.payload.choiceSummary).toContain("Expertise Skill");
    expect(findCompendiumEntry("skill-expert")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Intelligence", "Arcana", "Perception"]),
    );
    expect(findCompendiumEntry("acolyte")?.payload.startingGear).toEqual(["Priest's Pack", "Holy Symbol", "Healer's Kit"]);
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
