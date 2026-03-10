import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  buildTrackedResourcesForCharacter,
  AUTOMATED_FIGHTER_SECOND_WIND_ID,
  AUTOMATED_PALADIN_LAY_ON_HANDS_ID,
  AUTOMATED_RANGER_TIRELESS_ID,
  normalizeSheetProfile,
  normalizeTrackedResources,
  updateTrackedResourceCurrent,
} from "../../shared/sheetTracking";
import type { CharacterRecord, CurrencyWallet, DerivedSheetState, TrackedResource } from "../../shared/types";
import {
  applySavedSheetHitDiceSpend,
  applySavedSheetLayOnHandsHealing,
  applySavedSheetMagicalCunning,
  SAVED_SHEET_PAGES,
  applySavedSheetRest,
  applySavedSheetSecondWindHealing,
  applySavedSheetTirelessTempHitPoints,
  applySavedSheetSorcerousRestoration,
  applySavedSheetSpellSlotRecovery,
  applySavedSheetTrackedResourceDelta,
  buildSavedSheetSpellInspectorNavigation,
  buildSavedSheetHitDiceSummary,
  buildSavedSheetSpellcastingHeader,
  buildSavedSheetSpellSlotRows,
  buildSavedSheetSpellTableRows,
  buildSavedSheetPageTwoSummary,
  buildSavedSheetTrackedResourceSections,
  filterSavedSheetSpellTableRows,
  buildSavedSheetRecoveryActions,
  canTakeSavedSheetRest,
  createSavedSheetEditorDraft,
  createSavedSheetTrackedResource,
  getSavedSheetDefaultSpellId,
  parseSavedSheetLanguages,
  updateSavedSheetPactSlotsRemaining,
  updateSavedSheetSpellSlotsRemaining,
  type SavedSheetSpellBrowseMode,
  type SavedSheetRestKind,
  type SavedSheetEditorDraft,
  type SavedSheetPageId,
  type SavedSheetRecoveryAction,
} from "../lib/savedSheetBook";
import { SheetPreview } from "./SheetPreview";

interface SavedSheetBookProps {
  character: CharacterRecord;
  derived: DerivedSheetState;
  onOpenReference?: (slug: string) => void;
  onSaveCharacter?: (nextCharacter: CharacterRecord, successMessage: string) => Promise<void>;
  pageOneActions?: ReactNode;
  routeStatus?: string;
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

function clampPositiveInteger(value: string, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : Math.max(1, parsed);
}

function formatResourceMeta(resource: TrackedResource) {
  const display = resource.display === "checkboxes" ? "Checkboxes" : "Counter";
  const recovery =
    resource.recovery === "shortRest" ? "Short Rest" : resource.recovery === "longRest" ? "Long Rest" : "Manual";
  const recoveryLabel = resource.recovery === "shortRestOne" ? "Short Rest +1 / Long Rest full" : recovery;
  return `${display} | ${recoveryLabel}`;
}

function parseSpellSlotIndex(rowId: string) {
  if (!rowId.startsWith("spell-slot-")) {
    return null;
  }

  const slotLevel = Number.parseInt(rowId.replace("spell-slot-", ""), 10);
  return Number.isNaN(slotLevel) || slotLevel <= 0 ? null : slotLevel - 1;
}

function formatPendingSpellSlotRecovery(pendingSpellSlotRecovery: number[]) {
  const parts = pendingSpellSlotRecovery.flatMap((quantity, index) =>
    quantity > 0 ? [`L${index + 1} x${quantity}`] : [],
  );

  return parts.join(", ");
}

function supportsBulkTrackedResourceAdjustment(resource: TrackedResource) {
  return resource.display === "counter" && resource.max >= 5;
}

function supportsLayOnHandsHealing(resource: TrackedResource) {
  return resource.display === "counter" && resource.id === AUTOMATED_PALADIN_LAY_ON_HANDS_ID;
}

function supportsSecondWindHealing(resource: TrackedResource) {
  return resource.display === "counter" && resource.id === AUTOMATED_FIGHTER_SECOND_WIND_ID;
}

function supportsTirelessTempHitPoints(resource: TrackedResource) {
  return resource.display === "counter" && resource.id === AUTOMATED_RANGER_TIRELESS_ID;
}

export function SavedSheetBook({
  character,
  derived,
  onOpenReference,
  onSaveCharacter,
  pageOneActions,
  routeStatus,
}: SavedSheetBookProps) {
  const [activePage, setActivePage] = useState<SavedSheetPageId>("page-1");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorStatus, setEditorStatus] = useState("Use Edit Sheet to add bounded profile fields and tracked resources directly on the saved-sheet route.");
  const [playStateStatus, setPlayStateStatus] = useState("Use the live controls here for at-table play state, then apply short or long rests when the character qualifies.");
  const [isSavingPlayState, setIsSavingPlayState] = useState(false);
  const [draft, setDraft] = useState<SavedSheetEditorDraft>(() => createSavedSheetEditorDraft(character));
  const [languagesInput, setLanguagesInput] = useState(() => createSavedSheetEditorDraft(character).sheetProfile.languages.join(", "));
  const [resourceAdjustmentDrafts, setResourceAdjustmentDrafts] = useState<Record<string, string>>({});
  const [hitDiceAdjustmentDraft, setHitDiceAdjustmentDraft] = useState("1");
  const [activeSpellSlotRecoveryId, setActiveSpellSlotRecoveryId] = useState<string | null>(null);
  const [pendingSpellSlotRecovery, setPendingSpellSlotRecovery] = useState<number[]>([]);
  const [spellSearchQuery, setSpellSearchQuery] = useState("");
  const [spellBrowseMode, setSpellBrowseMode] = useState<SavedSheetSpellBrowseMode>("all");
  const [showReadyTrackedResources, setShowReadyTrackedResources] = useState(() =>
    buildTrackedResourcesForCharacter(character, undefined, derived.abilityModifiers).every(
      (resource) => resource.current >= resource.max,
    ),
  );

  const previewCharacter = isEditing
    ? {
        ...character,
        sheetProfile: draft.sheetProfile,
        trackedResources: buildTrackedResourcesForCharacter(character, draft.trackedResources, derived.abilityModifiers),
      }
    : character;
  const trackedResources = buildTrackedResourcesForCharacter(character, undefined, derived.abilityModifiers);
  const pageTwoSummary = buildSavedSheetPageTwoSummary(previewCharacter, derived);
  const livePageTwoSummary = buildSavedSheetPageTwoSummary(character, derived);
  const trackedResourceSections = buildSavedSheetTrackedResourceSections(livePageTwoSummary.trackedResources);
  const attentionTrackedResources = trackedResourceSections.needsAttention;
  const readyTrackedResources = trackedResourceSections.ready;
  const spellcastingHeader = buildSavedSheetSpellcastingHeader(derived);
  const spellSlotRows = buildSavedSheetSpellSlotRows(derived);
  const spellRows = buildSavedSheetSpellTableRows(derived);
  const filteredSpellRows = filterSavedSheetSpellTableRows(spellRows, {
    query: spellSearchQuery,
    mode: spellBrowseMode,
  });
  const recoveryActions = buildSavedSheetRecoveryActions(character, derived);
  const readyRecoveryActions = recoveryActions.filter((action) => action.disabledReason === null);
  const blockedRecoveryActions = recoveryActions.filter((action) => action.disabledReason !== null);
  const hitDiceSummary = buildSavedSheetHitDiceSummary(character, derived);
  const defaultSpellId = getSavedSheetDefaultSpellId(spellRows);
  const filteredDefaultSpellId = getSavedSheetDefaultSpellId(filteredSpellRows);
  const [previewedSpellId, setPreviewedSpellId] = useState<string | null>(() => defaultSpellId);
  const [pinnedSpellId, setPinnedSpellId] = useState<string | null>(null);
  const visiblePinnedSpellId = filteredSpellRows.some((spell) => spell.id === pinnedSpellId) ? pinnedSpellId : null;
  const visiblePreviewedSpellId = filteredSpellRows.some((spell) => spell.id === previewedSpellId) ? previewedSpellId : null;
  const inspectedSpellId = visiblePinnedSpellId ?? visiblePreviewedSpellId ?? filteredDefaultSpellId;
  const inspectedSpell = filteredSpellRows.find((spell) => spell.id === inspectedSpellId) ?? null;
  const spellInspectorNavigation = buildSavedSheetSpellInspectorNavigation(filteredSpellRows, inspectedSpellId);
  const canRest = canTakeSavedSheetRest(character);
  const activeSpellSlotRecovery = recoveryActions.find(
    (action): action is Extract<SavedSheetRecoveryAction, { kind: "spellSlots" }> =>
      action.kind === "spellSlots" && action.resourceId === activeSpellSlotRecoveryId,
  ) ?? null;
  const pendingSpellSlotRecoveryLevelTotal = pendingSpellSlotRecovery.reduce(
    (total, quantity, index) => total + quantity * (index + 1),
    0,
  );
  const pendingSpellSlotRecoverySummary = formatPendingSpellSlotRecovery(pendingSpellSlotRecovery);
  const recoveryOverviewButtonLabel = activeSpellSlotRecovery ? "Continue Recovery on Page 2" : "Open Page 2 Recovery";
  const recoveryOverviewStatus =
    activeSpellSlotRecovery !== null
      ? `Recovery selection is in progress for ${activeSpellSlotRecovery.label}.`
      : readyRecoveryActions.length > 0
        ? `${readyRecoveryActions.length} recovery action${readyRecoveryActions.length === 1 ? "" : "s"} ready on page 2.`
        : `${blockedRecoveryActions.length} tracked recovery action${blockedRecoveryActions.length === 1 ? "" : "s"}, but none are ready right now.`;

  useEffect(() => {
    setActivePage("page-1");
    setIsEditing(false);
    setIsSaving(false);
    setEditorStatus("Use Edit Sheet to add bounded profile fields and tracked resources directly on the saved-sheet route.");
    setPlayStateStatus("Use the live controls here for at-table play state, then apply short or long rests when the character qualifies.");
    setIsSavingPlayState(false);
    setPreviewedSpellId(defaultSpellId);
    setPinnedSpellId(null);
    setResourceAdjustmentDrafts({});
    setHitDiceAdjustmentDraft("1");
    setActiveSpellSlotRecoveryId(null);
    setPendingSpellSlotRecovery([]);
    setSpellSearchQuery("");
    setSpellBrowseMode("all");
    setShowReadyTrackedResources(attentionTrackedResources.length === 0);
  }, [attentionTrackedResources.length, character.id, defaultSpellId]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const nextDraft = createSavedSheetEditorDraft(character);
    setDraft(nextDraft);
    setLanguagesInput(nextDraft.sheetProfile.languages.join(", "));
  }, [character, isEditing]);

  useEffect(() => {
    if (!activeSpellSlotRecoveryId) {
      return;
    }

    if (!activeSpellSlotRecovery) {
      setActiveSpellSlotRecoveryId(null);
      setPendingSpellSlotRecovery([]);
    }
  }, [activeSpellSlotRecovery, activeSpellSlotRecoveryId]);

  useEffect(() => {
    if (attentionTrackedResources.length === 0) {
      setShowReadyTrackedResources(true);
    }
  }, [attentionTrackedResources.length]);

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
          trackedResources: buildTrackedResourcesForCharacter(character, trackedResources, derived.abilityModifiers),
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
      return false;
    }

    setIsSavingPlayState(true);
    setPlayStateStatus("Saving play state...");

    try {
      await onSaveCharacter(nextCharacter, successMessage);
      setPlayStateStatus(successMessage);
      return true;
    } catch (error: unknown) {
      setPlayStateStatus(error instanceof Error ? error.message : "Failed to save play state.");
      return false;
    } finally {
      setIsSavingPlayState(false);
    }
  }

  function resetActiveSpellSlotRecovery() {
    setActiveSpellSlotRecoveryId(null);
    setPendingSpellSlotRecovery([]);
  }

  function startSpellSlotRecovery(resourceId: string) {
    setActiveSpellSlotRecoveryId(resourceId);
    setPendingSpellSlotRecovery(Array.from({ length: derived.spellcasting.spellSlotsMax.length }, () => 0));
  }

  function updatePendingSlotRecovery(slotIndex: number, delta: 1 | -1) {
    setPendingSpellSlotRecovery((current) => current.map((quantity, index) => (
      index === slotIndex ? Math.max(0, quantity + delta) : quantity
    )));
  }

  function setResourceAdjustment(resourceId: string, nextValue: string) {
    setResourceAdjustmentDrafts((current) => ({
      ...current,
      [resourceId]: nextValue,
    }));
  }

  function getResourceAdjustment(resourceId: string) {
    return clampPositiveInteger(resourceAdjustmentDrafts[resourceId] ?? "1", 1);
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

  async function handleHitDiceAction(mode: "spendOnly" | "averageHeal") {
    const requestedAmount = clampPositiveInteger(hitDiceAdjustmentDraft, 1);
    const nextCharacter = applySavedSheetHitDiceSpend(character, derived, requestedAmount, mode);

    if (nextCharacter === character) {
      return;
    }

    const spentAmount = nextCharacter.hitDiceSpent - character.hitDiceSpent;
    const healedAmount = nextCharacter.currentHitPoints - character.currentHitPoints;
    const successMessage = mode === "averageHeal"
      ? `Spent ${spentAmount} Hit Dice and healed ${healedAmount} HP using average healing.`
      : `Spent ${spentAmount} Hit Dice.`;

    await savePlayState(nextCharacter, successMessage);
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
    const resource = trackedResources.find((entry) => entry.id === resourceId);

    if (!resource) {
      return;
    }

    void savePlayState(
      {
        ...character,
        trackedResources: updateTrackedResourceCurrent(trackedResources, resourceId, nextCurrent),
      },
      `Updated ${resource.label}.`,
    );
  }

  function handleTrackedResourceDelta(resource: TrackedResource, delta: number) {
    const nextCharacter = applySavedSheetTrackedResourceDelta(character, derived, resource.id, delta);

    if (nextCharacter === character) {
      return;
    }

    const amount = Math.abs(delta);
    const successMessage = delta < 0
      ? `Spent ${amount} from ${resource.label}.`
      : `Restored ${amount} to ${resource.label}.`;

    void savePlayState(nextCharacter, successMessage);
  }

  function handleLayOnHandsHealing(resource: TrackedResource) {
    const requestedAmount = getResourceAdjustment(resource.id);
    const nextCharacter = applySavedSheetLayOnHandsHealing(character, derived, requestedAmount);

    if (nextCharacter === character) {
      return;
    }

    const healedAmount = nextCharacter.currentHitPoints - character.currentHitPoints;

    void savePlayState(nextCharacter, `Restored ${healedAmount} HP with Lay on Hands.`);
  }

  function handleSecondWindHealing() {
    const nextCharacter = applySavedSheetSecondWindHealing(character, derived);

    if (nextCharacter === character) {
      return;
    }

    const healedAmount = nextCharacter.currentHitPoints - character.currentHitPoints;

    void savePlayState(nextCharacter, `Restored ${healedAmount} HP with Second Wind using average healing.`);
  }

  function handleTirelessTempHitPoints() {
    const nextCharacter = applySavedSheetTirelessTempHitPoints(character, derived);

    if (nextCharacter === character) {
      return;
    }

    void savePlayState(nextCharacter, `Set temporary HP to ${nextCharacter.tempHitPoints} with Tireless using average healing.`);
  }

  function handleSpellSlotRemainingChange(slotIndex: number, nextRemaining: number) {
    void savePlayState(
      updateSavedSheetSpellSlotsRemaining(character, derived, slotIndex, nextRemaining),
      "Saved spell slot tracking.",
    );
  }

  function handlePactSlotsRemainingChange(nextRemaining: number) {
    void savePlayState(
      updateSavedSheetPactSlotsRemaining(character, derived, nextRemaining),
      "Saved spell slot tracking.",
    );
  }

  async function handleRecoveryAction(action: SavedSheetRecoveryAction) {
    if (action.kind === "spellSlots") {
      if (activeSpellSlotRecoveryId === action.resourceId) {
        return;
      }

      startSpellSlotRecovery(action.resourceId);
      setPlayStateStatus(`Select spell slots to recover with ${action.label}, then apply the recovery.`);
      return;
    }

    const nextCharacter =
      action.kind === "pactSlots"
        ? applySavedSheetMagicalCunning(character, derived)
        : applySavedSheetSorcerousRestoration(character, derived);
    const successMessage =
      action.kind === "pactSlots"
        ? "Recovered Pact Magic slots with Magical Cunning."
        : `Recovered ${action.recoverAmount} ${action.targetLabel} with Sorcerous Restoration.`;

    if (nextCharacter === character) {
      return;
    }

    await savePlayState(nextCharacter, successMessage);
  }

  async function handleApplySpellSlotRecovery() {
    if (!activeSpellSlotRecovery) {
      return;
    }

    const nextCharacter = applySavedSheetSpellSlotRecovery(
      character,
      derived,
      activeSpellSlotRecovery.resourceId,
      pendingSpellSlotRecovery,
    );

    if (nextCharacter === character) {
      return;
    }

    const saved = await savePlayState(nextCharacter, `Recovered spell slots with ${activeSpellSlotRecovery.label}.`);

    if (saved) {
      resetActiveSpellSlotRecovery();
    }
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

  function navigateToSpell(spellId: string | null) {
    if (!spellId) {
      return;
    }

    setPreviewedSpellId(spellId);
    setPinnedSpellId(spellId);
  }

  function renderInteractiveTrackedResourceRow(resource: TrackedResource) {
    return (
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
              Use
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
              +1
            </button>
            {supportsBulkTrackedResourceAdjustment(resource) ? (
              <div className="saved-sheet-book__resource-adjuster">
                <label className="saved-sheet-book__resource-adjuster-field">
                  <span>Amount</span>
                  <input
                    aria-label={`${resource.label} amount`}
                    min={1}
                    onChange={(event) => setResourceAdjustment(resource.id, event.target.value)}
                    type="number"
                    value={resourceAdjustmentDrafts[resource.id] ?? "1"}
                  />
                </label>
                <button
                  className="inline-link-button"
                  disabled={isSavingPlayState || getResourceAdjustment(resource.id) > resource.current}
                  onClick={() => handleTrackedResourceDelta(resource, -getResourceAdjustment(resource.id))}
                  type="button"
                >
                  Spend
                </button>
                <button
                  className="inline-link-button"
                  disabled={isSavingPlayState || resource.current + getResourceAdjustment(resource.id) > resource.max}
                  onClick={() => handleTrackedResourceDelta(resource, getResourceAdjustment(resource.id))}
                  type="button"
                >
                  Restore
                </button>
                {supportsLayOnHandsHealing(resource) ? (
                  <button
                    className="inline-link-button"
                    disabled={
                      isSavingPlayState ||
                      character.currentHitPoints >= derived.hitPointsMax ||
                      getResourceAdjustment(resource.id) > resource.current ||
                      getResourceAdjustment(resource.id) > derived.hitPointsMax - character.currentHitPoints
                    }
                    onClick={() => handleLayOnHandsHealing(resource)}
                    type="button"
                  >
                    Heal HP
                  </button>
                ) : null}
              </div>
            ) : null}
            {supportsSecondWindHealing(resource) ? (
              <button
                className="inline-link-button"
                disabled={isSavingPlayState || resource.current <= 0 || character.currentHitPoints >= derived.hitPointsMax}
                onClick={handleSecondWindHealing}
                type="button"
              >
                Average Heal
              </button>
            ) : null}
            {supportsTirelessTempHitPoints(resource) ? (
              <button
                className="inline-link-button"
                disabled={isSavingPlayState || resource.current <= 0 || character.tempHitPoints >= Math.max(1, 5 + derived.abilityModifiers.wisdom)}
                onClick={handleTirelessTempHitPoints}
                type="button"
              >
                Average Temp HP
              </button>
            ) : null}
          </div>
        )}
        {supportsLayOnHandsHealing(resource) ? (
          <small className="saved-sheet-book__resource-action-note">
            Heal HP applies only direct self-healing here. Poisoned removal and other target-side effects stay manual.
          </small>
        ) : supportsSecondWindHealing(resource) ? (
          <small className="saved-sheet-book__resource-action-note">
            Average Heal applies Second Wind self-healing only. Tactical Mind and Tactical Shift stay manual.
          </small>
        ) : supportsTirelessTempHitPoints(resource) ? (
          <small className="saved-sheet-book__resource-action-note">
            Average Temp HP applies only the Tireless temporary HP gain. Exhaustion reduction stays manual.
          </small>
        ) : null}
      </div>
    );
  }

  const worksheetFooter = (
    <div className="saved-sheet-book__worksheet-footer">
      <article className="saved-sheet-book__panel">
        <header className="saved-sheet-book__panel-header">
          <span>Play State &amp; Rest</span>
          <strong>{isSavingPlayState ? "Saving..." : "Live"}</strong>
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
          resources. Hit Dice can be spent directly here; use Average Heal as a fast shortcut, or roll at the table
          and update HP manually if you want the exact die result.
        </p>
        <p className="muted-copy">{playStateStatus}</p>
        {recoveryActions.length > 0 ? (
          <div className="saved-sheet-book__recovery-overview">
            <div className="saved-sheet-book__recovery-overview-copy">
              <strong>Recovery Highlights</strong>
              <small>{recoveryOverviewStatus}</small>
              {activeSpellSlotRecovery ? (
                <small>
                  Pending: {pendingSpellSlotRecoverySummary || "none selected"} ({pendingSpellSlotRecoveryLevelTotal}/
                  {activeSpellSlotRecovery.slotBudget} slot levels)
                </small>
              ) : blockedRecoveryActions.length > 0 && readyRecoveryActions.length === 0 ? (
                <small>
                  {blockedRecoveryActions[0]?.label}: {blockedRecoveryActions[0]?.disabledReason}
                </small>
              ) : null}
            </div>
            <div className="saved-sheet-book__chip-list">
              {readyRecoveryActions.map((action) => (
                <span
                  key={action.resourceId}
                  className="saved-sheet-book__resource-summary-pill saved-sheet-book__resource-summary-pill--attention"
                >
                  {action.label}
                </span>
              ))}
              {blockedRecoveryActions.length > 0 && readyRecoveryActions.length === 0 ? (
                blockedRecoveryActions.map((action) => (
                  <span key={action.resourceId} className="saved-sheet-book__resource-summary-pill">
                    {action.label}
                  </span>
                ))
              ) : null}
            </div>
            <button className="inline-link-button" onClick={() => selectPage("page-2")} type="button">
              {recoveryOverviewButtonLabel}
            </button>
          </div>
        ) : null}
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
        <div className="saved-sheet-book__hit-dice-actions">
          <div className="saved-sheet-book__hit-dice-copy">
            <strong>Hit Dice Actions</strong>
            <small>
              {hitDiceSummary.available}/{hitDiceSummary.max} available • {hitDiceSummary.hitDieLabel} • Average{" "}
              {hitDiceSummary.averageHealingPerDie} HP per die
            </small>
            <small>Spend Only keeps healing manual. Average Heal applies a bounded average shortcut and still respects max HP.</small>
          </div>
          <label className="saved-sheet-book__resource-adjuster-field">
            <span>Amount</span>
            <input
              aria-label="Hit Dice amount"
              max={Math.max(1, hitDiceSummary.available)}
              min={1}
              onChange={(event) => setHitDiceAdjustmentDraft(event.target.value)}
              type="number"
              value={hitDiceAdjustmentDraft}
            />
          </label>
          <button
            className="inline-link-button"
            disabled={isSavingPlayState || hitDiceSummary.available <= 0 || clampPositiveInteger(hitDiceAdjustmentDraft, 1) > hitDiceSummary.available}
            onClick={() => void handleHitDiceAction("spendOnly")}
            type="button"
          >
            Spend Only
          </button>
          <button
            className="inline-link-button"
            disabled={
              isSavingPlayState ||
              hitDiceSummary.available <= 0 ||
              character.currentHitPoints >= derived.hitPointsMax ||
              clampPositiveInteger(hitDiceAdjustmentDraft, 1) > hitDiceSummary.available
            }
            onClick={() => void handleHitDiceAction("averageHeal")}
            type="button"
          >
            Average Heal
          </button>
        </div>
      </article>

      <article className="saved-sheet-book__panel">
        <header className="saved-sheet-book__panel-header">
          <span>Tracked Resources</span>
          <strong>{livePageTwoSummary.trackedResources.length} configured</strong>
        </header>
        {isEditing ? (
          <p className="muted-copy">
            Live resource rows stay wired to the saved character while worksheet setup edits remain in draft until you
            save them below.
          </p>
        ) : null}
        {livePageTwoSummary.trackedResources.length > 0 ? (
          <div className="saved-sheet-book__resource-sections">
            <div className="saved-sheet-book__resource-summary">
              <span
                className={`saved-sheet-book__resource-summary-pill ${attentionTrackedResources.length > 0 ? "saved-sheet-book__resource-summary-pill--attention" : ""}`.trim()}
              >
                Needs Attention {attentionTrackedResources.length}
              </span>
              <span className="saved-sheet-book__resource-summary-pill">Ready {readyTrackedResources.length}</span>
              {attentionTrackedResources.length > 0 && readyTrackedResources.length > 0 ? (
                <button
                  className="inline-link-button"
                  onClick={() => setShowReadyTrackedResources((current) => !current)}
                  type="button"
                >
                  {showReadyTrackedResources
                    ? `Hide Ready Resources (${readyTrackedResources.length})`
                    : `Show Ready Resources (${readyTrackedResources.length})`}
                </button>
              ) : null}
            </div>
            {attentionTrackedResources.length > 0 ? (
              <section className="saved-sheet-book__resource-section">
                <header className="saved-sheet-book__resource-section-header">
                  <strong>Needs Attention</strong>
                  <small>Spent, partially used, or otherwise not at full capacity.</small>
                </header>
                <div className="saved-sheet-book__resource-list">
                  {attentionTrackedResources.map((resource) => renderInteractiveTrackedResourceRow(resource))}
                </div>
              </section>
            ) : null}
            {readyTrackedResources.length > 0 && (showReadyTrackedResources || attentionTrackedResources.length === 0) ? (
              <section className="saved-sheet-book__resource-section">
                <header className="saved-sheet-book__resource-section-header">
                  <strong>Ready Resources</strong>
                  <small>Currently full or unused and available when the table needs them.</small>
                </header>
                <div className="saved-sheet-book__resource-list">
                  {readyTrackedResources.map((resource) => renderInteractiveTrackedResourceRow(resource))}
                </div>
              </section>
            ) : attentionTrackedResources.length > 0 && readyTrackedResources.length > 0 ? (
              <p className="muted-copy">Ready resources are collapsed while attention items are present.</p>
            ) : null}
          </div>
        ) : (
          <p className="muted-copy">No bounded resource rows are configured yet.</p>
        )}
      </article>
    </div>
  );

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
        <header className="saved-sheet-book__page-header saved-sheet-book__page-header--compact">
          <div className="saved-sheet-book__page-copy">
            <span>Page 1</span>
            <strong>Character Worksheet</strong>
          </div>
        </header>
        {pageOneActions || routeStatus ? (
          <div className="saved-sheet-book__route-toolbar">
            {pageOneActions ? <div className="action-row saved-sheet-book__page-action-row">{pageOneActions}</div> : null}
            {routeStatus ? <small>{routeStatus}</small> : null}
          </div>
        ) : null}

        <article className="saved-sheet-book__preview-shell saved-sheet-book__preview-shell--primary">
          <SheetPreview
            character={previewCharacter}
            derived={derived}
            onOpenReference={onOpenReference}
            worksheetFooter={worksheetFooter}
          />
        </article>

        <div className="saved-sheet-book__page-one-support">
          <article className="saved-sheet-book__panel saved-sheet-book__panel--wide">
            <header className="saved-sheet-book__panel-header">
              <span>Field Notebook</span>
              <strong>{isEditing ? "Editing" : "Saved profile"}</strong>
            </header>
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
            <p className="muted-copy">{editorStatus}</p>
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

          {isEditing ? (
            <article className="saved-sheet-book__panel saved-sheet-book__panel--wide">
              <header className="saved-sheet-book__panel-header">
                <span>Resource Setup</span>
                <strong>{draft.trackedResources.length} draft row{draft.trackedResources.length === 1 ? "" : "s"}</strong>
              </header>
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
                            recovery:
                              event.target.value === "shortRest" ||
                              event.target.value === "longRest" ||
                              event.target.value === "shortRestOne"
                                ? event.target.value
                                : "manual",
                          }))}
                          value={resource.recovery}
                        >
                          <option value="manual">Manual</option>
                          <option value="shortRest">Short Rest</option>
                          <option value="shortRestOne">+1 Short Rest / Full Long Rest</option>
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
                <p className="muted-copy">
                  Supported class-driven resources are added automatically on the live sheet when the character qualifies.
                </p>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="saved-sheet-book__page saved-sheet-book__page--page-2" id="saved-sheet-book-page-2">
        <header className="saved-sheet-book__page-header saved-sheet-book__page-header--compact">
          <div className="saved-sheet-book__page-copy">
            <span>Page 2</span>
            <strong>Spellbook Worksheet</strong>
          </div>
          <div className="saved-sheet-book__page-meta">
            <span>{isEditing ? "Previewing draft" : "Live now"}</span>
            <small>
              {isEditing
                ? "Unsaved notebook edits already flow through the spellbook summary while spell hover and pin behavior stays active."
                : "Hover or focus a spell to preview it. Click a row to pin it in the inspector."}
            </small>
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

                    {spellSlotRows.map((row, index) => {
                      const rowSlotIndex = parseSpellSlotIndex(row.id);
                      const pendingRecovery = rowSlotIndex === null ? 0 : pendingSpellSlotRecovery[rowSlotIndex] ?? 0;
                      const slotLevel = rowSlotIndex === null ? null : rowSlotIndex + 1;
                      const canUseSlotRecoveryControls =
                        activeSpellSlotRecovery !== null &&
                        rowSlotIndex !== null &&
                        slotLevel !== null &&
                        slotLevel <= activeSpellSlotRecovery.maxRecoverableSlotLevel;
                      const expendedRecoverableSlots = row.total - row.remaining - pendingRecovery;
                      const canAddRecovery =
                        canUseSlotRecoveryControls &&
                        activeSpellSlotRecovery !== null &&
                        slotLevel !== null &&
                        expendedRecoverableSlots > 0 &&
                        pendingSpellSlotRecoveryLevelTotal + slotLevel <= activeSpellSlotRecovery.slotBudget;
                      const canRemoveRecovery = canUseSlotRecoveryControls && pendingRecovery > 0;

                      return (
                        <div key={row.id} className="saved-sheet-book__slot-ledger-row">
                          <span className="saved-sheet-book__slot-ledger-cell" data-label="Level">{row.levelLabel}</span>
                          <span className="saved-sheet-book__slot-ledger-cell" data-label="Total">{row.total}</span>
                          <span className="saved-sheet-book__slot-ledger-cell" data-label="Expended">{row.expended}</span>
                          <span className="saved-sheet-book__slot-ledger-cell saved-sheet-book__slot-ledger-cell--remaining" data-label="Remaining">
                            <strong>{row.remaining}</strong>
                            <div className="saved-sheet-book__slot-controls">
                              <button
                                className="inline-link-button"
                                disabled={isSavingPlayState || activeSpellSlotRecovery !== null || row.remaining <= 0}
                                onClick={() => (
                                  row.id === "pact-slots"
                                    ? handlePactSlotsRemainingChange(row.remaining - 1)
                                    : handleSpellSlotRemainingChange(index, row.remaining - 1)
                                )}
                                type="button"
                              >
                                Use
                              </button>
                              <button
                                className="inline-link-button"
                                disabled={isSavingPlayState || activeSpellSlotRecovery !== null || row.remaining >= row.total}
                                onClick={() => (
                                  row.id === "pact-slots"
                                    ? handlePactSlotsRemainingChange(row.remaining + 1)
                                    : handleSpellSlotRemainingChange(index, row.remaining + 1)
                                )}
                                type="button"
                              >
                                +1
                              </button>
                            </div>
                            {canUseSlotRecoveryControls ? (
                              <div className="saved-sheet-book__slot-recovery-controls">
                                <button
                                  className="inline-link-button"
                                  disabled={isSavingPlayState || !canRemoveRecovery}
                                  onClick={() => rowSlotIndex !== null && updatePendingSlotRecovery(rowSlotIndex, -1)}
                                  type="button"
                                >
                                  Undo
                                </button>
                                <button
                                  className="inline-link-button"
                                  disabled={isSavingPlayState || !canAddRecovery}
                                  onClick={() => rowSlotIndex !== null && updatePendingSlotRecovery(rowSlotIndex, 1)}
                                  type="button"
                                >
                                  Recover
                                </button>
                              </div>
                            ) : null}
                            {pendingRecovery > 0 ? <small className="saved-sheet-book__slot-recovery-badge">Pending +{pendingRecovery}</small> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted-copy">No spell slots are currently tracked for this character.</p>
                )}
              </div>
              {recoveryActions.length > 0 ? (
                <div className="saved-sheet-book__worksheet-recovery-section">
                  <div className="saved-sheet-book__worksheet-section-heading">
                    <span>Recovery Actions</span>
                    <strong>{readyRecoveryActions.length} ready</strong>
                  </div>
                  <div className="saved-sheet-book__recovery-card-list">
                    {[...readyRecoveryActions, ...blockedRecoveryActions].map((action) => {
                      const isActive = action.kind === "spellSlots" && action.resourceId === activeSpellSlotRecoveryId;
                      const actionBlockedByOtherSelection = activeSpellSlotRecovery !== null && !isActive;
                      const actionDisabled = isSavingPlayState || actionBlockedByOtherSelection || action.disabledReason !== null;
                      const actionSummary =
                        action.kind === "spellSlots"
                          ? `Recover up to ${action.slotBudget} combined slot levels (max level ${action.maxRecoverableSlotLevel}).`
                          : action.kind === "pactSlots"
                            ? `Restore ${action.recoverAmount} expended pact slots.`
                            : `Restore ${action.recoverAmount} ${action.targetLabel}.`;

                      return (
                        <article
                          key={action.resourceId}
                          className={`saved-sheet-book__recovery-card ${isActive ? "saved-sheet-book__recovery-card--active" : ""}`.trim()}
                        >
                          <div className="saved-sheet-book__recovery-card-copy">
                            <strong>{action.label}</strong>
                            <small>{action.usesRemaining}/{action.usesMax} uses remaining</small>
                            <small>{actionSummary}</small>
                            {action.notes ? <small>{action.notes}</small> : null}
                            {isActive ? (
                              <small>
                                Selected: {pendingSpellSlotRecoverySummary || "none"} ({pendingSpellSlotRecoveryLevelTotal}/{action.slotBudget} levels)
                              </small>
                            ) : null}
                            {action.disabledReason ? <small>{action.disabledReason}</small> : null}
                          </div>
                          <div className="saved-sheet-book__recovery-card-actions">
                            {action.kind === "spellSlots" && isActive ? (
                              <>
                                <button
                                  className="action-button"
                                  disabled={isSavingPlayState || pendingSpellSlotRecoveryLevelTotal <= 0}
                                  onClick={() => void handleApplySpellSlotRecovery()}
                                  type="button"
                                >
                                  Apply Recovery
                                </button>
                                <button
                                  className="action-button action-button--secondary"
                                  disabled={isSavingPlayState}
                                  onClick={resetActiveSpellSlotRecovery}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="action-button"
                                disabled={actionDisabled}
                                onClick={() => void handleRecoveryAction(action)}
                                type="button"
                              >
                                {action.kind === "spellSlots"
                                  ? "Start Recovery"
                                  : action.kind === "pactSlots"
                                    ? "Recover Pact Slots"
                                    : `Recover ${action.recoverAmount} ${action.targetLabel}`}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
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
                <strong>{filteredSpellRows.length === spellRows.length ? `${spellRows.length} tracked` : `${filteredSpellRows.length}/${spellRows.length} shown`}</strong>
              </header>
              {spellRows.length > 0 ? (
                <div className="saved-sheet-book__spell-table-panel">
                  <div className="saved-sheet-book__spell-toolbar">
                    <label className="saved-sheet-book__form-field saved-sheet-book__spell-search-field">
                      <span>Search</span>
                      <input
                        aria-label="Spell table search"
                        onChange={(event) => setSpellSearchQuery(event.target.value)}
                        placeholder="Search spells, text, or range"
                        type="text"
                        value={spellSearchQuery}
                      />
                    </label>
                    <div className="saved-sheet-book__spell-filter-row">
                      {([
                        ["all", "All"],
                        ["prepared", "Prepared"],
                        ["cantrips", "Cantrips"],
                        ["leveled", "Leveled"],
                      ] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          className={`saved-sheet-book__worksheet-toggle ${spellBrowseMode === mode ? "saved-sheet-book__worksheet-toggle--active" : ""}`.trim()}
                          onClick={() => setSpellBrowseMode(mode)}
                          type="button"
                        >
                          {label}
                        </button>
                      ))}
                      {(spellSearchQuery || spellBrowseMode !== "all") ? (
                        <button
                          className="inline-link-button"
                          onClick={() => {
                            setSpellSearchQuery("");
                            setSpellBrowseMode("all");
                          }}
                          type="button"
                        >
                          Clear Filters
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {filteredSpellRows.length > 0 ? (
                    <div className="saved-sheet-book__spell-table-shell">
                      <div className="saved-sheet-book__spell-table">
                        <div className="saved-sheet-book__spell-table-head">Level</div>
                        <div className="saved-sheet-book__spell-table-head">Spell Name</div>
                        <div className="saved-sheet-book__spell-table-head">Range</div>
                        <div className="saved-sheet-book__spell-table-head">Save / Attack</div>
                        <div className="saved-sheet-book__spell-table-head">Casting</div>
                        <div className="saved-sheet-book__spell-table-head">Duration</div>
                        <div className="saved-sheet-book__spell-table-head">C</div>

                        {filteredSpellRows.map((spell) => {
                          const isActive = inspectedSpell?.id === spell.id;
                          const isPinned = visiblePinnedSpellId === spell.id;

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
                    <p className="muted-copy">No spells match the current filters. Clear filters to see the full spellbook.</p>
                  )}
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
                  <div className="saved-sheet-book__spell-inspector-toolbar">
                    <div className="saved-sheet-book__spell-inspector-position">
                      {spellInspectorNavigation.currentPosition !== null
                        ? `Showing ${spellInspectorNavigation.currentPosition} of ${spellInspectorNavigation.total} visible spells`
                        : `${spellInspectorNavigation.total} visible spells`}
                    </div>
                    <div className="saved-sheet-book__spell-inspector-nav">
                      <button
                        className="action-button action-button--secondary"
                        disabled={spellInspectorNavigation.previousSpellId === null}
                        onClick={() => navigateToSpell(spellInspectorNavigation.previousSpellId)}
                        type="button"
                      >
                        Previous Spell
                      </button>
                      <button
                        className="action-button action-button--secondary"
                        disabled={spellInspectorNavigation.nextSpellId === null}
                        onClick={() => navigateToSpell(spellInspectorNavigation.nextSpellId)}
                        type="button"
                      >
                        Next Spell
                      </button>
                    </div>
                  </div>
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
              ) : filteredSpellRows.length > 0 ? (
                <p className="muted-copy">Hover, focus, or select a spell row to inspect its text here.</p>
              ) : (
                <p className="muted-copy">No filtered spell is currently selected because the active filters returned no rows.</p>
              )}
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
