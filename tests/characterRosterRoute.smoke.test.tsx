// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DEFAULT_ENABLED_SOURCE_IDS } from "../shared/data/contentSources";
import { buildCharacterFromInput } from "../shared/factories";
import type { BuilderInput, CharacterRecord } from "../shared/types";
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

function findRosterArticleByName(container: HTMLElement, name: string) {
  return Array.from(container.querySelectorAll<HTMLElement>(".library-item")).find(
    (article) => normalizeText(article.querySelector("strong")?.textContent) === name,
  );
}

function findLabeledField<T extends HTMLElement>(container: HTMLElement, labelText: string, selector: string) {
  return (
    Array.from(container.querySelectorAll<HTMLLabelElement>("label")).find((label) =>
      normalizeText(label.querySelector("span")?.textContent) === labelText,
    )?.querySelector<T>(selector) ?? null
  );
}

function getVisibleRosterNames(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(".library-item strong")).map((element) =>
    normalizeText(element.textContent),
  );
}

function makeRosterBuilderInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    name: "Roster Test Character",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "fighter",
    subclass: "",
    speciesId: "human",
    backgroundId: "soldier",
    level: 1,
    abilities: {
      strength: 15,
      dexterity: 13,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    skillProficiencies: {},
    inventory: [],
    armorId: null,
    shieldEquipped: false,
    weaponIds: [],
    featIds: [],
    featSelections: {},
    bonusSpellClassId: "",
    bonusSpellIds: [],
    spellIds: [],
    preparedSpellIds: [],
    spellSlotsRemaining: [],
    pactSlotsRemaining: 0,
    homebrewIds: [],
    notes: {
      classFeatures: "",
      backgroundFeatures: "",
      speciesTraits: "",
      feats: "",
    },
    sheetProfile: {
      appearance: "",
      alignment: "",
      languages: ["Common"],
      equipmentNotes: "",
      currencies: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 0,
        pp: 0,
      },
    },
    trackedResources: [],
    currentHitPoints: 12,
    tempHitPoints: 0,
    hitDiceSpent: 0,
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    inspiration: false,
    ...overrides,
  };
}

function makeRosterCharacter(options: {
  id: string;
  name: string;
  classId: BuilderInput["classId"];
  speciesId: BuilderInput["speciesId"];
  level: number;
  updatedAt: string;
}): CharacterRecord {
  const record = buildCharacterFromInput(
    makeRosterBuilderInput({
      name: options.name,
      classId: options.classId,
      speciesId: options.speciesId,
      level: options.level,
    }),
  );

  return {
    ...record,
    id: options.id,
    createdAt: options.updatedAt,
    updatedAt: options.updatedAt,
  };
}

describe("character roster route smoke test", () => {
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

    Object.defineProperty(window.HTMLAnchorElement.prototype, "click", {
      configurable: true,
      value: vi.fn(),
    });

    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test-download"),
    });

    Object.defineProperty(window.URL, "revokeObjectURL", {
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

  it("filters the saved roster by search, class, and species and can reset browse state", async () => {
    const records = [
      makeRosterCharacter({
        id: "wizard-latest",
        name: "Zara Voss",
        classId: "wizard",
        speciesId: "elf",
        level: 5,
        updatedAt: "2026-03-10T16:00:00.000Z",
      }),
      makeRosterCharacter({
        id: "cleric-middle",
        name: "Mira Dawnwatch",
        classId: "cleric",
        speciesId: "human",
        level: 7,
        updatedAt: "2026-03-10T15:00:00.000Z",
      }),
      makeRosterCharacter({
        id: "fighter-oldest",
        name: "Borin Stoneguard",
        classId: "fighter",
        speciesId: "dwarf",
        level: 3,
        updatedAt: "2026-03-10T14:00:00.000Z",
      }),
    ];

    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify(records));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Character Roster"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    expect(getVisibleRosterNames(appContainer)).toEqual(["Zara Voss", "Mira Dawnwatch", "Borin Stoneguard"]);

    const searchInput = findLabeledField<HTMLInputElement>(appContainer, "Search", 'input[type="search"]');
    const classSelect = findLabeledField<HTMLSelectElement>(appContainer, "Class", "select");
    const speciesSelect = findLabeledField<HTMLSelectElement>(appContainer, "Species", "select");

    expect(searchInput).toBeTruthy();
    expect(classSelect).toBeTruthy();
    expect(speciesSelect).toBeTruthy();

    await changeInput(searchInput!, "elf");
    await waitForCondition(() => getVisibleRosterNames(appContainer).length === 1);
    expect(getVisibleRosterNames(appContainer)).toEqual(["Zara Voss"]);

    await changeSelect(classSelect!, "wizard");
    await waitForCondition(() => getVisibleRosterNames(appContainer)[0] === "Zara Voss");
    expect(getVisibleRosterNames(appContainer)).toEqual(["Zara Voss"]);

    await changeSelect(speciesSelect!, "human");
    await waitForCondition(() => normalizeText(appContainer.textContent).includes("No roster matches the current search or filters."));
    expect(normalizeText(appContainer.textContent)).toContain("No roster matches the current search or filters.");

    const resetButton = findButtonByText(appContainer, "Reset Roster Filters");
    expect(resetButton).toBeTruthy();

    await click(resetButton!);
    await waitForCondition(() => getVisibleRosterNames(appContainer).length === 3);
    expect(getVisibleRosterNames(appContainer)).toEqual(["Zara Voss", "Mira Dawnwatch", "Borin Stoneguard"]);
  });

  it("sorts the visible roster locally", async () => {
    const records = [
      makeRosterCharacter({
        id: "wizard-latest",
        name: "Zara Voss",
        classId: "wizard",
        speciesId: "elf",
        level: 5,
        updatedAt: "2026-03-10T16:00:00.000Z",
      }),
      makeRosterCharacter({
        id: "cleric-middle",
        name: "Mira Dawnwatch",
        classId: "cleric",
        speciesId: "human",
        level: 7,
        updatedAt: "2026-03-10T15:00:00.000Z",
      }),
      makeRosterCharacter({
        id: "fighter-oldest",
        name: "Borin Stoneguard",
        classId: "fighter",
        speciesId: "dwarf",
        level: 3,
        updatedAt: "2026-03-10T14:00:00.000Z",
      }),
    ];

    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify(records));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Character Roster"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const sortSelect = findLabeledField<HTMLSelectElement>(appContainer, "Sort", "select");
    expect(sortSelect).toBeTruthy();

    await changeSelect(sortSelect!, "name");
    await waitForCondition(() => getVisibleRosterNames(appContainer)[0] === "Borin Stoneguard");
    expect(getVisibleRosterNames(appContainer)).toEqual(["Borin Stoneguard", "Mira Dawnwatch", "Zara Voss"]);

    await changeSelect(sortSelect!, "level-desc");
    await waitForCondition(() => getVisibleRosterNames(appContainer)[0] === "Mira Dawnwatch");
    expect(getVisibleRosterNames(appContainer)).toEqual(["Mira Dawnwatch", "Zara Voss", "Borin Stoneguard"]);
  });

  it("supports launch-page export and delete actions from roster cards", async () => {
    const records = [
      makeRosterCharacter({
        id: "wizard-latest",
        name: "Zara Voss",
        classId: "wizard",
        speciesId: "elf",
        level: 5,
        updatedAt: "2026-03-10T16:00:00.000Z",
      }),
      makeRosterCharacter({
        id: "cleric-middle",
        name: "Mira Dawnwatch",
        classId: "cleric",
        speciesId: "human",
        level: 7,
        updatedAt: "2026-03-10T15:00:00.000Z",
      }),
    ];

    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify(records));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = "#/characters";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitForCondition(() => normalizeText(container?.textContent).includes("Character Roster"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const zaraArticle = findRosterArticleByName(appContainer, "Zara Voss");
    expect(zaraArticle).toBeTruthy();

    const exportButton = findButtonByText(zaraArticle!, "Export JSON");
    expect(exportButton).toBeTruthy();

    await click(exportButton!);
    await waitForCondition(() => normalizeText(appContainer.textContent).includes("Exported Zara Voss to browser-download:zara-voss.dndsheet.json"));
    expect(normalizeText(appContainer.textContent)).toContain("Exported Zara Voss to browser-download:zara-voss.dndsheet.json");

    const deleteButton = findButtonByText(zaraArticle!, "Delete");
    expect(deleteButton).toBeTruthy();

    await click(deleteButton!);
    await waitForCondition(() => !findRosterArticleByName(appContainer, "Zara Voss"));
    expect(getVisibleRosterNames(appContainer)).toEqual(["Mira Dawnwatch"]);
    expect(normalizeText(appContainer.textContent)).toContain("Deleted Zara Voss.");
  });
});
