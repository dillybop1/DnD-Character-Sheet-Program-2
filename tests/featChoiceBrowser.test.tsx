// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getFeatTemplate } from "../shared/data/reference";
import { FeatChoiceBrowser } from "../src/components/FeatChoiceBrowser";

function setActEnvironment(enabled: boolean) {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = enabled;
}

function requireFeatTemplate(featId: string) {
  const template = getFeatTemplate(featId);

  if (!template) {
    throw new Error(`Missing feat template for ${featId}`);
  }

  return template;
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

describe("FeatChoiceBrowser", () => {
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

  it("filters configurable feat options and forwards toggle or reference actions", async () => {
    const onToggleChoice = vi.fn();
    const onOpenReference = vi.fn();

    await act(async () => {
      root?.render(
        <FeatChoiceBrowser
          classId="fighter"
          feat={requireFeatTemplate("resilient")}
          featSelections={{ resilient: ["dexterity"] }}
          onOpenReference={onOpenReference}
          onToggleChoice={onToggleChoice}
          scopeKey="resilient:fighter"
          selectedChoices={["dexterity"]}
          skillProficiencies={{}}
        />,
      );
    });

    await flushEffects();

    expect(container.textContent).toContain("Resilient Choices");
    expect(container.textContent).toContain("1 of 1 required");
    expect(container.querySelectorAll(".feat-choice-browser__item")).toHaveLength(6);

    const unavailableButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Unavailable",
    );

    await act(async () => {
      unavailableButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    expect(container.querySelectorAll(".feat-choice-browser__item")).toHaveLength(2);

    const resetButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Reset Filters",
    );

    await act(async () => {
      resetButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushEffects();

    const searchInput = container.querySelector("input");

    expect(searchInput).toBeInstanceOf(HTMLInputElement);

    await updateTextInput(searchInput as HTMLInputElement, "wis");

    await flushEffects();

    expect(container.querySelectorAll(".feat-choice-browser__item")).toHaveLength(1);

    const wisdomLabel = [...container.querySelectorAll("label.checkbox-field")].find((label) =>
      label.textContent?.includes("Wisdom"),
    );
    const refButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Ref",
    );

    await act(async () => {
      wisdomLabel?.querySelector("input")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      refButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onToggleChoice).toHaveBeenCalledWith("resilient", "wisdom");
    expect(onOpenReference).toHaveBeenCalledWith("resilient");
  });

  it("resets its local browse state when the feat-choice scope changes", async () => {
    const feat = requireFeatTemplate("skilled");

    await act(async () => {
      root?.render(
        <FeatChoiceBrowser
          classId="fighter"
          feat={feat}
          featSelections={{}}
          onOpenReference={() => {}}
          onToggleChoice={() => {}}
          scopeKey="skilled:fighter"
          selectedChoices={[]}
          skillProficiencies={{ arcana: "proficient" }}
        />,
      );
    });

    await flushEffects();

    const unavailableButton = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.trim() === "Unavailable",
    );
    const searchInput = container.querySelector("input");

    expect(searchInput).toBeInstanceOf(HTMLInputElement);

    await act(async () => {
      unavailableButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await updateTextInput(searchInput as HTMLInputElement, "arc");

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("arc");
    expect(container.querySelectorAll(".feat-choice-browser__item")).toHaveLength(1);

    await act(async () => {
      root?.render(
        <FeatChoiceBrowser
          classId="wizard"
          feat={feat}
          featSelections={{}}
          onOpenReference={() => {}}
          onToggleChoice={() => {}}
          scopeKey="skilled:wizard"
          selectedChoices={[]}
          skillProficiencies={{ arcana: "proficient" }}
        />,
      );
    });

    await flushEffects();

    expect((container.querySelector("input") as HTMLInputElement).value).toBe("");
    expect(container.querySelectorAll(".feat-choice-browser__item")).toHaveLength(feat.choiceGroups?.[0]?.options.length ?? 0);
  });
});
