// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LoadoutManagerCard } from "../src/components/LoadoutManagerCard";

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

describe("LoadoutManagerCard", () => {
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

  it("surfaces current loadout state and forwards direct loadout actions", async () => {
    const onSetEquipped = vi.fn();
    const onUseUnarmored = vi.fn();
    const onOpenReference = vi.fn();

    await act(async () => {
      root?.render(
        <LoadoutManagerCard
          armorEntries={[
            { id: "armor-1", name: "Leather Armor", equipped: false, referenceSlug: "leather", summary: "11 + Dexterity modifier" },
            { id: "armor-2", name: "Chain Mail", equipped: true, referenceSlug: "chain-mail", summary: "Flat AC 16" },
          ]}
          onOpenReference={onOpenReference}
          onSetEquipped={onSetEquipped}
          onUseUnarmored={onUseUnarmored}
          shieldEntries={[{ id: "gear-1", name: "Shield", equipped: true, referenceSlug: "shield", summary: "+2 Armor Class while equipped" }]}
          weaponEntries={[
            { id: "weapon-1", name: "Longsword", equipped: true, referenceSlug: "longsword", summary: "1d8 slashing" },
            { id: "weapon-2", name: "Shortbow", equipped: false, referenceSlug: "shortbow", summary: "1d6 piercing" },
          ]}
        />,
      );
    });

    await flushEffects();

    expect(container.textContent).toContain("Loadout Manager");
    expect(container.textContent).toContain("Chain Mail");
    expect(container.textContent).toContain("Ready");
    expect(container.textContent).toContain("1 active weapon");

    const useUnarmoredButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Use Unarmored",
    );
    const leatherButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Leather Armor",
    );
    const shieldRefButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Ref",
    );
    const shortbowEquipButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Equip",
    );

    await act(async () => {
      useUnarmoredButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      leatherButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      shieldRefButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      shortbowEquipButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onUseUnarmored).toHaveBeenCalled();
    expect(onSetEquipped).toHaveBeenCalledWith("armor-1", true);
    expect(onSetEquipped).toHaveBeenCalledWith("weapon-2", true);
    expect(onOpenReference).toHaveBeenCalled();
  });

  it("handles empty tracked sections without crashing", async () => {
    await act(async () => {
      root?.render(
        <LoadoutManagerCard
          armorEntries={[]}
          onOpenReference={() => {}}
          onSetEquipped={() => {}}
          onUseUnarmored={() => {}}
          shieldEntries={[]}
          weaponEntries={[]}
        />,
      );
    });

    await flushEffects();

    expect(container.textContent).toContain("Use Unarmored");
    expect(container.textContent).toContain("No shield is currently tracked in inventory.");
    expect(container.textContent).toContain("No tracked weapons yet.");
  });
});
