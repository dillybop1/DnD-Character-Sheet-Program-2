import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompendiumEntryDetail } from "../src/components/CompendiumEntryDetail";
import type { CompendiumEntry } from "../shared/types";

describe("CompendiumEntryDetail", () => {
  it("prefers long-form exact text over browse summary copy when present", () => {
    const entry: CompendiumEntry = {
      slug: "test-spell",
      sourceId: "core-open",
      type: "spell",
      name: "Test Spell",
      ruleset: "2024",
      source: "SRD / Free Rules",
      license: "CC-BY-4.0 / Open Content",
      attribution: "Wizards of the Coast open rules content",
      summary: "Short browse summary.",
      searchText: "test spell short browse summary",
      payload: {
        level: 1,
        school: "Illusion",
        effect: "Short effect snippet.",
        description: "Exact official spell text.",
      },
    };

    const markup = renderToStaticMarkup(<CompendiumEntryDetail entry={entry} />);

    expect(markup).toContain("Exact official spell text.");
    expect(markup).not.toContain("Short browse summary.");
    expect(markup).not.toContain("Short effect snippet.");
  });
});
