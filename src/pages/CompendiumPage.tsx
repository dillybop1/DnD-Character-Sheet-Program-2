import { useDeferredValue, useEffect, useState } from "react";
import type { CompendiumEntry, CompendiumType } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

const FILTERS: Array<{ label: string; value?: CompendiumType }> = [
  { label: "All" },
  { label: "Classes", value: "class" },
  { label: "Species", value: "species" },
  { label: "Backgrounds", value: "background" },
  { label: "Spells", value: "spell" },
  { label: "Weapons", value: "weapon" },
  { label: "Armor", value: "armor" },
  { label: "Feats", value: "feat" },
  { label: "Rules", value: "rule" },
];

export function CompendiumPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CompendiumType | undefined>(undefined);
  const [entries, setEntries] = useState<CompendiumEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CompendiumEntry | null>(null);
  const [status, setStatus] = useState("Open-content reference library.");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    async function search() {
      const results = await dndApi.compendium.search({
        query: deferredQuery,
        type: filter,
      });
      setEntries(results);
      setSelectedEntry((current) => {
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
  }, [deferredQuery, filter]);

  return (
    <div className="workspace workspace--two-up">
      <SectionCard
        title="Linked Compendium"
        subtitle="Open reference content"
      >
        <div className="stack-md">
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search spells, weapons, rules, and more..."
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
                  const detail = await dndApi.compendium.get(entry.slug);
                  setSelectedEntry(detail);
                }}
                type="button"
              >
                <strong>{entry.name}</strong>
                <span>
                  {entry.type} · {entry.source}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={selectedEntry?.name ?? "Entry Detail"}
        subtitle={selectedEntry?.type ?? "Select an entry"}
      >
        {selectedEntry ? (
          <div className="stack-md">
            <p>{selectedEntry.summary}</p>
            <div className="detail-grid">
              <div>
                <span className="detail-label">Ruleset</span>
                <strong>{selectedEntry.ruleset}</strong>
              </div>
              <div>
                <span className="detail-label">Source</span>
                <strong>{selectedEntry.source}</strong>
              </div>
              <div>
                <span className="detail-label">License</span>
                <strong>{selectedEntry.license}</strong>
              </div>
              <div>
                <span className="detail-label">Attribution</span>
                <strong>{selectedEntry.attribution}</strong>
              </div>
            </div>
            <pre className="payload-view">{JSON.stringify(selectedEntry.payload, null, 2)}</pre>
          </div>
        ) : (
          <div className="empty-state">Search or select an entry to inspect it.</div>
        )}
      </SectionCard>
    </div>
  );
}
