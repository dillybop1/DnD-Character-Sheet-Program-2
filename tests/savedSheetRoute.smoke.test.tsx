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

function makeSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    name: "Smoke Test Warlock",
    enabledSourceIds: [...DEFAULT_ENABLED_SOURCE_IDS],
    classId: "warlock",
    subclass: "",
    speciesId: "human",
    backgroundId: "criminal",
    level: 3,
    abilities: {
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 10,
      wisdom: 12,
      charisma: 16,
    },
    skillProficiencies: {
      deception: "proficient",
      stealth: "proficient",
    },
    inventory: [],
    armorId: null,
    shieldEquipped: false,
    weaponIds: [],
    featIds: [],
    featSelections: {},
    bonusSpellClassId: "",
    bonusSpellIds: [],
    spellIds: ["eldritch-blast", "hex"],
    preparedSpellIds: ["hex"],
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
      appearance: "Sharp coat and infernal grin.",
      alignment: "Chaotic Neutral",
      languages: ["Common", "Infernal"],
      equipmentNotes: "Carries a scorched journal and a silver token.",
      currencies: {
        cp: 0,
        sp: 8,
        ep: 0,
        gp: 14,
        pp: 0,
      },
    },
    trackedResources: [
      {
        id: "dark-ones-blessing",
        label: "Dark One's Blessing",
        current: 0,
        max: 1,
        display: "checkboxes",
        recovery: "shortRest",
      },
    ],
    currentHitPoints: 9,
    tempHitPoints: 0,
    hitDiceSpent: 1,
    deathSaves: {
      successes: 1,
      failures: 2,
    },
    inspiration: false,
    ...overrides,
  };
}

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function readStoredCharacters() {
  return JSON.parse(window.localStorage.getItem(CHARACTERS_KEY) ?? "[]") as CharacterRecord[];
}

async function waitFor(condition: () => boolean, timeoutMs = 4000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await act(async () => {
      await Promise.resolve();
      await new Promise((resolve) => window.setTimeout(resolve, 20));
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

function findButtonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    normalizeText(button.textContent).includes(text),
  );
}

function findSpellRow(container: HTMLElement, spellName: string) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>(".saved-sheet-book__spell-row")).find((button) =>
    normalizeText(button.textContent).includes(spellName),
  );
}

describe("saved sheet route smoke test", () => {
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

  it("loads the saved-sheet route and exercises the key saved-sheet interactions", async () => {
    const character = buildCharacterFromInput(makeSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Saved sheet workspace"));
    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    expect(normalizeText(appContainer.textContent)).toContain("Character Worksheet");
    expect(normalizeText(appContainer.textContent)).not.toContain("Page 1 Preview");
    expect(normalizeText(appContainer.textContent)).not.toContain("Combat Snapshot");
    expect(appContainer.querySelector(".record-sheet")).toBeTruthy();

    const pageTwoButton = findButtonByText(appContainer, "Spellbook Worksheet");
    expect(pageTwoButton).toBeTruthy();
    expect(pageTwoButton?.getAttribute("aria-pressed")).toBe("false");

    await click(pageTwoButton!);

    expect(pageTwoButton?.getAttribute("aria-pressed")).toBe("true");
    expect(appContainer.querySelector(".saved-sheet-book")?.className).toContain("saved-sheet-book--page-2");

    const hexRow = findSpellRow(appContainer, "Hex");
    expect(hexRow).toBeTruthy();

    await click(hexRow!);

    await waitFor(() => Boolean(findButtonByText(appContainer, "Unpin Spell")));
    const inspectorHeading = appContainer.querySelector(
      ".saved-sheet-book__page-two-rail .saved-sheet-book__panel .saved-sheet-book__panel-header strong",
    );
    expect(normalizeText(inspectorHeading?.textContent)).toBe("Hex");

    const shortRestButton = findButtonByText(appContainer, "Short Rest");
    expect(shortRestButton).toBeTruthy();

    await click(shortRestButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return Boolean(
        savedCharacter &&
          savedCharacter.pactSlotsRemaining === 2 &&
          savedCharacter.deathSaves.successes === 0 &&
          savedCharacter.deathSaves.failures === 0 &&
          savedCharacter.trackedResources.find((resource) => resource.id === "dark-ones-blessing")?.current === 1,
      );
    });

    expect(normalizeText(appContainer.textContent)).toContain("Applied a bounded short rest");
  });
});
