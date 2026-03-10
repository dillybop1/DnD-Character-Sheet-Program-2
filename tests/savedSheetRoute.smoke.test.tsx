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

function makeBarbarianSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      name: "Smoke Test Barbarian",
      classId: "barbarian",
      backgroundId: "soldier",
      level: 5,
      abilities: {
        strength: 16,
        dexterity: 14,
        constitution: 16,
        intelligence: 8,
        wisdom: 12,
        charisma: 10,
      },
      spellIds: [],
      preparedSpellIds: [],
      spellSlotsRemaining: [],
      trackedResources: [],
      currentHitPoints: 41,
    }),
    ...overrides,
  };
}

function makeFighterSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      name: "Smoke Test Fighter",
      classId: "fighter",
      backgroundId: "soldier",
      level: 17,
      abilities: {
        strength: 18,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 10,
      },
      spellIds: [],
      preparedSpellIds: [],
      spellSlotsRemaining: [],
      pactSlotsRemaining: 0,
      trackedResources: [
        {
          id: "auto-resource:fighter-second-wind",
          label: "Second Wind",
          current: 3,
          max: 4,
          display: "counter",
          recovery: "shortRestOne",
        },
      ],
      currentHitPoints: 120,
    }),
    ...overrides,
  };
}

function makeRangerSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      name: "Smoke Test Ranger",
      classId: "ranger",
      backgroundId: "soldier",
      level: 14,
      abilities: {
        strength: 10,
        dexterity: 18,
        constitution: 14,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
      spellIds: ["hunters-mark", "pass-without-trace"],
      preparedSpellIds: ["hunters-mark", "pass-without-trace"],
      spellSlotsRemaining: [4, 3, 2],
      pactSlotsRemaining: 0,
      trackedResources: [
        {
          id: "auto-resource:ranger-tireless",
          label: "Tireless",
          current: 3,
          max: 3,
          display: "counter",
          recovery: "longRest",
        },
      ],
      currentHitPoints: 94,
      tempHitPoints: 0,
    }),
    ...overrides,
  };
}

function makeWizardSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      name: "Smoke Test Wizard",
      classId: "wizard",
      backgroundId: "sage",
      level: 3,
      abilities: {
        strength: 8,
        dexterity: 14,
        constitution: 12,
        intelligence: 16,
        wisdom: 12,
        charisma: 10,
      },
      spellIds: ["fire-bolt", "magic-missile", "sleep"],
      preparedSpellIds: ["magic-missile", "sleep"],
      spellSlotsRemaining: [2, 0],
      pactSlotsRemaining: 0,
      trackedResources: [],
      currentHitPoints: 14,
    }),
    ...overrides,
  };
}

function makePaladinSavedSheetInput(overrides: Partial<BuilderInput> = {}): BuilderInput {
  return {
    ...makeSavedSheetInput({
      name: "Smoke Test Paladin",
      classId: "paladin",
      backgroundId: "soldier",
      level: 12,
      abilities: {
        strength: 16,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 12,
        charisma: 16,
      },
      spellIds: ["bless"],
      preparedSpellIds: ["bless"],
      spellSlotsRemaining: [4, 3, 2],
      pactSlotsRemaining: 0,
      trackedResources: [
        {
          id: "auto-resource:paladin-lay-on-hands",
          label: "Lay on Hands",
          current: 25,
          max: 60,
          display: "counter",
          recovery: "longRest",
        },
      ],
      currentHitPoints: 68,
    }),
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

async function changeInput(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;

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

function findSpellRow(container: HTMLElement, spellName: string) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>(".saved-sheet-book__spell-row")).find((button) =>
    normalizeText(button.textContent).includes(spellName),
  );
}

function findSlotRow(container: HTMLElement, levelLabel: string) {
  return Array.from(container.querySelectorAll<HTMLElement>(".saved-sheet-book__slot-ledger-row")).find((row) =>
    normalizeText(row.textContent).includes(levelLabel),
  );
}

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe("saved sheet route smoke test", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeAll(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    setWindowWidth(1400);

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

    await waitFor(() => normalizeText(container?.textContent).includes("Character Worksheet"));
    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    expect(normalizeText(appContainer.textContent)).toContain("Character Worksheet");
    expect(normalizeText(appContainer.textContent)).not.toContain("Page 1 Preview");
    expect(normalizeText(appContainer.textContent)).not.toContain("Combat Snapshot");
    expect(normalizeText(appContainer.textContent)).not.toContain("Saved sheet workspace");
    expect(normalizeText(appContainer.textContent)).not.toContain("Quick References");
    expect(normalizeText(appContainer.textContent)).not.toContain("Sheet Snapshot");
    expect(normalizeText(appContainer.textContent)).not.toContain("Desktop Layout Locked");
    expect(normalizeText(appContainer.textContent)).not.toContain("Sheet Navigator");
    expect(normalizeText(appContainer.textContent)).not.toContain("Last saved");
    expect(appContainer.querySelector(".record-sheet")).toBeTruthy();
    expect(findButtonByText(appContainer, "Export JSON")).toBeTruthy();
    expect(findButtonByText(appContainer, "Back to Roster")).toBeTruthy();

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

    const pactSlotRow = appContainer.querySelector(".saved-sheet-book__slot-ledger-row");
    const pactUseButton = pactSlotRow
      ? Array.from(pactSlotRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Use")
      : null;

    expect(pactUseButton).toBeTruthy();

    await click(pactUseButton!);

    await waitFor(() => readStoredCharacters()[0]?.pactSlotsRemaining === 1);

    expect(normalizeText(appContainer.textContent)).toContain("Saved spell slot tracking.");
  });

  it("surfaces automated class resources and lets the player spend them from the saved sheet", async () => {
    const character = buildCharacterFromInput(makeBarbarianSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Rage"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const rageRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
      normalizeText(row.textContent).includes("Rage"),
    );
    const useButton = rageRow
      ? Array.from(rageRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Use")
      : null;

    expect(rageRow).toBeTruthy();
    expect(useButton).toBeTruthy();

    await click(useButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return savedCharacter?.trackedResources.find((resource) => resource.id === "auto-resource:barbarian-rage")?.current === 2;
    });

    expect(normalizeText(appContainer.textContent)).toContain("Updated Rage.");
  });

  it("lets the player apply bounded slot recovery automation from the spellbook page", async () => {
    const character = buildCharacterFromInput(makeWizardSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Arcane Recovery"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const pageTwoButton = findButtonByText(appContainer, "Spellbook Worksheet");
    expect(pageTwoButton).toBeTruthy();

    await click(pageTwoButton!);

    const startRecoveryButton = findButtonByText(appContainer, "Start Recovery");
    expect(startRecoveryButton).toBeTruthy();

    await click(startRecoveryButton!);

    const levelOneRow = findSlotRow(appContainer, "Level 1");
    expect(levelOneRow).toBeTruthy();

    const levelOneRecoverButtons = levelOneRow
      ? Array.from(levelOneRow.querySelectorAll<HTMLButtonElement>("button")).filter((button) => normalizeText(button.textContent) === "Recover")
      : [];

    expect(levelOneRecoverButtons).toHaveLength(1);

    await click(levelOneRecoverButtons[0]!);
    await click(levelOneRecoverButtons[0]!);

    const applyRecoveryButton = findButtonByText(appContainer, "Apply Recovery");
    expect(applyRecoveryButton).toBeTruthy();

    await click(applyRecoveryButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return Boolean(
        savedCharacter &&
          savedCharacter.spellSlotsRemaining[0] === 4 &&
          savedCharacter.trackedResources.find((resource) => resource.id === "auto-resource:wizard-arcane-recovery")?.current === 0,
      );
    });

    expect(normalizeText(appContainer.textContent)).toContain("Recovered spell slots with Arcane Recovery.");
  });

  it("surfaces recovery highlights on page 1 and links directly to page 2 recovery actions", async () => {
    const character = buildCharacterFromInput(makeWizardSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Recovery Highlights"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const recoveryOverview = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__recovery-overview")).find((panel) =>
      normalizeText(panel.textContent).includes("Arcane Recovery"),
    );
    const openRecoveryButton = findButtonByText(appContainer, "Open Page 2 Recovery");

    expect(recoveryOverview).toBeTruthy();
    expect(normalizeText(recoveryOverview?.textContent)).toContain("1 recovery action ready on page 2.");
    expect(normalizeText(recoveryOverview?.textContent)).toContain("Arcane Recovery");
    expect(openRecoveryButton).toBeTruthy();

    await click(openRecoveryButton!);

    await waitFor(() => appContainer.querySelector(".saved-sheet-book")?.className.includes("saved-sheet-book--page-2") ?? false);
    expect(normalizeText(appContainer.textContent)).toContain("Recovery Actions");
  });

  it("filters the spellbook table by scope and search while keeping the inspector aligned to visible rows", async () => {
    const character = buildCharacterFromInput(makeWizardSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Spellbook Worksheet"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const pageTwoButton = findButtonByText(appContainer, "Spellbook Worksheet");
    expect(pageTwoButton).toBeTruthy();

    await click(pageTwoButton!);

    const cantripsButton = findButtonByText(appContainer, "Cantrips");
    expect(cantripsButton).toBeTruthy();

    await click(cantripsButton!);

    await waitFor(() => Boolean(findSpellRow(appContainer, "Fire Bolt")));
    expect(findSpellRow(appContainer, "Magic Missile")).toBeUndefined();
    expect(normalizeText(appContainer.textContent)).toContain("Spell Detail");
    expect(normalizeText(appContainer.textContent)).toContain("Fire Bolt");

    const allButton = findButtonByText(appContainer, "All");
    const searchInput = appContainer.querySelector<HTMLInputElement>('input[aria-label="Spell table search"]');

    expect(allButton).toBeTruthy();
    expect(searchInput).toBeTruthy();

    await click(allButton!);
    await changeInput(searchInput!, "sleep");

    await waitFor(() => Boolean(findSpellRow(appContainer, "Sleep")));
    expect(findSpellRow(appContainer, "Fire Bolt")).toBeUndefined();
    expect(normalizeText(appContainer.textContent)).toContain("Spell Detail");
    expect(normalizeText(appContainer.textContent)).toContain("Sleep");
  });

  it("navigates previous and next spells within the current filtered spellbook rows", async () => {
    const character = buildCharacterFromInput(makeWizardSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Spellbook Worksheet"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const pageTwoButton = findButtonByText(appContainer, "Spellbook Worksheet");
    expect(pageTwoButton).toBeTruthy();

    await click(pageTwoButton!);

    const leveledButton = findButtonByText(appContainer, "Leveled");
    expect(leveledButton).toBeTruthy();

    await click(leveledButton!);

    const inspectorPanel = appContainer.querySelector<HTMLElement>(".saved-sheet-book__worksheet-panel--inspector");
    expect(inspectorPanel).toBeTruthy();

    await waitFor(() => normalizeText(appContainer.textContent).includes("Showing 1 of 2 visible spells"));
    expect(normalizeText(inspectorPanel?.textContent)).toContain("Magic Missile");

    const nextSpellButton = findButtonByText(appContainer, "Next Spell");
    expect(nextSpellButton).toBeTruthy();

    await click(nextSpellButton!);

    await waitFor(() => normalizeText(appContainer.textContent).includes("Showing 2 of 2 visible spells"));
    expect(normalizeText(inspectorPanel?.textContent)).toContain("Sleep");

    const previousSpellButton = findButtonByText(appContainer, "Previous Spell");
    expect(previousSpellButton).toBeTruthy();

    await click(previousSpellButton!);

    await waitFor(() => normalizeText(appContainer.textContent).includes("Showing 1 of 2 visible spells"));
    expect(normalizeText(inspectorPanel?.textContent)).toContain("Magic Missile");
  });

  it("lets the player spend a multi-point tracked pool directly from the saved sheet", async () => {
    const character = buildCharacterFromInput(makePaladinSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Lay on Hands"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const layOnHandsRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
      normalizeText(row.textContent).includes("Lay on Hands"),
    );
    const amountInput = layOnHandsRow?.querySelector<HTMLInputElement>('input[aria-label="Lay on Hands amount"]') ?? null;
    const spendButton = layOnHandsRow
      ? Array.from(layOnHandsRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Spend")
      : null;

    expect(layOnHandsRow).toBeTruthy();
    expect(amountInput).toBeTruthy();
    expect(spendButton).toBeTruthy();

    await changeInput(amountInput!, "5");
    await waitFor(() => {
      const refreshedRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
        normalizeText(row.textContent).includes("Lay on Hands"),
      );
      const refreshedInput = refreshedRow?.querySelector<HTMLInputElement>('input[aria-label="Lay on Hands amount"]') ?? null;
      return refreshedInput?.value === "5";
    });

    const refreshedLayOnHandsRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
      normalizeText(row.textContent).includes("Lay on Hands"),
    );
    const refreshedSpendButton = refreshedLayOnHandsRow
      ? Array.from(refreshedLayOnHandsRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Spend")
      : null;

    expect(refreshedSpendButton).toBeTruthy();

    await click(refreshedSpendButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return savedCharacter?.trackedResources.find((resource) => resource.id === "auto-resource:paladin-lay-on-hands")?.current === 20;
    });

    expect(normalizeText(appContainer.textContent)).toContain("Spent 5 from Lay on Hands.");
  });

  it("lets the player heal current HP directly from Lay on Hands on the saved sheet", async () => {
    const character = buildCharacterFromInput(makePaladinSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Lay on Hands"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const layOnHandsRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
      normalizeText(row.textContent).includes("Lay on Hands"),
    );
    const amountInput = layOnHandsRow?.querySelector<HTMLInputElement>('input[aria-label="Lay on Hands amount"]') ?? null;
    const healButton = layOnHandsRow
      ? Array.from(layOnHandsRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Heal HP")
      : null;

    expect(layOnHandsRow).toBeTruthy();
    expect(amountInput).toBeTruthy();
    expect(healButton).toBeTruthy();

    await changeInput(amountInput!, "5");
    await click(healButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return Boolean(
        savedCharacter &&
          savedCharacter.currentHitPoints === 73 &&
          savedCharacter.trackedResources.find((resource) => resource.id === "auto-resource:paladin-lay-on-hands")?.current === 20,
      );
    });

    expect(normalizeText(appContainer.textContent)).toContain("Restored 5 HP with Lay on Hands.");
  });

  it("lets the player use Second Wind self-healing directly from the saved sheet", async () => {
    const character = buildCharacterFromInput(makeFighterSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Second Wind"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const secondWindRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
      normalizeText(row.textContent).includes("Second Wind"),
    );
    const healButton = secondWindRow
      ? Array.from(secondWindRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Average Heal")
      : null;

    expect(secondWindRow).toBeTruthy();
    expect(healButton).toBeTruthy();

    await click(healButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return Boolean(
        savedCharacter &&
          savedCharacter.currentHitPoints === 143 &&
          savedCharacter.trackedResources.find((resource) => resource.id === "auto-resource:fighter-second-wind")?.current === 2,
      );
    });

    expect(normalizeText(appContainer.textContent)).toContain("Restored 23 HP with Second Wind using average healing.");
  });

  it("lets the player use Tireless temporary hit points directly from the saved sheet", async () => {
    const character = buildCharacterFromInput(makeRangerSavedSheetInput());
    window.localStorage.setItem(CHARACTERS_KEY, JSON.stringify([character]));
    window.localStorage.setItem(HOMEBREW_KEY, "[]");
    window.location.hash = `#/characters/${character.id}`;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<App />);
    });

    await waitFor(() => normalizeText(container?.textContent).includes("Tireless"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const tirelessRow = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__resource-row")).find((row) =>
      normalizeText(row.textContent).includes("Tireless"),
    );
    const tempHpButton = tirelessRow
      ? Array.from(tirelessRow.querySelectorAll<HTMLButtonElement>("button")).find((button) => normalizeText(button.textContent) === "Average Temp HP")
      : null;

    expect(tirelessRow).toBeTruthy();
    expect(tempHpButton).toBeTruthy();

    await click(tempHpButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return Boolean(
        savedCharacter &&
          savedCharacter.tempHitPoints === 8 &&
          savedCharacter.trackedResources.find((resource) => resource.id === "auto-resource:ranger-tireless")?.current === 2,
      );
    });

    expect(normalizeText(appContainer.textContent)).toContain("Set temporary HP to 8 with Tireless using average healing.");
  });

  it("triages tracked resources so attention items stay visible before ready rows", async () => {
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

    await waitFor(() => normalizeText(container?.textContent).includes("Needs Attention 1"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const trackedResourcesPanel = Array.from(appContainer.querySelectorAll<HTMLElement>(".saved-sheet-book__panel")).find((panel) =>
      normalizeText(panel.textContent).includes("Tracked Resources") && normalizeText(panel.textContent).includes("Show Ready Resources"),
    );

    expect(trackedResourcesPanel).toBeTruthy();
    expect(normalizeText(trackedResourcesPanel?.textContent)).toContain("Dark One's Blessing");
    expect(normalizeText(trackedResourcesPanel?.textContent)).not.toContain("Magical Cunning");

    const showReadyButton = findButtonByText(appContainer, "Show Ready Resources (1)");

    expect(showReadyButton).toBeTruthy();

    await click(showReadyButton!);

    await waitFor(() => normalizeText(trackedResourcesPanel?.textContent).includes("Magical Cunning"));
    expect(normalizeText(trackedResourcesPanel?.textContent)).toContain("Hide Ready Resources (1)");
  });

  it("lets the player spend hit dice with average healing from the saved-sheet rest panel", async () => {
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

    await waitFor(() => normalizeText(container?.textContent).includes("Hit Dice Actions"));

    const appContainer = container;

    if (!appContainer) {
      throw new Error("Expected app container to exist.");
    }

    const amountInput = appContainer.querySelector<HTMLInputElement>('input[aria-label="Hit Dice amount"]');
    const averageHealButton = findButtonByText(appContainer, "Average Heal");

    expect(amountInput).toBeTruthy();
    expect(averageHealButton).toBeTruthy();

    await changeInput(amountInput!, "1");
    await click(averageHealButton!);

    await waitFor(() => {
      const savedCharacter = readStoredCharacters()[0];
      return Boolean(savedCharacter && savedCharacter.currentHitPoints === 15 && savedCharacter.hitDiceSpent === 2);
    });

    expect(normalizeText(appContainer.textContent)).toContain("Spent 1 Hit Dice and healed 6 HP using average healing.");
  });
});
