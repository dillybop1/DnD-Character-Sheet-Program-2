// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { findCompendiumEntry } from "../shared/data/compendiumSeed";
import { FeatSelectionBrowser } from "../src/components/FeatSelectionBrowser";
import type { CompendiumEntry } from "../shared/types";

function setActEnvironment(enabled: boolean) {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = enabled;
}

function requireFeatEntry(slug: string): CompendiumEntry {
  const entry = findCompendiumEntry(slug);

  if (!entry || entry.type !== "feat") {
    throw new Error(`Missing feat entry for ${slug}`);
  }

  return entry;
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

describe("FeatSelectionBrowser", () => {
  let container: HTMLDivElement;
  let root: Root | null;

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

  it("filters feats by search, support, and blocked browse mode", async () => {
    const entries = [
      requireFeatEntry("alert"),
      requireFeatEntry("magic-initiate"),
      requireFeatEntry("observant"),
      requireFeatEntry("skilled"),
    ];
    const availabilityById = new Map([
      ["alert", { selectable: true }],
      ["magic-initiate", { selectable: true }],
      ["observant", { selectable: true }],
      ["skilled", { selectable: false, constraintMessage: "No untrained skills remain." }],
    ]);

    await act(async () => {
      root?.render(
        <FeatSelectionBrowser
          availabilityById={availabilityById}
          emptyMessage="No feats."
          entries={entries}
          onOpenReference={() => {}}
          onToggleFeat={() => {}}
          scopeKey="fighter"
          selectedFeatIds={["alert", "magic-initiate"]}
          title="Available Feats"
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");
    const supportSelect = container.querySelector("select");

    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect(supportSelect).toBeInstanceOf(HTMLSelectElement);
    expect(container.querySelectorAll(".feat-browser__item")).toHaveLength(4);
    expect(container.textContent).toContain("Derived Support");
    expect(container.textContent).toContain("Partial Support");

    await updateTextInput(searchInput as HTMLInputElement, "magic");

    await flushEffects();

    expect(container.querySelectorAll(".feat-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Magic Initiate");
    expect(container.textContent).not.toContain("Observant");

    const resetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    await updateSelect(supportSelect as HTMLSelectElement, "Derived");

    await flushEffects();

    expect(container.querySelectorAll(".feat-browser__item")).toHaveLength(2);
    expect(container.textContent).not.toContain("Magic Initiate");

    const blockedButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Blocked",
    );

    await act(async () => {
      blockedButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelectorAll(".feat-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Skilled");
    expect(container.textContent).toContain("No untrained skills remain.");
  });

  it("resets its local browse state when the feat scope changes", async () => {
    const entries = [requireFeatEntry("alert"), requireFeatEntry("magic-initiate")];
    const availabilityById = new Map([
      ["alert", { selectable: true }],
      ["magic-initiate", { selectable: true }],
    ]);

    await act(async () => {
      root?.render(
        <FeatSelectionBrowser
          availabilityById={availabilityById}
          emptyMessage="No feats."
          entries={entries}
          onOpenReference={() => {}}
          onToggleFeat={() => {}}
          scopeKey="fighter"
          selectedFeatIds={[]}
          title="Available Feats"
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");

    await updateTextInput(searchInput as HTMLInputElement, "magic");

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("magic");
    expect(container.querySelectorAll(".feat-browser__item")).toHaveLength(1);

    await act(async () => {
      root?.render(
        <FeatSelectionBrowser
          availabilityById={availabilityById}
          emptyMessage="No feats."
          entries={entries}
          onOpenReference={() => {}}
          onToggleFeat={() => {}}
          scopeKey="wizard"
          selectedFeatIds={[]}
          title="Available Feats"
        />,
      );
    });

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll(".feat-browser__item")).toHaveLength(2);
  });
});
