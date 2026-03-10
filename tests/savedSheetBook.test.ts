import { describe, expect, it } from "vitest";
import { calculateDerivedState } from "../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import { createInventoryItem } from "../shared/inventory";
import {
  AUTOMATED_DRUID_NATURAL_RECOVERY_ID,
  AUTOMATED_FIGHTER_SECOND_WIND_ID,
  AUTOMATED_PALADIN_LAY_ON_HANDS_ID,
  AUTOMATED_RANGER_TIRELESS_ID,
  AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
  AUTOMATED_SORCERER_SORCERY_POINTS_ID,
  AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID,
  AUTOMATED_WIZARD_ARCANE_RECOVERY_ID,
  buildTrackedResourcesForCharacter,
  recoverTrackedResourcesForRest,
  updateTrackedResourceCurrent,
} from "../shared/sheetTracking";
import type { BuilderInput } from "../shared/types";
import {
  applySavedSheetHitDiceSpend,
  applySavedSheetLayOnHandsHealing,
  applySavedSheetRest,
  applySavedSheetMagicalCunning,
  applySavedSheetSecondWindHealing,
  applySavedSheetTirelessTempHitPoints,
  applySavedSheetSorcerousRestoration,
  applySavedSheetSpellSlotRecovery,
  applySavedSheetTrackedResourceDelta,
  buildSavedSheetAbilityCards,
  buildSavedSheetFeatureSections,
  buildSavedSheetHitDiceSummary,
  buildSavedSheetSpellInspectorNavigation,
  buildSavedSheetLoadoutSummary,
  buildSavedSheetOffenseRows,
  buildSavedSheetPageOneSummary,
  buildSavedSheetTrackedResourceSections,
  buildSavedSheetRecoveryActions,
  buildSavedSheetSkillColumns,
  buildSavedSheetSpellSlotRows,
  buildSavedSheetSpellcastingHeader,
  buildSavedSheetSpellTableRows,
  buildSavedSheetPageTwoSummary,
  canTakeSavedSheetRest,
  createSavedSheetEditorDraft,
  filterSavedSheetSpellTableRows,
  formatSavedSheetCurrencySummary,
  getSavedSheetDefaultSpellId,
  parseSavedSheetLanguages,
  updateSavedSheetPactSlotsRemaining,
  updateSavedSheetSpellSlotsRemaining,
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
    trackedResources: [],
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

function makeBarbarianSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "barbarian",
      speciesId: "human",
      backgroundId: "soldier",
      level: 5,
      abilities: {
        strength: 16,
        dexterity: 14,
        constitution: 16,
        intelligence: 8,
        wisdom: 12,
        charisma: 10,
      },
      spellIds: [],
      preparedSpellIds: [],
      spellSlotsRemaining: [],
      trackedResources: [],
      currentHitPoints: 41,
    }),
    ...overrides,
  };
}

function makeDruidSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "druid",
      speciesId: "elf",
      backgroundId: "acolyte",
      level: 6,
      abilities: {
        strength: 8,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 16,
        charisma: 12,
      },
      spellIds: ["produce-flame", "goodberry"],
      preparedSpellIds: ["goodberry"],
      trackedResources: [],
    }),
    ...overrides,
  };
}

function makeBardSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "bard",
      speciesId: "human",
      backgroundId: "sage",
      level: 5,
      abilities: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 10,
        wisdom: 12,
        charisma: 16,
      },
      spellIds: ["vicious-mockery", "healing-word"],
      preparedSpellIds: ["healing-word"],
      trackedResources: [],
    }),
    ...overrides,
  };
}

function makeClericSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "cleric",
      speciesId: "human",
      backgroundId: "acolyte",
      level: 10,
      abilities: {
        strength: 10,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 16,
        charisma: 12,
      },
      spellIds: ["guidance", "bless"],
      preparedSpellIds: ["bless"],
      trackedResources: [],
    }),
    ...overrides,
  };
}

function makeFighterSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "fighter",
      speciesId: "human",
      backgroundId: "soldier",
      level: 17,
      abilities: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 10,
      },
      spellIds: [],
      preparedSpellIds: [],
      spellSlotsRemaining: [],
      trackedResources: [],
      currentHitPoints: 145,
    }),
    ...overrides,
  };
}

function makePaladinSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "paladin",
      speciesId: "human",
      backgroundId: "soldier",
      level: 12,
      abilities: {
        strength: 16,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 16,
      },
      spellIds: ["bless", "aid"],
      preparedSpellIds: ["bless", "aid"],
      trackedResources: [],
      currentHitPoints: 88,
    }),
    ...overrides,
  };
}

function makeRangerSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "ranger",
      speciesId: "human",
      backgroundId: "soldier",
      level: 14,
      abilities: {
        strength: 10,
        dexterity: 18,
        constitution: 14,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      spellIds: ["hunters-mark", "pass-without-trace"],
      preparedSpellIds: ["hunters-mark", "pass-without-trace"],
      trackedResources: [],
      currentHitPoints: 94,
    }),
    ...overrides,
  };
}

function makeRogueSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "rogue",
      speciesId: "human",
      backgroundId: "criminal",
      level: 20,
      abilities: {
        strength: 10,
        dexterity: 20,
        constitution: 14,
        intelligence: 12,
        wisdom: 12,
        charisma: 10,
      },
      spellIds: [],
      preparedSpellIds: [],
      spellSlotsRemaining: [],
      trackedResources: [],
      currentHitPoints: 143,
    }),
    ...overrides,
  };
}

function makeSorcererSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      classId: "sorcerer",
      speciesId: "human",
      backgroundId: "sage",
      level: 9,
      abilities: {
        strength: 8,
        dexterity: 14,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 18,
      },
      spellIds: ["fire-bolt", "fly"],
      preparedSpellIds: ["fly"],
      trackedResources: [],
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

  it("partitions tracked resources into needs-attention and ready sections", () => {
    const character = buildCharacterFromInput(
      makeSavedSheetInput({
        trackedResources: [
          {
            id: "torch-uses",
            label: "Torch Uses",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "manual",
          },
        ],
      }),
    );
    const derived = calculateDerivedState(character);
    const sections = buildSavedSheetTrackedResourceSections(buildSavedSheetPageTwoSummary(character, derived).trackedResources);

    expect(sections.needsAttention.map((resource) => resource.label)).toEqual(["Torch Uses"]);
    expect(sections.ready.map((resource) => resource.label)).toEqual(["Arcane Recovery"]);
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

  it("filters spell table rows by search text and bounded browse modes", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const derived = calculateDerivedState(character);
    const rows = buildSavedSheetSpellTableRows(derived);

    expect(filterSavedSheetSpellTableRows(rows, { query: "", mode: "prepared" }).map((row) => row.name)).toEqual([
      "Magic Missile",
      "Sleep",
    ]);
    expect(filterSavedSheetSpellTableRows(rows, { query: "", mode: "cantrips" }).map((row) => row.name)).toEqual([
      "Fire Bolt",
    ]);
    expect(filterSavedSheetSpellTableRows(rows, { query: "sleep", mode: "all" }).map((row) => row.name)).toEqual([
      "Sleep",
    ]);
    expect(filterSavedSheetSpellTableRows(rows, { query: "spell attack", mode: "all" }).map((row) => row.name)).toEqual([
      "Fire Bolt",
    ]);
  });

  it("builds bounded adjacent spell navigation against the current visible rows", () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    const derived = calculateDerivedState(character);
    const rows = buildSavedSheetSpellTableRows(derived);

    expect(buildSavedSheetSpellInspectorNavigation(rows, "magic-missile")).toEqual({
      currentPosition: 2,
      previousSpellId: "fire-bolt",
      nextSpellId: "sleep",
      total: 3,
    });
    expect(buildSavedSheetSpellInspectorNavigation(rows, "fire-bolt")).toEqual({
      currentPosition: 1,
      previousSpellId: null,
      nextSpellId: "magic-missile",
      total: 3,
    });
    expect(buildSavedSheetSpellInspectorNavigation(rows, null)).toEqual({
      currentPosition: null,
      previousSpellId: null,
      nextSpellId: null,
      total: 3,
    });
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
    expect(draft.trackedResources).toHaveLength(0);
    expect(parseSavedSheetLanguages(" Common, Elvish, Common , Goblin ")).toEqual(["Common", "Elvish", "Goblin"]);
  });

  it("derives automated Rage and Druid resources from class and level", () => {
    const barbarian = buildCharacterFromInput(makeBarbarianSavedSheetInput());
    const druid = buildCharacterFromInput(makeDruidSavedSheetInput());

    expect(buildTrackedResourcesForCharacter(barbarian)).toEqual([
      expect.objectContaining({
        id: "auto-resource:barbarian-rage",
        label: "Rage",
        current: 3,
        max: 3,
        display: "counter",
        recovery: "shortRestOne",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(druid)).toEqual([
      expect.objectContaining({
        id: "auto-resource:druid-wild-shape",
        label: "Wild Shape",
        current: 3,
        max: 3,
        display: "counter",
        recovery: "shortRestOne",
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-resurgence",
        label: "Wild Resurgence",
        current: 1,
        max: 1,
        display: "counter",
        recovery: "longRest",
      }),
    ]);
  });

  it("derives additional class resources for the current supported class baseline", () => {
    const bard = buildCharacterFromInput(makeBardSavedSheetInput({ abilities: { ...makeBardSavedSheetInput().abilities, charisma: 10 } }));
    const cleric = buildCharacterFromInput(makeClericSavedSheetInput());
    const fighter = buildCharacterFromInput(makeFighterSavedSheetInput());
    const paladin = buildCharacterFromInput(makePaladinSavedSheetInput());
    const ranger = buildCharacterFromInput(makeRangerSavedSheetInput());
    const rogue = buildCharacterFromInput(makeRogueSavedSheetInput());
    const sorcerer = buildCharacterFromInput(makeSorcererSavedSheetInput());
    const warlock = buildCharacterFromInput(makeWarlockSavedSheetInput({ level: 9 }));
    const wizard = buildCharacterFromInput(makeSavedSheetInput());

    expect(buildTrackedResourcesForCharacter(bard, undefined, { charisma: 3 })).toEqual([
      expect.objectContaining({
        id: "auto-resource:bard-bardic-inspiration",
        label: "Bardic Inspiration",
        current: 3,
        max: 3,
        recovery: "shortRest",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(cleric)).toEqual([
      expect.objectContaining({
        id: "auto-resource:cleric-channel-divinity",
        label: "Channel Divinity",
        current: 3,
        max: 3,
        recovery: "shortRestOne",
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-divine-intervention",
        label: "Divine Intervention",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(fighter)).toEqual([
      expect.objectContaining({
        id: "auto-resource:fighter-second-wind",
        label: "Second Wind",
        current: 4,
        max: 4,
        recovery: "shortRestOne",
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-action-surge",
        label: "Action Surge",
        current: 2,
        max: 2,
        recovery: "shortRest",
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-indomitable",
        label: "Indomitable",
        current: 3,
        max: 3,
        recovery: "longRest",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(paladin)).toEqual([
      expect.objectContaining({
        id: "auto-resource:paladin-lay-on-hands",
        label: "Lay on Hands",
        current: 60,
        max: 60,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:paladin-faithful-steed",
        label: "Faithful Steed",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:paladin-channel-divinity",
        label: "Channel Divinity",
        current: 3,
        max: 3,
        recovery: "shortRestOne",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(ranger)).toEqual([
      expect.objectContaining({
        id: "auto-resource:ranger-favored-enemy",
        label: "Favored Enemy",
        current: 5,
        max: 5,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:ranger-tireless",
        label: "Tireless",
        current: 3,
        max: 3,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:ranger-natures-veil",
        label: "Nature's Veil",
        current: 3,
        max: 3,
        recovery: "longRest",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(rogue)).toEqual([
      expect.objectContaining({
        id: "auto-resource:rogue-stroke-of-luck",
        label: "Stroke of Luck",
        current: 1,
        max: 1,
        recovery: "shortRest",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(sorcerer)).toEqual([
      expect.objectContaining({
        id: "auto-resource:sorcerer-innate-sorcery",
        label: "Innate Sorcery",
        current: 2,
        max: 2,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:sorcerer-sorcery-points",
        label: "Sorcery Points",
        current: 9,
        max: 9,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:sorcerer-sorcerous-restoration",
        label: "Sorcerous Restoration",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(warlock)).toEqual([
      expect.objectContaining({
        id: "auto-resource:warlock-contact-patron",
        label: "Contact Patron",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:warlock-magical-cunning",
        label: "Magical Cunning",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "dark-ones-blessing",
        label: "Dark One's Blessing",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(wizard)).toEqual([
      expect.objectContaining({
        id: "auto-resource:wizard-arcane-recovery",
        label: "Arcane Recovery",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
    ]);
  });

  it("derives subclass-aware tracked resources for battle master and light domain characters", () => {
    const battleMaster = buildCharacterFromInput(
      makeFighterSavedSheetInput({
        subclass: "fighter-battle-master",
      }),
    );
    const landDruid = buildCharacterFromInput(
      makeDruidSavedSheetInput({
        subclass: "druid-circle-of-the-land",
      }),
    );
    const lightCleric = buildCharacterFromInput(
      makeClericSavedSheetInput({
        subclass: "cleric-light-domain",
      }),
    );

    expect(buildTrackedResourcesForCharacter(battleMaster)).toEqual([
      expect.objectContaining({
        id: "auto-resource:fighter-second-wind",
        label: "Second Wind",
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-battle-master-superiority-dice",
        label: "Superiority Dice",
        current: 5,
        max: 5,
        recovery: "shortRest",
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-action-surge",
        label: "Action Surge",
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-indomitable",
        label: "Indomitable",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(landDruid)).toEqual([
      expect.objectContaining({
        id: "auto-resource:druid-circle-of-the-land-natural-recovery",
        label: "Natural Recovery",
        current: 1,
        max: 1,
        recovery: "longRest",
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-shape",
        label: "Wild Shape",
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-resurgence",
        label: "Wild Resurgence",
      }),
    ]);

    expect(buildTrackedResourcesForCharacter(lightCleric)).toEqual([
      expect.objectContaining({
        id: "auto-resource:cleric-channel-divinity",
        label: "Channel Divinity",
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-divine-intervention",
        label: "Divine Intervention",
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-light-domain-warding-flare",
        label: "Warding Flare",
        current: 3,
        max: 3,
        recovery: "longRest",
      }),
    ]);
  });

  it("keeps automated resources out of the editable draft while preserving manual rows", () => {
    const character = buildCharacterFromInput(
      makeBarbarianSavedSheetInput({
        trackedResources: [
          {
            id: "torch-uses",
            label: "Torch Uses",
            current: 2,
            max: 3,
            display: "counter",
            recovery: "manual",
          },
          {
            id: "auto-resource:barbarian-rage",
            label: "Rage",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
        ],
      }),
    );
    const draft = createSavedSheetEditorDraft(character);

    expect(draft.trackedResources).toHaveLength(1);
    expect(draft.trackedResources[0]?.label).toBe("Torch Uses");
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
          {
            id: "wild-shape",
            label: "Wild Shape",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
        ],
      }),
    );

    expect(updateTrackedResourceCurrent(character.trackedResources, "wand-charges", 2)[1]?.current).toBe(2);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "shortRest")[2]?.current).toBe(2);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "longRest")[0]?.current).toBe(1);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "longRest")[1]?.current).toBe(1);
    expect(recoverTrackedResourcesForRest(character.trackedResources, "longRest")[2]?.current).toBe(3);
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
    expect(rested.trackedResources.find((resource) => resource.id === "dark-ones-blessing")?.current).toBe(1);
    expect(rested.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });

  it("builds hit-die summary data and applies bounded spend shortcuts on the saved sheet", () => {
    const character = buildCharacterFromInput(
      makeSavedSheetInput({
        currentHitPoints: 12,
        hitDiceSpent: 1,
      }),
    );
    const derived = calculateDerivedState(character);

    expect(buildSavedSheetHitDiceSummary(character, derived)).toEqual({
      available: 2,
      spent: 1,
      max: 3,
      hitDie: 6,
      hitDieLabel: "d6",
      averageHealingPerDie: 5,
    });

    const spentOnly = applySavedSheetHitDiceSpend(character, derived, 1, "spendOnly");
    expect(spentOnly.currentHitPoints).toBe(12);
    expect(spentOnly.hitDiceSpent).toBe(2);

    const averageHealed = applySavedSheetHitDiceSpend(character, derived, 2, "averageHeal");
    expect(averageHealed.currentHitPoints).toBe(derived.hitPointsMax);
    expect(averageHealed.hitDiceSpent).toBe(3);
  });

  it("keeps average-heal hit-die shortcuts bounded by available dice and max hit points", () => {
    const character = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        currentHitPoints: 18,
        hitDiceSpent: 2,
      }),
    );
    const derived = calculateDerivedState(character);
    const averageHealed = applySavedSheetHitDiceSpend(character, derived, 5, "averageHeal");

    expect(averageHealed.currentHitPoints).toBe(derived.hitPointsMax);
    expect(averageHealed.hitDiceSpent).toBe(3);

    const fullHitPointsCharacter = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        currentHitPoints: derived.hitPointsMax,
      }),
    );
    const fullHitPointsDerived = calculateDerivedState(fullHitPointsCharacter);

    expect(applySavedSheetHitDiceSpend(fullHitPointsCharacter, fullHitPointsDerived, 1, "averageHeal")).toBe(fullHitPointsCharacter);
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
    expect(rested.trackedResources.find((resource) => resource.id === "dark-ones-blessing")?.current).toBe(1);
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
        trackedResources: [],
      }),
    );
    const derived = calculateDerivedState(character);
    const rested = applySavedSheetRest(character, derived, "longRest");

    expect(rested.currentHitPoints).toBe(derived.hitPointsMax);
    expect(rested.tempHitPoints).toBe(0);
    expect(rested.hitDiceSpent).toBe(0);
    expect(rested.spellSlotsRemaining).toEqual([4, 2]);
    expect(rested.pactSlotsRemaining).toBe(0);
    expect(rested.trackedResources.find((resource) => resource.id === "auto-resource:wizard-arcane-recovery")?.current).toBe(1);
    expect(rested.deathSaves).toEqual({
      successes: 0,
      failures: 0,
    });
  });

  it("updates bounded standard and pact spell slot tracking directly on the saved-sheet route", () => {
    const wizard = buildCharacterFromInput(makeSavedSheetInput());
    const wizardDerived = calculateDerivedState(wizard);
    const wizardAfterUse = updateSavedSheetSpellSlotsRemaining(wizard, wizardDerived, 0, 3);
    const wizardAfterRestore = updateSavedSheetSpellSlotsRemaining(wizardAfterUse, wizardDerived, 1, 2);

    expect(wizardAfterUse.spellSlotsRemaining).toEqual([3, 1]);
    expect(wizardAfterRestore.spellSlotsRemaining).toEqual([3, 2]);

    const warlock = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        pactSlotsRemaining: 2,
      }),
    );
    const warlockDerived = calculateDerivedState(warlock);
    const warlockAfterUse = updateSavedSheetPactSlotsRemaining(warlock, warlockDerived, 1);
    const warlockAfterRestore = updateSavedSheetPactSlotsRemaining(warlockAfterUse, warlockDerived, 2);

    expect(warlockAfterUse.pactSlotsRemaining).toBe(1);
    expect(warlockAfterRestore.pactSlotsRemaining).toBe(2);
  });

  it("applies bounded tracked-resource pool deltas directly on the saved-sheet route", () => {
    const paladin = buildCharacterFromInput(
      makePaladinSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:paladin-lay-on-hands",
            label: "Lay on Hands",
            current: 30,
            max: 60,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const paladinDerived = calculateDerivedState(paladin);
    const paladinSpent = applySavedSheetTrackedResourceDelta(paladin, paladinDerived, "auto-resource:paladin-lay-on-hands", -5);
    const paladinRestored = applySavedSheetTrackedResourceDelta(paladinSpent, paladinDerived, "auto-resource:paladin-lay-on-hands", 8);

    expect(paladinSpent.trackedResources.find((resource) => resource.id === "auto-resource:paladin-lay-on-hands")?.current).toBe(25);
    expect(paladinRestored.trackedResources.find((resource) => resource.id === "auto-resource:paladin-lay-on-hands")?.current).toBe(33);

    const sorcerer = buildCharacterFromInput(
      makeSorcererSavedSheetInput({
        trackedResources: [
          {
            id: AUTOMATED_SORCERER_SORCERY_POINTS_ID,
            label: "Sorcery Points",
            current: 2,
            max: 9,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const sorcererDerived = calculateDerivedState(sorcerer);
    const sorcererClampedSpend = applySavedSheetTrackedResourceDelta(sorcerer, sorcererDerived, AUTOMATED_SORCERER_SORCERY_POINTS_ID, -9);
    const sorcererClampedRestore = applySavedSheetTrackedResourceDelta(sorcererClampedSpend, sorcererDerived, AUTOMATED_SORCERER_SORCERY_POINTS_ID, 20);

    expect(sorcererClampedSpend.trackedResources.find((resource) => resource.id === AUTOMATED_SORCERER_SORCERY_POINTS_ID)?.current).toBe(0);
    expect(sorcererClampedRestore.trackedResources.find((resource) => resource.id === AUTOMATED_SORCERER_SORCERY_POINTS_ID)?.current).toBe(9);
  });

  it("applies bounded Lay on Hands healing directly on the saved-sheet route", () => {
    const paladin = buildCharacterFromInput(
      makePaladinSavedSheetInput({
        currentHitPoints: 68,
        trackedResources: [
          {
            id: AUTOMATED_PALADIN_LAY_ON_HANDS_ID,
            label: "Lay on Hands",
            current: 25,
            max: 60,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const paladinDerived = calculateDerivedState(paladin);
    const healed = applySavedSheetLayOnHandsHealing(paladin, paladinDerived, 5);

    expect(healed.currentHitPoints).toBe(73);
    expect(healed.trackedResources.find((resource) => resource.id === AUTOMATED_PALADIN_LAY_ON_HANDS_ID)?.current).toBe(20);

    const clamped = applySavedSheetLayOnHandsHealing(healed, paladinDerived, 99);

    expect(clamped.currentHitPoints).toBe(93);
    expect(clamped.trackedResources.find((resource) => resource.id === AUTOMATED_PALADIN_LAY_ON_HANDS_ID)?.current).toBe(0);
  });

  it("applies bounded Second Wind healing directly on the saved-sheet route", () => {
    const fighter = buildCharacterFromInput(
      makeFighterSavedSheetInput({
        currentHitPoints: 120,
        trackedResources: [
          {
            id: AUTOMATED_FIGHTER_SECOND_WIND_ID,
            label: "Second Wind",
            current: 3,
            max: 4,
            display: "counter",
            recovery: "shortRestOne",
          },
        ],
      }),
    );
    const fighterDerived = calculateDerivedState(fighter);
    const healed = applySavedSheetSecondWindHealing(fighter, fighterDerived);

    expect(healed.currentHitPoints).toBe(143);
    expect(healed.trackedResources.find((resource) => resource.id === AUTOMATED_FIGHTER_SECOND_WIND_ID)?.current).toBe(2);

    const maxed = applySavedSheetSecondWindHealing(
      buildCharacterFromInput(
        makeFighterSavedSheetInput({
          currentHitPoints: fighterDerived.hitPointsMax,
          trackedResources: [
            {
              id: AUTOMATED_FIGHTER_SECOND_WIND_ID,
              label: "Second Wind",
              current: 3,
              max: 4,
              display: "counter",
              recovery: "shortRestOne",
            },
          ],
        }),
      ),
      fighterDerived,
    );

    expect(maxed.currentHitPoints).toBe(fighterDerived.hitPointsMax);
  });

  it("applies bounded Tireless temporary hit points directly on the saved-sheet route", () => {
    const ranger = buildCharacterFromInput(
      makeRangerSavedSheetInput({
        tempHitPoints: 0,
        trackedResources: [
          {
            id: AUTOMATED_RANGER_TIRELESS_ID,
            label: "Tireless",
            current: 3,
            max: 3,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const rangerDerived = calculateDerivedState(ranger);
    const gained = applySavedSheetTirelessTempHitPoints(ranger, rangerDerived);

    expect(gained.tempHitPoints).toBe(8);
    expect(gained.trackedResources.find((resource) => resource.id === AUTOMATED_RANGER_TIRELESS_ID)?.current).toBe(2);

    const unchanged = applySavedSheetTirelessTempHitPoints(
      buildCharacterFromInput(
        makeRangerSavedSheetInput({
          tempHitPoints: 9,
          trackedResources: [
            {
              id: AUTOMATED_RANGER_TIRELESS_ID,
              label: "Tireless",
              current: 3,
              max: 3,
              display: "counter",
              recovery: "longRest",
            },
          ],
        }),
      ),
      rangerDerived,
    );

    expect(unchanged.tempHitPoints).toBe(9);
  });

  it("builds bounded saved-sheet recovery actions for spell slots and magic-resource features", () => {
    const wizard = buildCharacterFromInput(
      makeSavedSheetInput({
        level: 3,
        spellSlotsRemaining: [2, 0],
      }),
    );
    const wizardDerived = calculateDerivedState(wizard);
    const wizardArcaneRecovery = buildSavedSheetRecoveryActions(wizard, wizardDerived).find(
      (action) => action.resourceId === AUTOMATED_WIZARD_ARCANE_RECOVERY_ID,
    );

    expect(wizardArcaneRecovery).toEqual(
      expect.objectContaining({
        kind: "spellSlots",
        label: "Arcane Recovery",
        disabledReason: null,
        slotBudget: 2,
        maxRecoverableSlotLevel: 5,
        recoverableSlotLevels: [1, 2],
      }),
    );

    const warlock = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        level: 9,
        pactSlotsRemaining: 1,
      }),
    );
    const warlockDerived = calculateDerivedState(warlock);
    const magicalCunning = buildSavedSheetRecoveryActions(warlock, warlockDerived).find(
      (action) => action.resourceId === AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID,
    );

    expect(magicalCunning).toEqual(
      expect.objectContaining({
        kind: "pactSlots",
        label: "Magical Cunning",
        disabledReason: null,
        recoverAmount: 1,
        pactSlotsRemaining: 1,
        pactSlotsMax: 2,
      }),
    );

    const sorcerer = buildCharacterFromInput(
      makeSorcererSavedSheetInput({
        level: 9,
        trackedResources: [
          {
            id: AUTOMATED_SORCERER_SORCERY_POINTS_ID,
            label: "Sorcery Points",
            current: 2,
            max: 9,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
            label: "Sorcerous Restoration",
            current: 1,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const sorcererDerived = calculateDerivedState(sorcerer);
    const sorcerousRestoration = buildSavedSheetRecoveryActions(sorcerer, sorcererDerived).find(
      (action) => action.resourceId === AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
    );

    expect(sorcerousRestoration).toEqual(
      expect.objectContaining({
        kind: "trackedResource",
        label: "Sorcerous Restoration",
        disabledReason: null,
        recoverAmount: 4,
        targetLabel: "Sorcery Points",
        targetCurrent: 2,
        targetMax: 9,
      }),
    );
  });

  it("applies bounded recovery helpers for pact, sorcery-point, and slot-based automation", () => {
    const warlock = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        level: 9,
        pactSlotsRemaining: 0,
        trackedResources: [
          {
            id: AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID,
            label: "Magical Cunning",
            current: 1,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const warlockDerived = calculateDerivedState(warlock);
    const warlockRecovered = applySavedSheetMagicalCunning(warlock, warlockDerived);

    expect(warlockRecovered.pactSlotsRemaining).toBe(warlockDerived.spellcasting.pactSlotsMax);
    expect(warlockRecovered.trackedResources.find((resource) => resource.id === AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID)?.current).toBe(0);

    const sorcerer = buildCharacterFromInput(
      makeSorcererSavedSheetInput({
        level: 9,
        trackedResources: [
          {
            id: AUTOMATED_SORCERER_SORCERY_POINTS_ID,
            label: "Sorcery Points",
            current: 2,
            max: 9,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
            label: "Sorcerous Restoration",
            current: 1,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const sorcererDerived = calculateDerivedState(sorcerer);
    const sorcererRecovered = applySavedSheetSorcerousRestoration(sorcerer, sorcererDerived);

    expect(sorcererRecovered.trackedResources.find((resource) => resource.id === AUTOMATED_SORCERER_SORCERY_POINTS_ID)?.current).toBe(6);
    expect(sorcererRecovered.trackedResources.find((resource) => resource.id === AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID)?.current).toBe(0);

    const wizard = buildCharacterFromInput(
      makeSavedSheetInput({
        level: 3,
        spellSlotsRemaining: [2, 0],
      }),
    );
    const wizardDerived = calculateDerivedState(wizard);
    const wizardRecovered = applySavedSheetSpellSlotRecovery(
      wizard,
      wizardDerived,
      AUTOMATED_WIZARD_ARCANE_RECOVERY_ID,
      [2, 0],
    );

    expect(wizardRecovered.spellSlotsRemaining).toEqual([4, 0]);
    expect(wizardRecovered.trackedResources.find((resource) => resource.id === AUTOMATED_WIZARD_ARCANE_RECOVERY_ID)?.current).toBe(0);

    const wizardInvalidRecovery = applySavedSheetSpellSlotRecovery(
      wizard,
      wizardDerived,
      AUTOMATED_WIZARD_ARCANE_RECOVERY_ID,
      [0, 2],
    );

    expect(wizardInvalidRecovery).toBe(wizard);

    const landDruid = buildCharacterFromInput(
      makeDruidSavedSheetInput({
        subclass: "druid-circle-of-the-land",
        spellSlotsRemaining: [4, 3, 2],
      }),
    );
    const landDruidDerived = calculateDerivedState(landDruid);
    const landDruidRecovered = applySavedSheetSpellSlotRecovery(
      landDruid,
      landDruidDerived,
      AUTOMATED_DRUID_NATURAL_RECOVERY_ID,
      [0, 0, 1],
    );

    expect(landDruidRecovered.spellSlotsRemaining).toEqual([4, 3, 3]);
    expect(landDruidRecovered.trackedResources.find((resource) => resource.id === AUTOMATED_DRUID_NATURAL_RECOVERY_ID)?.current).toBe(0);
  });

  it("surfaces automated resources in saved-sheet summaries and restores one use on a short rest", () => {
    const character = buildCharacterFromInput(
      makeBarbarianSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:barbarian-rage",
            label: "Rage",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
        ],
      }),
    );
    const derived = calculateDerivedState(character);
    const pageOneSummary = buildSavedSheetPageOneSummary(character, derived);
    const pageTwoSummary = buildSavedSheetPageTwoSummary(character, derived);
    const shortRested = applySavedSheetRest(character, derived, "shortRest");

    expect(pageOneSummary.trackedResourceCount).toBe(1);
    expect(pageTwoSummary.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:barbarian-rage",
        label: "Rage",
        current: 1,
        max: 3,
      }),
    ]);
    expect(shortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:barbarian-rage",
        current: 2,
        max: 3,
      }),
    ]);
  });

  it("applies mixed automated recovery rules for fighter and paladin resources", () => {
    const fighter = buildCharacterFromInput(
      makeFighterSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:fighter-second-wind",
            label: "Second Wind",
            current: 1,
            max: 4,
            display: "counter",
            recovery: "shortRestOne",
          },
          {
            id: "auto-resource:fighter-action-surge",
            label: "Action Surge",
            current: 0,
            max: 2,
            display: "counter",
            recovery: "shortRest",
          },
          {
            id: "auto-resource:fighter-indomitable",
            label: "Indomitable",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const fighterDerived = calculateDerivedState(fighter);
    const fighterShortRested = applySavedSheetRest(fighter, fighterDerived, "shortRest");

    expect(fighterShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:fighter-second-wind",
        current: 2,
        max: 4,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-action-surge",
        current: 2,
        max: 2,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-indomitable",
        current: 1,
        max: 3,
      }),
    ]);

    const fighterLongRested = applySavedSheetRest(fighter, fighterDerived, "longRest");

    expect(fighterLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:fighter-second-wind",
        current: 4,
        max: 4,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-action-surge",
        current: 2,
        max: 2,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-indomitable",
        current: 3,
        max: 3,
      }),
    ]);

    const paladin = buildCharacterFromInput(
      makePaladinSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:paladin-lay-on-hands",
            label: "Lay on Hands",
            current: 12,
            max: 60,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:paladin-faithful-steed",
            label: "Faithful Steed",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:paladin-channel-divinity",
            label: "Channel Divinity",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
        ],
      }),
    );
    const paladinDerived = calculateDerivedState(paladin);
    const paladinLongRested = applySavedSheetRest(paladin, paladinDerived, "longRest");

    expect(paladinLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:paladin-lay-on-hands",
        current: 60,
        max: 60,
      }),
      expect.objectContaining({
        id: "auto-resource:paladin-faithful-steed",
        current: 1,
        max: 1,
      }),
      expect.objectContaining({
        id: "auto-resource:paladin-channel-divinity",
        current: 3,
        max: 3,
      }),
    ]);
  });

  it("restores rogue stroke-of-luck automation on short or long rests", () => {
    const rogue = buildCharacterFromInput(
      makeRogueSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:rogue-stroke-of-luck",
            label: "Stroke of Luck",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "shortRest",
          },
        ],
      }),
    );
    const rogueDerived = calculateDerivedState(rogue);
    const rogueShortRested = applySavedSheetRest(rogue, rogueDerived, "shortRest");
    const rogueLongRested = applySavedSheetRest(rogue, rogueDerived, "longRest");

    expect(rogueShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:rogue-stroke-of-luck",
        current: 1,
        max: 1,
      }),
    ]);
    expect(rogueLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:rogue-stroke-of-luck",
        current: 1,
        max: 1,
      }),
    ]);
  });

  it("applies subclass-aware recovery rules for battle master and light domain counters", () => {
    const battleMaster = buildCharacterFromInput(
      makeFighterSavedSheetInput({
        subclass: "fighter-battle-master",
        trackedResources: [
          {
            id: "auto-resource:fighter-second-wind",
            label: "Second Wind",
            current: 1,
            max: 4,
            display: "counter",
            recovery: "shortRestOne",
          },
          {
            id: "auto-resource:fighter-battle-master-superiority-dice",
            label: "Superiority Dice",
            current: 1,
            max: 5,
            display: "counter",
            recovery: "shortRest",
          },
          {
            id: "auto-resource:fighter-action-surge",
            label: "Action Surge",
            current: 0,
            max: 2,
            display: "counter",
            recovery: "shortRest",
          },
          {
            id: "auto-resource:fighter-indomitable",
            label: "Indomitable",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const battleMasterDerived = calculateDerivedState(battleMaster);
    const battleMasterShortRested = applySavedSheetRest(battleMaster, battleMasterDerived, "shortRest");

    expect(battleMasterShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:fighter-second-wind",
        current: 2,
        max: 4,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-battle-master-superiority-dice",
        current: 5,
        max: 5,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-action-surge",
        current: 2,
        max: 2,
      }),
      expect.objectContaining({
        id: "auto-resource:fighter-indomitable",
        current: 1,
        max: 3,
      }),
    ]);

    const landDruid = buildCharacterFromInput(
      makeDruidSavedSheetInput({
        subclass: "druid-circle-of-the-land",
        trackedResources: [
          {
            id: "auto-resource:druid-circle-of-the-land-natural-recovery",
            label: "Natural Recovery",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:druid-wild-shape",
            label: "Wild Shape",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
          {
            id: "auto-resource:druid-wild-resurgence",
            label: "Wild Resurgence",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const landDruidDerived = calculateDerivedState(landDruid);
    const landDruidShortRested = applySavedSheetRest(landDruid, landDruidDerived, "shortRest");
    const landDruidLongRested = applySavedSheetRest(landDruid, landDruidDerived, "longRest");

    expect(landDruidShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:druid-circle-of-the-land-natural-recovery",
        current: 0,
        max: 1,
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-shape",
        current: 2,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-resurgence",
        current: 0,
        max: 1,
      }),
    ]);
    expect(landDruidLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:druid-circle-of-the-land-natural-recovery",
        current: 1,
        max: 1,
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-shape",
        current: 3,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-resurgence",
        current: 1,
        max: 1,
      }),
    ]);

    const lightCleric = buildCharacterFromInput(
      makeClericSavedSheetInput({
        subclass: "cleric-light-domain",
        trackedResources: [
          {
            id: "auto-resource:cleric-channel-divinity",
            label: "Channel Divinity",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
          {
            id: "auto-resource:cleric-divine-intervention",
            label: "Divine Intervention",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:cleric-light-domain-warding-flare",
            label: "Warding Flare",
            current: 0,
            max: 3,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const lightClericDerived = calculateDerivedState(lightCleric);
    const lightClericShortRested = applySavedSheetRest(lightCleric, lightClericDerived, "shortRest");
    const lightClericLongRested = applySavedSheetRest(lightCleric, lightClericDerived, "longRest");

    expect(lightClericShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:cleric-channel-divinity",
        current: 2,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-divine-intervention",
        current: 0,
        max: 1,
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-light-domain-warding-flare",
        current: 0,
        max: 3,
      }),
    ]);
    expect(lightClericLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:cleric-channel-divinity",
        current: 3,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-divine-intervention",
        current: 1,
        max: 1,
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-light-domain-warding-flare",
        current: 3,
        max: 3,
      }),
    ]);
  });

  it("applies bounded recovery rules for cleric and ranger long-rest automation", () => {
    const cleric = buildCharacterFromInput(
      makeClericSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:cleric-channel-divinity",
            label: "Channel Divinity",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
          {
            id: "auto-resource:cleric-divine-intervention",
            label: "Divine Intervention",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const clericDerived = calculateDerivedState(cleric);
    const clericShortRested = applySavedSheetRest(cleric, clericDerived, "shortRest");
    const clericLongRested = applySavedSheetRest(cleric, clericDerived, "longRest");

    expect(clericShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:cleric-channel-divinity",
        current: 2,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-divine-intervention",
        current: 0,
        max: 1,
      }),
    ]);
    expect(clericLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:cleric-channel-divinity",
        current: 3,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:cleric-divine-intervention",
        current: 1,
        max: 1,
      }),
    ]);

    const ranger = buildCharacterFromInput(
      makeRangerSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:ranger-favored-enemy",
            label: "Favored Enemy",
            current: 1,
            max: 5,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:ranger-tireless",
            label: "Tireless",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:ranger-natures-veil",
            label: "Nature's Veil",
            current: 0,
            max: 3,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const rangerDerived = calculateDerivedState(ranger);
    const rangerShortRested = applySavedSheetRest(ranger, rangerDerived, "shortRest");
    const rangerLongRested = applySavedSheetRest(ranger, rangerDerived, "longRest");

    expect(rangerShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:ranger-favored-enemy",
        current: 1,
        max: 5,
      }),
      expect.objectContaining({
        id: "auto-resource:ranger-tireless",
        current: 1,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:ranger-natures-veil",
        current: 0,
        max: 3,
      }),
    ]);
    expect(rangerLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:ranger-favored-enemy",
        current: 5,
        max: 5,
      }),
      expect.objectContaining({
        id: "auto-resource:ranger-tireless",
        current: 3,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:ranger-natures-veil",
        current: 3,
        max: 3,
      }),
    ]);
  });

  it("restores Druid, Sorcerer, and Warlock long-rest automation without treating short rests as universal refills", () => {
    const druid = buildCharacterFromInput(
      makeDruidSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:druid-wild-shape",
            label: "Wild Shape",
            current: 1,
            max: 3,
            display: "counter",
            recovery: "shortRestOne",
          },
          {
            id: "auto-resource:druid-wild-resurgence",
            label: "Wild Resurgence",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const druidDerived = calculateDerivedState(druid);
    const druidShortRested = applySavedSheetRest(druid, druidDerived, "shortRest");
    const druidLongRested = applySavedSheetRest(druid, druidDerived, "longRest");

    expect(druidShortRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:druid-wild-shape",
        current: 2,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-resurgence",
        current: 0,
        max: 1,
      }),
    ]);
    expect(druidLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:druid-wild-shape",
        current: 3,
        max: 3,
      }),
      expect.objectContaining({
        id: "auto-resource:druid-wild-resurgence",
        current: 1,
        max: 1,
      }),
    ]);

    const sorcerer = buildCharacterFromInput(
      makeSorcererSavedSheetInput({
        trackedResources: [
          {
            id: "auto-resource:sorcerer-innate-sorcery",
            label: "Innate Sorcery",
            current: 0,
            max: 2,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:sorcerer-sorcery-points",
            label: "Sorcery Points",
            current: 2,
            max: 9,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:sorcerer-sorcerous-restoration",
            label: "Sorcerous Restoration",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const sorcererDerived = calculateDerivedState(sorcerer);
    const sorcererShortRested = applySavedSheetRest(sorcerer, sorcererDerived, "shortRest");
    const sorcererLongRested = applySavedSheetRest(sorcerer, sorcererDerived, "longRest");

    expect(sorcererShortRested.trackedResources.find((resource) => resource.id === "auto-resource:sorcerer-sorcerous-restoration")?.current).toBe(0);
    expect(sorcererLongRested.trackedResources).toEqual([
      expect.objectContaining({
        id: "auto-resource:sorcerer-innate-sorcery",
        current: 2,
        max: 2,
      }),
      expect.objectContaining({
        id: "auto-resource:sorcerer-sorcery-points",
        current: 9,
        max: 9,
      }),
      expect.objectContaining({
        id: "auto-resource:sorcerer-sorcerous-restoration",
        current: 1,
        max: 1,
      }),
    ]);

    const warlock = buildCharacterFromInput(
      makeWarlockSavedSheetInput({
        level: 9,
        trackedResources: [
          {
            id: "auto-resource:warlock-contact-patron",
            label: "Contact Patron",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
          {
            id: "auto-resource:warlock-magical-cunning",
            label: "Magical Cunning",
            current: 0,
            max: 1,
            display: "counter",
            recovery: "longRest",
          },
        ],
      }),
    );
    const warlockDerived = calculateDerivedState(warlock);
    const warlockShortRested = applySavedSheetRest(warlock, warlockDerived, "shortRest");
    const warlockLongRested = applySavedSheetRest(warlock, warlockDerived, "longRest");

    expect(warlockShortRested.trackedResources.find((resource) => resource.id === "auto-resource:warlock-contact-patron")?.current).toBe(0);
    expect(warlockShortRested.trackedResources.find((resource) => resource.id === "auto-resource:warlock-magical-cunning")?.current).toBe(0);
    expect(warlockLongRested.trackedResources.find((resource) => resource.id === "auto-resource:warlock-contact-patron")?.current).toBe(1);
    expect(warlockLongRested.trackedResources.find((resource) => resource.id === "auto-resource:warlock-magical-cunning")?.current).toBe(1);
  });
});
