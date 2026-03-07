import { describe, expect, it } from "vitest";
import { calculateDerivedState } from "../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import type { BuilderInput } from "../shared/types";

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
        preparedSpellIds: ["magic-missile"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.spellcasting.spellAttackBonus).toBe(7);
    expect(derived.spellcasting.spellSaveDC).toBe(15);
    expect(derived.spellcasting.spellSlotsMax).toEqual([4, 3, 2]);
  });
});
