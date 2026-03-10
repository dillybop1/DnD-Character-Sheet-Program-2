import { useDeferredValue, useEffect, useState } from "react";
import {
  getFeatChoiceLabel,
  getFeatSupportLabel,
  listAvailableFeatChoiceOptions,
} from "../../shared/data/reference";
import type { BuilderInput, FeatTemplate } from "../../shared/types";

type FeatChoiceBrowseMode = "all" | "selected" | "available" | "unavailable";

interface FeatChoiceBrowserProps {
  feat: FeatTemplate;
  classId: string;
  skillProficiencies: BuilderInput["skillProficiencies"];
  featSelections: Record<string, string[]>;
  selectedChoices: string[];
  scopeKey: string;
  onToggleChoice: (featId: string, optionId: string) => void;
  onOpenReference: (featId: string) => void;
}

function buildChoiceSearchText(featName: string, groupLabel: string, groupDescription: string, optionLabel: string) {
  return [featName, groupLabel, groupDescription, optionLabel].join(" ").toLowerCase();
}

function formatGroupSelectionSummary(selectedCount: number, minChoices: number, maxChoices: number) {
  if (minChoices === maxChoices) {
    return `${selectedCount} of ${maxChoices} chosen`;
  }

  return `${selectedCount} chosen (${minChoices}-${maxChoices})`;
}

export function FeatChoiceBrowser({
  feat,
  classId,
  skillProficiencies,
  featSelections,
  selectedChoices,
  scopeKey,
  onToggleChoice,
  onOpenReference,
}: FeatChoiceBrowserProps) {
  const [query, setQuery] = useState("");
  const [browseMode, setBrowseMode] = useState<FeatChoiceBrowseMode>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedTerms = deferredQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  useEffect(() => {
    setQuery("");
    setBrowseMode("all");
  }, [scopeKey]);

  const choiceGroups = feat.choiceGroups ?? [];
  const totalRequiredChoices = choiceGroups.reduce((total, group) => total + group.minChoices, 0);
  const totalOptions = choiceGroups.reduce((total, group) => total + group.options.length, 0);

  const groupViews = choiceGroups
    .map((group) => {
      const availableOptions = new Set(
        listAvailableFeatChoiceOptions(feat.id, group.id, {
          classId,
          skillProficiencies,
          featSelections,
        }),
      );
      const selectedInGroup = selectedChoices.filter((optionId) => group.options.includes(optionId));
      const options = group.options.map((optionId) => {
        const selected = selectedChoices.includes(optionId);
        const available = availableOptions.has(optionId);
        const label = getFeatChoiceLabel(feat.id, optionId);

        return {
          optionId,
          label,
          selected,
          available,
        };
      });
      const filteredOptions = options.filter((option) => {
        if (browseMode === "selected" && !option.selected) {
          return false;
        }

        if (browseMode === "available" && (option.selected || !option.available)) {
          return false;
        }

        if (browseMode === "unavailable" && (option.selected || option.available)) {
          return false;
        }

        if (normalizedTerms.length === 0) {
          return true;
        }

        const haystack = buildChoiceSearchText(feat.name, group.label, group.description, option.label);
        return normalizedTerms.every((term) => haystack.includes(term));
      });

      return {
        ...group,
        selectedInGroup,
        filteredOptions,
        unavailableCount: options.filter((option) => !option.selected && !option.available).length,
      };
    })
    .filter((group) => group.filteredOptions.length > 0);

  const unavailableCount = choiceGroups.reduce((total, group) => {
    const availableOptions = new Set(
      listAvailableFeatChoiceOptions(feat.id, group.id, {
        classId,
        skillProficiencies,
        featSelections,
      }),
    );

    return (
      total +
      group.options.filter((optionId) => !selectedChoices.includes(optionId) && !availableOptions.has(optionId)).length
    );
  }, 0);
  const incompleteGroupCount = choiceGroups.filter((group) => {
    const selectedCount = selectedChoices.filter((optionId) => group.options.includes(optionId)).length;
    return selectedCount < group.minChoices;
  }).length;
  const hasActiveFilters = query.trim().length > 0 || browseMode !== "all";
  const browseStatus =
    choiceGroups.length === 0
      ? "No configurable choices are attached to this feat."
      : groupViews.length === 0
        ? hasActiveFilters
          ? "No feat choices match the current builder browse filters."
          : "No configurable choices are available right now."
        : `${groupViews.length} of ${choiceGroups.length} choice groups shown.`;

  if (choiceGroups.length === 0) {
    return null;
  }

  return (
    <div className="detail-card">
      <div className="detail-card__header">
        <div className="stack-sm">
          <strong>{feat.name} Choices</strong>
          <span className="muted-copy">{getFeatSupportLabel(feat.supportLevel)} support</span>
        </div>
        <div className="library-item__actions">
          {hasActiveFilters ? (
            <button
              className="inline-link-button"
              onClick={() => {
                setQuery("");
                setBrowseMode("all");
              }}
              type="button"
            >
              Reset Filters
            </button>
          ) : null}
          <button
            className="inline-link-button"
            onClick={() => onOpenReference(feat.id)}
            type="button"
          >
            Ref
          </button>
        </div>
      </div>
      <p className="muted-copy">{feat.summary}</p>
      {feat.automationStatus ? <p className="muted-copy">{feat.automationStatus}</p> : null}
      <div className="compendium-filter-grid feat-choice-browser__controls">
        <label>
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by group label, choice description, or option name..."
            value={query}
          />
        </label>
      </div>
      <div className="filter-row">
        {[
          { label: "All", value: "all" },
          { label: "Selected", value: "selected" },
          { label: "Available", value: "available" },
          { label: "Unavailable", value: "unavailable" },
        ].map((option) => (
          <button
            key={option.value}
            className={`chip ${browseMode === option.value ? "chip--active" : ""}`}
            onClick={() => setBrowseMode(option.value as FeatChoiceBrowseMode)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <span className="chip">
          {selectedChoices.length} of {totalRequiredChoices} required
        </span>
        <span className="chip">{choiceGroups.length} groups</span>
        <span className="chip">{unavailableCount} unavailable</span>
        <span className="chip">{totalOptions} total options</span>
        {incompleteGroupCount > 0 ? <span className="chip">{incompleteGroupCount} incomplete</span> : null}
      </div>
      <p className="muted-copy">{browseStatus}</p>

      {groupViews.length === 0 ? (
        <div className="detail-card">
          <p className="muted-copy">Adjust the current filters or browse mode to surface configurable options for this feat.</p>
        </div>
      ) : null}

      <div className="stack-md">
        {groupViews.map((group) => (
          <div key={`${feat.id}-${group.id}`} className="detail-card feat-choice-browser__group">
            <div className="detail-card__header">
              <strong>{group.label}</strong>
              <span>{formatGroupSelectionSummary(group.selectedInGroup.length, group.minChoices, group.maxChoices)}</span>
            </div>
            <p className="muted-copy">{group.description}</p>
            <div className="filter-row">
              {group.selectedInGroup.length > 0 ? (
                group.selectedInGroup.map((optionId) => (
                  <span key={`${feat.id}-${group.id}-${optionId}`} className="chip chip--active">
                    {getFeatChoiceLabel(feat.id, optionId)}
                  </span>
                ))
              ) : (
                <span className="chip">No choices selected</span>
              )}
              {group.unavailableCount > 0 ? <span className="chip">{group.unavailableCount} unavailable</span> : null}
            </div>
            <div className="stack-sm">
              {group.filteredOptions.map((option) => (
                <div key={`${feat.id}-${group.id}-${option.optionId}`} className="library-item feat-choice-browser__item">
                  <div className="choice-row">
                    <label className="checkbox-field">
                      <input
                        checked={option.selected}
                        disabled={!option.selected && !option.available}
                        onChange={() => onToggleChoice(feat.id, option.optionId)}
                        type="checkbox"
                      />
                      <span>{option.label}</span>
                    </label>
                  </div>
                  <div className="library-item__meta">
                    {option.selected ? <span className="library-item__pill">Selected</span> : null}
                    {!option.selected && option.available ? <span className="library-item__pill">Available</span> : null}
                    {!option.selected && !option.available ? <span className="library-item__pill">Unavailable</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
