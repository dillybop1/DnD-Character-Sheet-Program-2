import { useEffect, useState } from "react";
import { normalizeSheetProfile, normalizeTrackedResources } from "../../shared/sheetTracking";
import type { CharacterRecord, CurrencyWallet, DerivedSheetState, TrackedResource } from "../../shared/types";
import {
  SAVED_SHEET_PAGES,
  buildSavedSheetPageOneSummary,
  buildSavedSheetPageTwoSummary,
  createSavedSheetEditorDraft,
  createSavedSheetTrackedResource,
  parseSavedSheetLanguages,
  type SavedSheetEditorDraft,
  type SavedSheetPageId,
} from "../lib/savedSheetBook";
import { SheetPreview } from "./SheetPreview";

interface SavedSheetBookProps {
  character: CharacterRecord;
  derived: DerivedSheetState;
  onOpenReference?: (slug: string) => void;
  onSaveSheetFields?: (updates: Pick<CharacterRecord, "sheetProfile" | "trackedResources">) => Promise<void>;
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

export function SavedSheetBook({ character, derived, onOpenReference, onSaveSheetFields }: SavedSheetBookProps) {
  const [activePage, setActivePage] = useState<SavedSheetPageId>("page-1");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorStatus, setEditorStatus] = useState("Use Edit Sheet to add bounded profile fields and tracked resources directly on the saved-sheet route.");
  const [draft, setDraft] = useState<SavedSheetEditorDraft>(() => createSavedSheetEditorDraft(character));
  const [languagesInput, setLanguagesInput] = useState(() => createSavedSheetEditorDraft(character).sheetProfile.languages.join(", "));

  const previewCharacter = isEditing
    ? { ...character, sheetProfile: draft.sheetProfile, trackedResources: draft.trackedResources }
    : character;
  const pageOneSummary = buildSavedSheetPageOneSummary(previewCharacter, derived);
  const pageTwoSummary = buildSavedSheetPageTwoSummary(previewCharacter, derived);
  const spellPreviewEntries = derived.spellcasting.knownSpells.slice(0, 12);
  const combatMetrics = [
    ["Armor Class", pageOneSummary.armorClass],
    ["Initiative", pageOneSummary.initiative],
    ["Speed", pageOneSummary.speed],
    ["Size", pageOneSummary.size],
    ["Proficiency", pageOneSummary.proficiencyBonus],
    ["Passive Perception", pageOneSummary.passivePerception],
    ["Spell Line", pageOneSummary.spellLine],
    ["Slots", pageOneSummary.slotSummary],
  ] as const;
  const playStateMetrics = [
    ["Hit Dice", pageOneSummary.hitDice],
    ["Death Saves", pageOneSummary.deathSaves],
    ["Inspiration", pageOneSummary.inspiration],
    ["Tracked Resources", `${pageOneSummary.trackedResourceCount}`],
  ] as const;

  useEffect(() => {
    const nextDraft = createSavedSheetEditorDraft(character);

    setActivePage("page-1");
    setIsEditing(false);
    setIsSaving(false);
    setDraft(nextDraft);
    setLanguagesInput(nextDraft.sheetProfile.languages.join(", "));
    setEditorStatus("Use Edit Sheet to add bounded profile fields and tracked resources directly on the saved-sheet route.");
  }, [character]);

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
    if (!onSaveSheetFields) {
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
      await onSaveSheetFields({ sheetProfile, trackedResources });
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
        <header className="saved-sheet-book__page-header">
          <div className="saved-sheet-book__page-copy">
            <span>Page 1</span>
            <strong>Core Sheet</strong>
            <p>The saved-sheet route now frames the reference sheet with a page-one overview and inline sheet editing.</p>
          </div>
          <div className="saved-sheet-book__page-meta saved-sheet-book__page-meta--stack">
            <span>{isEditing ? "Edit mode" : "Sheet mode"}</span>
            <strong>{pageOneSummary.headline}</strong>
            <small>{editorStatus}</small>
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
        </header>

        <div className="saved-sheet-book__page-1-grid">
          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Identity</span>
              <strong>{pageOneSummary.headline}</strong>
            </header>
            <div className="saved-sheet-book__overview-grid">
              {[
                ["Class", pageOneSummary.classLabel],
                ["Subclass", pageOneSummary.subclassLabel],
                ["Species", pageOneSummary.speciesLabel],
                ["Background", pageOneSummary.backgroundLabel],
              ].map(([label, value]) => (
                <div key={label} className="saved-sheet-book__field-card">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Combat Snapshot</span>
              <strong>{pageOneSummary.hitPoints} HP</strong>
            </header>
            <div className="saved-sheet-book__metric-grid">
              {combatMetrics.map(([label, value]) => (
                <div key={label} className="saved-sheet-book__metric">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="saved-sheet-book__subsection">
              <span className="saved-sheet-book__subheading">Play State</span>
              <div className="saved-sheet-book__metric-grid">
                {playStateMetrics.map(([label, value]) => (
                  <div key={label} className="saved-sheet-book__metric">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
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
                  <div key={resource.id} className="saved-sheet-book__resource-row">
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
                    <span>{resource.current}/{resource.max}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No bounded resource rows are configured yet.</p>
            )}
          </article>
        </div>

        <article className="saved-sheet-book__preview-shell">
          <header className="saved-sheet-book__preview-header">
            <div className="saved-sheet-book__preview-copy">
              <span>Reference Sheet</span>
              <strong>Page 1 Preview</strong>
            </div>
            <small>The original core sheet remains the main page-one visual while the saved-sheet route grows page-specific editing around it.</small>
          </header>
          <SheetPreview character={previewCharacter} derived={derived} onOpenReference={onOpenReference} />
        </article>
      </section>

      <section className="saved-sheet-book__page saved-sheet-book__page--page-2" id="saved-sheet-book-page-2">
        <header className="saved-sheet-book__page-header">
          <div className="saved-sheet-book__page-copy">
            <span>Page 2</span>
            <strong>Spells & Notes</strong>
            <p>This shell still reserves the second page for spellbook-heavy play, and edit mode already previews bounded field changes here.</p>
          </div>
          <div className="saved-sheet-book__page-meta">
            <span>{isEditing ? "Previewing draft" : "Scaffolded"}</span>
            <small>{isEditing ? "Unsaved page-profile and resource edits already flow through this summary." : "Full spell table, inspector, and rest controls land in the next slices."}</small>
          </div>
        </header>

        <div className="saved-sheet-book__shell-grid">
          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Spellbook Snapshot</span>
              <strong>{pageTwoSummary.knownSpellCount} known</strong>
            </header>
            <div className="saved-sheet-book__metric-grid">
              {[
                ["Prepared", `${pageTwoSummary.preparedSpellCount}`],
                ["Cantrips", `${pageTwoSummary.cantripCount}`],
                ["Leveled", `${pageTwoSummary.leveledSpellCount}`],
                ["Slots", pageTwoSummary.slotSummary],
              ].map(([label, value]) => (
                <div key={label} className="saved-sheet-book__metric">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="saved-sheet-book__subsection">
              <span className="saved-sheet-book__subheading">Known Spells</span>
              {spellPreviewEntries.length > 0 ? (
                <div className="saved-sheet-book__chip-list">
                  {spellPreviewEntries.map((spell) => (
                    <button key={spell.id} className="chip" onClick={() => onOpenReference?.(spell.id)} type="button">
                      {spell.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted-copy">No spells are currently tracked on this character.</p>
              )}
            </div>
          </article>

          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Field Profile</span>
              <strong>{isEditing ? "Draft values" : "Saved page-two fields"}</strong>
            </header>
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
          </article>

          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Tracked Resources</span>
              <strong>{pageTwoSummary.trackedResources.length} configured</strong>
            </header>
            {pageTwoSummary.trackedResources.length > 0 ? (
              <div className="saved-sheet-book__resource-list">
                {pageTwoSummary.trackedResources.map((resource) => (
                  <div key={resource.id} className="saved-sheet-book__resource-row">
                    <div>
                      <strong>{resource.label}</strong>
                      <small>{formatResourceMeta(resource)}</small>
                    </div>
                    <span>{resource.current}/{resource.max}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No bounded resource rows are configured yet. Rest controls and charge toggles land in the next slice.</p>
            )}
          </article>

          <article className="saved-sheet-book__panel">
            <header className="saved-sheet-book__panel-header">
              <span>Page 2 Focus</span>
              <strong>Next layout passes</strong>
            </header>
            <ul className="instruction-list">
              <li>Convert this spell snapshot into the final table with level, range, casting time, save type, duration, and concentration columns.</li>
              <li>Replace the placeholder spell summary panel with the final spell inspector that can reveal source-aware descriptions without bloating character saves.</li>
              <li>Add short-rest and long-rest controls plus checkbox-based charge rows without pretending to automate every 2024 class rule yet.</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
