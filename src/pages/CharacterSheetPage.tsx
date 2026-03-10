import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { calculateDerivedState } from "../../shared/calculations";
import type { CharacterRecord, HomebrewEntry } from "../../shared/types";
import { LockedSheetViewport } from "../components/LockedSheetViewport";
import { SavedSheetBook } from "../components/SavedSheetBook";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";
import { buildCompendiumEntryPath, type CompendiumHandoffState } from "../lib/compendiumNavigation";

export function CharacterSheetPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { characterId } = useParams();
  const [character, setCharacter] = useState<CharacterRecord | null>(null);
  const [homebrewEntries, setHomebrewEntries] = useState<HomebrewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    "Use the worksheet pages here, export when needed, or reopen the editor without leaving this window.",
  );

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      if (!characterId) {
        if (!isCancelled) {
          setCharacter(null);
          setHomebrewEntries([]);
          setLoading(false);
        }
        return;
      }

      const [record, entries] = await Promise.all([
        dndApi.characters.get(characterId),
        dndApi.homebrew.list(),
      ]);

      if (isCancelled) {
        return;
      }

      setCharacter(record);
      setHomebrewEntries(entries);
      setLoading(false);
    }

    setLoading(true);
    bootstrap().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }

      setMessage(error instanceof Error ? error.message : "Failed to load the saved character.");
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [characterId]);

  async function openReference(slug: string) {
    const entry = await dndApi.compendium.get(slug);

    if (!entry) {
      setMessage("Reference entry not found.");
      return;
    }

    const handoffState: CompendiumHandoffState = {
      returnTo: `${location.pathname}${location.search}`,
      returnLabel: "Back to Sheet",
      originLabel: character ? `${character.name} Sheet` : "Saved Sheet",
    };

    navigate(buildCompendiumEntryPath(entry), { state: handoffState });
  }

  function openReferenceSafe(slug: string) {
    void openReference(slug).catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Failed to open reference.");
    });
  }

  async function handleExport(kind: "exportJson" | "exportPdf") {
    if (!character) {
      return;
    }

    const filePath = await dndApi.characters[kind](character.id);
    setMessage(filePath ? `Exported to ${filePath}` : "Export canceled.");
  }

  async function handleDelete() {
    if (!character) {
      return;
    }

    await dndApi.characters.delete(character.id);
    navigate("/characters", { replace: true });
  }

  if (loading) {
    return <div className="empty-state">Loading saved sheet...</div>;
  }

  if (!character) {
    return (
      <div className="workspace">
        <SectionCard
          title="Character Not Found"
          subtitle="Saved sheet route"
        >
          <div className="stack-sm">
            <p className="muted-copy">The requested character record could not be loaded from local storage.</p>
            <div className="action-row">
              <button
                className="action-button"
                onClick={() => navigate("/characters")}
                type="button"
              >
                Back to Roster
              </button>
              <button
                className="action-button action-button--secondary"
                onClick={() => navigate("/characters/new")}
                type="button"
              >
                New Character
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  const activeCharacter = character;
  const activeHomebrew = homebrewEntries.filter((entry) => activeCharacter.homebrewIds.includes(entry.id));
  const derived = calculateDerivedState(activeCharacter, activeHomebrew);

  async function saveTrackedCharacter(nextCharacter: CharacterRecord, successMessage: string) {
    const saved = await dndApi.characters.save(nextCharacter);
    setCharacter(saved);
    setMessage(successMessage);
  }

  async function handleSaveCharacterFromSheet(nextCharacter: CharacterRecord, successMessage: string) {
    await saveTrackedCharacter(nextCharacter, successMessage);
  }

  return (
    <div className="workspace">
      <LockedSheetViewport minWidth={1180} showChrome={false}>
        <SavedSheetBook
          character={character}
          derived={derived}
          onOpenReference={openReferenceSafe}
          onSaveCharacter={handleSaveCharacterFromSheet}
          pageOneActions={
            <>
              <button
                className="action-button"
                onClick={() => navigate(`/characters/${activeCharacter.id}/edit`)}
                type="button"
              >
                Edit Character
              </button>
              <button
                className="action-button action-button--secondary"
                onClick={() => void handleExport("exportJson")}
                type="button"
              >
                Export JSON
              </button>
              <button
                className="action-button action-button--secondary"
                onClick={() => void handleExport("exportPdf")}
                type="button"
              >
                Export PDF
              </button>
              <button
                className="action-button action-button--secondary"
                onClick={() => navigate("/characters")}
                type="button"
              >
                Back to Roster
              </button>
              <button
                className="action-button action-button--ghost"
                onClick={() => void handleDelete()}
                type="button"
              >
                Delete Character
              </button>
            </>
          }
          routeStatus={message}
        />
      </LockedSheetViewport>
    </div>
  );
}
