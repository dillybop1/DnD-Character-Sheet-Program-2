import { useDeferredValue, useEffect, useState } from "react";
import type { CompendiumEntry, SpellCompendiumPayload } from "../../shared/types";

const SPELL_LEVEL_OPTIONS = [
  { label: "All Levels", value: "all" },
  { label: "Cantrips", value: "0" },
  { label: "Level 1", value: "1" },
  { label: "Level 2", value: "2" },
  { label: "Level 3", value: "3" },
  { label: "Level 4", value: "4" },
  { label: "Level 5", value: "5" },
  { label: "Level 6", value: "6" },
  { label: "Level 7", value: "7" },
  { label: "Level 8", value: "8" },
  { label: "Level 9", value: "9" },
];
const SPELL_SCHOOL_OPTIONS = [
  "All Schools",
  "Abjuration",
  "Conjuration",
  "Divination",
  "Enchantment",
  "Evocation",
  "Illusion",
  "Necromancy",
  "Transmutation",
];

type SpellBrowseMode = "all" | "selected" | "unselected" | "prepared";

interface SpellSelectionBrowserProps {
  title: string;
  scopeKey: string;
  entries: CompendiumEntry[];
  selectedSpellIds: string[];
  preparedSpellIds?: string[];
  emptyMessage: string;
  onToggleSpell: (spellId: string) => void;
  onOpenReference: (spellId: string) => void;
  onTogglePreparedSpell?: (spellId: string) => void;
}

function readSpellPayload(entry: CompendiumEntry): SpellCompendiumPayload | null {
  return entry.type === "spell" ? (entry.payload as SpellCompendiumPayload) : null;
}

function formatSpellLevelLabel(level: number) {
  return level === 0 ? "Cantrips" : `Level ${level}`;
}

function buildSpellSearchText(entry: CompendiumEntry, payload: SpellCompendiumPayload) {
  return [
    entry.name,
    entry.summary,
    entry.searchText,
    payload.school,
    payload.classes.join(" "),
    payload.castingTime,
    payload.range,
    payload.duration,
    typeof payload.damage === "string" ? payload.damage : "",
    typeof payload.healing === "string" ? payload.healing : "",
    typeof payload.effect === "string" ? payload.effect : "",
    typeof payload.description === "string" ? payload.description : "",
    typeof payload.higherLevel === "string" ? payload.higherLevel : "",
  ]
    .join(" ")
    .toLowerCase();
}

export function SpellSelectionBrowser({
  title,
  scopeKey,
  entries,
  selectedSpellIds,
  preparedSpellIds = [],
  emptyMessage,
  onToggleSpell,
  onOpenReference,
  onTogglePreparedSpell,
}: SpellSelectionBrowserProps) {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [browseMode, setBrowseMode] = useState<SpellBrowseMode>("all");
  const deferredQuery = useDeferredValue(query);
  const supportsPreparedBrowse = Boolean(onTogglePreparedSpell);
  const selectedSpellIdsSet = new Set(selectedSpellIds);
  const preparedSpellIdsSet = new Set(preparedSpellIds);
  const availableBrowseModes: Array<{ label: string; value: SpellBrowseMode }> = [
    { label: "All", value: "all" },
    { label: "Selected", value: "selected" },
    { label: "Unselected", value: "unselected" },
  ];

  if (supportsPreparedBrowse) {
    availableBrowseModes.push({ label: "Ready Only", value: "prepared" });
  }

  useEffect(() => {
    setQuery("");
    setLevelFilter("all");
    setSchoolFilter("All Schools");
    setBrowseMode("all");
  }, [scopeKey]);

  useEffect(() => {
    if (browseMode === "prepared" && !supportsPreparedBrowse) {
      setBrowseMode("all");
    }
  }, [browseMode, supportsPreparedBrowse]);

  const normalizedTerms = deferredQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const selectedCount = entries.filter((entry) => selectedSpellIdsSet.has(entry.slug)).length;
  const readyCount = entries.filter((entry) => preparedSpellIdsSet.has(entry.slug)).length;
  const hasActiveFilters =
    query.trim().length > 0 ||
    levelFilter !== "all" ||
    schoolFilter !== "All Schools" ||
    browseMode !== "all";
  const filteredEntries = entries.filter((entry) => {
    const payload = readSpellPayload(entry);

    if (!payload) {
      return false;
    }

    if (levelFilter !== "all" && payload.level !== Number(levelFilter)) {
      return false;
    }

    if (schoolFilter !== "All Schools" && payload.school !== schoolFilter) {
      return false;
    }

    const isSelected = selectedSpellIdsSet.has(entry.slug);
    const isPrepared = preparedSpellIdsSet.has(entry.slug);

    if (browseMode === "selected" && !isSelected) {
      return false;
    }

    if (browseMode === "unselected" && isSelected) {
      return false;
    }

    if (browseMode === "prepared" && !isPrepared) {
      return false;
    }

    if (normalizedTerms.length === 0) {
      return true;
    }

    const haystack = buildSpellSearchText(entry, payload);
    return normalizedTerms.every((term) => haystack.includes(term));
  });
  const groupedEntries = Array.from(
    filteredEntries.reduce((groups, entry) => {
      const payload = readSpellPayload(entry);
      const level = payload?.level ?? 0;
      const existing = groups.get(level) ?? [];

      existing.push(entry);
      groups.set(level, existing);

      return groups;
    }, new Map<number, CompendiumEntry[]>()),
  )
    .sort(([leftLevel], [rightLevel]) => leftLevel - rightLevel)
    .map(([level, groupEntries]) => ({
      level,
      entries: [...groupEntries].sort((left, right) => left.name.localeCompare(right.name)),
    }));
  const browseStatus =
    entries.length === 0
      ? emptyMessage
      : filteredEntries.length === 0
        ? hasActiveFilters
          ? "No spells match the current builder browse filters."
          : "No spells available in this list."
        : filteredEntries.length === entries.length
          ? `${filteredEntries.length} spells shown.`
          : `${filteredEntries.length} of ${entries.length} spells shown.`;

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
                setLevelFilter("all");
                setSchoolFilter("All Schools");
                setBrowseMode("all");
              }}
              type="button"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
        <div className="compendium-filter-grid spell-browser__controls">
          <label>
            <span>Search</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, school, effect, range, duration, or exact rules text..."
              value={query}
            />
          </label>
          <label>
            <span>Level</span>
            <select
              onChange={(event) => setLevelFilter(event.target.value)}
              value={levelFilter}
            >
              {SPELL_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>School</span>
            <select
              onChange={(event) => setSchoolFilter(event.target.value)}
              value={schoolFilter}
            >
              {SPELL_SCHOOL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          {availableBrowseModes.map((option) => (
            <button
              key={option.value}
              className={`chip ${browseMode === option.value ? "chip--active" : ""}`}
              onClick={() => setBrowseMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="chip">{selectedCount} selected</span>
          {supportsPreparedBrowse ? <span className="chip">{readyCount} ready</span> : null}
          <span className="chip">{entries.length} total</span>
        </div>
        <p className="muted-copy">{browseStatus}</p>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="detail-card">
          <p className="muted-copy">Adjust the current filters or browse mode to surface spells from this list.</p>
        </div>
      ) : null}

      {groupedEntries.map((group) => (
        <div key={`${title}-${group.level}`} className="detail-card spell-browser__group">
          <div className="detail-card__header">
            <strong>{formatSpellLevelLabel(group.level)}</strong>
            <span>{group.entries.length} shown</span>
          </div>
          <div className="stack-sm">
            {group.entries.map((entry) => {
              const payload = readSpellPayload(entry);

              if (!payload) {
                return null;
              }

              const isSelected = selectedSpellIdsSet.has(entry.slug);
              const isPrepared = preparedSpellIdsSet.has(entry.slug);

              return (
                <div key={entry.slug} className="library-item spell-browser__item">
                  <div className="choice-row">
                    <label className="checkbox-field">
                      <input
                        checked={isSelected}
                        onChange={() => onToggleSpell(entry.slug)}
                        type="checkbox"
                      />
                      <span>{entry.name}</span>
                    </label>
                    <div className="library-item__actions">
                      {onTogglePreparedSpell && payload.level > 0 && isSelected ? (
                        <button
                          className={`chip ${isPrepared ? "chip--active" : ""}`}
                          onClick={() => onTogglePreparedSpell(entry.slug)}
                          type="button"
                        >
                          {isPrepared ? "Ready" : "Mark Ready"}
                        </button>
                      ) : null}
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
                    <span className="library-item__pill">{payload.level === 0 ? "Cantrip" : `Level ${payload.level}`}</span>
                    <span>{payload.school}</span>
                    <span>{payload.castingTime}</span>
                    <span>{payload.range}</span>
                    <span>{payload.duration}</span>
                    {payload.concentration ? <span className="library-item__pill">Concentration</span> : null}
                    {payload.ritual ? <span className="library-item__pill">Ritual</span> : null}
                    {isSelected ? <span className="library-item__pill">Selected</span> : null}
                    {isPrepared ? <span className="library-item__pill">Ready</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
