import { useDeferredValue, useEffect, useState } from "react";
import type { InventoryItemKind } from "../../shared/types";

type EquipmentBrowseMode = "all" | "tracked" | "untracked" | "equipped";

export interface EquipmentBrowserEntry {
  key: string;
  templateType: InventoryItemKind;
  templateId: string;
  referenceSlug: string;
  name: string;
  category: string;
  summary: string;
  searchText: string;
}

interface TrackedEquipmentState {
  quantity: number;
  equippedCount: number;
}

interface EquipmentSelectionBrowserProps {
  title: string;
  scopeKey: string;
  entries: EquipmentBrowserEntry[];
  trackedStateByKey: Map<string, TrackedEquipmentState>;
  emptyMessage: string;
  onAddItem: (templateType: InventoryItemKind, templateId: string) => void;
  onOpenReference: (slug: string) => void;
}

const EQUIPMENT_TYPE_OPTIONS: Array<{ label: string; value: InventoryItemKind | "all" }> = [
  { label: "All Types", value: "all" },
  { label: "Armor", value: "armor" },
  { label: "Weapons", value: "weapon" },
  { label: "Gear", value: "gear" },
];

function formatTypeLabel(templateType: InventoryItemKind) {
  if (templateType === "armor") {
    return "Armor";
  }

  if (templateType === "weapon") {
    return "Weapon";
  }

  return "Gear";
}

export function EquipmentSelectionBrowser({
  title,
  scopeKey,
  entries,
  trackedStateByKey,
  emptyMessage,
  onAddItem,
  onOpenReference,
}: EquipmentSelectionBrowserProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<InventoryItemKind | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [browseMode, setBrowseMode] = useState<EquipmentBrowseMode>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedTerms = deferredQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const categoryOptions = Array.from(
    new Set(
      entries
        .filter((entry) => typeFilter === "all" || entry.templateType === typeFilter)
        .map((entry) => entry.category),
    ),
  ).sort((left, right) => left.localeCompare(right));

  useEffect(() => {
    setQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setBrowseMode("all");
  }, [scopeKey]);

  useEffect(() => {
    if (categoryFilter !== "all" && !categoryOptions.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, categoryOptions]);

  const hasActiveFilters =
    query.trim().length > 0 || typeFilter !== "all" || categoryFilter !== "all" || browseMode !== "all";

  const filteredEntries = entries.filter((entry) => {
    const trackedState = trackedStateByKey.get(entry.key);
    const isTracked = Boolean(trackedState && trackedState.quantity > 0);
    const isEquipped = Boolean(trackedState && trackedState.equippedCount > 0);

    if (typeFilter !== "all" && entry.templateType !== typeFilter) {
      return false;
    }

    if (categoryFilter !== "all" && entry.category !== categoryFilter) {
      return false;
    }

    if (browseMode === "tracked" && !isTracked) {
      return false;
    }

    if (browseMode === "untracked" && isTracked) {
      return false;
    }

    if (browseMode === "equipped" && !isEquipped) {
      return false;
    }

    if (normalizedTerms.length === 0) {
      return true;
    }

    return normalizedTerms.every((term) => entry.searchText.includes(term));
  });

  const groupedEntries = Array.from(
    filteredEntries.reduce((groups, entry) => {
      const existing = groups.get(entry.templateType) ?? [];

      existing.push(entry);
      groups.set(entry.templateType, existing);

      return groups;
    }, new Map<InventoryItemKind, EquipmentBrowserEntry[]>()),
  )
    .sort(([leftType], [rightType]) => {
      const order = new Map<InventoryItemKind, number>([
        ["armor", 0],
        ["weapon", 1],
        ["gear", 2],
      ]);

      return (order.get(leftType) ?? 0) - (order.get(rightType) ?? 0);
    })
    .map(([templateType, groupEntries]) => ({
      templateType,
      entries: [...groupEntries].sort((left, right) => left.name.localeCompare(right.name)),
    }));

  const trackedCount = entries.filter((entry) => (trackedStateByKey.get(entry.key)?.quantity ?? 0) > 0).length;
  const equippedCount = entries.filter((entry) => (trackedStateByKey.get(entry.key)?.equippedCount ?? 0) > 0).length;
  const browseStatus =
    entries.length === 0
      ? emptyMessage
      : filteredEntries.length === 0
        ? hasActiveFilters
          ? "No equipment matches the current builder browse filters."
          : "No equipment is available in this list."
        : filteredEntries.length === entries.length
          ? `${filteredEntries.length} equipment options shown.`
          : `${filteredEntries.length} of ${entries.length} equipment options shown.`;

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
                setTypeFilter("all");
                setCategoryFilter("all");
                setBrowseMode("all");
              }}
              type="button"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
        <div className="compendium-filter-grid equipment-browser__controls">
          <label>
            <span>Search</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, type, category, damage, AC, or item notes..."
              value={query}
            />
          </label>
          <label>
            <span>Type</span>
            <select
              onChange={(event) => setTypeFilter(event.target.value as InventoryItemKind | "all")}
              value={typeFilter}
            >
              {EQUIPMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((option) => (
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
            { label: "Tracked", value: "tracked" },
            { label: "Untracked", value: "untracked" },
            { label: "Equipped", value: "equipped" },
          ].map((option) => (
            <button
              key={option.value}
              className={`chip ${browseMode === option.value ? "chip--active" : ""}`}
              onClick={() => setBrowseMode(option.value as EquipmentBrowseMode)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span className="chip">{trackedCount} tracked</span>
          <span className="chip">{equippedCount} equipped</span>
          <span className="chip">{entries.length} total</span>
        </div>
        <p className="muted-copy">{browseStatus}</p>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="detail-card">
          <p className="muted-copy">Adjust the current filters or browse mode to surface more equipment options.</p>
        </div>
      ) : null}

      {groupedEntries.map((group) => (
        <div key={`${title}-${group.templateType}`} className="detail-card equipment-browser__group">
          <div className="detail-card__header">
            <strong>{formatTypeLabel(group.templateType)}</strong>
            <span>{group.entries.length} shown</span>
          </div>
          <div className="stack-sm">
            {group.entries.map((entry) => {
              const trackedState = trackedStateByKey.get(entry.key);
              const trackedQuantity = trackedState?.quantity ?? 0;
              const equippedCountForEntry = trackedState?.equippedCount ?? 0;

              return (
                <div key={entry.key} className="library-item equipment-browser__item">
                  <div className="choice-row">
                    <div>
                      <strong>{entry.name}</strong>
                    </div>
                    <div className="library-item__actions">
                      <button
                        className="chip"
                        onClick={() => onAddItem(entry.templateType, entry.templateId)}
                        type="button"
                      >
                        {trackedQuantity > 0 ? "Add Copy" : "Add"}
                      </button>
                      <button
                        className="inline-link-button"
                        onClick={() => onOpenReference(entry.referenceSlug)}
                        type="button"
                      >
                        Ref
                      </button>
                    </div>
                  </div>
                  <div className="library-item__meta">
                    <span className="library-item__pill">{formatTypeLabel(entry.templateType)}</span>
                    <span>{entry.category}</span>
                    <span>{entry.summary}</span>
                    {trackedQuantity > 0 ? <span className="library-item__pill">{trackedQuantity} tracked</span> : null}
                    {equippedCountForEntry > 0 ? (
                      <span className="library-item__pill">
                        {equippedCountForEntry === 1 ? "Equipped" : `${equippedCountForEntry} equipped`}
                      </span>
                    ) : null}
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
