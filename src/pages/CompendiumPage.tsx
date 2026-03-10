import { useDeferredValue, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { CompendiumEntry, CompendiumType, SpellCompendiumPayload } from "../../shared/types";
import { findCompendiumEntry } from "../../shared/data/compendiumSeed";
import { CompendiumEntryDetail } from "../components/CompendiumEntryDetail";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";
import { readCompendiumHandoffState } from "../lib/compendiumNavigation";
import { humanizeLabel } from "../lib/editor";

const FILTERS: Array<{ label: string; value?: CompendiumType }> = [
  { label: "All" },
  { label: "Classes", value: "class" },
  { label: "Subclasses", value: "subclass" },
  { label: "Species", value: "species" },
  { label: "Backgrounds", value: "background" },
  { label: "Spells", value: "spell" },
  { label: "Creatures", value: "creature" },
  { label: "Weapons", value: "weapon" },
  { label: "Armor", value: "armor" },
  { label: "Gear", value: "gear" },
  { label: "Feats", value: "feat" },
  { label: "Rules", value: "rule" },
];

const SPELL_CLASS_OPTIONS = ["All Classes", "Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];
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
const SPELL_LEVEL_VALUES = SPELL_LEVEL_OPTIONS.map((option) => option.value);
const SPELL_BOOLEAN_FILTER_VALUES = ["all", "yes", "no"] as const;

interface BrowseMetaItem {
  label: string;
  pill?: boolean;
}

interface BrowseFacetConfig {
  label: string;
  options: string[];
}

function readTypeFilter(value: string | null): CompendiumType | undefined {
  return FILTERS.some((entry) => entry.value === value) ? (value as CompendiumType) : undefined;
}

function readStringFilter(value: string | null, allowedValues: readonly string[], fallback: string) {
  return value && allowedValues.includes(value) ? value : fallback;
}

function readSpellPayload(entry: CompendiumEntry): SpellCompendiumPayload | null {
  return entry.type === "spell" ? (entry.payload as SpellCompendiumPayload) : null;
}

function readStringPayloadValue(entry: CompendiumEntry, key: string) {
  const value = entry.payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readStringArrayPayloadValue(entry: CompendiumEntry, key: string) {
  const value = entry.payload[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function formatCasterTypeLabel(value: string) {
  if (value === "full") {
    return "Full Caster";
  }

  if (value === "half") {
    return "Half Caster";
  }

  if (value === "pact") {
    return "Pact Caster";
  }

  return "Noncaster";
}

function readBrowseFacetValue(entry: CompendiumEntry, filter: CompendiumType) {
  if (entry.type !== filter) {
    return null;
  }

  if (filter === "class") {
    const casterType = readStringPayloadValue(entry, "casterType");
    return casterType ? formatCasterTypeLabel(casterType) : null;
  }

  if (filter === "subclass") {
    return readStringPayloadValue(entry, "class");
  }

  if (filter === "species") {
    return readStringPayloadValue(entry, "size");
  }

  if (filter === "background") {
    return readStringPayloadValue(entry, "theme");
  }

  if (filter === "creature") {
    return readStringPayloadValue(entry, "creatureType");
  }

  if (filter === "feat") {
    return readStringPayloadValue(entry, "support");
  }

  if (filter === "weapon" || filter === "armor" || filter === "gear" || filter === "rule") {
    return readStringPayloadValue(entry, "category");
  }

  return null;
}

function readBrowseFacetConfig(filter: CompendiumType | undefined, entries: CompendiumEntry[]): BrowseFacetConfig | null {
  if (!filter || filter === "spell") {
    return null;
  }

  let label: string | null = null;

  if (filter === "class") {
    label = "Caster Type";
  } else if (filter === "subclass") {
    label = "Class";
  } else if (filter === "species") {
    label = "Size";
  } else if (filter === "background") {
    label = "Theme";
  } else if (filter === "creature") {
    label = "Creature Type";
  } else if (filter === "feat") {
    label = "Support";
  } else if (filter === "weapon" || filter === "armor" || filter === "gear" || filter === "rule") {
    label = "Category";
  }

  if (!label) {
    return null;
  }

  const options = Array.from(
    new Set(
      entries
        .map((entry) => readBrowseFacetValue(entry, filter))
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return options.length > 0 ? { label, options } : null;
}

function formatArmorClassLabel(entry: CompendiumEntry) {
  const baseArmorClass = entry.payload.baseArmorClass;

  if (typeof baseArmorClass !== "number") {
    return null;
  }

  const ignoresDexterity = entry.payload.ignoresDexterity === true;
  const dexterityCap = entry.payload.dexterityCap;

  if (ignoresDexterity) {
    return `AC ${baseArmorClass}`;
  }

  if (typeof dexterityCap === "number") {
    return `AC ${baseArmorClass} + Dex (max ${dexterityCap})`;
  }

  return `AC ${baseArmorClass} + Dex`;
}

function readBrowseMetaItems(entry: CompendiumEntry): BrowseMetaItem[] {
  if (entry.type === "class") {
    const casterType = readStringPayloadValue(entry, "casterType");
    const role = readStringPayloadValue(entry, "role");

    return [
      ...(casterType ? [{ label: formatCasterTypeLabel(casterType), pill: true }] : []),
      ...(role ? [{ label: role }] : []),
    ];
  }

  if (entry.type === "subclass") {
    const classLabel = readStringPayloadValue(entry, "class");
    const keyFeatures = readStringArrayPayloadValue(entry, "keyFeatures");

    return [
      ...(classLabel ? [{ label: classLabel, pill: true }] : []),
      ...(keyFeatures.length > 0 ? [{ label: `${keyFeatures.length} key features` }] : []),
    ];
  }

  if (entry.type === "species") {
    const size = readStringPayloadValue(entry, "size");
    const speed = entry.payload.speed;

    return [
      ...(size ? [{ label: size, pill: true }] : []),
      ...(typeof speed === "number" ? [{ label: `${speed} ft.` }] : []),
    ];
  }

  if (entry.type === "background") {
    const theme = readStringPayloadValue(entry, "theme");
    const suggestedSkills = readStringArrayPayloadValue(entry, "suggestedSkills");

    return [
      ...(theme ? [{ label: theme, pill: true }] : []),
      ...(suggestedSkills.length > 0 ? [{ label: suggestedSkills.join(", ") }] : []),
    ];
  }

  if (entry.type === "creature") {
    const size = readStringPayloadValue(entry, "size");
    const creatureType = readStringPayloadValue(entry, "creatureType");
    const challengeRating = readStringPayloadValue(entry, "challengeRating");
    const beastFormEligible = entry.payload.beastFormEligible === true;

    return [
      ...(creatureType ? [{ label: creatureType, pill: true }] : []),
      ...(size ? [{ label: size }] : []),
      ...(challengeRating ? [{ label: `CR ${challengeRating}` }] : []),
      ...(beastFormEligible ? [{ label: "Beast Form", pill: true }] : []),
    ];
  }

  if (entry.type === "weapon") {
    const damage = readStringPayloadValue(entry, "damage");
    const damageType = readStringPayloadValue(entry, "damageType");
    const range = readStringPayloadValue(entry, "range");
    const properties = readStringArrayPayloadValue(entry, "properties");

    return [
      ...(damage && damageType ? [{ label: `${damage} ${damageType}`, pill: true }] : []),
      ...(range ? [{ label: range }] : []),
      ...properties.slice(0, 2).map((property) => ({ label: property })),
    ];
  }

  if (entry.type === "armor") {
    const category = readStringPayloadValue(entry, "category");
    const armorClass = formatArmorClassLabel(entry);

    return [
      ...(category ? [{ label: category, pill: true }] : []),
      ...(armorClass ? [{ label: armorClass }] : []),
    ];
  }

  if (entry.type === "gear") {
    const category = readStringPayloadValue(entry, "category");
    const use = readStringPayloadValue(entry, "use");
    const quantity = readStringPayloadValue(entry, "quantity");

    return [
      ...(category ? [{ label: category, pill: true }] : []),
      ...(use ? [{ label: use }] : []),
      ...(quantity ? [{ label: quantity }] : []),
    ];
  }

  if (entry.type === "feat") {
    const support = readStringPayloadValue(entry, "support");
    const choiceSummary = readStringPayloadValue(entry, "choiceSummary");

    return [
      ...(support ? [{ label: `${support} Support`, pill: true }] : []),
      ...(choiceSummary ? [{ label: "Configurable", pill: true }] : []),
    ];
  }

  if (entry.type === "rule") {
    const category = readStringPayloadValue(entry, "category");

    return category ? [{ label: category, pill: true }] : [];
  }

  return [];
}

function compareSpellEntries(left: CompendiumEntry, right: CompendiumEntry) {
  const leftPayload = readSpellPayload(left);
  const rightPayload = readSpellPayload(right);

  if (!leftPayload || !rightPayload) {
    return left.name.localeCompare(right.name);
  }

  return leftPayload.level - rightPayload.level || left.name.localeCompare(right.name);
}

function readRelatedEntrySlugs(entry: CompendiumEntry | null) {
  const value = entry?.payload.relatedEntries;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function CompendiumPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [entries, setEntries] = useState<CompendiumEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CompendiumEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkedStatus, setLinkedStatus] = useState<string | null>(null);
  const handoffState = readCompendiumHandoffState(location.state);
  const query = searchParams.get("q") ?? "";
  const filter = readTypeFilter(searchParams.get("type"));
  const spellClassFilter = readStringFilter(searchParams.get("spellClass"), SPELL_CLASS_OPTIONS, "All Classes");
  const spellLevelFilter = readStringFilter(searchParams.get("spellLevel"), SPELL_LEVEL_VALUES, "all");
  const spellSchoolFilter = readStringFilter(searchParams.get("spellSchool"), SPELL_SCHOOL_OPTIONS, "All Schools");
  const spellConcentrationFilter = readStringFilter(
    searchParams.get("spellConcentration"),
    SPELL_BOOLEAN_FILTER_VALUES,
    "all",
  );
  const spellRitualFilter = readStringFilter(searchParams.get("spellRitual"), SPELL_BOOLEAN_FILTER_VALUES, "all");
  const deferredQuery = useDeferredValue(query);
  const selectedSlug = searchParams.get("slug");
  const spellFiltersEnabled = filter === "spell";
  const browseFacetConfig = readBrowseFacetConfig(filter, entries);
  const browseFacetFilter = browseFacetConfig
    ? readStringFilter(searchParams.get("facet"), ["all", ...browseFacetConfig.options], "all")
    : "all";
  const hasActiveBrowseState =
    query.length > 0 ||
    Boolean(filter) ||
    browseFacetFilter !== "all" ||
    spellClassFilter !== "All Classes" ||
    spellLevelFilter !== "all" ||
    spellSchoolFilter !== "All Schools" ||
    spellConcentrationFilter !== "all" ||
    spellRitualFilter !== "all";

  function commitBrowseState(next: URLSearchParams) {
    const search = next.toString();

    navigate(
      {
        pathname: location.pathname,
        search: search.length > 0 ? `?${search}` : "",
      },
      {
        replace: true,
        state: location.state,
      },
    );
  }

  function replaceBrowseState(
    update: (next: URLSearchParams) => void,
    options: {
      clearSlug?: boolean;
    } = {},
  ) {
    const next = new URLSearchParams(searchParams);
    update(next);

    if (options.clearSlug ?? true) {
      next.delete("slug");
    }

    commitBrowseState(next);
  }

  function openCompendiumEntry(
    entry: CompendiumEntry,
    options: {
      resetQuery?: boolean;
    } = {},
  ) {
    replaceBrowseState(
      (next) => {
        next.set("type", entry.type);
        next.set("slug", entry.slug);

        if (options.resetQuery) {
          next.delete("q");
        }

        if (entry.type !== "spell") {
          next.delete("spellClass");
          next.delete("spellLevel");
          next.delete("spellSchool");
          next.delete("spellConcentration");
          next.delete("spellRitual");
        }

        if (entry.type !== filter || entry.type === "spell") {
          next.delete("facet");
        }
      },
      { clearSlug: false },
    );
  }

  useEffect(() => {
    async function search() {
      const results = await dndApi.compendium.search({
        query: deferredQuery,
        type: filter,
      });
      setEntries(results);
      setErrorMessage(null);
    }

    search().catch((error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to search compendium.");
    });
  }, [deferredQuery, filter]);

  const displayedEntries = entries.filter((entry) => {
    const payload = readSpellPayload(entry);

    if (browseFacetConfig && browseFacetFilter !== "all" && filter) {
      if (readBrowseFacetValue(entry, filter) !== browseFacetFilter) {
        return false;
      }
    }

    if (!spellFiltersEnabled || !payload) {
      return true;
    }

    if (spellClassFilter !== "All Classes" && !payload.classes.includes(spellClassFilter)) {
      return false;
    }

    if (spellLevelFilter !== "all" && payload.level !== Number(spellLevelFilter)) {
      return false;
    }

    if (spellSchoolFilter !== "All Schools" && payload.school !== spellSchoolFilter) {
      return false;
    }

    if (spellConcentrationFilter === "yes" && !payload.concentration) {
      return false;
    }

    if (spellConcentrationFilter === "no" && payload.concentration) {
      return false;
    }

    if (spellRitualFilter === "yes" && !payload.ritual) {
      return false;
    }

    if (spellRitualFilter === "no" && payload.ritual) {
      return false;
    }

    return true;
  });

  if (spellFiltersEnabled) {
    displayedEntries.sort(compareSpellEntries);
  }

  const selectedEntryIndex = selectedEntry ? displayedEntries.findIndex((entry) => entry.slug === selectedEntry.slug) : -1;
  const previousEntry = selectedEntryIndex > 0 ? displayedEntries[selectedEntryIndex - 1] : null;
  const nextEntry =
    selectedEntryIndex >= 0 && selectedEntryIndex < displayedEntries.length - 1
      ? displayedEntries[selectedEntryIndex + 1]
      : null;
  const relatedEntries = Array.from(
    new Map(
      readRelatedEntrySlugs(selectedEntry)
        .map((slug) => findCompendiumEntry(slug))
        .filter((entry): entry is CompendiumEntry => Boolean(entry && entry.slug !== selectedEntry?.slug))
        .map((entry) => [entry.slug, entry] as const),
    ).values(),
  );

  useEffect(() => {
    if (selectedSlug) {
      return;
    }

    setSelectedEntry((current) => {
      if (current && displayedEntries.some((entry) => entry.slug === current.slug)) {
        return current;
      }

      return displayedEntries[0] ?? null;
    });
  }, [displayedEntries, selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) {
      setLinkedStatus(null);
      return;
    }

    dndApi.compendium
      .get(selectedSlug)
      .then((entry) => {
        setSelectedEntry(entry);
        setLinkedStatus(entry ? `Showing ${entry.name}.` : "Linked entry not found.");
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load linked entry.");
      });
  }, [selectedSlug]);

  const browseStatus = spellFiltersEnabled
    ? displayedEntries.length > 0
      ? displayedEntries.length === entries.length
        ? `${displayedEntries.length} spell entries found.`
        : `${displayedEntries.length} spell entries shown (${entries.length} spell matches before quick filters).`
      : entries.length > 0
        ? "No spells match the current quick filters."
        : "No matching spells."
    : displayedEntries.length > 0
      ? `${displayedEntries.length} entries found.`
      : "No matching entries.";
  const status = errorMessage ?? linkedStatus ?? browseStatus;
  const searchPlaceholder = spellFiltersEnabled
    ? "Search spells by name, effect, classes, schools, and exact rules text..."
    : "Search classes, subclasses, spells, gear, rules, and more...";

  return (
    <div className="workspace workspace--two-up">
      <SectionCard
        title="Linked Compendium"
        subtitle="Open reference content"
      >
        <div className="stack-md">
          {handoffState ? (
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>{handoffState.originLabel}</strong>
                <button
                  className="action-button action-button--secondary"
                  onClick={() => navigate(handoffState.returnTo)}
                  type="button"
                >
                  {handoffState.returnLabel}
                </button>
              </div>
              <p className="muted-copy">
                This full compendium view was opened from an in-context reference. Keep browsing here or jump back when you are done.
              </p>
            </div>
          ) : null}
          <input
            onChange={(event) => {
              replaceBrowseState((next) => {
                const value = event.target.value.trim();

                if (value.length === 0) {
                  next.delete("q");
                  return;
                }

                next.set("q", event.target.value);
              });
            }}
            placeholder={searchPlaceholder}
            value={query}
          />
          <div className="filter-row">
            {FILTERS.map((entry) => (
              <button
                key={entry.label}
                className={`chip ${filter === entry.value ? "chip--active" : ""}`}
                onClick={() => {
                  replaceBrowseState((next) => {
                    if (entry.value) {
                      next.set("type", entry.value);
                    } else {
                      next.delete("type");
                    }

                    if (entry.value !== "spell") {
                      next.delete("spellClass");
                      next.delete("spellLevel");
                      next.delete("spellSchool");
                      next.delete("spellConcentration");
                      next.delete("spellRitual");
                    }

                    next.delete("facet");
                  });
                }}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
          {browseFacetConfig ? (
            <div className="compendium-filter-grid">
              <label>
                <span>{browseFacetConfig.label}</span>
                <select
                  onChange={(event) => {
                    replaceBrowseState((next) => {
                      if (event.target.value === "all") {
                        next.delete("facet");
                        return;
                      }

                      next.set("facet", event.target.value);
                    });
                  }}
                  value={browseFacetFilter}
                >
                  <option value="all">{`All ${browseFacetConfig.label}s`}</option>
                  {browseFacetConfig.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {spellFiltersEnabled ? (
            <div className="compendium-filter-grid">
              <label>
                <span>Class</span>
                <select
                  onChange={(event) => {
                    replaceBrowseState((next) => {
                      if (event.target.value === "All Classes") {
                        next.delete("spellClass");
                        return;
                      }

                      next.set("spellClass", event.target.value);
                    });
                  }}
                  value={spellClassFilter}
                >
                  {SPELL_CLASS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Level</span>
                <select
                  onChange={(event) => {
                    replaceBrowseState((next) => {
                      if (event.target.value === "all") {
                        next.delete("spellLevel");
                        return;
                      }

                      next.set("spellLevel", event.target.value);
                    });
                  }}
                  value={spellLevelFilter}
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
                  onChange={(event) => {
                    replaceBrowseState((next) => {
                      if (event.target.value === "All Schools") {
                        next.delete("spellSchool");
                        return;
                      }

                      next.set("spellSchool", event.target.value);
                    });
                  }}
                  value={spellSchoolFilter}
                >
                  {SPELL_SCHOOL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Concentration</span>
                <select
                  onChange={(event) => {
                    replaceBrowseState((next) => {
                      if (event.target.value === "all") {
                        next.delete("spellConcentration");
                        return;
                      }

                      next.set("spellConcentration", event.target.value);
                    });
                  }}
                  value={spellConcentrationFilter}
                >
                  <option value="all">All</option>
                  <option value="yes">Concentration Only</option>
                  <option value="no">No Concentration</option>
                </select>
              </label>
              <label>
                <span>Ritual</span>
                <select
                  onChange={(event) => {
                    replaceBrowseState((next) => {
                      if (event.target.value === "all") {
                        next.delete("spellRitual");
                        return;
                      }

                      next.set("spellRitual", event.target.value);
                    });
                  }}
                  value={spellRitualFilter}
                >
                  <option value="all">All</option>
                  <option value="yes">Ritual Only</option>
                  <option value="no">Non-Ritual</option>
                </select>
              </label>
            </div>
          ) : null}
          {hasActiveBrowseState ? (
            <div className="action-row">
              <button
                className="action-button action-button--secondary"
                onClick={() => commitBrowseState(new URLSearchParams())}
                type="button"
              >
                Reset Browse State
              </button>
            </div>
          ) : null}
          <p className="muted-copy">{status}</p>
          <div className="compendium-list">
            {displayedEntries.map((entry) => {
              const spellPayload = readSpellPayload(entry);
              const browseMetaItems = readBrowseMetaItems(entry);

              return (
                <button
                  key={entry.slug}
                  className={`library-item ${selectedEntry?.slug === entry.slug ? "library-item--active" : ""}`}
                  onClick={() => {
                    replaceBrowseState(
                      (next) => {
                        next.set("slug", entry.slug);
                      },
                      { clearSlug: false },
                    );
                  }}
                  type="button"
                >
                  <strong>{entry.name}</strong>
                  <div className="library-item__meta">
                    <span className="library-item__pill">{humanizeLabel(entry.type)}</span>
                    {spellPayload ? (
                      <>
                        <span className="library-item__pill">
                          {spellPayload.level === 0 ? "Cantrip" : `Level ${spellPayload.level}`}
                        </span>
                        <span>{spellPayload.school}</span>
                        <span>{spellPayload.classes.join(", ")}</span>
                        {spellPayload.concentration ? <span className="library-item__pill">Concentration</span> : null}
                        {spellPayload.ritual ? <span className="library-item__pill">Ritual</span> : null}
                      </>
                    ) : (
                      <>
                        {browseMetaItems.map((item) => (
                          <span
                            key={`${entry.slug}-${item.label}`}
                            className={item.pill ? "library-item__pill" : undefined}
                          >
                            {item.label}
                          </span>
                        ))}
                        <span>{entry.source}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={selectedEntry?.name ?? "Entry Detail"}
        subtitle={selectedEntry?.type ?? "Select an entry"}
      >
        <div className="stack-md">
          <CompendiumEntryDetail entry={selectedEntry} />
          {selectedEntryIndex >= 0 ? (
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Browse Nearby</strong>
                <span>
                  {selectedEntryIndex + 1} of {displayedEntries.length} in current results
                </span>
              </div>
              <div className="action-row">
                {previousEntry ? (
                  <button
                    className="action-button action-button--secondary"
                    onClick={() => openCompendiumEntry(previousEntry)}
                    type="button"
                  >
                    Previous Result
                  </button>
                ) : null}
                {nextEntry ? (
                  <button
                    className="action-button action-button--secondary"
                    onClick={() => openCompendiumEntry(nextEntry)}
                    type="button"
                  >
                    Next Result
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {relatedEntries.length > 0 ? (
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Related Entries</strong>
                <span>{relatedEntries.length} linked</span>
              </div>
              <div className="filter-row">
                {relatedEntries.map((entry) => (
                  <button
                    key={entry.slug}
                    className="chip"
                    onClick={() => openCompendiumEntry(entry, { resetQuery: true })}
                    type="button"
                  >
                    {entry.name} ({humanizeLabel(entry.type)})
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
