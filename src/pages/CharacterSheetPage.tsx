import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { calculateDerivedState } from "../../shared/calculations";
import {
  getBackgroundTemplate,
  getClassTemplate,
  getSpeciesTemplate,
  getSubclassLabel,
} from "../../shared/data/reference";
import { normalizePactSlotsRemaining, normalizeSpellSlotsRemaining } from "../../shared/spellSlots";
import type { CharacterRecord, CompendiumEntry, HomebrewEntry } from "../../shared/types";
import { CompendiumEntryDetail } from "../components/CompendiumEntryDetail";
import { SavedSheetBook } from "../components/SavedSheetBook";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";
import { formatSavedSheetSpellSlotSummary } from "../lib/savedSheetBook";

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function CharacterSheetPage() {
  const navigate = useNavigate();
  const { characterId } = useParams();
  const [character, setCharacter] = useState<CharacterRecord | null>(null);
  const [homebrewEntries, setHomebrewEntries] = useState<HomebrewEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    "Review the saved sheet here, export it when needed, or reopen the editor without leaving this window.",
  );
  const [referenceEntry, setReferenceEntry] = useState<CompendiumEntry | null>(null);
  const [referenceStatus, setReferenceStatus] = useState(
    "Click a linked label on the sheet to inspect the matching compendium entry here.",
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
    setReferenceStatus("Loading reference...");
    const entry = await dndApi.compendium.get(slug);

    if (!entry) {
      setReferenceEntry(null);
      setReferenceStatus("Reference entry not found.");
      return;
    }

    setReferenceEntry(entry);
    setReferenceStatus(`Showing ${entry.name}.`);
  }

  function openReferenceSafe(slug: string) {
    void openReference(slug).catch((error: unknown) => {
      setReferenceStatus(error instanceof Error ? error.message : "Failed to open reference.");
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
  const selectedClass = getClassTemplate(activeCharacter.classId);
  const selectedSpecies = getSpeciesTemplate(activeCharacter.speciesId);
  const selectedBackground = getBackgroundTemplate(activeCharacter.backgroundId);
  const subclassLabel = activeCharacter.subclass
    ? getSubclassLabel(activeCharacter.classId, activeCharacter.subclass, activeCharacter.enabledSourceIds)
    : null;

  async function saveTrackedCharacter(nextCharacter: CharacterRecord, successMessage: string) {
    const saved = await dndApi.characters.save(nextCharacter);
    setCharacter(saved);
    setMessage(successMessage);
  }

  function handleSpellSlotRemainingChange(slotIndex: number, value: number) {
    const nextSpellSlotsRemaining = [...activeCharacter.spellSlotsRemaining];
    nextSpellSlotsRemaining[slotIndex] = value;

    void saveTrackedCharacter(
      {
        ...activeCharacter,
        spellSlotsRemaining: normalizeSpellSlotsRemaining(nextSpellSlotsRemaining, derived.spellcasting.spellSlotsMax),
      },
      "Saved spell slot tracking.",
    );
  }

  function handlePactSlotsRemainingChange(value: number) {
    void saveTrackedCharacter(
      {
        ...activeCharacter,
        pactSlotsRemaining: normalizePactSlotsRemaining(value, derived.spellcasting.pactSlotsMax),
      },
      "Saved spell slot tracking.",
    );
  }

  function handleResetSpellSlots() {
    void saveTrackedCharacter(
      {
        ...activeCharacter,
        spellSlotsRemaining: [...derived.spellcasting.spellSlotsMax],
        pactSlotsRemaining: derived.spellcasting.pactSlotsMax,
      },
      "Reset tracked spell slots to their current maximum values.",
    );
  }

  async function handleSaveSheetFields(updates: Pick<CharacterRecord, "sheetProfile" | "trackedResources">) {
    await saveTrackedCharacter(
      {
        ...activeCharacter,
        sheetProfile: updates.sheetProfile,
        trackedResources: updates.trackedResources,
      },
      "Saved sheet fields.",
    );
  }

  return (
    <div className="workspace">
      <SectionCard
        title={character.name}
        subtitle="Saved sheet workspace"
      >
        <div className="stack-md">
          <div className="sheet-route-overview">
            <div className="sheet-route-overview__identity">
              <span className="sheet-route-overview__eyebrow">Saved sheet route</span>
              <div className="sheet-route-overview__headline">
                <strong>Level {character.level} {selectedClass.name}</strong>
                <span>{subclassLabel ?? `${selectedSpecies.name} adventurer`}</span>
              </div>
              <p className="muted-copy">
                This route is the read/export surface for a finished record. Editing still reuses the separate creator
                workflow in the same Electron window.
              </p>
              <div className="sheet-route-overview__meta">
                <span className="library-item__pill">{selectedSpecies.name}</span>
                <span className="library-item__pill">{selectedBackground.name}</span>
                {subclassLabel ? <span className="library-item__pill">{subclassLabel}</span> : null}
                <span>Created {formatTimestamp(character.createdAt)}</span>
                <span>Last saved {formatTimestamp(character.updatedAt)}</span>
              </div>
            </div>

            <div className="sheet-route-overview__actions">
              <div className="action-row">
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
              </div>
              <p className="muted-copy">{message}</p>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Quick References</strong>
                <span>Linked compendium targets</span>
              </div>
              <div className="filter-row">
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(character.classId)}
                  type="button"
                >
                  Level {character.level} {selectedClass.name}
                </button>
                {subclassLabel ? (
                  <button
                    className="chip"
                    onClick={() => openReferenceSafe(character.subclass)}
                    type="button"
                  >
                    {subclassLabel}
                  </button>
                ) : null}
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(character.speciesId)}
                  type="button"
                >
                  {selectedSpecies.name}
                </button>
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(character.backgroundId)}
                  type="button"
                >
                  {selectedBackground.name}
                </button>
                {activeHomebrew.map((entry) => (
                  <span
                    key={entry.id}
                    className="chip chip--active"
                  >
                    {entry.name}
                  </span>
                ))}
              </div>
              <p className="muted-copy">
                Linked labels on the sheet load the matching rule, spell, subclass, feat, or item into the reference
                panel below without leaving the saved-sheet route.
              </p>
            </div>

            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Sheet Snapshot</strong>
                <span>Save-state overview</span>
              </div>
              <div className="sheet-route-metrics">
                <div className="sheet-route-metric">
                  <span>Armor Class</span>
                  <strong>{derived.armorClass}</strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Hit Points</span>
                  <strong>
                    {character.currentHitPoints}/{derived.hitPointsMax}
                  </strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Spell Line</span>
                  <strong>
                    {derived.spellcasting.spellSaveDC === null
                      ? derived.spellcasting.bonusSpellcasting?.sourceLabel ?? "None"
                      : `DC ${derived.spellcasting.spellSaveDC}`}
                  </strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Tracked Entries</span>
                  <strong>{derived.inventoryEntries.length}</strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Feat Entries</span>
                  <strong>{derived.feats.length}</strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Source Profiles</span>
                  <strong>{character.enabledSourceIds.length}</strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Homebrew</span>
                  <strong>{activeHomebrew.length}</strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Prepared</span>
                  <strong>{derived.spellcasting.preparedSpells.length}</strong>
                </div>
                <div className="sheet-route-metric">
                  <span>Tracked Slots</span>
                  <strong>{formatSavedSheetSpellSlotSummary(derived)}</strong>
                </div>
              </div>
            </div>

            {derived.spellcasting.slotMode !== "none" ? (
              <div className="detail-card">
                <div className="detail-card__header">
                  <strong>Spell Slot Tracking</strong>
                  <button
                    className="inline-link-button"
                    onClick={handleResetSpellSlots}
                    type="button"
                  >
                    Reset to Max
                  </button>
                </div>
                <div className="form-grid">
                  {derived.spellcasting.slotMode === "pact" ? (
                    <label>
                      <span>Pact Slots Remaining</span>
                      <input
                        max={derived.spellcasting.pactSlotsMax}
                        min={0}
                        onChange={(event) => handlePactSlotsRemainingChange(Number(event.target.value))}
                        type="number"
                        value={activeCharacter.pactSlotsRemaining ?? derived.spellcasting.pactSlotsRemaining}
                      />
                    </label>
                  ) : (
                    derived.spellcasting.spellSlotsMax.map((slotMax, index) => (
                      <label key={`saved-sheet-slot-${index + 1}`}>
                        <span>Level {index + 1} Remaining</span>
                        <input
                          max={slotMax}
                          min={0}
                          onChange={(event) => handleSpellSlotRemainingChange(index, Number(event.target.value))}
                          type="number"
                          value={activeCharacter.spellSlotsRemaining[index] ?? slotMax}
                        />
                      </label>
                    ))
                  )}
                </div>
                <p className="muted-copy">
                  Slot usage now persists directly on the saved-sheet route, so the read/export view is useful during play.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        className="section-card--sheet-preview"
        title="Character Sheet Pages"
        subtitle="Saved sheet route"
      >
        <SavedSheetBook
          character={character}
          derived={derived}
          onOpenReference={openReferenceSafe}
          onSaveSheetFields={handleSaveSheetFields}
        />
      </SectionCard>

      <SectionCard
        title={referenceEntry?.name ?? "Linked Reference"}
        subtitle="In-context compendium detail"
      >
        <CompendiumEntryDetail
          actions={
            referenceEntry ? (
              <button
                className="action-button action-button--secondary"
                onClick={() => navigate(`/compendium?slug=${referenceEntry.slug}`)}
                type="button"
              >
                Open Full Compendium View
              </button>
            ) : undefined
          }
          emptyMessage={referenceStatus}
          entry={referenceEntry}
        />
      </SectionCard>
    </div>
  );
}
