// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import App from "../src/App";

const CHARACTERS_KEY = "dnd-character-sheet:characters";
const HOMEBREW_KEY = "dnd-character-sheet:homebrew";

function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function waitForCondition(condition: () => boolean, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await act(async () => {
      await Promise.resolve();
    });

    if (condition()) {
      return;
    }
  }

  throw new Error("Timed out waiting for condition.");
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.dispatchEvent(
      new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      }),
    );
    await Promise.resolve();
  });
}

async function changeInput(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new window.Event("input", { bubbles: true }));
    element.dispatchEvent(new window.Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

async function changeSelect(element: HTMLSelectElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new window.Event("input", { bubbles: true }));
    element.dispatchEvent(new window.Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

function findButtonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    normalizeText(button.textContent).includes(text),
  );
}

function findLabeledField<T extends HTMLElement>(container: HTMLElement, labelText: string, selector: string) {
  return (
    Array.from(container.querySelectorAll<HTMLLabelElement>("label")).find((label) =>
      normalizeText(label.querySelector("span")?.textContent) === labelText,
    )?.querySelector<T>(selector) ?? null
  );
}

function findCheckboxByLabel(container: HTMLElement, labelText: string) {
  return findLabeledField<HTMLInputElement>(container, labelText, 'input[type="checkbox"]');
}

describe("character builder route smoke test", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeAll(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0),
    });

    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }

    container?.remove();
    container = null;
    root = null;
    window.localStorage.clear();
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "";
    vi.clearAllMocks();
  });

  it("applies class standard arrays in the new-character builder", async () => {
    window.localStorage.setItem(CHARACTERS_KEY, "[]");
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters/new";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Ability Scores"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const classSelect = findLabeledField<HTMLSelectElement>(appContainer, "Class", "select");
    const strengthInput = findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]');
    const dexterityInput = findLabeledField<HTMLInputElement>(appContainer, "Dexterity", 'input[type="number"]');
    const charismaInput = findLabeledField<HTMLInputElement>(appContainer, "Charisma", 'input[type="number"]');

    expect(classSelect?.value).toBe("fighter");
    expect(strengthInput?.value).toBe("15");
    expect(dexterityInput?.value).toBe("13");
    expect(charismaInput?.value).toBe("8");

    await changeSelect(classSelect!, "wizard");

    await waitForCondition(() => findLabeledField<HTMLInputElement>(appContainer, "Intelligence", 'input[type="number"]')?.value === "15");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]')?.value).toBe("8");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Dexterity", 'input[type="number"]')?.value).toBe("13");

    const refreshedStrengthInput = findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]');
    const refreshedClassSelect = findLabeledField<HTMLSelectElement>(appContainer, "Class", "select");

    expect(refreshedStrengthInput).toBeTruthy();
    expect(refreshedClassSelect).toBeTruthy();

    await changeInput(refreshedStrengthInput!, "14");
    await changeSelect(refreshedClassSelect!, "rogue");

    await waitForCondition(() => findLabeledField<HTMLSelectElement>(appContainer, "Class", "select")?.value === "rogue");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]')?.value).toBe("14");

    const applyRogueArrayButton = findButtonByText(appContainer, "Apply Rogue Standard Array");
    expect(applyRogueArrayButton).toBeTruthy();

    await click(applyRogueArrayButton!);

    await waitForCondition(() => findLabeledField<HTMLInputElement>(appContainer, "Dexterity", 'input[type="number"]')?.value === "15");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Constitution", 'input[type="number"]')?.value).toBe("14");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Wisdom", 'input[type="number"]')?.value).toBe("13");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]')?.value).toBe("8");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Intelligence", 'input[type="number"]')?.value).toBe("12");
  });

  it("applies the combined class and background quick-start setup in the new-character builder", async () => {
    window.localStorage.setItem(CHARACTERS_KEY, "[]");
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters/new";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Quick Start Setup"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const classSelect = findLabeledField<HTMLSelectElement>(appContainer, "Class", "select");
    const backgroundSelect = findLabeledField<HTMLSelectElement>(appContainer, "Background", "select");

    expect(classSelect).toBeTruthy();
    expect(backgroundSelect).toBeTruthy();

    await changeSelect(classSelect!, "wizard");
    await changeSelect(backgroundSelect!, "sage");

    const strengthInput = findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]');
    expect(strengthInput).toBeTruthy();

    await changeInput(strengthInput!, "14");

    const quickStartButton = findButtonByText(appContainer, "Apply Wizard + Sage Quick Start");
    expect(quickStartButton).toBeTruthy();

    await click(quickStartButton!);

    await waitForCondition(() => findLabeledField<HTMLInputElement>(appContainer, "Intelligence", 'input[type="number"]')?.value === "15");

    expect(findLabeledField<HTMLInputElement>(appContainer, "Strength", 'input[type="number"]')?.value).toBe("8");
    expect(findLabeledField<HTMLInputElement>(appContainer, "Constitution", 'input[type="number"]')?.value).toBe("14");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Arcana", "select")?.value).toBe("proficient");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Investigation", "select")?.value).toBe("proficient");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "History", "select")?.value).toBe("proficient");
    await waitForCondition(() => findCheckboxByLabel(appContainer, "Fire Bolt")?.checked === true);
    expect(findCheckboxByLabel(appContainer, "Mage Hand")?.checked).toBe(true);
    expect(findCheckboxByLabel(appContainer, "Magic Missile")?.checked).toBe(true);
    expect(findCheckboxByLabel(appContainer, "Sleep")?.checked).toBe(true);
    expect(normalizeText(appContainer.textContent)).toContain("Spellbook");
    expect(normalizeText(appContainer.textContent)).toContain("Explorer's Pack");
    await waitForCondition(() => normalizeText(appContainer.textContent).includes("Applied Wizard + Sage quick start"));
    expect(normalizeText(appContainer.textContent)).toContain("Applied Wizard + Sage quick start");
  });

  it("auto-carries starter spell packages across fresh class changes but preserves manual spell edits", async () => {
    window.localStorage.setItem(CHARACTERS_KEY, "[]");
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters/new";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Spells"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const classSelect = findLabeledField<HTMLSelectElement>(appContainer, "Class", "select");
    expect(classSelect).toBeTruthy();

    await changeSelect(classSelect!, "wizard");
    await waitForCondition(() => findCheckboxByLabel(appContainer, "Fire Bolt")?.checked === true);
    expect(findCheckboxByLabel(appContainer, "Magic Missile")?.checked).toBe(true);

    await changeSelect(classSelect!, "cleric");
    await waitForCondition(() => findCheckboxByLabel(appContainer, "Guidance")?.checked === true);
    expect(findCheckboxByLabel(appContainer, "Bless")?.checked).toBe(true);

    const guidanceCheckbox = findCheckboxByLabel(appContainer, "Guidance");
    expect(guidanceCheckbox).toBeTruthy();

    await click(guidanceCheckbox!);
    expect(findCheckboxByLabel(appContainer, "Guidance")?.checked).toBe(false);

    await changeSelect(classSelect!, "druid");
    await waitForCondition(() => findLabeledField<HTMLSelectElement>(appContainer, "Class", "select")?.value === "druid");
    expect(findCheckboxByLabel(appContainer, "Shillelagh")?.checked).toBe(false);
    expect(findButtonByText(appContainer, "Apply Druid Starter Spells")?.hasAttribute("disabled")).toBe(false);
  });

  it("auto-carries starter skill packages across fresh class changes but preserves manual skill edits", async () => {
    window.localStorage.setItem(CHARACTERS_KEY, "[]");
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters/new";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Skill Proficiencies"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const classSelect = findLabeledField<HTMLSelectElement>(appContainer, "Class", "select");
    expect(classSelect).toBeTruthy();
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Athletics", "select")?.value).toBe("proficient");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Perception", "select")?.value).toBe("proficient");

    await changeSelect(classSelect!, "wizard");
    await waitForCondition(() => findLabeledField<HTMLSelectElement>(appContainer, "Arcana", "select")?.value === "proficient");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Investigation", "select")?.value).toBe("proficient");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Athletics", "select")?.value).toBe("none");

    await changeSelect(findLabeledField<HTMLSelectElement>(appContainer, "Arcana", "select")!, "none");
    await changeSelect(classSelect!, "rogue");

    await waitForCondition(() => findLabeledField<HTMLSelectElement>(appContainer, "Class", "select")?.value === "rogue");
    expect(findLabeledField<HTMLSelectElement>(appContainer, "Stealth", "select")?.value).toBe("none");
    expect(findButtonByText(appContainer, "Apply Rogue Starter Skills")?.hasAttribute("disabled")).toBe(false);
  });
});
