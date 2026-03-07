import { describe, expect, it } from "vitest";
import { inventoryEntryFromItem } from "../shared/inventory";

describe("inventory helpers", () => {
  it("provides reference slugs for non-shield gear entries with compendium coverage", () => {
    const entry = inventoryEntryFromItem({
      id: "gear-1",
      templateType: "gear",
      templateId: "arcane-focus",
      quantity: 1,
      equipped: true,
    });

    expect(entry).toMatchObject({
      kind: "gear",
      name: "Arcane Focus",
      equipped: true,
      referenceSlug: "arcane-focus",
    });
  });
});
