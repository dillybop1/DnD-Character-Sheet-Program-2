import { describe, expect, it } from "vitest";
import { getArmorReferenceSlug, getSpellcastingReferenceSlug, RULE_REFERENCE_SLUGS } from "../src/lib/compendiumLinks";

describe("compendium reference links", () => {
  it("maps rule helpers to stable compendium slugs", () => {
    expect(getArmorReferenceSlug("chain-mail")).toBe("chain-mail");
    expect(getArmorReferenceSlug(null)).toBe("unarmored");
    expect(getSpellcastingReferenceSlug(true)).toBe(RULE_REFERENCE_SLUGS.spellAttackBonus);
    expect(getSpellcastingReferenceSlug(false)).toBe(RULE_REFERENCE_SLUGS.spellSaveDC);
  });
});
