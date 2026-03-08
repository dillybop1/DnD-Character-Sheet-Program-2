import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClassTemplate, getSpeciesTemplate } from "../../shared/data/reference";
import type { CharacterSummary } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function CharacterRosterPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Launch a saved sheet, edit an existing character, or start a new draft.");

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

  if (loading) {
    return <div className="empty-state">Loading character roster...</div>;
  }

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

            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Route Split</strong>
                <span>Single window</span>
              </div>
              <div className="filter-row">
                <span className="chip chip--active">Roster</span>
                <span className="chip">Saved Sheet</span>
                <span className="chip">Creator / Editor</span>
              </div>
              <p className="muted-copy">
                Opening a character now lands on the dedicated sheet route, while edits stay on the separate builder route.
              </p>
            </div>
          </div>

          <div className="library-list">
            {characters.length === 0 ? <p className="muted-copy">No saved characters yet.</p> : null}
            {characters.map((character) => {
              const classLabel = getClassTemplate(character.classId).name;
              const speciesLabel = getSpeciesTemplate(character.speciesId).name;

              return (
                <article
                  key={character.id}
                  className="library-item"
                >
                  <div className="stack-sm">
                    <div>
                      <strong>{character.name}</strong>
                      <div className="library-item__meta">
                        <span className="library-item__pill">Level {character.level}</span>
                        <span>{classLabel}</span>
                        <span>{speciesLabel}</span>
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
