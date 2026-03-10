import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClassTemplate, getSpeciesTemplate } from "../../shared/data/reference";
import type { CharacterSummary } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

type RosterSortMode = "recent" | "name" | "level-desc" | "level-asc";

interface RosterEntry extends CharacterSummary {
  classLabel: string;
  speciesLabel: string;
  searchText: string;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function compareRosterEntries(left: RosterEntry, right: RosterEntry, sortMode: RosterSortMode) {
  switch (sortMode) {
    case "name":
      return left.name.localeCompare(right.name) || right.updatedAt.localeCompare(left.updatedAt);
    case "level-desc":
      return right.level - left.level || right.updatedAt.localeCompare(left.updatedAt);
    case "level-asc":
      return left.level - right.level || right.updatedAt.localeCompare(left.updatedAt);
    case "recent":
    default:
      return right.updatedAt.localeCompare(left.updatedAt) || left.name.localeCompare(right.name);
  }
}

export function CharacterRosterPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Launch a saved sheet, edit an existing character, or start a new draft.");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [sortMode, setSortMode] = useState<RosterSortMode>("recent");
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  async function loadCharacters() {
    const nextCharacters = await dndApi.characters.list();
    setCharacters(nextCharacters);
  }

  useEffect(() => {
    async function bootstrap() {
      await loadCharacters();
      setLoading(false);
    }

    bootstrap().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Failed to load the saved character roster.");
      setLoading(false);
    });
  }, []);

  function resetRosterBrowseState() {
    setSearchQuery("");
    setClassFilter("all");
    setSpeciesFilter("all");
    setSortMode("recent");
  }

  async function handleImport() {
    try {
      const imported = await dndApi.characters.importJson();

      if (!imported) {
        setMessage("Import canceled.");
        return;
      }

      await loadCharacters();
      navigate(`/characters/${imported.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import character JSON.");
    }
  }

  async function handleExportCharacter(character: CharacterSummary) {
    const actionKey = `export:${character.id}`;
    setPendingActionKey(actionKey);

    try {
      const filePath = await dndApi.characters.exportJson(character.id);
      setMessage(filePath ? `Exported ${character.name} to ${filePath}` : "Export canceled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to export character JSON.");
    } finally {
      setPendingActionKey(null);
    }
  }

  async function handleDeleteCharacter(character: CharacterSummary) {
    const actionKey = `delete:${character.id}`;
    setPendingActionKey(actionKey);

    try {
      await dndApi.characters.delete(character.id);
      await loadCharacters();
      setMessage(`Deleted ${character.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete the saved character.");
    } finally {
      setPendingActionKey(null);
    }
  }

  if (loading) {
    return <div className="empty-state">Loading character roster...</div>;
  }

  const rosterEntries: RosterEntry[] = characters.map((character) => {
    const classLabel = getClassTemplate(character.classId).name;
    const speciesLabel = getSpeciesTemplate(character.speciesId).name;

    return {
      ...character,
      classLabel,
      speciesLabel,
      searchText: `${character.name} ${classLabel} ${speciesLabel} level ${character.level}`.toLowerCase(),
    };
  });

  const classOptions = Array.from(new Map(rosterEntries.map((entry) => [entry.classId, entry.classLabel])).entries()).sort(
    (left, right) => left[1].localeCompare(right[1]),
  );
  const speciesOptions = Array.from(
    new Map(rosterEntries.map((entry) => [entry.speciesId, entry.speciesLabel])).entries(),
  ).sort((left, right) => left[1].localeCompare(right[1]));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleCharacters = rosterEntries
    .filter((character) => {
      if (normalizedQuery && !character.searchText.includes(normalizedQuery)) {
        return false;
      }

      if (classFilter !== "all" && character.classId !== classFilter) {
        return false;
      }

      if (speciesFilter !== "all" && character.speciesId !== speciesFilter) {
        return false;
      }

      return true;
    })
    .sort((left, right) => compareRosterEntries(left, right, sortMode));
  const hasActiveBrowseState =
    normalizedQuery.length > 0 || classFilter !== "all" || speciesFilter !== "all" || sortMode !== "recent";

  return (
    <div className="workspace">
      <SectionCard
        title="Character Roster"
        subtitle="Roster-first launch"
      >
        <div className="stack-md">
          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Open a Workflow</strong>
                <span>{characters.length} saved</span>
              </div>
              <div className="action-row">
                <button
                  className="action-button"
                  onClick={() => navigate("/characters/new")}
                  type="button"
                >
                  New Character
                </button>
                <button
                  className="action-button action-button--secondary"
                  onClick={() => void handleImport()}
                  type="button"
                >
                  Import JSON
                </button>
              </div>
              <p className="muted-copy">{message}</p>
            </div>

            <div className="detail-card stack-sm">
              <div className="detail-card__header">
                <strong>Browse the Roster</strong>
                <span>{visibleCharacters.length} shown</span>
              </div>
              <div className="compendium-filter-grid">
                <label>
                  <span>Search</span>
                  <input
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search name, class, or species"
                    type="search"
                    value={searchQuery}
                  />
                </label>
                <label>
                  <span>Sort</span>
                  <select
                    onChange={(event) => setSortMode(event.target.value as RosterSortMode)}
                    value={sortMode}
                  >
                    <option value="recent">Recently Updated</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="level-desc">Level (High-Low)</option>
                    <option value="level-asc">Level (Low-High)</option>
                  </select>
                </label>
                <label>
                  <span>Class</span>
                  <select
                    onChange={(event) => setClassFilter(event.target.value)}
                    value={classFilter}
                  >
                    <option value="all">All Classes</option>
                    {classOptions.map(([id, label]) => (
                      <option
                        key={id}
                        value={id}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Species</span>
                  <select
                    onChange={(event) => setSpeciesFilter(event.target.value)}
                    value={speciesFilter}
                  >
                    <option value="all">All Species</option>
                    {speciesOptions.map(([id, label]) => (
                      <option
                        key={id}
                        value={id}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="filter-row">
                <span className="chip chip--active">{`Showing ${visibleCharacters.length} of ${characters.length}`}</span>
                {classFilter !== "all" ? <span className="chip">{getClassTemplate(classFilter).name}</span> : null}
                {speciesFilter !== "all" ? <span className="chip">{getSpeciesTemplate(speciesFilter).name}</span> : null}
                {normalizedQuery ? <span className="chip">{`Search: ${searchQuery.trim()}`}</span> : null}
              </div>
              <div className="action-row">
                <button
                  className="action-button action-button--secondary"
                  disabled={!hasActiveBrowseState}
                  onClick={resetRosterBrowseState}
                  type="button"
                >
                  Reset Roster Filters
                </button>
              </div>
            </div>
          </div>

          <div className="library-list">
            {characters.length === 0 ? <p className="muted-copy">No saved characters yet.</p> : null}
            {characters.length > 0 && visibleCharacters.length === 0 ? (
              <div className="empty-state stack-sm">
                <strong>No roster matches the current search or filters.</strong>
                <p className="muted-copy">Try a broader query or reset the current roster browse state.</p>
                <div className="action-row">
                  <button
                    className="action-button action-button--secondary"
                    onClick={resetRosterBrowseState}
                    type="button"
                  >
                    Reset Roster Filters
                  </button>
                </div>
              </div>
            ) : null}
            {visibleCharacters.map((character) => (
              <article
                key={character.id}
                className="library-item"
              >
                <div className="stack-sm">
                  <div>
                    <strong>{character.name}</strong>
                    <div className="library-item__meta">
                      <span className="library-item__pill">Level {character.level}</span>
                      <span>{character.classLabel}</span>
                      <span>{character.speciesLabel}</span>
                      <span>Updated {formatUpdatedAt(character.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="library-item__actions">
                    <button
                      className="inline-link-button"
                      onClick={() => navigate(`/characters/${character.id}`)}
                      type="button"
                    >
                      Open Sheet
                    </button>
                    <button
                      className="inline-link-button"
                      onClick={() => navigate(`/characters/${character.id}/edit`)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="inline-link-button"
                      disabled={pendingActionKey !== null}
                      onClick={() => void handleExportCharacter(character)}
                      type="button"
                    >
                      {pendingActionKey === `export:${character.id}` ? "Exporting..." : "Export JSON"}
                    </button>
                    <button
                      className="inline-link-button inline-link-button--danger"
                      disabled={pendingActionKey !== null}
                      onClick={() => void handleDeleteCharacter(character)}
                      type="button"
                    >
                      {pendingActionKey === `delete:${character.id}` ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
