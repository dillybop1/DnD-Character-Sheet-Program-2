// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryManagerBrowser, type InventoryBrowserEntry } from "../src/components/InventoryManagerBrowser";

function setActEnvironment(enabled: boolean) {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = enabled;
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

async function updateTextInput(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function updateSelect(select: HTMLSelectElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("InventoryManagerBrowser", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  const entries: InventoryBrowserEntry[] = [
    {
      id: "armor-1",
      kind: "armor",
      templateId: "chain-mail",
      name: "Chain Mail",
      quantity: 1,
      equipped: true,
      equipable: true,
      category: "Heavy",
      summary: "Flat AC 16",
      searchText: "chain mail heavy armor flat ac 16",
      referenceSlug: "chain-mail",
    },
    {
      id: "weapon-1",
      kind: "weapon",
      templateId: "longsword",
      name: "Longsword",
      quantity: 2,
      equipped: true,
      equipable: true,
      category: "Melee",
      summary: "1d8 slashing",
      searchText: "longsword melee 1d8 slashing weapon",
      referenceSlug: "longsword",
    },
    {
      id: "weapon-2",
      kind: "weapon",
      templateId: "shortbow",
      name: "Shortbow",
      quantity: 1,
      equipped: false,
      equipable: true,
      category: "Ranged",
      summary: "1d6 piercing",
      searchText: "shortbow ranged 1d6 piercing weapon",
      referenceSlug: "shortbow",
    },
    {
      id: "gear-1",
      kind: "gear",
      templateId: "explorers-pack",
      name: "Explorer's Pack",
      quantity: 1,
      equipped: false,
      equipable: false,
      category: "Gear",
      summary: "Travel supplies",
      searchText: "explorers pack gear travel supplies",
      referenceSlug: "explorers-pack",
    },
  ];

  beforeAll(() => {
    setActEnvironment(true);
  });

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    root = null;
  });

  afterAll(() => {
    setActEnvironment(false);
  });

  it("filters tracked inventory and forwards row actions", async () => {
    const onUpdateQuantity = vi.fn();
    const onToggleEquipped = vi.fn();
    const onOpenReference = vi.fn();
    const onRemoveItem = vi.fn();

    await act(async () => {
      root?.render(
        <InventoryManagerBrowser
          emptyMessage="No tracked inventory."
          entries={entries}
          onOpenReference={onOpenReference}
          onRemoveItem={onRemoveItem}
          onToggleEquipped={onToggleEquipped}
          onUpdateQuantity={onUpdateQuantity}
          scopeKey="inventory"
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");
    const selects = container.querySelectorAll("select");

    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect(selects).toHaveLength(2);
    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(4);
    expect(container.textContent).toContain("4 stacks");
    expect(container.textContent).toContain("5 total items");

    await updateTextInput(searchInput as HTMLInputElement, "bow");

    await flushEffects();

    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Shortbow");

    const resetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    await updateSelect(selects[0] as HTMLSelectElement, "gear");

    await flushEffects();

    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Explorer's Pack");

    await updateSelect(selects[1] as HTMLSelectElement, "Gear");

    await flushEffects();

    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(1);

    const refreshedResetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      refreshedResetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    const equippedButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Equipped",
    );

    await act(async () => {
      equippedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(2);
    expect(container.textContent).not.toContain("Shortbow");

    const qtyInput = container.querySelector(".inventory-qty-input") as HTMLInputElement;
    const qtySetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

    await act(async () => {
      qtySetter?.call(qtyInput, "3");
      qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
      qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const equipToggle = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Unequip",
    );
    const refButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Ref",
    );
    const removeButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Remove",
    );

    await act(async () => {
      equipToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      refButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      removeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onUpdateQuantity).toHaveBeenCalled();
    expect(onToggleEquipped).toHaveBeenCalled();
    expect(onOpenReference).toHaveBeenCalled();
    expect(onRemoveItem).toHaveBeenCalled();
  });

  it("resets its local browse state when the inventory scope changes", async () => {
    await act(async () => {
      root?.render(
        <InventoryManagerBrowser
          emptyMessage="No tracked inventory."
          entries={entries}
          onOpenReference={() => {}}
          onRemoveItem={() => {}}
          onToggleEquipped={() => {}}
          onUpdateQuantity={() => {}}
          scopeKey="fighter"
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");

    await updateTextInput(searchInput as HTMLInputElement, "chain");

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("chain");
    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(1);

    await act(async () => {
      root?.render(
        <InventoryManagerBrowser
          emptyMessage="No tracked inventory."
          entries={entries}
          onOpenReference={() => {}}
          onRemoveItem={() => {}}
          onToggleEquipped={() => {}}
          onUpdateQuantity={() => {}}
          scopeKey="wizard"
        />,
      );
    });

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll(".inventory-browser__item")).toHaveLength(4);
  });
});
