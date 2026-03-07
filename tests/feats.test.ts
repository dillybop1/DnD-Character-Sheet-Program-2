import { describe, expect, it } from "vitest";
import { SKILL_NAMES } from "../shared/types";
import {
  isFeatSelectable,
  listAvailableFeatChoiceOptions,
  listFeatSelectionLabels,
  sanitizeAllFeatSelections,
  sanitizeFeatState,
} from "../shared/data/reference";

describe("feat selection labels", () => {
  it("formats single-group feat choices for display", () => {
    expect(
      listFeatSelectionLabels("resilient", {
        resilient: ["dexterity"],
      }, {
        classId: "fighter",
      }),
    ).toEqual(["Dexterity"]);
  });

  it("formats multi-group feat choices for display", () => {
    expect(
      listFeatSelectionLabels("skill-expert", {
        "skill-expert": ["ability:intelligence", "skill:arcana", "expertise:perception"],
      }, {
        skillProficiencies: {
          perception: "proficient",
        },
      }),
    ).toEqual(["Intelligence", "Arcana", "Perception"]);
  });

  it("filters resilient choices away from class save proficiencies", () => {
    expect(
      listAvailableFeatChoiceOptions("resilient", "ability", {
        classId: "fighter",
      }),
    ).toEqual(expect.not.arrayContaining(["strength", "constitution"]));
  });

  it("filters skill expert choices based on current skill proficiency state", () => {
    expect(
      listAvailableFeatChoiceOptions("skill-expert", "skill", {
        skillProficiencies: {
          arcana: "proficient",
          stealth: "expertise",
        },
      }),
    ).toEqual(expect.not.arrayContaining(["skill:arcana", "skill:stealth"]));

    expect(
      listAvailableFeatChoiceOptions("skill-expert", "expertise", {
        skillProficiencies: {
          arcana: "proficient",
          stealth: "expertise",
        },
        featSelections: {
          "skill-expert": ["skill:history"],
        },
      }),
    ).toEqual(expect.arrayContaining(["expertise:arcana", "expertise:history"]));
  });

  it("sanitizes stale invalid feat selections against prerequisite-aware options", () => {
    expect(
      sanitizeAllFeatSelections(
        ["resilient", "skill-expert"],
        {
          resilient: ["strength"],
          "skill-expert": ["ability:intelligence", "skill:arcana", "expertise:stealth"],
        },
        {
          classId: "fighter",
          skillProficiencies: {
            arcana: "proficient",
            stealth: "expertise",
          },
        },
      ),
    ).toEqual({
      "skill-expert": ["ability:intelligence"],
    });
  });

  it("treats skill expert as selectable when a legal sequence of choices exists", () => {
    expect(
      isFeatSelectable("skill-expert", {
        skillProficiencies: {},
      }),
    ).toBe(true);
  });

  it("treats skilled as unavailable when fewer than three untrained skills remain", () => {
    const nearlyFullyTrainedSkills = Object.fromEntries(
      SKILL_NAMES.filter((skill) => !["arcana", "history"].includes(skill)).map((skill) => [skill, "proficient"] as const),
    );

    expect(
      isFeatSelectable("skilled", {
        skillProficiencies: nearlyFullyTrainedSkills,
      }),
    ).toBe(false);
  });

  it("removes impossible feat ids while preserving supported selections", () => {
    const nearlyFullyTrainedSkills = Object.fromEntries(
      SKILL_NAMES.filter((skill) => !["arcana", "history"].includes(skill)).map((skill) => [skill, "proficient"] as const),
    );

    expect(
      sanitizeFeatState(
        ["alert", "skilled", "skill-expert"],
        {
          skilled: ["arcana", "history", "stealth"],
          "skill-expert": ["ability:intelligence", "skill:arcana", "expertise:arcana"],
        },
        {
          skillProficiencies: nearlyFullyTrainedSkills,
        },
      ),
    ).toEqual({
      featIds: ["alert", "skill-expert"],
      featSelections: {
        "skill-expert": ["ability:intelligence", "skill:arcana", "expertise:arcana"],
      },
    });
  });
});
