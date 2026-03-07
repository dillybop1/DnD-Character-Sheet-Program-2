import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CompendiumEntry, CompendiumType } from "../../shared/types";
import { CompendiumEntryDetail } from "../components/CompendiumEntryDetail";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";
import { humanizeLabel } from "../lib/editor";

const FILTERS: Array<{ label: string; value?: CompendiumType }> = [
  { label: "All" },
  { label: "Classes", value: "class" },
  { label: "Subclasses", value: "subclass" },
  { label: "Species", value: "species" },
  { label: "Backgrounds", value: "background" },
  { label: "Spells", value: "spell" },
  { label: "Weapons", value: "weapon" },
  { label: "Armor", value: "armor" },
  { label: "Gear", value: "gear" },
  { label: "Feats", value: "feat" },
  { label: "Rules", value: "rule" },
];

export function CompendiumPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CompendiumType | undefined>(undefined);
  const [entries, setEntries] = useState<CompendiumEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CompendiumEntry | null>(null);
  const [status, setStatus] = useState("Open-content reference library.");
  const deferredQuery = useDeferredValue(query);
  const selectedSlug = searchParams.get("slug");

  useEffect(() => {
    async function search() {
      const results = await dndApi.compendium.search({
        query: deferredQuery,
        type: filter,
      });
      setEntries(results);
      setSelectedEntry((current) => {
        if (selectedSlug) {
          return current;
        }

        if (current && results.some((entry) => entry.slug === current.slug)) {
          return current;
        }

        return results[0] ?? null;
      });
      setStatus(results.length > 0 ? `${results.length} entries found.` : "No matching entries.");
    }

    search().catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Failed to search compendium.");
    });
  }, [deferredQuery, filter, selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) {
      return;
    }

    dndApi.compendium
      .get(selectedSlug)
      .then((entry) => {
        setSelectedEntry(entry);
        setStatus(entry ? `Showing ${entry.name}.` : "Linked entry not found.");
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Failed to load linked entry.");
      });
  }, [selectedSlug]);

  return (
    <div className="workspace workspace--two-up">
      <SectionCard
        title="Linked Compendium"
        subtitle="Open reference content"
      >
        <div className="stack-md">
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search classes, subclasses, spells, gear, rules, and more..."
            value={query}
          />
          <div className="filter-row">
            {FILTERS.map((entry) => (
              <button
                key={entry.label}
                className={`chip ${filter === entry.value ? "chip--active" : ""}`}
                onClick={() => setFilter(entry.value)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
          <p className="muted-copy">{status}</p>
          <div className="compendium-list">
            {entries.map((entry) => (
              <button
                key={entry.slug}
                className={`library-item ${selectedEntry?.slug === entry.slug ? "library-item--active" : ""}`}
                onClick={async () => {
                  setSearchParams({ slug: entry.slug });
                }}
                type="button"
              >
                <strong>{entry.name}</strong>
                <div className="library-item__meta">
                  <span className="library-item__pill">{humanizeLabel(entry.type)}</span>
                  <span>{entry.source}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={selectedEntry?.name ?? "Entry Detail"}
        subtitle={selectedEntry?.type ?? "Select an entry"}
      >
        <CompendiumEntryDetail entry={selectedEntry} />
      </SectionCard>
    </div>
  );
}
