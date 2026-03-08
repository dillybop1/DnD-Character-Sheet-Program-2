import { describe, expect, it } from "vitest";
import { calculateDerivedState } from "../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import type { BuilderInput } from "../shared/types";
import {
  buildSavedSheetPageOneSummary,
  buildSavedSheetPageTwoSummary,
  createSavedSheetEditorDraft,
  formatSavedSheetCurrencySummary,
  parseSavedSheetLanguages,
} from "../src/lib/savedSheetBook";

function makeSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    name: "Saved Sheet Test",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "wizard",
    subclass: "",
    speciesId: "elf",
    backgroundId: "sage",
    level: 3,
    abilities: {
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 16,
      wisdom: 12,
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
    featIds: [],
    featSelections: {},
    bonusSpellClassId: "",
    bonusSpellIds: [],
    spellIds: ["fire-bolt", "magic-missile", "sleep"],
    preparedSpellIds: ["magic-missile", "sleep"],
    spellSlotsRemaining: [4, 1],
    pactSlotsRemaining: 0,
    homebrewIds: [],
    notes: {
      classFeatures: "",
      backgroundFeatures: "",
      speciesTraits: "",
      feats: "",
    },
    sheetProfile: {
      appearance: "Tall and silver-haired",
      alignment: "Neutral Good",
      languages: ["Common", "Elvish"],
      equipmentNotes: "Keeps a blue leather journal.",
      currencies: {
        cp: 4,
        sp: 8,
        ep: 0,
        gp: 23,
        pp: 1,
      },
    },
    trackedResources: [
      {
        id: "arcane-recovery",
        label: "Arcane Recovery",
        current: 1,
        max: 1,
        display: "counter",
        recovery: "longRest",
      },
    ],
    currentHitPoints: 14,
    tempHitPoints: 0,
    hitDiceSpent: 1,
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    inspiration: false,
    ...overrides,
  };
}

describe("saved sheet book helpers", () => {
  it("formats coin summaries from largest to smallest denomination", () => {
    expect(
      formatSavedSheetCurrencySummary({
        cp: 4,
        sp: 8,
        ep: 0,
        gp: 23,
        pp: 1,
      }),
    ).toBe("1 PP | 23 GP | 8 SP | 4 CP");
    expect(
      formatSavedSheetCurrencySummary({
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 0,
        pp: 0,
      }),
    ).toBe("No coins tracked");
  });

  it("builds page-one summary data from the saved character state", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const derived = calculateDerivedState(character);
    const summary = buildSavedSheetPageOneSummary(character, derived);

    expect(summary.headline).toBe("Level 3 Wizard");
    expect(summary.classLabel).toBe("Wizard");
    expect(summary.speciesLabel).toBe("Elf");
    expect(summary.backgroundLabel).toBe("Sage");
    expect(summary.subclassLabel).toBe("No subclass");
    expect(summary.armorClass).toBe("12");
    expect(summary.hitPoints).toBe("14/17");
    expect(summary.initiative).toBe("+2");
    expect(summary.proficiencyBonus).toBe("+2");
    expect(summary.slotSummary).toBe("L1:4/4 L2:1/2");
    expect(summary.trackedResourceCount).toBe(1);
  });

  it("builds page-two summary data from the saved character state", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const derived = calculateDerivedState(character);
    const summary = buildSavedSheetPageTwoSummary(character, derived);

    expect(summary.knownSpellCount).toBe(3);
    expect(summary.preparedSpellCount).toBe(2);
    expect(summary.cantripCount).toBe(1);
    expect(summary.leveledSpellCount).toBe(2);
    expect(summary.slotSummary).toBe("L1:4/4 L2:1/2");
    expect(summary.languages).toBe("Common, Elvish");
    expect(summary.currencySummary).toBe("1 PP | 23 GP | 8 SP | 4 CP");
    expect(summary.spellNames).toEqual(["Fire Bolt", "Magic Missile", "Sleep"]);
    expect(summary.trackedResources).toHaveLength(1);
    expect(summary.trackedResources[0]?.label).toBe("Arcane Recovery");
  });

  it("uses fallback text when page-two profile fields are blank", () => {
    const character = buildCharacterFromInput(
      makeSavedSheetInput({
        sheetProfile: {
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
        },
        trackedResources: [],
        spellIds: [],
        preparedSpellIds: [],
        spellSlotsRemaining: [],
      }),
    );
    const derived = calculateDerivedState(character);
    const summary = buildSavedSheetPageTwoSummary(character, derived);

    expect(summary.appearance).toBe("No appearance notes yet.");
    expect(summary.alignment).toBe("Unset");
    expect(summary.languages).toBe("No languages tracked");
    expect(summary.equipmentNotes).toBe("No equipment notes yet.");
    expect(summary.currencySummary).toBe("No coins tracked");
    expect(summary.slotSummary).toBe("L1:4/4 L2:2/2");
  });

  it("normalizes the sheet editor draft and language parsing", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const draft = createSavedSheetEditorDraft(character);

    expect(draft.sheetProfile.languages).toEqual(["Common", "Elvish"]);
    expect(draft.trackedResources).toHaveLength(1);
    expect(parseSavedSheetLanguages(" Common, Elvish, Common , Goblin ")).toEqual(["Common", "Elvish", "Goblin"]);
  });
});
