import { describe, expect, it } from "vitest";
import { getBackgroundTemplate } from "../shared/data/reference";
import { createInventoryItem, mergeInventorySuggestions } from "../shared/inventory";

describe("mergeInventorySuggestions", () => {
  it("adds missing background starting gear into inventory", () => {
    const merged = mergeInventorySuggestions([], getBackgroundTemplate("acolyte").startingInventory);

    expect(merged.addedCount).toBe(3);
    expect(merged.updatedCount).toBe(0);
    expect(merged.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ templateType: "gear", templateId: "priests-pack", quantity: 1, equipped: false }),
        expect.objectContaining({ templateType: "gear", templateId: "holy-symbol", quantity: 1, equipped: true }),
        expect.objectContaining({ templateType: "gear", templateId: "healers-kit", quantity: 1, equipped: false }),
      ]),
    );
  });

  it("keeps the merge idempotent while raising existing items to the suggested minimum", () => {
    const soldierSuggestions = getBackgroundTemplate("soldier").startingInventory;
    const existingInventory = [
      createInventoryItem("gear", "dungeoneers-pack"),
      createInventoryItem("gear", "rope-hempen"),
      createInventoryItem("gear", "torch", { quantity: 1 }),
    ];

    const merged = mergeInventorySuggestions(existingInventory, soldierSuggestions);
    const mergedAgain = mergeInventorySuggestions(merged.inventory, soldierSuggestions);

    expect(merged.addedCount).toBe(0);
    expect(merged.updatedCount).toBe(1);
    expect(merged.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ templateType: "gear", templateId: "torch", quantity: 2 }),
      ]),
    );
    expect(mergedAgain.addedCount).toBe(0);
    expect(mergedAgain.updatedCount).toBe(0);
  });
});
