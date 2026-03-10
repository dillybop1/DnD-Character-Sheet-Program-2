import { describe, expect, it } from "vitest";
import {
  areSameSkillProficiencies,
  areSameSpellSelections,
  buildClassStarterSkillProficiencies,
  buildClassStandardAbilityScores,
  buildClassStarterSpellSelection,
  createDefaultBuilderInput,
} from "../src/lib/editor";

describe("builder ability score presets", () => {
  it("builds class standard arrays from the class priority order", () => {
    expect(buildClassStandardAbilityScores("wizard")).toEqual({
      strength: 8,
      dexterity: 13,
      constitution: 14,
      intelligence: 15,
      wisdom: 12,
      charisma: 10,
    });

    expect(buildClassStandardAbilityScores("paladin")).toEqual({
      strength: 15,
      dexterity: 10,
      constitution: 13,
      intelligence: 8,
      wisdom: 12,
      charisma: 14,
    });
  });

  it("uses the fighter standard array for new character drafts", () => {
    const draft = createDefaultBuilderInput();

    expect(draft.classId).toBe("fighter");
    expect(draft.abilities).toEqual({
      strength: 15,
      dexterity: 13,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    });
    expect(draft.skillProficiencies).toEqual({
      athletics: "proficient",
      perception: "proficient",
    });
  });

  it("builds class starter spell selections from seeded class spell recommendations", () => {
    expect(buildClassStarterSpellSelection("wizard", ["core-open"])).toEqual({
      spellIds: ["fire-bolt", "mage-hand", "magic-missile", "sleep", "mage-armor", "detect-magic"],
      preparedSpellIds: ["magic-missile", "sleep", "mage-armor", "detect-magic"],
    });

    expect(buildClassStarterSpellSelection("fighter", ["core-open"])).toEqual({
      spellIds: [],
      preparedSpellIds: [],
    });
  });

  it("builds class starter skill suggestions from the class recommendation layer", () => {
    expect(buildClassStarterSkillProficiencies("wizard")).toEqual({
      arcana: "proficient",
      investigation: "proficient",
    });

    expect(areSameSkillProficiencies(
      { investigation: "proficient", arcana: "proficient" },
      buildClassStarterSkillProficiencies("wizard"),
    )).toBe(true);
  });

  it("treats spell selections with the same ids as equal even when order differs", () => {
    expect(
      areSameSpellSelections(
        ["magic-missile", "sleep", "fire-bolt"],
        ["sleep", "magic-missile"],
        ["fire-bolt", "sleep", "magic-missile"],
        ["magic-missile", "sleep"],
      ),
    ).toBe(true);
  });
});
