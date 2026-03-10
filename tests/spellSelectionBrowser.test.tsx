// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { findCompendiumEntry } from "../shared/data/compendiumSeed";
import { SpellSelectionBrowser } from "../src/components/SpellSelectionBrowser";
import type { CompendiumEntry } from "../shared/types";

function setActEnvironment(enabled: boolean) {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = enabled;
}

function requireSpellEntry(slug: string): CompendiumEntry {
  const entry = findCompendiumEntry(slug);

  if (!entry || entry.type !== "spell") {
    throw new Error(`Missing spell entry for ${slug}`);
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

describe("SpellSelectionBrowser", () => {
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

  it("filters and groups spells by builder browse controls", async () => {
    const entries = [
      requireSpellEntry("detect-magic"),
      requireSpellEntry("counterspell"),
      requireSpellEntry("fireball"),
    ];

    await act(async () => {
      root?.render(
        <SpellSelectionBrowser
          emptyMessage="No spells."
          entries={entries}
          onOpenReference={() => {}}
          onTogglePreparedSpell={() => {}}
          onToggleSpell={() => {}}
          preparedSpellIds={["fireball"]}
          scopeKey="wizard"
          selectedSpellIds={["detect-magic", "fireball"]}
          title="Wizard Spell List"
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");
    const selects = container.querySelectorAll("select");

    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect(selects).toHaveLength(2);
    expect(container.querySelectorAll(".spell-browser__item")).toHaveLength(3);
    expect(container.textContent).toContain("Cantrips");
    expect(container.textContent).toContain("Level 1");
    expect(container.textContent).toContain("Level 3");

    await updateTextInput(searchInput as HTMLInputElement, "fire");

    await flushEffects();

    expect((searchInput as HTMLInputElement).value).toBe("fire");
    expect(container.querySelectorAll(".spell-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Fireball");
    expect(container.textContent).not.toContain("Counterspell");

    const resetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    await updateSelect(selects[0] as HTMLSelectElement, "3");

    await flushEffects();

    expect(container.querySelectorAll(".spell-browser__item")).toHaveLength(2);
    expect(container.textContent).not.toContain("Detect Magic");

    const readyOnlyButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Ready Only",
    );

    await act(async () => {
      readyOnlyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelectorAll(".spell-browser__item")).toHaveLength(1);
    expect(container.textContent).toContain("Fireball");
    expect(container.textContent).not.toContain("Counterspell");
  });

  it("resets its local browse state when the spell scope changes", async () => {
    const entries = [
      requireSpellEntry("detect-magic"),
      requireSpellEntry("counterspell"),
      requireSpellEntry("fireball"),
    ];

    await act(async () => {
      root?.render(
        <SpellSelectionBrowser
          emptyMessage="No spells."
          entries={entries}
          onOpenReference={() => {}}
          onToggleSpell={() => {}}
          scopeKey="wizard"
          selectedSpellIds={[]}
          title="Wizard Spell List"
        />,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");

    await updateTextInput(searchInput as HTMLInputElement, "counter");

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("counter");
    expect(container.querySelectorAll(".spell-browser__item")).toHaveLength(1);

    await act(async () => {
      root?.render(
        <SpellSelectionBrowser
          emptyMessage="No spells."
          entries={entries}
          onOpenReference={() => {}}
          onToggleSpell={() => {}}
          scopeKey="cleric"
          selectedSpellIds={[]}
          title="Cleric Spell List"
        />,
      );
    });

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll(".spell-browser__item")).toHaveLength(3);
  });
});
