import { useEffect, useState } from "react";
import { normalizeSheetProfile, normalizeTrackedResources, updateTrackedResourceCurrent } from "../../shared/sheetTracking";
import type { CharacterRecord, CurrencyWallet, DerivedSheetState, TrackedResource } from "../../shared/types";
import {
  SAVED_SHEET_PAGES,
  applySavedSheetRest,
  buildSavedSheetSpellcastingHeader,
  buildSavedSheetSpellSlotRows,
  buildSavedSheetSpellTableRows,
  buildSavedSheetPageTwoSummary,
  canTakeSavedSheetRest,
  createSavedSheetEditorDraft,
  createSavedSheetTrackedResource,
  getSavedSheetDefaultSpellId,
  parseSavedSheetLanguages,
  type SavedSheetRestKind,
  type SavedSheetEditorDraft,
  type SavedSheetPageId,
} from "../lib/savedSheetBook";
import { SheetPreview } from "./SheetPreview";

interface SavedSheetBookProps {
  character: CharacterRecord;
  derived: DerivedSheetState;
  onOpenReference?: (slug: string) => void;
  onSaveCharacter?: (nextCharacter: CharacterRecord, successMessage: string) => Promise<void>;
}

function scrollToSavedSheetPage(pageId: SavedSheetPageId) {
  document.getElementById(`saved-sheet-book-${pageId}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function clampInteger(value: string, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : Math.max(0, parsed);
}

function formatResourceMeta(resource: TrackedResource) {
  const display = resource.display === "checkboxes" ? "Checkboxes" : "Counter";
  const recovery =
    resource.recovery === "shortRest" ? "Short Rest" : resource.recovery === "longRest" ? "Long Rest" : "Manual";
  return `${display} | ${recovery}`;
}

export function SavedSheetBook({ character, derived, onOpenReference, onSaveCharacter }: SavedSheetBookProps) {
  const [activePage, setActivePage] = useState<SavedSheetPageId>("page-1");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorStatus, setEditorStatus] = useState("Use Edit Sheet to add bounded profile fields and tracked resources directly on the saved-sheet route.");
  const [playStateStatus, setPlayStateStatus] = useState("Use the live controls here for at-table play state, then apply short or long rests when the character qualifies.");
  const [isSavingPlayState, setIsSavingPlayState] = useState(false);
  const [draft, setDraft] = useState<SavedSheetEditorDraft>(() => createSavedSheetEditorDraft(character));
  const [languagesInput, setLanguagesInput] = useState(() => createSavedSheetEditorDraft(character).sheetProfile.languages.join(", "));

  const previewCharacter = isEditing
    ? { ...character, sheetProfile: draft.sheetProfile, trackedResources: draft.trackedResources }
    : character;
  const pageTwoSummary = buildSavedSheetPageTwoSummary(previewCharacter, derived);
  const spellcastingHeader = buildSavedSheetSpellcastingHeader(derived);
  const spellSlotRows = buildSavedSheetSpellSlotRows(derived);
  const spellRows = buildSavedSheetSpellTableRows(derived);
  const defaultSpellId = getSavedSheetDefaultSpellId(spellRows);
  const [previewedSpellId, setPreviewedSpellId] = useState<string | null>(() => defaultSpellId);
  const [pinnedSpellId, setPinnedSpellId] = useState<string | null>(null);
  const inspectedSpellId = pinnedSpellId ?? previewedSpellId ?? defaultSpellId;
  const inspectedSpell = spellRows.find((spell) => spell.id === inspectedSpellId) ?? null;
  const canRest = canTakeSavedSheetRest(character);

  useEffect(() => {
    setActivePage("page-1");
    setIsEditing(false);
    setIsSaving(false);
    setEditorStatus("Use Edit Sheet to add bounded profile fields and tracked resources directly on the saved-sheet route.");
    setPlayStateStatus("Use the live controls here for at-table play state, then apply short or long rests when the character qualifies.");
    setIsSavingPlayState(false);
    setPreviewedSpellId(defaultSpellId);
    setPinnedSpellId(null);
  }, [character.id, defaultSpellId]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const nextDraft = createSavedSheetEditorDraft(character);
    setDraft(nextDraft);
    setLanguagesInput(nextDraft.sheetProfile.languages.join(", "));
  }, [character, isEditing]);

  function selectPage(pageId: SavedSheetPageId) {
    setActivePage(pageId);
    window.requestAnimationFrame(() => scrollToSavedSheetPage(pageId));
  }

  function updateTextField(field: "appearance" | "alignment" | "equipmentNotes", value: string) {
    setDraft((current) => ({
      ...current,
      sheetProfile: { ...current.sheetProfile, [field]: value },
    }));
  }

  function updateCurrency(coin: keyof CurrencyWallet, value: string) {
    setDraft((current) => ({
      ...current,
      sheetProfile: {
        ...current.sheetProfile,
        currencies: { ...current.sheetProfile.currencies, [coin]: clampInteger(value) },
      },
    }));
  }

  function updateResource(resourceId: string, updater: (resource: TrackedResource) => TrackedResource) {
    setDraft((current) => ({
      ...current,
      trackedResources: current.trackedResources.map((resource) => (
        resource.id === resourceId ? updater(resource) : resource
      )),
    }));
  }

  function handleEditStart() {
    const nextDraft = createSavedSheetEditorDraft(character);
    setDraft(nextDraft);
    setLanguagesInput(nextDraft.sheetProfile.languages.join(", "));
    setIsEditing(true);
    setEditorStatus("Unsaved sheet edits stay local until you save them.");
  }

  function handleEditCancel() {
    const nextDraft = createSavedSheetEditorDraft(character);
    setDraft(nextDraft);
    setLanguagesInput(nextDraft.sheetProfile.languages.join(", "));
    setIsEditing(false);
    setEditorStatus("Discarded unsaved sheet edits.");
  }

  async function handleEditSave() {
    if (!onSaveCharacter) {
      return;
    }

    const sheetProfile = normalizeSheetProfile({
      ...draft.sheetProfile,
      languages: parseSavedSheetLanguages(languagesInput),
    });
    const trackedResources = normalizeTrackedResources(draft.trackedResources);

    setIsSaving(true);
    setEditorStatus("Saving sheet fields...");

    try {
      await onSaveCharacter(
        {
          ...character,
          sheetProfile,
          trackedResources,
        },
        "Saved sheet fields.",
      );
      setDraft({ sheetProfile, trackedResources });
      setLanguagesInput(sheetProfile.languages.join(", "));
      setIsEditing(false);
      setEditorStatus("Saved sheet fields.");
    } catch (error: unknown) {
      setEditorStatus(error instanceof Error ? error.message : "Failed to save sheet fields.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePlayState(nextCharacter: CharacterRecord, successMessage: string) {
    if (!onSaveCharacter) {
      return;
    }

    setIsSavingPlayState(true);
    setPlayStateStatus("Saving play state...");

    try {
      await onSaveCharacter(nextCharacter, successMessage);
      setPlayStateStatus(successMessage);
    } catch (error: unknown) {
      setPlayStateStatus(error instanceof Error ? error.message : "Failed to save play state.");
    } finally {
      setIsSavingPlayState(false);
    }
  }

  function handlePlayStateNumberChange(
    field: "currentHitPoints" | "tempHitPoints" | "hitDiceSpent",
    value: string,
  ) {
    const parsedValue = clampInteger(value, character[field]);
    const nextValue =
      field === "currentHitPoints"
        ? Math.min(parsedValue, derived.hitPointsMax)
        : field === "hitDiceSpent"
          ? Math.min(parsedValue, derived.hitDiceMax)
          : parsedValue;

    void savePlayState(
      {
        ...character,
        [field]: nextValue,
      },
      `Saved ${field === "currentHitPoints" ? "hit points" : field === "tempHitPoints" ? "temporary hit points" : "hit dice spent"}.`,
    );
  }

  function handleDeathSaveChange(field: "successes" | "failures", value: string) {
    const nextValue = Math.min(3, clampInteger(value, character.deathSaves[field]));

    void savePlayState(
      {
        ...character,
        deathSaves: {
          ...character.deathSaves,
          [field]: nextValue,
        },
      },
      "Saved death save tracking.",
    );
  }

  function handleInspirationToggle() {
    void savePlayState(
      {
        ...character,
        inspiration: !character.inspiration,
      },
      `Marked inspiration ${character.inspiration ? "off" : "on"}.`,
    );
  }

  function handleTrackedResourceCurrentChange(resourceId: string, nextCurrent: number) {
    const resource = character.trackedResources.find((entry) => entry.id === resourceId);

    if (!resource) {
      return;
    }

    void savePlayState(
      {
        ...character,
        trackedResources: updateTrackedResourceCurrent(character.trackedResources, resourceId, nextCurrent),
      },
      `Updated ${resource.label}.`,
    );
  }

  function handleRest(restKind: SavedSheetRestKind) {
    if (!canRest) {
      return;
    }

    const nextCharacter = applySavedSheetRest(character, derived, restKind);
    const successMessage =
      restKind === "shortRest"
        ? "Applied a bounded short rest: pact slots, short-rest resources, and stale death saves were reset."
        : "Applied a bounded long rest: hit points, hit point dice, spell slots, and rest-based resources were reset.";

    void savePlayState(nextCharacter, successMessage);
  }

  function previewSpell(spellId: string) {
    if (!pinnedSpellId) {
      setPreviewedSpellId(spellId);
    }
  }

  function clearSpellPreview() {
    if (!pinnedSpellId) {
      setPreviewedSpellId(defaultSpellId);
    }
  }

  function togglePinnedSpell(spellId: string) {
    setPreviewedSpellId(spellId);
    setPinnedSpellId((currentSpellId) => currentSpellId === spellId ? null : spellId);
  }

  return (
    <div className={`saved-sheet-book saved-sheet-book--${activePage}`.trim()}>
      <div className="saved-sheet-book__nav">
        {SAVED_SHEET_PAGES.map((page) => (
          <button
            key={page.id}
            aria-pressed={activePage === page.id}
            className={`saved-sheet-book__nav-button ${activePage === page.id ? "saved-sheet-book__nav-button--active" : ""}`.trim()}
            onClick={() => selectPage(page.id)}
            type="button"
          >
            <span>{page.label}</span>
            <strong>{page.title}</strong>
            <small>{page.description}</small>
          </button>
        ))}
      </div>

      <section className="saved-sheet-book__page saved-sheet-book__page--page-1" id="saved-sheet-book-page-1">
        <article className="saved-sheet-book__preview-shell saved-sheet-book__preview-shell--primary">
          <SheetPreview character={previewCharacter} derived={derived} onOpenReference={onOpenReference} />
        </article>

        <div className="saved-sheet-book__page-one-toolbar">
          <div className="saved-sheet-book__page-one-toolbar-copy">
            <span>{isEditing ? "Edit mode" : "Sheet mode"}</span>
            <small>{editorStatus}</small>
          </div>
          <div className="action-row saved-sheet-book__page-action-row">
            {isEditing ? (
              <>
                <button className="action-button" disabled={isSaving} onClick={() => void handleEditSave()} type="button">
                  {isSaving ? "Saving..." : "Save Sheet"}
                </button>
                <button className="action-button action-button--secondary" disabled={isSaving} onClick={handleEditCancel} type="button">
                  Cancel
                </button>
              </>
            ) : (
              <button className="action-button" onClick={handleEditStart} type="button">
                Edit Sheet
              </button>
            )}
          </div>
        </div>

        <div className="saved-sheet-book__page-one-support">
          <article className="saved-sheet-book__panel saved-sheet-book__panel--wide">
            <header className="saved-sheet-book__panel-header">
              <span>Rest & Recovery</span>
              <strong>{isSavingPlayState ? "Saving..." : "Ready"}</strong>
            </header>
            <div className="action-row saved-sheet-book__rest-actions">
              <button
                className="action-button"
                disabled={isSavingPlayState}
                onClick={() => handleRest("shortRest")}
                type="button"
              >
                Short Rest
              </button>
              <button
                className="action-button action-button--secondary"
                disabled={isSavingPlayState}
                onClick={() => handleRest("longRest")}
                type="button"
              >
                Long Rest
              </button>
            </div>
            <p className="muted-copy">
              Short Rest refreshes pact slots, short-rest resources, and clears stale death saves. Long Rest restores hit
              points, clears temp HP, refreshes spell slots, restores hit point dice, and resets all rest-based
              resources. Hit Point Dice spending during a short rest stays manual through the fields below.
            </p>
            <p className="muted-copy">{playStateStatus}</p>
            <div className="saved-sheet-book__play-state-grid">
              <label className="saved-sheet-book__form-field">
                <span>Current HP</span>
                <input
                  max={derived.hitPointsMax}
                  min={0}
                  onChange={(event) => handlePlayStateNumberChange("currentHitPoints", event.target.value)}
                  type="number"
                  value={character.currentHitPoints}
                />
              </label>
              <label className="saved-sheet-book__form-field">
                <span>Temp HP</span>
                <input
                  min={0}
                  onChange={(event) => handlePlayStateNumberChange("tempHitPoints", event.target.value)}
                  type="number"
                  value={character.tempHitPoints}
                />
              </label>
              <label className="saved-sheet-book__form-field">
                <span>Hit Dice Spent</span>
                <input
                  max={derived.hitDiceMax}
                  min={0}
                  onChange={(event) => handlePlayStateNumberChange("hitDiceSpent", event.target.value)}
                  type="number"
                  value={character.hitDiceSpent}
                />
              </label>
              <label className="saved-sheet-book__form-field">
                <span>Inspiration</span>
                <button
                  className={`action-button saved-sheet-book__play-state-toggle ${character.inspiration ? "action-button--secondary" : ""}`.trim()}
                  disabled={isSavingPlayState}
                  onClick={handleInspirationToggle}
                  type="button"
                >
                  {character.inspiration ? "Marked" : "Open"}
                </button>
              </label>
              <label className="saved-sheet-book__form-field">
                <span>Death Save Successes</span>
                <input
                  max={3}
                  min={0}
                  onChange={(event) => handleDeathSaveChange("successes", event.target.value)}
                  type="number"
                  value={character.deathSaves.successes}
                />
              </label>
              <label className="saved-sheet-book__form-field">
                <span>Death Save Failures</span>
                <input
                  max={3}
                  min={0}
                  onChange={(event) => handleDeathSaveChange("failures", event.target.value)}
                  type="number"
                  value={character.deathSaves.failures}
                />
              </label>
            </div>
          </article>

          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Field Notebook</span>
              <strong>{isEditing ? "Inline edits" : "Saved profile"}</strong>
            </header>
            {isEditing ? (
              <div className="saved-sheet-book__edit-grid">
                <label className="saved-sheet-book__form-field">
                  <span>Alignment</span>
                  <input onChange={(event) => updateTextField("alignment", event.target.value)} type="text" value={draft.sheetProfile.alignment} />
                </label>
                <label className="saved-sheet-book__form-field">
                  <span>Languages</span>
                  <input
                    onChange={(event) => {
                      setLanguagesInput(event.target.value);
                      setDraft((current) => ({
                        ...current,
                        sheetProfile: { ...current.sheetProfile, languages: parseSavedSheetLanguages(event.target.value) },
                      }));
                    }}
                    placeholder="Common, Elvish"
                    type="text"
                    value={languagesInput}
                  />
                </label>
                <label className="saved-sheet-book__form-field saved-sheet-book__form-field--wide">
                  <span>Appearance</span>
                  <textarea onChange={(event) => updateTextField("appearance", event.target.value)} rows={4} value={draft.sheetProfile.appearance} />
                </label>
                <label className="saved-sheet-book__form-field saved-sheet-book__form-field--wide">
                  <span>Equipment Notes</span>
                  <textarea onChange={(event) => updateTextField("equipmentNotes", event.target.value)} rows={4} value={draft.sheetProfile.equipmentNotes} />
                </label>
                <div className="saved-sheet-book__subsection">
                  <span className="saved-sheet-book__subheading">Currencies</span>
                  <div className="saved-sheet-book__currency-grid">
                    {(["pp", "gp", "ep", "sp", "cp"] as const).map((coin) => (
                      <label key={coin} className="saved-sheet-book__form-field">
                        <span>{coin.toUpperCase()}</span>
                        <input min={0} onChange={(event) => updateCurrency(coin, event.target.value)} type="number" value={draft.sheetProfile.currencies[coin]} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="saved-sheet-book__field-grid">
                <div className="saved-sheet-book__field-card">
                  <span>Alignment</span>
                  <strong>{pageTwoSummary.alignment}</strong>
                </div>
                <div className="saved-sheet-book__field-card">
                  <span>Languages</span>
                  <strong>{pageTwoSummary.languages}</strong>
                </div>
                <div className="saved-sheet-book__field-card">
                  <span>Coins</span>
                  <strong>{pageTwoSummary.currencySummary}</strong>
                </div>
                <div className="saved-sheet-book__field-card saved-sheet-book__field-card--wide">
                  <span>Appearance</span>
                  <p>{pageTwoSummary.appearance}</p>
                </div>
                <div className="saved-sheet-book__field-card saved-sheet-book__field-card--wide">
                  <span>Equipment Notes</span>
                  <p>{pageTwoSummary.equipmentNotes}</p>
                </div>
              </div>
            )}
          </article>

          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Tracked Resources</span>
              <strong>{pageTwoSummary.trackedResources.length} configured</strong>
            </header>
            {isEditing ? (
              <div className="saved-sheet-book__resource-editor">
                {draft.trackedResources.map((resource) => (
                  <article key={resource.id} className="saved-sheet-book__resource-editor-card">
                    <div className="saved-sheet-book__resource-editor-top">
                      <label className="saved-sheet-book__form-field saved-sheet-book__form-field--wide">
                        <span>Label</span>
                        <input onChange={(event) => updateResource(resource.id, (current) => ({ ...current, label: event.target.value }))} type="text" value={resource.label} />
                      </label>
                      <button
                        className="inline-link-button"
                        onClick={() => setDraft((current) => ({ ...current, trackedResources: current.trackedResources.filter((entry) => entry.id !== resource.id) }))}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="saved-sheet-book__resource-editor-grid">
                      <label className="saved-sheet-book__form-field">
                        <span>Current</span>
                        <input
                          min={0}
                          onChange={(event) => updateResource(resource.id, (current) => ({ ...current, current: Math.min(current.max, clampInteger(event.target.value, current.current)) }))}
                          type="number"
                          value={resource.current}
                        />
                      </label>
                      <label className="saved-sheet-book__form-field">
                        <span>Max</span>
                        <input
                          min={1}
                          onChange={(event) => updateResource(resource.id, (current) => {
                            const nextMax = Math.max(1, clampInteger(event.target.value, current.max));
                            return { ...current, max: nextMax, current: Math.min(current.current, nextMax) };
                          })}
                          type="number"
                          value={resource.max}
                        />
                      </label>
                      <label className="saved-sheet-book__form-field">
                        <span>Display</span>
                        <select onChange={(event) => updateResource(resource.id, (current) => ({ ...current, display: event.target.value === "counter" ? "counter" : "checkboxes" }))} value={resource.display}>
                          <option value="checkboxes">Checkboxes</option>
                          <option value="counter">Counter</option>
                        </select>
                      </label>
                      <label className="saved-sheet-book__form-field">
                        <span>Recovery</span>
                        <select
                          onChange={(event) => updateResource(resource.id, (current) => ({
                            ...current,
                            recovery: event.target.value === "shortRest" || event.target.value === "longRest" ? event.target.value : "manual",
                          }))}
                          value={resource.recovery}
                        >
                          <option value="manual">Manual</option>
                          <option value="shortRest">Short Rest</option>
                          <option value="longRest">Long Rest</option>
                        </select>
                      </label>
                      <label className="saved-sheet-book__form-field saved-sheet-book__form-field--wide">
                        <span>Reference Slug</span>
                        <input onChange={(event) => updateResource(resource.id, (current) => ({ ...current, referenceSlug: event.target.value }))} type="text" value={resource.referenceSlug ?? ""} />
                      </label>
                      <label className="saved-sheet-book__form-field saved-sheet-book__form-field--wide">
                        <span>Notes</span>
                        <textarea onChange={(event) => updateResource(resource.id, (current) => ({ ...current, notes: event.target.value }))} rows={2} value={resource.notes ?? ""} />
                      </label>
                    </div>
                  </article>
                ))}
                <button
                  className="inline-link-button"
                  onClick={() => setDraft((current) => ({ ...current, trackedResources: [...current.trackedResources, createSavedSheetTrackedResource(current.trackedResources.length)] }))}
                  type="button"
                >
                  Add Resource
                </button>
              </div>
            ) : pageTwoSummary.trackedResources.length > 0 ? (
              <div className="saved-sheet-book__resource-list">
                {pageTwoSummary.trackedResources.map((resource) => (
                  <div key={resource.id} className="saved-sheet-book__resource-row saved-sheet-book__resource-row--interactive">
                    <div>
                      {resource.referenceSlug && onOpenReference ? (
                        <button className="record-sheet__link-button" onClick={() => onOpenReference(resource.referenceSlug!)} type="button">
                          <strong>{resource.label}</strong>
                        </button>
                      ) : (
                        <strong>{resource.label}</strong>
                      )}
                      <small>{formatResourceMeta(resource)}</small>
                      {resource.notes ? <small>{resource.notes}</small> : null}
                    </div>
                    {resource.display === "checkboxes" ? (
                      <div className="saved-sheet-book__resource-pips" role="group" aria-label={`${resource.label} charges`}>
                        {Array.from({ length: resource.max }, (_, index) => {
                          const isAvailable = index < resource.current;

                          return (
                            <button
                              key={`${resource.id}-${index + 1}`}
                              aria-pressed={isAvailable}
                              className={`saved-sheet-book__resource-pip ${isAvailable ? "saved-sheet-book__resource-pip--active" : ""}`.trim()}
                              disabled={isSavingPlayState}
                              onClick={() => handleTrackedResourceCurrentChange(resource.id, isAvailable ? index : index + 1)}
                              type="button"
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="saved-sheet-book__resource-counter">
                        <button
                          className="inline-link-button"
                          disabled={isSavingPlayState || resource.current <= 0}
                          onClick={() => handleTrackedResourceCurrentChange(resource.id, resource.current - 1)}
                          type="button"
                        >
                          -
                        </button>
                        <span>
                          {resource.current}/{resource.max}
                        </span>
                        <button
                          className="inline-link-button"
                          disabled={isSavingPlayState || resource.current >= resource.max}
                          onClick={() => handleTrackedResourceCurrentChange(resource.id, resource.current + 1)}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No bounded resource rows are configured yet.</p>
            )}
          </article>
        </div>
      </section>

      <section className="saved-sheet-book__page saved-sheet-book__page--page-2" id="saved-sheet-book-page-2">
        <header className="saved-sheet-book__page-header">
          <div className="saved-sheet-book__page-copy">
            <span>Page 2</span>
            <strong>Spellbook Worksheet</strong>
            <p>The second page now reads like a dedicated spellbook sheet: spellcasting summary up top, a lined spell table in the center, and a right-rail inspector instead of a generic notes block.</p>
          </div>
          <div className="saved-sheet-book__page-meta">
            <span>{isEditing ? "Previewing draft" : "Live now"}</span>
            <small>{isEditing ? "Unsaved page-profile and resource edits already flow through this page while spell hover and pin behavior stays active." : "Hover or focus a spell to preview it. Click a row to pin it in the inspector."}</small>
          </div>
        </header>

        <div className="saved-sheet-book__page-two-layout">
          <div className="saved-sheet-book__page-two-main">
            <article className="saved-sheet-book__panel saved-sheet-book__worksheet-panel saved-sheet-book__worksheet-panel--spellbook">
              <header className="saved-sheet-book__panel-header">
                <span>Spellcasting</span>
                <strong>{spellcastingHeader.focusLabel}</strong>
              </header>
              <div className="saved-sheet-book__worksheet-spellbook-top">
                <div className="saved-sheet-book__worksheet-focus-box">
                  <span>Ability</span>
                  <strong>{spellcastingHeader.focusShortLabel}</strong>
                  <small>{spellcastingHeader.focusLabel}</small>
                </div>
                <div className="saved-sheet-book__worksheet-stat-strip">
                  {[
                    ["Spell Attack", spellcastingHeader.spellAttackLabel],
                    ["Save DC", spellcastingHeader.spellSaveLabel],
                    ["Prepared", `${pageTwoSummary.preparedSpellCount}`],
                    ["Known", `${pageTwoSummary.knownSpellCount}`],
                    ["Cantrips", `${pageTwoSummary.cantripCount}`],
                    ["Leveled", `${pageTwoSummary.leveledSpellCount}`],
                  ].map(([label, value]) => (
                    <div key={label} className="saved-sheet-book__worksheet-stat-cell">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="saved-sheet-book__worksheet-slot-section">
                <div className="saved-sheet-book__worksheet-section-heading">
                  <span>Spell Slots</span>
                  <strong>{pageTwoSummary.slotSummary}</strong>
                </div>
                {spellSlotRows.length > 0 ? (
                  <div className="saved-sheet-book__slot-ledger" role="table" aria-label="Spell slot ledger">
                    <div className="saved-sheet-book__slot-ledger-head">Level</div>
                    <div className="saved-sheet-book__slot-ledger-head">Total</div>
                    <div className="saved-sheet-book__slot-ledger-head">Expended</div>
                    <div className="saved-sheet-book__slot-ledger-head">Remaining</div>

                    {spellSlotRows.map((row) => (
                      <div key={row.id} className="saved-sheet-book__slot-ledger-row">
                        <span className="saved-sheet-book__slot-ledger-cell" data-label="Level">{row.levelLabel}</span>
                        <span className="saved-sheet-book__slot-ledger-cell" data-label="Total">{row.total}</span>
                        <span className="saved-sheet-book__slot-ledger-cell" data-label="Expended">{row.expended}</span>
                        <span className="saved-sheet-book__slot-ledger-cell" data-label="Remaining">{row.remaining}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-copy">No spell slots are currently tracked for this character.</p>
                )}
              </div>
              {spellcastingHeader.bonusLine ? (
                <div className="saved-sheet-book__worksheet-bonus-line">
                  <span>Additional Spellcasting</span>
                  <strong>{spellcastingHeader.bonusLine}</strong>
                </div>
              ) : null}
            </article>

            <article className="saved-sheet-book__panel saved-sheet-book__worksheet-panel saved-sheet-book__worksheet-panel--spell-table">
              <header className="saved-sheet-book__panel-header">
                <span>Spell Table</span>
                <strong>{spellRows.length} tracked</strong>
              </header>
              {spellRows.length > 0 ? (
                <div className="saved-sheet-book__spell-table-shell">
                  <div className="saved-sheet-book__spell-table">
                    <div className="saved-sheet-book__spell-table-head">Level</div>
                    <div className="saved-sheet-book__spell-table-head">Spell Name</div>
                    <div className="saved-sheet-book__spell-table-head">Range</div>
                    <div className="saved-sheet-book__spell-table-head">Save / Attack</div>
                    <div className="saved-sheet-book__spell-table-head">Casting</div>
                    <div className="saved-sheet-book__spell-table-head">Duration</div>
                    <div className="saved-sheet-book__spell-table-head">C</div>

                    {spellRows.map((spell) => {
                      const isActive = inspectedSpell?.id === spell.id;
                      const isPinned = pinnedSpellId === spell.id;

                      return (
                        <button
                          key={spell.id}
                          className={`saved-sheet-book__spell-row ${isActive ? "saved-sheet-book__spell-row--active" : ""} ${isPinned ? "saved-sheet-book__spell-row--pinned" : ""}`.trim()}
                          onBlur={clearSpellPreview}
                          onClick={() => togglePinnedSpell(spell.id)}
                          onFocus={() => previewSpell(spell.id)}
                          onMouseEnter={() => previewSpell(spell.id)}
                          onMouseLeave={clearSpellPreview}
                          type="button"
                        >
                          <span className="saved-sheet-book__spell-cell" data-label="Level">{spell.levelLabel}</span>
                          <span className="saved-sheet-book__spell-cell saved-sheet-book__spell-cell--name" data-label="Spell Name">
                            <strong>{spell.name}</strong>
                            <small>{spell.prepared ? "Prepared" : "Known"} | {spell.ritualLabel}</small>
                          </span>
                          <span className="saved-sheet-book__spell-cell" data-label="Range">{spell.rangeLabel}</span>
                          <span className="saved-sheet-book__spell-cell" data-label="Save / Attack">{spell.saveLabel}</span>
                          <span className="saved-sheet-book__spell-cell" data-label="Casting">{spell.castLabel}</span>
                          <span className="saved-sheet-book__spell-cell" data-label="Duration">{spell.durationLabel}</span>
                          <span className="saved-sheet-book__spell-cell" data-label="Concentration">{spell.concentrationLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="muted-copy">No spells are currently tracked on this character.</p>
              )}
            </article>
          </div>

          <div className="saved-sheet-book__page-two-rail">
            <article className="saved-sheet-book__panel saved-sheet-book__worksheet-panel saved-sheet-book__worksheet-panel--inspector">
              <header className="saved-sheet-book__panel-header">
                <span>Spell Detail</span>
                <strong>{inspectedSpell?.name ?? "No spell selected"}</strong>
              </header>
              {inspectedSpell ? (
                <div className="saved-sheet-book__spell-inspector">
                  <div className="saved-sheet-book__metric-grid">
                    {[
                      ["Level", inspectedSpell.levelLabel],
                      ["Range", inspectedSpell.rangeLabel],
                      ["Save / Attack", inspectedSpell.saveLabel],
                      ["Cast", inspectedSpell.castLabel],
                      ["Duration", inspectedSpell.durationLabel],
                      ["Concentration", inspectedSpell.concentrationLabel],
                    ].map(([label, value]) => (
                      <div key={label} className="saved-sheet-book__metric">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="saved-sheet-book__subsection">
                    <span className="saved-sheet-book__subheading">Text</span>
                    <p className="saved-sheet-book__spell-copy">{inspectedSpell.description}</p>
                    {inspectedSpell.higherLevel ? (
                      <div className="saved-sheet-book__spell-copy-block">
                        <span className="saved-sheet-book__subheading">Higher-Level Slot</span>
                        <p className="saved-sheet-book__spell-copy">{inspectedSpell.higherLevel}</p>
                      </div>
                    ) : null}
                    <div className="action-row">
                      <button
                        className={`action-button ${pinnedSpellId === inspectedSpell.id ? "action-button--secondary" : ""}`.trim()}
                        onClick={() => togglePinnedSpell(inspectedSpell.id)}
                        type="button"
                      >
                        {pinnedSpellId === inspectedSpell.id ? "Unpin Spell" : "Pin Spell"}
                      </button>
                      {onOpenReference ? (
                        <button
                          className="action-button action-button--secondary"
                          onClick={() => onOpenReference(inspectedSpell.id)}
                          type="button"
                        >
                          Open Linked Reference
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="muted-copy">Hover, focus, or select a spell row to inspect its text here.</p>
              )}
            </article>

            <article className="saved-sheet-book__panel saved-sheet-book__worksheet-panel saved-sheet-book__worksheet-panel--profile">
              <header className="saved-sheet-book__panel-header">
                <span>Field Profile</span>
                <strong>{isEditing ? "Draft values" : "Saved page-two fields"}</strong>
              </header>
              <div className="saved-sheet-book__worksheet-note-stack">
                <section className="saved-sheet-book__worksheet-note-block">
                  <span>Appearance</span>
                  <p>{pageTwoSummary.appearance}</p>
                </section>
                <section className="saved-sheet-book__worksheet-note-block">
                  <span>Equipment Notes</span>
                  <p>{pageTwoSummary.equipmentNotes}</p>
                </section>
              </div>
              <div className="saved-sheet-book__worksheet-detail-grid">
                <div className="saved-sheet-book__worksheet-detail">
                  <span>Alignment</span>
                  <strong>{pageTwoSummary.alignment}</strong>
                </div>
                <div className="saved-sheet-book__worksheet-detail">
                  <span>Languages</span>
                  <strong>{pageTwoSummary.languages}</strong>
                </div>
                <div className="saved-sheet-book__worksheet-detail saved-sheet-book__worksheet-detail--wide">
                  <span>Coins</span>
                  <strong>{pageTwoSummary.currencySummary}</strong>
                </div>
              </div>
            </article>

            <article className="saved-sheet-book__panel saved-sheet-book__worksheet-panel saved-sheet-book__worksheet-panel--resources">
              <header className="saved-sheet-book__panel-header">
                <span>Tracked Resources</span>
                <strong>{pageTwoSummary.trackedResources.length} configured</strong>
              </header>
              {pageTwoSummary.trackedResources.length > 0 ? (
                <div className="saved-sheet-book__resource-list">
                  {pageTwoSummary.trackedResources.map((resource) => (
                    <div key={resource.id} className="saved-sheet-book__resource-row saved-sheet-book__resource-row--summary">
                      <div>
                        <strong>{resource.label}</strong>
                        <small>{formatResourceMeta(resource)}</small>
                      </div>
                      <span>{resource.current}/{resource.max}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">No bounded resource rows are configured yet. Add them in Edit Sheet mode to make the rest controls more useful during play.</p>
              )}
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
