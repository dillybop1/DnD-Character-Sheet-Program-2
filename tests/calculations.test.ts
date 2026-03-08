import { describe, expect, it } from "vitest";
import { calculateDerivedState } from "../shared/calculations";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import { createInventoryItem } from "../shared/inventory";
import { SKILL_NAMES } from "../shared/types";
import type { BuilderInput, HomebrewEntry } from "../shared/types";

function makeBaseInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    name: "Test Character",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "fighter",
    subclass: "",
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
    featIds: [],
    featSelections: {},
    bonusSpellClassId: "",
    bonusSpellIds: [],
    spellIds: [],
    preparedSpellIds: [],
    spellSlotsRemaining: [],
    pactSlotsRemaining: undefined,
    homebrewIds: [],
    notes: {
      classFeatures: "",
      backgroundFeatures: "",
      speciesTraits: "",
      feats: "",
    },
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
    currentHitPoints: 12,
    tempHitPoints: 0,
    hitDiceSpent: 0,
    deathSaves: {
      successes: 0,
      failures: 0,
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

  it("persists sheet profile fields and normalizes tracked resources when building characters", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        sheetProfile: {
          appearance: "Scar over one eye",
          alignment: "Chaotic Good",
          languages: ["Common", " Goblin ", "Common"],
          equipmentNotes: "Carries a marked longbow case.",
          currencies: {
            cp: 12,
            sp: 3,
            ep: 0,
            gp: 45,
            pp: 1,
          },
        },
        trackedResources: [
          {
            id: "",
            label: "Hunter's Mark Charges",
            current: 7,
            max: 4,
            display: "checkboxes",
            recovery: "longRest",
          },
          {
            id: "blank-resource",
            label: "   ",
            current: 1,
            max: 1,
            display: "counter",
            recovery: "manual",
          },
        ],
      }),
    );

    expect(character.sheetProfile.languages).toEqual(["Common", "Goblin"]);
    expect(character.sheetProfile.currencies.gp).toBe(45);
    expect(character.trackedResources).toEqual([
      {
        id: "tracked-resource-1",
        label: "Hunter's Mark Charges",
        current: 4,
        max: 4,
        display: "checkboxes",
        recovery: "longRest",
      },
    ]);
  });

  it("derives equipped loadout from inventory entries", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        inventory: [
          createInventoryItem("armor", "leather", { equipped: true }),
          createInventoryItem("gear", "shield", { equipped: true }),
          createInventoryItem("weapon", "shortbow", { equipped: true }),
          createInventoryItem("weapon", "longsword", { equipped: false }),
          createInventoryItem("gear", "explorers-pack", { quantity: 1 }),
        ],
        armorId: null,
        shieldEquipped: false,
        weaponIds: [],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.armorClass).toBe(14);
    expect(derived.equippedArmorId).toBe("leather");
    expect(derived.shieldEquipped).toBe(true);
    expect(derived.weaponEntries.map((entry) => entry.id)).toEqual(["shortbow"]);
    expect(derived.inventoryEntries.map((entry) => entry.name)).toContain("Explorer's Pack");
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
    expect(derived.spellcasting.spellSlotsRemaining).toEqual([4, 3, 2]);
    expect(derived.spellcasting.pactSlotsMax).toBe(0);
    expect(derived.spellcasting.pactSlotsRemaining).toBe(0);
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
    expect(derived.spellcasting.pactSlotsRemaining).toBe(2);
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

  it("folds seeded subclass features into the class feature summary and canonicalizes saved subclass ids", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        subclass: "Champion",
        notes: {
          classFeatures: "Shield drill notes",
          backgroundFeatures: "",
          speciesTraits: "",
          feats: "",
        },
      }),
    );

    const derived = calculateDerivedState(character);

    expect(character.subclass).toBe("fighter-champion");
    expect(derived.classFeatures).toEqual(
      expect.arrayContaining(["Second Wind", "Improved Critical", "Athletic Versatility", "Shield drill notes"]),
    );
  });

  it("derives background features and selected feat names into sheet-facing lists", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        backgroundId: "acolyte",
        featIds: ["alert"],
        notes: {
          classFeatures: "",
          backgroundFeatures: "Temple rumors and local rites",
          speciesTraits: "",
          feats: "Dungeon Delver candidate",
        },
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.backgroundFeatures).toEqual(
      expect.arrayContaining(["Temple Service", "Two skill proficiencies", "Temple rumors and local rites"]),
    );
    expect(derived.feats).toEqual(expect.arrayContaining(["Alert", "Dungeon Delver candidate"]));
  });

  it("applies seeded starter feat mechanics for alert and tough", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        level: 5,
        featIds: ["alert", "tough"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.initiative).toBe(6);
    expect(derived.hitPointsMax).toBe(54);
  });

  it("applies initiative and per-level hit point bonuses from homebrew effects", () => {
    const homebrewEntry: HomebrewEntry = {
      id: "veteran-drill",
      name: "Veteran Drill",
      type: "feat",
      summary: "A custom feat that sharpens reaction speed and durability.",
      effects: [
        {
          id: "veteran-drill-initiative",
          type: "initiative_bonus",
          value: 3,
        },
        {
          id: "veteran-drill-hp-per-level",
          type: "hp_bonus_per_level",
          value: 2,
        },
      ],
      createdAt: "2026-03-06T22:00:00.000Z",
      updatedAt: "2026-03-06T22:00:00.000Z",
    };

    const character = buildCharacterFromInput(
      makeBaseInput({
        level: 5,
        homebrewIds: [homebrewEntry.id],
      }),
      [homebrewEntry],
    );

    const derived = calculateDerivedState(character, [homebrewEntry]);

    expect(derived.initiative).toBe(4);
    expect(derived.hitPointsMax).toBe(54);
  });

  it("supports magic initiate spell selections for non-casters", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        abilities: {
          strength: 16,
          dexterity: 12,
          constitution: 14,
          intelligence: 14,
          wisdom: 10,
          charisma: 8,
        },
        featIds: ["magic-initiate"],
        bonusSpellClassId: "wizard",
        bonusSpellIds: ["fire-bolt", "mage-hand", "magic-missile"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.spellcasting.slotMode).toBe("none");
    expect(derived.spellcasting.spellcastingAbility).toBe("intelligence");
    expect(derived.spellcasting.spellAttackBonus).toBe(4);
    expect(derived.spellcasting.spellSaveDC).toBe(12);
    expect(derived.spellcasting.bonusSpellcasting).toBeNull();
    expect(derived.spellcasting.knownSpells.map((spell) => spell.id)).toEqual(
      expect.arrayContaining(["fire-bolt", "mage-hand", "magic-missile"]),
    );
    expect(derived.spellcasting.preparedSpells.map((spell) => spell.id)).toEqual(["magic-missile"]);
  });

  it("adds a separate magic initiate spellcasting line for native casters when the chosen list uses another ability", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        classId: "wizard",
        level: 5,
        abilities: {
          strength: 8,
          dexterity: 14,
          constitution: 12,
          intelligence: 18,
          wisdom: 14,
          charisma: 10,
        },
        spellIds: ["magic-missile"],
        preparedSpellIds: ["magic-missile"],
        featIds: ["magic-initiate"],
        bonusSpellClassId: "cleric",
        bonusSpellIds: ["guidance", "sacred-flame", "healing-word"],
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.spellcasting.slotMode).toBe("standard");
    expect(derived.spellcasting.spellcastingAbility).toBe("intelligence");
    expect(derived.spellcasting.spellAttackBonus).toBe(7);
    expect(derived.spellcasting.spellSaveDC).toBe(15);
    expect(derived.spellcasting.bonusSpellcasting).toMatchObject({
      sourceId: "cleric",
      sourceLabel: "Magic Initiate (Cleric)",
      spellcastingAbility: "wisdom",
      spellAttackBonus: 5,
      spellSaveDC: 13,
      spellIds: ["guidance", "sacred-flame", "healing-word"],
    });
    expect(derived.spellcasting.knownSpells.map((spell) => spell.id)).toEqual(
      expect.arrayContaining(["magic-missile", "guidance", "sacred-flame", "healing-word"]),
    );
    expect(derived.spellcasting.preparedSpells.map((spell) => spell.id)).toEqual(
      expect.arrayContaining(["magic-missile", "healing-word"]),
    );
  });

  it("applies configurable starter feats like skilled and resilient", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        featIds: ["skilled", "resilient"],
        featSelections: {
          skilled: ["arcana", "stealth", "survival"],
          resilient: ["dexterity"],
        },
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.adjustedAbilities.dexterity).toBe(13);
    expect(derived.savingThrows.dexterity).toBe(3);
    expect(derived.skills.arcana).toBe(2);
    expect(derived.skills.stealth).toBe(3);
    expect(derived.skills.survival).toBe(2);
  });

  it("does not downgrade expertise when feat-granted proficiency overlaps an expert skill", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        skillProficiencies: {
          athletics: "proficient",
          perception: "proficient",
          stealth: "expertise",
        },
        featIds: ["skilled"],
        featSelections: {
          skilled: ["stealth", "arcana", "history"],
        },
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.skills.stealth).toBe(5);
    expect(derived.skills.arcana).toBe(2);
    expect(derived.skills.history).toBe(2);
  });

  it("supports multi-group feat choices for skill expert", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        featIds: ["skill-expert"],
        featSelections: {
          "skill-expert": ["ability:intelligence", "skill:arcana", "expertise:perception"],
        },
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.adjustedAbilities.intelligence).toBe(11);
    expect(derived.abilityModifiers.intelligence).toBe(0);
    expect(derived.skills.arcana).toBe(2);
    expect(derived.skills.perception).toBe(4);
  });

  it("drops selected feats that the current class or skill state can no longer satisfy", () => {
    const nearlyFullyTrainedSkills = Object.fromEntries(
      SKILL_NAMES.filter((skill) => !["arcana", "history"].includes(skill)).map((skill) => [skill, "proficient"] as const),
    );

    const character = buildCharacterFromInput(
      makeBaseInput({
        featIds: ["alert", "skilled"],
        featSelections: {
          skilled: ["arcana", "history", "stealth"],
        },
        skillProficiencies: nearlyFullyTrainedSkills,
      }),
    );

    const derived = calculateDerivedState(character);

    expect(character.featIds).toEqual(["alert"]);
    expect(character.featSelections).toEqual({});
    expect(derived.feats).toEqual(expect.arrayContaining(["Alert"]));
    expect(derived.feats).not.toContain("Skilled");
  });

  it("supports expanded starter feats with derived and partial automation", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        featIds: ["mobile", "athlete", "observant"],
        featSelections: {
          athlete: ["dexterity"],
          observant: ["wisdom"],
        },
      }),
    );

    const derived = calculateDerivedState(character);

    expect(derived.speed).toBe(40);
    expect(derived.adjustedAbilities.dexterity).toBe(13);
    expect(derived.adjustedAbilities.wisdom).toBe(11);
    expect(derived.abilityModifiers.dexterity).toBe(1);
    expect(derived.abilityModifiers.wisdom).toBe(0);
    expect(derived.passiveSkills.perception).toBe(17);
    expect(derived.passiveSkills.investigation).toBe(15);
    expect(derived.passiveSkills.insight).toBe(10);
  });

  it("routes homebrew feature categories into the matching sheet sections", () => {
    const homebrewEntries: HomebrewEntry[] = [
      {
        id: "battle-drill",
        name: "Battle Drill",
        type: "feature",
        summary: "A custom class feature.",
        effects: [],
        createdAt: "2026-03-06T22:00:00.000Z",
        updatedAt: "2026-03-06T22:00:00.000Z",
      },
      {
        id: "fey-mark",
        name: "Fey Mark",
        type: "speciesTrait",
        summary: "A custom species trait.",
        effects: [],
        createdAt: "2026-03-06T22:00:00.000Z",
        updatedAt: "2026-03-06T22:00:00.000Z",
      },
      {
        id: "eldritch-student",
        name: "Eldritch Student",
        type: "feat",
        summary: "A custom feat.",
        effects: [],
        createdAt: "2026-03-06T22:00:00.000Z",
        updatedAt: "2026-03-06T22:00:00.000Z",
      },
      {
        id: "storm-charm",
        name: "Storm Charm",
        type: "item",
        summary: "A custom active item effect.",
        effects: [],
        createdAt: "2026-03-06T22:00:00.000Z",
        updatedAt: "2026-03-06T22:00:00.000Z",
      },
    ];

    const character = buildCharacterFromInput(
      makeBaseInput({
        homebrewIds: homebrewEntries.map((entry) => entry.id),
      }),
      homebrewEntries,
    );

    const derived = calculateDerivedState(character, homebrewEntries);

    expect(derived.classFeatures).toContain("Battle Drill");
    expect(derived.speciesTraits).toContain("Fey Mark");
    expect(derived.feats).toContain("Eldritch Student");
    expect(derived.activeEffects).toEqual(["Storm Charm"]);
  });

  it("exposes adjusted ability scores and species size for sheet rendering", () => {
    const homebrewEntry: HomebrewEntry = {
      id: "belt-of-giant-strength-lite",
      name: "Belt of Giant Strength Lite",
      type: "item",
      summary: "A modest strength enhancer.",
      effects: [
        {
          id: "raise-strength",
          type: "ability_bonus",
          target: "strength",
          value: 2,
        },
      ],
      createdAt: "2026-03-06T22:00:00.000Z",
      updatedAt: "2026-03-06T22:00:00.000Z",
    };

    const character = buildCharacterFromInput(
      makeBaseInput({
        homebrewIds: [homebrewEntry.id],
      }),
      [homebrewEntry],
    );

    const derived = calculateDerivedState(character, [homebrewEntry]);

    expect(derived.adjustedAbilities.strength).toBe(18);
    expect(derived.abilityModifiers.strength).toBe(4);
    expect(derived.size).toBe("Medium");
  });

  it("preserves tracked vitals while clamping them to legal limits", () => {
    const character = buildCharacterFromInput(
      makeBaseInput({
        currentHitPoints: 99,
        tempHitPoints: 7,
        hitDiceSpent: 8,
        deathSaves: {
          successes: 2,
          failures: 1,
        },
      }),
    );

    expect(character.currentHitPoints).toBe(12);
    expect(character.tempHitPoints).toBe(7);
    expect(character.hitDiceSpent).toBe(1);
    expect(character.deathSaves).toEqual({
      successes: 2,
      failures: 1,
    });
  });
});
