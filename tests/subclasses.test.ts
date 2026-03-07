import { describe, expect, it } from "vitest";
import {
  getSubclassLabel,
  listSubclassTemplates,
  normalizeSubclassSelection,
} from "../shared/data/reference";

describe("subclass options", () => {
  it("returns class-filtered subclass options", () => {
    const fighterSubclasses = listSubclassTemplates("fighter").map((entry) => entry.name);
    const wizardSubclasses = listSubclassTemplates("wizard").map((entry) => entry.name);

    expect(fighterSubclasses).toContain("Champion");
    expect(fighterSubclasses).toContain("Battle Master");
    expect(wizardSubclasses).not.toContain("Champion");
    expect(wizardSubclasses).toContain("School of Evocation");
  });

  it("normalizes legacy subclass names to canonical ids when they match the current class", () => {
    expect(normalizeSubclassSelection("fighter", "Champion")).toBe("fighter-champion");
    expect(normalizeSubclassSelection("wizard", "Champion")).toBe("Champion");
  });

  it("renders human-readable labels for canonical and legacy subclass values", () => {
    expect(getSubclassLabel("fighter", "fighter-champion")).toBe("Champion");
    expect(getSubclassLabel("wizard", "fighter-champion")).toBe("Champion");
    expect(getSubclassLabel("wizard", "My Homebrew Tradition")).toBe("My Homebrew Tradition");
  });
});
