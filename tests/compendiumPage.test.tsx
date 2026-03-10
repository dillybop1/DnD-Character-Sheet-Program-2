// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { CompendiumPage } from "../src/pages/CompendiumPage";

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function setActEnvironment(enabled: boolean) {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = enabled;
}

async function updateSelect(select: HTMLSelectElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe("CompendiumPage", () => {
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

  it("hydrates and resets spell browse state from the URL", async () => {
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={["/compendium?type=spell&q=wish&spellClass=Wizard&spellLevel=9&spellSchool=Conjuration&spellConcentration=no&spellRitual=no"]}>
          <Routes>
            <Route
              element={
                <>
                  <LocationProbe />
                  <CompendiumPage />
                </>
              }
              path="/compendium"
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await flushEffects();

    const searchInput = container.querySelector("input");
    const selects = container.querySelectorAll("select");
    const resetButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Reset Browse State",
    );
    const location = container.querySelector('[data-testid="location"]');

    expect(searchInput).toBeInstanceOf(HTMLInputElement);
    expect((searchInput as HTMLInputElement).value).toBe("wish");
    expect(selects).toHaveLength(5);
    expect((selects[0] as HTMLSelectElement).value).toBe("Wizard");
    expect((selects[1] as HTMLSelectElement).value).toBe("9");
    expect((selects[2] as HTMLSelectElement).value).toBe("Conjuration");
    expect((selects[3] as HTMLSelectElement).value).toBe("no");
    expect((selects[4] as HTMLSelectElement).value).toBe("no");
    expect(location?.textContent).toContain("type=spell");
    expect(location?.textContent).toContain("q=wish");
    expect(container.textContent).toContain("Wish");
    expect(resetButton).toBeTruthy();

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll("select")).toHaveLength(0);
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/compendium");
  });

  it("preserves browse params when selecting an entry", async () => {
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={["/compendium?type=spell&q=wish"]}>
          <Routes>
            <Route
              element={
                <>
                  <LocationProbe />
                  <CompendiumPage />
                </>
              }
              path="/compendium"
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await flushEffects();

    const wishRow = [...container.querySelectorAll(".library-item")].find((item) =>
      item.textContent?.includes("Wish"),
    );

    expect(wishRow).toBeTruthy();

    await act(async () => {
      wishRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    const location = container.querySelector('[data-testid="location"]');

    expect(location?.textContent).toContain("type=spell");
    expect(location?.textContent).toContain("q=wish");
    expect(location?.textContent).toContain("slug=wish");
  });

  it("hydrates and preserves typed non-spell facet filters from the URL", async () => {
    await act(async () => {
      root?.render(
        <MemoryRouter initialEntries={["/compendium?type=feat&facet=Derived"]}>
          <Routes>
            <Route
              element={
                <>
                  <LocationProbe />
                  <CompendiumPage />
                </>
              }
              path="/compendium"
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await flushEffects();

    const selects = container.querySelectorAll("select");
    const location = container.querySelector('[data-testid="location"]');

    expect(selects).toHaveLength(1);
    expect((selects[0] as HTMLSelectElement).value).toBe("Derived");
    expect(location?.textContent).toContain("type=feat");
    expect(location?.textContent).toContain("facet=Derived");
    expect(container.textContent).toContain("Alert");
    expect(container.textContent).toContain("Skill Expert");
    expect(container.textContent).not.toContain("Magic Initiate");

    const skillExpertRow = [...container.querySelectorAll(".library-item")].find((item) =>
      item.textContent?.includes("Skill Expert"),
    );

    expect(skillExpertRow).toBeTruthy();

    await act(async () => {
      skillExpertRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain("facet=Derived");
    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain("slug=skill-expert");

    await updateSelect(selects[0] as HTMLSelectElement, "Partial");

    await flushEffects();

    expect(container.querySelector('[data-testid="location"]')?.textContent).toContain("facet=Partial");
    expect(container.textContent).toContain("Magic Initiate");
    expect(container.textContent).not.toContain("Alert");
  });

  it("shows a return action when opened from character context and preserves it across browse changes", async () => {
    await act(async () => {
      root?.render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/compendium",
              search: "?type=spell&slug=fireball",
              state: {
                returnTo: "/characters/new",
                returnLabel: "Back to Builder",
                originLabel: "Character Builder",
              },
            },
          ]}
        >
          <Routes>
            <Route
              element={
                <>
                  <LocationProbe />
                  <CompendiumPage />
                </>
              }
              path="/compendium"
            />
            <Route
              element={
                <>
                  <LocationProbe />
                  <div>Builder Route</div>
                </>
              }
              path="/characters/new"
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await flushEffects();

    expect(container.textContent).toContain("Character Builder");

    const resetButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Reset Browse State",
    );

    expect(resetButton).toBeTruthy();

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.textContent).toContain("Character Builder");
    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/compendium");

    const backButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Back to Builder",
    );

    expect(backButton).toBeTruthy();

    await act(async () => {
      backButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/characters/new");
    expect(container.textContent).toContain("Builder Route");
  });

  it("opens related entries as typed deep links without losing the return handoff", async () => {
    await act(async () => {
      root?.render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/compendium",
              search: "?type=rule&slug=armor-class",
              state: {
                returnTo: "/characters/new",
                returnLabel: "Back to Builder",
                originLabel: "Character Builder",
              },
            },
          ]}
        >
          <Routes>
            <Route
              element={
                <>
                  <LocationProbe />
                  <CompendiumPage />
                </>
              }
              path="/compendium"
            />
            <Route
              element={
                <>
                  <LocationProbe />
                  <div>Builder Route</div>
                </>
              }
              path="/characters/new"
            />
          </Routes>
        </MemoryRouter>,
      );
    });

    await flushEffects();

    expect(container.textContent).toContain("Related Entries");
    expect(container.textContent).toContain("Chain Mail (Armor)");

    const relatedEntryButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Chain Mail (Armor)",
    );

    await act(async () => {
      relatedEntryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    const location = container.querySelector('[data-testid="location"]');
    const backButton = [...container.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Back to Builder",
    );

    expect(location?.textContent).toContain("type=armor");
    expect(location?.textContent).toContain("slug=chain-mail");
    expect(container.textContent).toContain("Character Builder");
    expect(backButton).toBeTruthy();

    await act(async () => {
      backButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelector('[data-testid="location"]')?.textContent).toBe("/characters/new");
    expect(container.textContent).toContain("Builder Route");
  });
});
