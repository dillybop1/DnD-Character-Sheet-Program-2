import { describe, expect, it } from "vitest";
import { calculateDerivedState } from "../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import { createInventoryItem } from "../shared/inventory";
import { recoverTrackedResourcesForRest, updateTrackedResourceCurrent } from "../shared/sheetTracking";
import type { BuilderInput } from "../shared/types";
import {
  applySavedSheetRest,
  buildSavedSheetAbilityCards,
  buildSavedSheetFeatureSections,
  buildSavedSheetLoadoutSummary,
  buildSavedSheetOffenseRows,
  buildSavedSheetPageOneSummary,
  buildSavedSheetSkillColumns,
  buildSavedSheetSpellSlotRows,
  buildSavedSheetSpellcastingHeader,
  buildSavedSheetSpellTableRows,
  buildSavedSheetPageTwoSummary,
  canTakeSavedSheetRest,
  createSavedSheetEditorDraft,
  formatSavedSheetCurrencySummary,
  getSavedSheetDefaultSpellId,
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

function makeWarlockSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "warlock",
      speciesId: "human",
      backgroundId: "criminal",
      abilities: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 12,
        charisma: 16,
      },
      spellIds: ["eldritch-blast", "hex"],
      preparedSpellIds: ["hex"],
      spellSlotsRemaining: [],
      pactSlotsRemaining: 0,
      trackedResources: [
        {
          id: "dark-ones-blessing",
          label: "Dark One's Blessing",
          current: 0,
          max: 1,
          display: "checkboxes",
          recovery: "shortRest",
        },
      ],
    }),
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

  it("builds spell table rows with inspector-friendly metadata", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const derived = calculateDerivedState(character);
    const rows = buildSavedSheetSpellTableRows(derived);

    expect(rows.map((row) => row.name)).toEqual(["Fire Bolt", "Magic Missile", "Sleep"]);
    expect(rows[0]).toMatchObject({
      name: "Fire Bolt",
      levelLabel: "Cantrip",
      rangeLabel: "120 feet",
      saveLabel: "Spell attack",
      castLabel: "Action",
      durationLabel: "Instantaneous",
      concentrationLabel: "No",
      prepared: false,
    });
    expect(rows[2]).toMatchObject({
      name: "Sleep",
      prepared: true,
      higherLevel: undefined,
    });
    expect(getSavedSheetDefaultSpellId(rows)).toBe("magic-missile");
  });

  it("builds worksheet-friendly spellcasting header and slot ledger data", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const derived = calculateDerivedState(character);

    expect(buildSavedSheetSpellcastingHeader(derived)).toMatchObject({
      focusLabel: "Intelligence focus",
      focusShortLabel: "Int",
      spellAttackLabel: "+5",
      spellSaveLabel: "DC 13",
      bonusLine: null,
    });

    expect(buildSavedSheetSpellSlotRows(derived)).toEqual([
      {
        id: "spell-slot-1",
        levelLabel: "Level 1",
        total: 4,
        expended: 0,
        remaining: 4,
      },
      {
        id: "spell-slot-2",
        levelLabel: "Level 2",
        total: 2,
        expended: 1,
        remaining: 1,
      },
    ]);
  });

  it("builds page-one worksheet detail data without relying on the old embedded preview", () => {
    const character = buildCharacterFromInput(
      makeSavedSheetInput({
        inventory: [
          createInventoryItem("armor", "leather", { equipped: true }),
          createInventoryItem("weapon", "quarterstaff", { equipped: true }),
          createInventoryItem("gear", "thieves-tools", { quantity: 1 }),
        ],
      }),
    );
    const derived = calculateDerivedState(character);

    expect(buildSavedSheetAbilityCards(derived)[0]).toMatchObject({
      ability: "strength",
      longLabel: "Strength",
      shortLabel: "STR",
      score: 8,
      modifierLabel: "-1",
      saveLabel: "-1",
      saveProficient: false,
    });

    const skillColumns = buildSavedSheetSkillColumns(derived);
    expect(skillColumns[0]?.[2]).toMatchObject({
      skill: "arcana",
      label: "Arcana",
      modifierLabel: "+5",
      rank: 1,
    });

    expect(buildSavedSheetOffenseRows(derived)).toEqual([
      {
        id: "quarterstaff",
        name: "Quarterstaff",
        attackLabel: "+1",
        damage: "1d6 + -1 bludgeoning",
        notes: "Versatile (1d8)",
      },
      {
        id: "fire-bolt",
        name: "Fire Bolt",
        attackLabel: "+5",
        damage: "1d10 fire",
        notes: "Spell attack",
      },
    ]);

    expect(buildSavedSheetFeatureSections(derived)[0]).toMatchObject({
      id: "class-features",
      title: "Class & Subclass Features",
      entries: ["Arcane Recovery", "Spellcasting", "Ritual Casting"],
    });

    expect(buildSavedSheetLoadoutSummary(derived)).toMatchObject({
      armorLabel: "Leather Armor",
      armorId: "leather",
      shieldEquipped: false,
      equippedWeapons: [{ name: "Quarterstaff" }],
      carriedGear: [{ name: "Thieves' Tools", quantity: 1 }],
      passiveSenses: [
        { id: "perception", label: "Per", value: 11 },
        { id: "investigation", label: "Inv", value: 15 },
        { id: "insight", label: "Ins", value: 11 },
      ],
    });
  });

  it("builds a pact slot ledger row for pact casters", () => {
    const character = buildCharacterFromInput(makeWarlockSavedSheetInput());
    const derived = calculateDerivedState(character);

    expect(buildSavedSheetSpellcastingHeader(derived)).toMatchObject({
      focusLabel: "Charisma focus",
      focusShortLabel: "Cha",
      spellAttackLabel: "+5",
      spellSaveLabel: "DC 13",
    });

    expect(buildSavedSheetSpellSlotRows(derived)).toEqual([
      {
        id: "pact-slots",
        levelLabel: "Level 2",
        total: 2,
        expended: 2,
        remaining: 0,
      },
    ]);
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

  it("updates tracked resources and recovers only the resources allowed by a rest", () => {
    const character = buildCharacterFromInput(
      makeSavedSheetInput({
        trackedResources: [
          {
            id: "arcane-recovery",
            label: "Arcane Recovery",
            current: 0,
            max: 1,
            display: "checkboxes",
            recovery: "longRest",
          },
          {
            id: "wand-charges",
            label: "Wand Charges",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "manual",
          },
        ],
      }),
    );

    expect(updateTrackedResourceCurrent(character.trackedResources, "wand-charges", 2)[1]?.current).toBe(2);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "shortRest")).toEqual(character.trackedResources);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "longRest")[0]?.current).toBe(1);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "longRest")[1]?.current).toBe(1);
  });

  it("applies bounded short-rest behavior without pretending to spend hit point dice automatically", () => {
    const character = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        currentHitPoints: 9,
        hitDiceSpent: 2,
        deathSaves: {
          successes: 1,
          failures: 2,
        },
      }),
    );
    const derived = calculateDerivedState(character);
    const rested = applySavedSheetRest(character, derived, "shortRest");

    expect(canTakeSavedSheetRest(character)).toBe(true);
    expect(rested.currentHitPoints).toBe(9);
    expect(rested.hitDiceSpent).toBe(2);
    expect(rested.pactSlotsRemaining).toBe(2);
    expect(rested.trackedResources[0]?.current).toBe(1);
    expect(rested.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });

  it("keeps rest actions available even when the saved character is at 0 hit points", () => {
    const character = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        currentHitPoints: 0,
        deathSaves: {
          successes: 2,
          failures: 1,
        },
      }),
    );
    const derived = calculateDerivedState(character);
    const rested = applySavedSheetRest(character, derived, "shortRest");

    expect(canTakeSavedSheetRest(character)).toBe(true);
    expect(rested.currentHitPoints).toBe(0);
    expect(rested.pactSlotsRemaining).toBe(2);
    expect(rested.trackedResources[0]?.current).toBe(1);
    expect(rested.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });

  it("applies bounded long-rest behavior to hit points, spell slots, and rest resources", () => {
    const character = buildCharacterFromInput(
      makeSavedSheetInput({
        currentHitPoints: 3,
        tempHitPoints: 5,
        hitDiceSpent: 2,
        deathSaves: {
          successes: 1,
          failures: 1,
        },
        trackedResources: [
          {
            id: "arcane-recovery",
            label: "Arcane Recovery",
            current: 0,
            max: 1,
            display: "checkboxes",
            recovery: "longRest",
          },
        ],
      }),
    );
    const derived = calculateDerivedState(character);
    const rested = applySavedSheetRest(character, derived, "longRest");

    expect(rested.currentHitPoints).toBe(derived.hitPointsMax);
    expect(rested.tempHitPoints).toBe(0);
    expect(rested.hitDiceSpent).toBe(0);
    expect(rested.spellSlotsRemaining).toEqual([4, 2]);
    expect(rested.pactSlotsRemaining).toBe(0);
    expect(rested.trackedResources[0]?.current).toBe(1);
    expect(rested.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });
});
