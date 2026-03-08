import { describe, expect, it } from "vitest";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { parseCharacterImport, parseCharacterRecord } from "../shared/validation";

describe("parseCharacterRecord", () => {
  it("backfills missing death save state for older saved characters", () => {
    const parsed = parseCharacterRecord({
      id: "legacy-character",
      name: "Legacy Character",
      enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
      classId: "fighter",
      speciesId: "human",
      backgroundId: "soldier",
      level: 1,
      abilities: {
        strength: 15,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
      },
      skillProficiencies: {
        athletics: "proficient",
      },
      inventory: [],
      armorId: "chain-mail",
      shieldEquipped: false,
      weaponIds: [],
      featIds: ["alert"],
      featSelections: {
        skilled: ["arcana", "history"],
      },
      bonusSpellClassId: "wizard",
      bonusSpellIds: ["fire-bolt"],
      spellIds: [],
      preparedSpellIds: [],
      homebrewIds: [],
      notes: {
        classFeatures: "",
        speciesTraits: "",
        feats: "",
      },
      currentHitPoints: 12,
      tempHitPoints: 0,
      hitDiceSpent: 0,
      inspiration: false,
      createdAt: "2026-03-06T22:00:00.000Z",
      updatedAt: "2026-03-06T22:00:00.000Z",
    });

    expect(parsed.subclass).toBe("");
    expect(parsed.featIds).toEqual(["alert"]);
    expect(parsed.featSelections).toEqual({
      skilled: ["arcana", "history"],
    });
    expect(parsed.bonusSpellClassId).toBe("wizard");
    expect(parsed.bonusSpellIds).toEqual(["fire-bolt"]);
    expect(parsed.notes.backgroundFeatures).toBe("");
    expect(parsed.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
    expect(parsed.sheetProfile).toEqual({
      appearance: "",
      alignment: "",
      languages: [],
      equipmentNotes: "",
      currencies: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 0,
        pp: 0,
      },
    });
    expect(parsed.trackedResources).toEqual([]);
    expect(parsed.spellSlotsRemaining).toEqual([]);
    expect(parsed.pactSlotsRemaining).toBe(0);
  });
});

describe("parseCharacterImport", () => {
  it("accepts exported wrapper files", () => {
    const parsed = parseCharacterImport({
      version: 1,
      exportedAt: "2026-03-07T18:00:00.000Z",
      character: {
        id: "imported-character",
        name: "Imported Character",
        enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
        classId: "wizard",
        speciesId: "elf",
        backgroundId: "sage",
        level: 3,
        abilities: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 16,
          wisdom: 13,
          charisma: 10,
        },
        skillProficiencies: {
          arcana: "proficient",
          investigation: "proficient",
        },
        inventory: [],
        armorId: null,
        shieldEquipped: false,
        weaponIds: [],
        featIds: ["observant"],
        featSelections: {
          observant: ["intelligence"],
        },
        bonusSpellClassId: "",
        bonusSpellIds: [],
        spellIds: ["mage-hand"],
        preparedSpellIds: [],
        homebrewIds: [],
        notes: {
          classFeatures: "",
          speciesTraits: "",
          feats: "",
        },
        sheetProfile: {
          appearance: "Blue cloak",
          languages: ["Common", " Elvish ", "Common"],
          currencies: {
            gp: 32,
          },
        },
        trackedResources: [
          {
            label: "Arcane Recovery",
            current: 2,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
        currentHitPoints: 14,
        tempHitPoints: 0,
        hitDiceSpent: 1,
        inspiration: false,
        createdAt: "2026-03-07T18:00:00.000Z",
        updatedAt: "2026-03-07T18:00:00.000Z",
      },
    });

    expect(parsed.name).toBe("Imported Character");
    expect(parsed.notes.backgroundFeatures).toBe("");
    expect(parsed.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
    expect(parsed.spellSlotsRemaining).toEqual([4, 2]);
    expect(parsed.pactSlotsRemaining).toBe(0);
    expect(parsed.featSelections).toEqual({
      observant: ["intelligence"],
    });
    expect(parsed.sheetProfile).toEqual({
      appearance: "Blue cloak",
      alignment: "",
      languages: ["Common", "Elvish"],
      equipmentNotes: "",
      currencies: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 32,
        pp: 0,
      },
    });
    expect(parsed.trackedResources).toEqual([
      {
        id: "tracked-resource-1",
        label: "Arcane Recovery",
        current: 1,
        max: 1,
        display: "counter",
        recovery: "longRest",
      },
    ]);
  });

  it("still accepts raw character records", () => {
    const parsed = parseCharacterImport({
      id: "raw-character",
      name: "Raw Character",
      enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
      classId: "fighter",
      speciesId: "human",
      backgroundId: "soldier",
      level: 2,
      abilities: {
        strength: 16,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
      },
      skillProficiencies: {
        athletics: "proficient",
      },
      inventory: [],
      armorId: "chain-mail",
      shieldEquipped: false,
      weaponIds: [],
      featIds: [],
      featSelections: {},
      bonusSpellClassId: "",
      bonusSpellIds: [],
      spellIds: [],
      preparedSpellIds: [],
      spellSlotsRemaining: [],
      pactSlotsRemaining: 0,
      homebrewIds: [],
      notes: {
        classFeatures: "",
        backgroundFeatures: "",
        speciesTraits: "",
        feats: "",
      },
      currentHitPoints: 18,
      tempHitPoints: 0,
      hitDiceSpent: 0,
      deathSaves: {
        successes: 1,
        failures: 0,
      },
      inspiration: true,
      createdAt: "2026-03-07T18:00:00.000Z",
      updatedAt: "2026-03-07T18:00:00.000Z",
    });

    expect(parsed.id).toBe("raw-character");
    expect(parsed.deathSaves).toEqual({
      successes: 1,
      failures: 0,
    });
    expect(parsed.spellSlotsRemaining).toEqual([]);
    expect(parsed.pactSlotsRemaining).toBe(0);
  });
});
