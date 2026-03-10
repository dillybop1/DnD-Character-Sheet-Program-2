import { useDeferredValue, useEffect, useState } from "react";
import type { InventoryItemKind } from "../../shared/types";

type InventoryBrowseMode = "all" | "equipped" | "unequipped";

export interface InventoryBrowserEntry {
  id: string;
  kind: InventoryItemKind;
  templateId: string;
  name: string;
  quantity: number;
  equipped: boolean;
  equipable: boolean;
  category: string;
  summary: string;
  searchText: string;
  referenceSlug?: string;
}

interface InventoryManagerBrowserProps {
  scopeKey: string;
  entries: InventoryBrowserEntry[];
  emptyMessage: string;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onToggleEquipped: (itemId: string) => void;
  onOpenReference: (slug: string) => void;
  onRemoveItem: (itemId: string) => void;
}

const INVENTORY_TYPE_OPTIONS: Array<{ label: string; value: InventoryItemKind | "all" }> = [
  { label: "All Types", value: "all" },
  { label: "Armor", value: "armor" },
  { label: "Weapons", value: "weapon" },
  { label: "Gear", value: "gear" },
];

function formatTypeLabel(kind: InventoryItemKind) {
  if (kind === "armor") {
    return "Armor";
  }

  if (kind === "weapon") {
    return "Weapon";
  }

  return "Gear";
}

function sanitizeQuantity(value: number) {
  return Math.max(1, Math.floor(Number.isFinite(value) ? value : 1) || 1);
}

export function InventoryManagerBrowser({
  scopeKey,
  entries,
  emptyMessage,
  onUpdateQuantity,
  onToggleEquipped,
  onOpenReference,
  onRemoveItem,
}: InventoryManagerBrowserProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<InventoryItemKind | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [browseMode, setBrowseMode] = useState<InventoryBrowseMode>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedTerms = deferredQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const categoryOptions = Array.from(
    new Set(
      entries
        .filter((entry) => typeFilter === "all" || entry.kind === typeFilter)
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
    if (typeFilter !== "all" && entry.kind !== typeFilter) {
      return false;
    }

    if (categoryFilter !== "all" && entry.category !== categoryFilter) {
      return false;
    }

    if (browseMode === "equipped" && !entry.equipped) {
      return false;
    }

    if (browseMode === "unequipped" && entry.equipped) {
      return false;
    }

    if (normalizedTerms.length === 0) {
      return true;
    }

    return normalizedTerms.every((term) => entry.searchText.includes(term));
  });

  const groupedEntries = Array.from(
    filteredEntries.reduce((groups, entry) => {
      const existing = groups.get(entry.kind) ?? [];

      existing.push(entry);
      groups.set(entry.kind, existing);

      return groups;
    }, new Map<InventoryItemKind, InventoryBrowserEntry[]>()),
  )
    .sort(([leftKind], [rightKind]) => {
      const order = new Map<InventoryItemKind, number>([
        ["armor", 0],
        ["weapon", 1],
        ["gear", 2],
      ]);

      return (order.get(leftKind) ?? 0) - (order.get(rightKind) ?? 0);
    })
    .map(([kind, groupEntries]) => ({
      kind,
      entries: [...groupEntries].sort((left, right) => left.name.localeCompare(right.name)),
    }));

  const equippedCount = entries.filter((entry) => entry.equipped).length;
  const equipableCount = entries.filter((entry) => entry.equipable).length;
  const totalQuantity = entries.reduce((total, entry) => total + entry.quantity, 0);
  const browseStatus =
    entries.length === 0
      ? emptyMessage
      : filteredEntries.length === 0
        ? hasActiveFilters
          ? "No tracked inventory matches the current browse filters."
          : "No tracked inventory entries."
        : filteredEntries.length === entries.length
          ? `${filteredEntries.length} tracked entries shown.`
          : `${filteredEntries.length} of ${entries.length} tracked entries shown.`;

  if (entries.length === 0) {
    return <p className="muted-copy">{emptyMessage}</p>;
  }

  return (
    <div className="stack-md">
      <div className="compendium-filter-grid inventory-browser__controls">
        <label>
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tracked items by name, type, category, or notes..."
            value={query}
          />
        </label>
        <label>
          <span>Type</span>
          <select
            onChange={(event) => setTypeFilter(event.target.value as InventoryItemKind | "all")}
            value={typeFilter}
          >
            {INVENTORY_TYPE_OPTIONS.map((option) => (
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
          { label: "Equipped", value: "equipped" },
          { label: "Unequipped", value: "unequipped" },
        ].map((option) => (
          <button
            key={option.value}
            className={`chip ${browseMode === option.value ? "chip--active" : ""}`}
            onClick={() => setBrowseMode(option.value as InventoryBrowseMode)}
            type="button"
          >
            {option.label}
          </button>
        ))}
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
      <div className="filter-row">
        <span className="chip">{entries.length} stacks</span>
        <span className="chip">{totalQuantity} total items</span>
        <span className="chip">{equippedCount} equipped</span>
        <span className="chip">{equipableCount} equipable</span>
      </div>
      <p className="muted-copy">{browseStatus}</p>

      {filteredEntries.length === 0 ? (
        <div className="detail-card">
          <p className="muted-copy">Adjust the current filters or browse mode to surface tracked inventory.</p>
        </div>
      ) : null}

      {groupedEntries.map((group) => (
        <div key={group.kind} className="detail-card inventory-browser__group">
          <div className="detail-card__header">
            <strong>{formatTypeLabel(group.kind)}</strong>
            <span>{group.entries.length} shown</span>
          </div>
          <div className="inventory-list">
            {group.entries.map((entry) => (
              <div key={entry.id} className="inventory-item inventory-browser__item">
                <div className="stack-sm">
                  <div>
                    <strong>{entry.name}</strong>
                  </div>
                  <div className="library-item__meta">
                    <span className="library-item__pill">{formatTypeLabel(entry.kind)}</span>
                    <span>{entry.category}</span>
                    {entry.equipped ? <span className="library-item__pill">Equipped</span> : null}
                  </div>
                  <p className="muted-copy">{entry.summary}</p>
                </div>
                <div className="inventory-actions">
                  <input
                    className="inventory-qty-input"
                    min={1}
                    onChange={(event) => onUpdateQuantity(entry.id, sanitizeQuantity(Number(event.target.value)))}
                    type="number"
                    value={entry.quantity}
                  />
                  {entry.equipable ? (
                    <button
                      className="inline-link-button"
                      onClick={() => onToggleEquipped(entry.id)}
                      type="button"
                    >
                      {entry.equipped ? "Unequip" : "Equip"}
                    </button>
                  ) : null}
                  {entry.referenceSlug ? (
                    <button
                      className="inline-link-button"
                      onClick={() => onOpenReference(entry.referenceSlug as string)}
                      type="button"
                    >
                      Ref
                    </button>
                  ) : null}
                  <button
                    className="inline-link-button"
                    onClick={() => onRemoveItem(entry.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
