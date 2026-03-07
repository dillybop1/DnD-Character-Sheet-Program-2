import { describe, expect, it } from "vitest";
import { calculateDerivedState } from "../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import type { BuilderInput, HomebrewEntry } from "../shared/types";

function makeBaseInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    name: "Test Character",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "fighter",
    speciesId: "human",
    backgroundId: "soldier",
    level: 1,
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
      perception: "proficient",
    },
    armorId: "chain-mail",
    shieldEquipped: true,
    weaponIds: ["longsword"],
    spellIds: [],
    preparedSpellIds: [],
    homebrewIds: [],
    notes: {
      classFeatures: "",
      speciesTraits: "",
      feats: "",
    },
    inspiration: false,
    ...overrides,
  };
}

describe("calculateDerivedState", () => {
  it("computes fighter armor class from chain mail and shield", () => {
    const character = buildCharacterFromInput(makeBaseInput());
    const derived = calculateDerivedState(character);

    expect(derived.armorClass).toBe(18);
    expect(derived.proficiencyBonus).toBe(2);
    expect(derived.weaponEntries[0]?.attackBonus).toBe(5);
  });

  it("computes full caster spell values and slots", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        classId: "wizard",
        level: 5,
        abilities: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 18,
          wisdom: 12,
          charisma: 10,
        },
        armorId: null,
        shieldEquipped: false,
        spellIds: ["magic-missile", "fire-bolt"],
        preparedSpellIds: ["magic-missile", "fire-bolt"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.spellcasting.spellAttackBonus).toBe(7);
    expect(derived.spellcasting.spellSaveDC).toBe(15);
    expect(derived.spellcasting.slotMode).toBe("standard");
    expect(derived.spellcasting.spellSlotsMax).toEqual([4, 3, 2]);
    expect(derived.spellcasting.pactSlotsMax).toBe(0);
    expect(derived.spellcasting.pactSlotLevel).toBeNull();
    expect(derived.spellcasting.preparedSpells.map((spell) => spell.id)).toEqual(["magic-missile"]);
  });

  it("computes half caster spell progression for paladins", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        classId: "paladin",
        level: 13,
        abilities: {
          strength: 18,
          dexterity: 10,
          constitution: 14,
          intelligence: 8,
          wisdom: 12,
          charisma: 16,
        },
        spellIds: ["bless"],
        preparedSpellIds: ["bless"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.spellcasting.slotMode).toBe("standard");
    expect(derived.spellcasting.spellAttackBonus).toBe(8);
    expect(derived.spellcasting.spellSaveDC).toBe(16);
    expect(derived.spellcasting.spellSlotsMax).toEqual([4, 3, 3, 1]);
    expect(derived.savingThrows.charisma).toBe(8);
  });

  it("computes pact magic progression for warlocks", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        classId: "warlock",
        level: 7,
        armorId: null,
        shieldEquipped: false,
        abilities: {
          strength: 8,
          dexterity: 14,
          constitution: 14,
          intelligence: 10,
          wisdom: 12,
          charisma: 18,
        },
        spellIds: ["fire-bolt"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.spellcasting.slotMode).toBe("pact");
    expect(derived.spellcasting.spellAttackBonus).toBe(7);
    expect(derived.spellcasting.spellSaveDC).toBe(15);
    expect(derived.spellcasting.spellSlotsMax).toEqual([]);
    expect(derived.spellcasting.pactSlotsMax).toBe(2);
    expect(derived.spellcasting.pactSlotLevel).toBe(4);
  });

  it("applies granted spells and spellcasting overrides from homebrew effects", () => {
    const homebrewEntry: HomebrewEntry = {
      id: "arcane-initiate",
      name: "Arcane Initiate",
      type: "feat",
      summary: "Gain a cantrip and use Intelligence for spellcasting.",
      effects: [
        {
          id: "grant-fire-bolt",
          type: "grant_spell",
          target: "fire-bolt",
        },
        {
          id: "set-intelligence-spellcasting",
          type: "set_spellcasting_ability",
          target: "intelligence",
        },
      ],
      createdAt: "2026-03-06T22:00:00.000Z",
      updatedAt: "2026-03-06T22:00:00.000Z",
    };

    const character = buildCharacterFromInput(
      makeBaseInput({
        classId: "fighter",
        armorId: null,
        shieldEquipped: false,
        weaponIds: [],
        homebrewIds: [homebrewEntry.id],
        abilities: {
          strength: 14,
          dexterity: 12,
          constitution: 14,
          intelligence: 16,
          wisdom: 10,
          charisma: 8,
        },
      }),
      [homebrewEntry],
    );

    const derived = calculateDerivedState(character, [homebrewEntry]);

    expect(derived.spellcasting.spellAttackBonus).toBe(5);
    expect(derived.spellcasting.spellSaveDC).toBe(13);
    expect(derived.spellcasting.knownSpells.map((spell) => spell.id)).toContain("fire-bolt");
    expect(derived.spellcasting.preparedSpells).toEqual([]);
  });
});
