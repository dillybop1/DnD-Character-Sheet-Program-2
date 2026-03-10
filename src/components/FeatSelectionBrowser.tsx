import { useDeferredValue, useEffect, useState } from "react";
import type { CompendiumEntry } from "../../shared/types";

const FEAT_SUPPORT_OPTIONS = ["All Support", "Derived", "Partial", "Reference"] as const;
const FEAT_SUPPORT_ORDER = new Map([
  ["Derived", 0],
  ["Partial", 1],
  ["Reference", 2],
]);

type FeatBrowseMode = "all" | "selected" | "unselected" | "blocked";

interface FeatBrowserAvailability {
  selectable: boolean;
  constraintMessage?: string | null;
}

interface FeatCompendiumPayload extends Record<string, unknown> {
  support?: string;
  prerequisites?: string;
  benefits?: string[];
  automation?: string;
  choiceSummary?: string;
  choiceOptions?: string[];
}

interface FeatSelectionBrowserProps {
  title: string;
  scopeKey: string;
  entries: CompendiumEntry[];
  selectedFeatIds: string[];
  availabilityById: Map<string, FeatBrowserAvailability>;
  emptyMessage: string;
  onToggleFeat: (featId: string) => void;
  onOpenReference: (featId: string) => void;
}

function readFeatPayload(entry: CompendiumEntry): FeatCompendiumPayload | null {
  return entry.type === "feat" ? (entry.payload as FeatCompendiumPayload) : null;
}

function buildFeatSearchText(entry: CompendiumEntry, payload: FeatCompendiumPayload) {
  return [
    entry.name,
    entry.summary,
    entry.searchText,
    payload.support ?? "",
    payload.prerequisites ?? "",
    payload.automation ?? "",
    ...(payload.benefits ?? []),
    payload.choiceSummary ?? "",
    ...(payload.choiceOptions ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function formatSupportGroupLabel(label: string) {
  return `${label} Support`;
}

export function FeatSelectionBrowser({
  title,
  scopeKey,
  entries,
  selectedFeatIds,
  availabilityById,
  emptyMessage,
  onToggleFeat,
  onOpenReference,
}: FeatSelectionBrowserProps) {
  const [query, setQuery] = useState("");
  const [supportFilter, setSupportFilter] = useState<(typeof FEAT_SUPPORT_OPTIONS)[number]>("All Support");
  const [browseMode, setBrowseMode] = useState<FeatBrowseMode>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedTerms = deferredQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const selectedFeatIdsSet = new Set(selectedFeatIds);

  useEffect(() => {
    setQuery("");
    setSupportFilter("All Support");
    setBrowseMode("all");
  }, [scopeKey]);

  const selectedCount = entries.filter((entry) => selectedFeatIdsSet.has(entry.slug)).length;
  const configurableCount = entries.filter((entry) => Boolean(readFeatPayload(entry)?.choiceSummary)).length;
  const blockedCount = entries.filter((entry) => {
    const availability = availabilityById.get(entry.slug);
    return !selectedFeatIdsSet.has(entry.slug) && !availability?.selectable;
  }).length;
  const hasActiveFilters = query.trim().length > 0 || supportFilter !== "All Support" || browseMode !== "all";

  const filteredEntries = entries.filter((entry) => {
    const payload = readFeatPayload(entry);

    if (!payload) {
      return false;
    }

    const isSelected = selectedFeatIdsSet.has(entry.slug);
    const isBlocked = !isSelected && !availabilityById.get(entry.slug)?.selectable;

    if (supportFilter !== "All Support" && payload.support !== supportFilter) {
      return false;
    }

    if (browseMode === "selected" && !isSelected) {
      return false;
    }

    if (browseMode === "unselected" && isSelected) {
      return false;
    }

    if (browseMode === "blocked" && !isBlocked) {
      return false;
    }

    if (normalizedTerms.length === 0) {
      return true;
    }

    const haystack = buildFeatSearchText(entry, payload);
    return normalizedTerms.every((term) => haystack.includes(term));
  });

  const groupedEntries = Array.from(
    filteredEntries.reduce((groups, entry) => {
      const payload = readFeatPayload(entry);
      const supportLabel = payload?.support ?? "Reference";
      const existing = groups.get(supportLabel) ?? [];

      existing.push(entry);
      groups.set(supportLabel, existing);

      return groups;
    }, new Map<string, CompendiumEntry[]>()),
  )
    .sort(([leftLabel], [rightLabel]) => {
      const leftOrder = FEAT_SUPPORT_ORDER.get(leftLabel) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = FEAT_SUPPORT_ORDER.get(rightLabel) ?? Number.MAX_SAFE_INTEGER;

      return leftOrder - rightOrder || leftLabel.localeCompare(rightLabel);
    })
    .map(([supportLabel, groupEntries]) => ({
      supportLabel,
      entries: [...groupEntries].sort((left, right) => left.name.localeCompare(right.name)),
    }));

  const browseStatus =
    entries.length === 0
      ? emptyMessage
      : filteredEntries.length === 0
        ? hasActiveFilters
          ? "No feats match the current builder browse filters."
          : "No feats available in this list."
        : filteredEntries.length === entries.length
          ? `${filteredEntries.length} feats shown.`
          : `${filteredEntries.length} of ${entries.length} feats shown.`;

  if (entries.length === 0) {
    return (
      <div className="detail-card">
        <p className="muted-copy">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="stack-md">
      <div className="detail-card">
        <div className="detail-card__header">
          <strong>{title}</strong>
          {hasActiveFilters ? (
            <button
              className="inline-link-button"
              onClick={() => {
                setQuery("");
                setSupportFilter("All Support");
                setBrowseMode("all");
              }}
              type="button"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
        <div className="compendium-filter-grid feat-browser__controls">
          <label>
            <span>Search</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by feat name, support level, benefits, automation, or choice text..."
              value={query}
            />
          </label>
          <label>
            <span>Support</span>
            <select onChange={(event) => setSupportFilter(event.target.value as (typeof FEAT_SUPPORT_OPTIONS)[number])} value={supportFilter}>
              {FEAT_SUPPORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          {[
            { label: "All", value: "all" },
            { label: "Selected", value: "selected" },
            { label: "Unselected", value: "unselected" },
            { label: "Blocked", value: "blocked" },
          ].map((option) => (
            <button
              key={option.value}
              className={`chip ${browseMode === option.value ? "chip--active" : ""}`}
              onClick={() => setBrowseMode(option.value as FeatBrowseMode)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="chip">{selectedCount} selected</span>
          <span className="chip">{configurableCount} configurable</span>
          <span className="chip">{blockedCount} blocked</span>
          <span className="chip">{entries.length} total</span>
        </div>
        <p className="muted-copy">{browseStatus}</p>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="detail-card">
          <p className="muted-copy">Adjust the current filters or browse mode to surface feats from this list.</p>
        </div>
      ) : null}

      {groupedEntries.map((group) => (
        <div key={`${title}-${group.supportLabel}`} className="detail-card feat-browser__group">
          <div className="detail-card__header">
            <strong>{formatSupportGroupLabel(group.supportLabel)}</strong>
            <span>{group.entries.length} shown</span>
          </div>
          <div className="stack-sm">
            {group.entries.map((entry) => {
              const payload = readFeatPayload(entry);

              if (!payload) {
                return null;
              }

              const availability = availabilityById.get(entry.slug);
              const isSelected = selectedFeatIdsSet.has(entry.slug);
              const isBlocked = !isSelected && !availability?.selectable;

              return (
                <div key={entry.slug} className="library-item feat-browser__item">
                  <div className="choice-row">
                    <label className="checkbox-field">
                      <input
                        checked={isSelected}
                        disabled={!isSelected && !availability?.selectable}
                        onChange={() => onToggleFeat(entry.slug)}
                        type="checkbox"
                      />
                      <span>{entry.name}</span>
                    </label>
                    <div className="library-item__actions">
                      <button
                        className="inline-link-button"
                        onClick={() => onOpenReference(entry.slug)}
                        type="button"
                      >
                        Ref
                      </button>
                    </div>
                  </div>
                  <div className="library-item__meta">
                    <span className="library-item__pill">{payload.support ?? "Reference"} support</span>
                    {payload.choiceSummary ? <span className="library-item__pill">Configurable</span> : null}
                    {isSelected ? <span className="library-item__pill">Selected</span> : null}
                    {isBlocked ? <span className="library-item__pill">Blocked</span> : null}
                  </div>
                  <p className="muted-copy">{entry.summary}</p>
                  {typeof payload.automation === "string" && payload.automation.length > 0 ? (
                    <p className="muted-copy">{payload.automation}</p>
                  ) : null}
                  {typeof payload.choiceSummary === "string" && payload.choiceSummary.length > 0 ? (
                    <p className="muted-copy">{payload.choiceSummary}</p>
                  ) : null}
                  {isBlocked && availability?.constraintMessage ? (
                    <p className="muted-copy">{availability.constraintMessage}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
