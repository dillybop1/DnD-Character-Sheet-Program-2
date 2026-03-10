// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { EquipmentSelectionBrowser, type EquipmentBrowserEntry } from "../src/components/EquipmentSelectionBrowser";

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

describe("EquipmentSelectionBrowser", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  const entries: EquipmentBrowserEntry[] = [
    {
      key: "armor:chain-mail",
      templateType: "armor",
      templateId: "chain-mail",
      referenceSlug: "chain-mail",
      name: "Chain Mail",
      category: "Heavy",
      summary: "Flat AC 16",
      searchText: "chain mail heavy flat ac 16 armor",
    },
    {
      key: "weapon:longsword",
      templateType: "weapon",
      templateId: "longsword",
      referenceSlug: "longsword",
      name: "Longsword",
      category: "Melee",
      summary: "1d8 slashing, versatile",
      searchText: "longsword melee 1d8 slashing versatile weapon",
    },
    {
      key: "weapon:shortbow",
      templateType: "weapon",
      templateId: "shortbow",
      referenceSlug: "shortbow",
      name: "Shortbow",
      category: "Ranged",
      summary: "1d6 piercing, ammunition",
      searchText: "shortbow ranged 1d6 piercing ammunition weapon",
    },
    {
      key: "gear:shield",
      templateType: "gear",
      templateId: "shield",
      referenceSlug: "shield",
      name: "Shield",
      category: "Shield",
      summary: "+2 Armor Class while equipped",
      searchText: "shield gear armor class equipped",
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

  it("filters equipment by search, type, category, and tracked state", async () => {
    const trackedStateByKey = new Map([
      ["armor:chain-mail", { quantity: 1, equippedCount: 1 }],
      ["weapon:longsword", { quantity: 2, equippedCount: 1 }],
      ["gear:shield", { quantity: 1, equippedCount: 1 }],
    ]);

    await act(async () => {
      root?.render(
        <EquipmentSelectionBrowser
          emptyMessage="No equipment."
          entries={entries}
          onAddItem={() => {}}
          onOpenReference={() => {}}
          scopeKey="base"
          title="Available Equipment"
          trackedStateByKey={trackedStateByKey}
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");
    const selects = container.querySelectorAll("select");

    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect(selects).toHaveLength(2);
    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(4);
    expect(container.textContent).toContain("3 tracked");
    expect(container.textContent).toContain("3 equipped");

    await updateTextInput(searchInput as HTMLInputElement, "bow");

    await flushEffects();

    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Shortbow");
    expect(container.textContent).not.toContain("Longsword");

    const refreshedResetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      refreshedResetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    await updateSelect(selects[0] as HTMLSelectElement, "gear");

    await flushEffects();

    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Shield");

    await updateSelect(selects[1] as HTMLSelectElement, "Shield");

    await flushEffects();

    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(1);

    const untrackedButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Untracked",
    );

    await act(async () => {
      untrackedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(0);

    const finalResetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      finalResetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    const equippedButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Equipped",
    );

    await act(async () => {
      equippedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(3);
    expect(container.textContent).not.toContain("Shortbow");
  });

  it("resets its local browse state when the equipment scope changes", async () => {
    await act(async () => {
      root?.render(
        <EquipmentSelectionBrowser
          emptyMessage="No equipment."
          entries={entries}
          onAddItem={() => {}}
          onOpenReference={() => {}}
          scopeKey="fighter"
          title="Available Equipment"
          trackedStateByKey={new Map()}
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");

    await updateTextInput(searchInput as HTMLInputElement, "shield");

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("shield");
    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(1);

    await act(async () => {
      root?.render(
        <EquipmentSelectionBrowser
          emptyMessage="No equipment."
          entries={entries}
          onAddItem={() => {}}
          onOpenReference={() => {}}
          scopeKey="wizard"
          title="Available Equipment"
          trackedStateByKey={new Map()}
        />,
      );
    });

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll(".equipment-browser__item")).toHaveLength(4);
  });
});
