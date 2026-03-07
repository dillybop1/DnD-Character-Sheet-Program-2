import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateDerivedState } from "../../shared/calculations";
import {
  getClassTemplate,
  listArmorTemplates,
  listBackgroundTemplates,
  listClassTemplates,
  listSpeciesTemplates,
  listWeaponTemplates,
} from "../../shared/data/reference";
import { listCompendiumSpells, spellRecordFromCompendium } from "../../shared/data/compendiumSeed";
import { ABILITY_NAMES, SKILL_NAMES } from "../../shared/types";
import type {
  AbilityName,
  BuilderInput,
  CharacterRecord,
  CharacterSummary,
  CompendiumEntry,
  HomebrewEntry,
  SkillName,
} from "../../shared/types";
import { CompendiumEntryDetail } from "../components/CompendiumEntryDetail";
import { SectionCard } from "../components/SectionCard";
import { SheetPreview } from "../components/SheetPreview";
import { getArmorReferenceSlug, RULE_REFERENCE_SLUGS } from "../lib/compendiumLinks";
import { dndApi } from "../lib/api";
import { buildPreviewCharacter, builderInputFromCharacter, createDefaultBuilderInput, humanizeLabel } from "../lib/editor";

function readSpellLevel(entry: CompendiumEntry) {
  return typeof entry.payload.level === "number" ? entry.payload.level : 0;
}

function areSameStringArrays(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sanitizeSpellSelections(
  spellIds: string[],
  preparedSpellIds: string[],
  availableSpells: CompendiumEntry[],
) {
  const availableIds = new Set(availableSpells.map((entry) => entry.slug));
  const leveledIds = new Set(availableSpells.filter((entry) => readSpellLevel(entry) > 0).map((entry) => entry.slug));
  const nextSpellIds = spellIds.filter((spellId) => availableIds.has(spellId));
  const nextPreparedSpellIds = preparedSpellIds.filter(
    (spellId) => nextSpellIds.includes(spellId) && leveledIds.has(spellId),
  );

  return {
    spellIds: nextSpellIds,
    preparedSpellIds: nextPreparedSpellIds,
    changed: !areSameStringArrays(spellIds, nextSpellIds) || !areSameStringArrays(preparedSpellIds, nextPreparedSpellIds),
  };
}

function collectGrantedSpellIds(homebrewEntries: HomebrewEntry[]) {
  return Array.from(
    new Set(
      homebrewEntries.flatMap((entry) =>
        entry.effects
          .filter((effect) => effect.type === "grant_spell" && typeof effect.target === "string")
          .map((effect) => effect.target as string),
      ),
    ),
  );
}

function formatSpellSlotSummary(
  spellcasting: ReturnType<typeof calculateDerivedState>["spellcasting"],
) {
  if (spellcasting.slotMode === "pact") {
    if (spellcasting.pactSlotsMax === 0 || spellcasting.pactSlotLevel === null) {
      return "Pact slots pending";
    }

    return `${spellcasting.pactSlotsMax} pact slots at level ${spellcasting.pactSlotLevel}`;
  }

  if (spellcasting.spellSlotsMax.length === 0) {
    return "No class slots";
  }

  return spellcasting.spellSlotsMax.map((value, index) => `L${index + 1}:${value}`).join(" ");
}

export function CharactersPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRecord | null>(null);
  const [draft, setDraft] = useState<BuilderInput>(createDefaultBuilderInput());
  const [homebrewEntries, setHomebrewEntries] = useState<HomebrewEntry[]>([]);
  const [message, setMessage] = useState("Create a new character or select one from the library.");
  const [referenceEntry, setReferenceEntry] = useState<CompendiumEntry | null>(null);
  const [referenceStatus, setReferenceStatus] = useState(
    "Click a class, spell, weapon, armor, or rule label to inspect it here.",
  );
  const [loading, setLoading] = useState(true);

  async function loadCharacters(selectedId?: string | null) {
    const nextCharacters = await dndApi.characters.list();
    setCharacters(nextCharacters);

    const targetId = selectedId ?? nextCharacters[0]?.id ?? null;
    if (!targetId) {
      setSelectedCharacter(null);
      setDraft(createDefaultBuilderInput());
      return;
    }

    const record = await dndApi.characters.get(targetId);
    if (record) {
      setSelectedCharacter(record);
      setDraft(builderInputFromCharacter(record));
    }
  }

  async function loadHomebrew() {
    const entries = await dndApi.homebrew.list();
    setHomebrewEntries(entries);
  }

  useEffect(() => {
    async function bootstrap() {
      await Promise.all([loadCharacters(), loadHomebrew()]);
      setLoading(false);
    }

    bootstrap().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Failed to load local data.");
      setLoading(false);
    });
  }, []);

  const activeHomebrew = homebrewEntries.filter((entry) => draft.homebrewIds.includes(entry.id));
  const previewCharacter = buildPreviewCharacter(draft, selectedCharacter, activeHomebrew);
  const derived = calculateDerivedState(previewCharacter, activeHomebrew);
  const selectedClass = getClassTemplate(draft.classId);
  const availableClasses = listClassTemplates(draft.enabledSourceIds);
  const availableSpecies = listSpeciesTemplates(draft.enabledSourceIds);
  const availableBackgrounds = listBackgroundTemplates(draft.enabledSourceIds);
  const availableArmor = listArmorTemplates(draft.enabledSourceIds);
  const availableWeapons = listWeaponTemplates(draft.enabledSourceIds);
  const classSpellOptions =
    selectedClass.spellcastingAbility === null ? [] : listCompendiumSpells(draft.enabledSourceIds, selectedClass.name);
  const selectedSpellEntries = draft.spellIds
    .map((spellId) => classSpellOptions.find((entry) => entry.slug === spellId))
    .filter((entry): entry is CompendiumEntry => Boolean(entry));
  const selectedCantripEntries = selectedSpellEntries.filter((entry) => readSpellLevel(entry) === 0);
  const selectedLeveledEntries = selectedSpellEntries.filter((entry) => readSpellLevel(entry) > 0);
  const grantedSpellEntries = collectGrantedSpellIds(activeHomebrew)
    .map((spellId) => spellRecordFromCompendium(spellId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const spellbookMessage =
    selectedClass.spellcastingAbility === null
      ? grantedSpellEntries.length > 0
        ? "This class has no native spell list, but homebrew-granted spells still appear on the sheet."
        : "This class does not use a class spell list."
      : classSpellOptions.length === 0
        ? `No starter compendium spells are seeded for ${selectedClass.name} yet.`
        : `Select cantrips and leveled spells from the seeded ${selectedClass.name.toLowerCase()} list.`;

  useEffect(() => {
    setDraft((current) => {
      const currentClass = getClassTemplate(current.classId);
      const currentSpellOptions =
        currentClass.spellcastingAbility === null
          ? []
          : listCompendiumSpells(current.enabledSourceIds, currentClass.name);
      const sanitized = sanitizeSpellSelections(current.spellIds, current.preparedSpellIds, currentSpellOptions);
      return sanitized.changed
        ? {
            ...current,
            spellIds: sanitized.spellIds,
            preparedSpellIds: sanitized.preparedSpellIds,
          }
        : current;
    });
  }, [draft.classId, draft.enabledSourceIds, draft.spellIds, draft.preparedSpellIds]);

  function updateDraft<K extends keyof BuilderInput>(key: K, value: BuilderInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateAbility(ability: AbilityName, value: number) {
    setDraft((current) => ({
      ...current,
      abilities: {
        ...current.abilities,
        [ability]: value,
      },
    }));
  }

  function updateSkill(skill: SkillName, value: BuilderInput["skillProficiencies"][SkillName]) {
    setDraft((current) => ({
      ...current,
      skillProficiencies: {
        ...current.skillProficiencies,
        [skill]: value,
      },
    }));
  }

  function toggleArrayEntry(key: "weaponIds" | "homebrewIds", value: string) {
    setDraft((current) => {
      const entries = current[key];
      const nextEntries = entries.includes(value)
        ? entries.filter((entry) => entry !== value)
        : [...entries, value];

      return {
        ...current,
        [key]: nextEntries,
      };
    });
  }

  function toggleSpell(spellId: string) {
    setDraft((current) => {
      const nextSpellIds = current.spellIds.includes(spellId)
        ? current.spellIds.filter((entry) => entry !== spellId)
        : [...current.spellIds, spellId];

      return {
        ...current,
        spellIds: nextSpellIds,
        preparedSpellIds: current.preparedSpellIds.filter((entry) => nextSpellIds.includes(entry)),
      };
    });
  }

  function togglePreparedSpell(spellId: string) {
    setDraft((current) => {
      if (!current.spellIds.includes(spellId)) {
        return current;
      }

      const nextPreparedSpellIds = current.preparedSpellIds.includes(spellId)
        ? current.preparedSpellIds.filter((entry) => entry !== spellId)
        : [...current.preparedSpellIds, spellId];

      return {
        ...current,
        preparedSpellIds: nextPreparedSpellIds,
      };
    });
  }

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

  async function handleSave() {
    try {
      if (!selectedCharacter) {
        const created = await dndApi.builder.createFromWizard(draft);
        setSelectedCharacter(created);
        setDraft(builderInputFromCharacter(created));
        await loadCharacters(created.id);
        setMessage(`Created ${created.name}.`);
        return;
      }

      const updated = await dndApi.characters.save({
        ...previewCharacter,
        currentHitPoints: Math.min(previewCharacter.currentHitPoints, derived.hitPointsMax),
      });
      setSelectedCharacter(updated);
      setDraft(builderInputFromCharacter(updated));
      await loadCharacters(updated.id);
      setMessage(`Saved ${updated.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save character.");
    }
  }

  async function handleDelete() {
    if (!selectedCharacter) {
      setDraft(createDefaultBuilderInput());
      setMessage("Reset draft.");
      return;
    }

    await dndApi.characters.delete(selectedCharacter.id);
    await loadCharacters();
    setMessage(`Deleted ${selectedCharacter.name}.`);
  }

  async function handleExport(kind: "exportJson" | "exportPdf") {
    if (!selectedCharacter) {
      setMessage("Save the character first.");
      return;
    }

    const filePath = await dndApi.characters[kind](selectedCharacter.id);
    setMessage(filePath ? `Exported to ${filePath}` : "Export canceled.");
  }

  if (loading) {
      return <div className="empty-state">Loading character library…</div>;
  }

  return (
    <div className="workspace">
      <SectionCard
        title="Character Library"
        subtitle="Saved locally"
      >
        <div className="stack-sm">
          <button
            className="action-button action-button--secondary"
            onClick={() => {
              setSelectedCharacter(null);
              setDraft(createDefaultBuilderInput());
              setMessage("Draft reset for a new character.");
            }}
            type="button"
          >
            New Character
          </button>
          <div className="library-list">
            {characters.length === 0 ? <p className="muted-copy">No saved characters yet.</p> : null}
            {characters.map((character) => (
              <button
                key={character.id}
                className={`library-item ${selectedCharacter?.id === character.id ? "library-item--active" : ""}`}
                onClick={async () => {
                  const record = await dndApi.characters.get(character.id);
                  if (record) {
                    setSelectedCharacter(record);
                    setDraft(builderInputFromCharacter(record));
                    setMessage(`Loaded ${record.name}.`);
                  }
                }}
                type="button"
              >
                <strong>{character.name}</strong>
                <span>
                  {character.level} · {character.classId}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Guided Builder"
        subtitle="Editable draft"
      >
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input
              onChange={(event) => updateDraft("name", event.target.value)}
              value={draft.name}
            />
          </label>
          <label>
            <span>Class</span>
            <select
              onChange={(event) => updateDraft("classId", event.target.value)}
              value={draft.classId}
            >
              {availableClasses.map((entry) => (
                <option
                  key={entry.id}
                  value={entry.id}
                >
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Species</span>
            <select
              onChange={(event) => updateDraft("speciesId", event.target.value)}
              value={draft.speciesId}
            >
              {availableSpecies.map((entry) => (
                <option
                  key={entry.id}
                  value={entry.id}
                >
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Background</span>
            <select
              onChange={(event) => updateDraft("backgroundId", event.target.value)}
              value={draft.backgroundId}
            >
              {availableBackgrounds.map((entry) => (
                <option
                  key={entry.id}
                  value={entry.id}
                >
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Level</span>
            <input
              max={20}
              min={1}
              onChange={(event) => updateDraft("level", Number(event.target.value))}
              type="number"
              value={draft.level}
            />
          </label>
          <label>
            <span>Armor</span>
            <select
              onChange={(event) => updateDraft("armorId", event.target.value || null)}
              value={draft.armorId ?? "unarmored"}
            >
              {availableArmor.map((entry) => (
                <option
                  key={entry.id}
                  value={entry.id}
                >
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-field">
            <input
              checked={draft.shieldEquipped}
              onChange={(event) => updateDraft("shieldEquipped", event.target.checked)}
              type="checkbox"
            />
            <span>Shield Equipped</span>
          </label>
          <label className="checkbox-field">
            <input
              checked={draft.inspiration}
              onChange={(event) => updateDraft("inspiration", event.target.checked)}
              type="checkbox"
            />
            <span>Inspiration</span>
          </label>
        </div>

        <div className="stack-md">
          <div>
            <h3 className="subheading">Ability Scores</h3>
            <div className="ability-editor">
              {ABILITY_NAMES.map((ability) => (
                <label key={ability}>
                  <span>{humanizeLabel(ability)}</span>
                  <input
                    max={30}
                    min={1}
                    onChange={(event) => updateAbility(ability, Number(event.target.value))}
                    type="number"
                    value={draft.abilities[ability]}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="subheading">Skill Proficiencies</h3>
            <div className="skill-editor">
              {SKILL_NAMES.map((skill) => (
                <label key={skill}>
                  <span>{humanizeLabel(skill)}</span>
                  <select
                    onChange={(event) =>
                      updateSkill(
                        skill,
                        event.target.value === "none"
                          ? undefined
                          : (event.target.value as BuilderInput["skillProficiencies"][SkillName]),
                      )
                    }
                    value={draft.skillProficiencies[skill] ?? "none"}
                  >
                    <option value="none">None</option>
                    <option value="proficient">Proficient</option>
                    <option value="expertise">Expertise</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="stack-sm">
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Enabled Content Sources</strong>
                <span>{draft.enabledSourceIds.length}</span>
              </div>
              <p className="muted-copy">
                This character stores its own content profile so future sourcebooks can be added without changing the
                base character model.
              </p>
              <div className="filter-row">
                {draft.enabledSourceIds.map((sourceId) => (
                  <span
                    key={sourceId}
                    className="chip chip--active"
                  >
                    {sourceId}
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Quick References</strong>
                <span>Builder context</span>
              </div>
              <div className="filter-row">
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(draft.classId)}
                  type="button"
                >
                  {availableClasses.find((entry) => entry.id === draft.classId)?.name ?? "Class"}
                </button>
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(draft.speciesId)}
                  type="button"
                >
                  {availableSpecies.find((entry) => entry.id === draft.speciesId)?.name ?? "Species"}
                </button>
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(draft.backgroundId)}
                  type="button"
                >
                  {availableBackgrounds.find((entry) => entry.id === draft.backgroundId)?.name ?? "Background"}
                </button>
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(getArmorReferenceSlug(draft.armorId))}
                  type="button"
                >
                  {availableArmor.find((entry) => entry.id === (draft.armorId ?? "unarmored"))?.name ?? "Armor"}
                </button>
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(RULE_REFERENCE_SLUGS.armorClass)}
                  type="button"
                >
                  Armor Class Rule
                </button>
              </div>
            </div>

            <div className="checkbox-grid">
              <div>
                <h3 className="subheading">Weapons</h3>
                {availableWeapons.map((weapon) => (
                  <div
                    key={weapon.id}
                    className="choice-row"
                  >
                    <label className="checkbox-field">
                      <input
                        checked={draft.weaponIds.includes(weapon.id)}
                        onChange={() => toggleArrayEntry("weaponIds", weapon.id)}
                        type="checkbox"
                      />
                      <span>{weapon.name}</span>
                    </label>
                    <button
                      className="inline-link-button"
                      onClick={() => openReferenceSafe(weapon.id)}
                      type="button"
                    >
                      Ref
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="subheading">Spells</h3>
                <div className="detail-card">
                  <div className="detail-card__header">
                    <strong>{selectedClass.name} Spellbook</strong>
                    <span>{formatSpellSlotSummary(derived.spellcasting)}</span>
                  </div>
                  <p className="muted-copy">{spellbookMessage}</p>
                  {grantedSpellEntries.length > 0 ? (
                    <p className="muted-copy">
                      Granted by homebrew: {grantedSpellEntries.map((spell) => spell.name).join(", ")}
                    </p>
                  ) : null}
                  <div className="filter-row">
                    <span className="chip">{selectedCantripEntries.length} cantrips chosen</span>
                    <span className="chip">{selectedLeveledEntries.length} leveled spells chosen</span>
                    <span className="chip">{derived.spellcasting.preparedSpells.length} ready</span>
                  </div>
                </div>
                {classSpellOptions.filter((spell) => readSpellLevel(spell) === 0).map((spell) => (
                  <div
                    key={spell.slug}
                    className="choice-row"
                  >
                    <label className="checkbox-field">
                      <input
                        checked={draft.spellIds.includes(spell.slug)}
                        onChange={() => toggleSpell(spell.slug)}
                        type="checkbox"
                      />
                      <span>{spell.name}</span>
                    </label>
                    <button
                      className="inline-link-button"
                      onClick={() => openReferenceSafe(spell.slug)}
                      type="button"
                    >
                      Ref
                    </button>
                  </div>
                ))}
                {classSpellOptions.filter((spell) => readSpellLevel(spell) > 0).map((spell) => (
                  <div
                    key={spell.slug}
                    className="choice-row"
                  >
                    <label className="checkbox-field">
                      <input
                        checked={draft.spellIds.includes(spell.slug)}
                        onChange={() => toggleSpell(spell.slug)}
                        type="checkbox"
                      />
                      <span>{spell.name}</span>
                    </label>
                    <button
                      className="inline-link-button"
                      onClick={() => openReferenceSafe(spell.slug)}
                      type="button"
                    >
                      Ref
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="subheading">Prepared / Ready Spells</h3>
                <div className="detail-card">
                  <p className="muted-copy">Cantrips are always available. Mark leveled spells you want surfaced as ready.</p>
                </div>
                {selectedLeveledEntries.length === 0 ? <p className="muted-copy">Select at least one leveled spell first.</p> : null}
                {selectedLeveledEntries.map((spell) => (
                  <div
                    key={spell.slug}
                    className="choice-row"
                  >
                    <label className="checkbox-field">
                      <input
                        checked={draft.preparedSpellIds.includes(spell.slug)}
                        onChange={() => togglePreparedSpell(spell.slug)}
                        type="checkbox"
                      />
                      <span>{spell.name}</span>
                    </label>
                    <button
                      className="inline-link-button"
                      onClick={() => openReferenceSafe(spell.slug)}
                      type="button"
                    >
                      Ref
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="subheading">Applied Homebrew</h3>
                {homebrewEntries.length === 0 ? <p className="muted-copy">No saved homebrew entries yet.</p> : null}
                {homebrewEntries.map((entry) => (
                  <label
                    key={entry.id}
                    className="checkbox-field"
                  >
                    <input
                      checked={draft.homebrewIds.includes(entry.id)}
                      onChange={() => toggleArrayEntry("homebrewIds", entry.id)}
                      type="checkbox"
                    />
                    <span>{entry.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="notes-grid">
            <label>
              <span>Class Features / Notes</span>
              <textarea
                onChange={(event) =>
                  updateDraft("notes", {
                    ...draft.notes,
                    classFeatures: event.target.value,
                  })
                }
                rows={4}
                value={draft.notes.classFeatures}
              />
            </label>
            <label>
              <span>Species Traits / Notes</span>
              <textarea
                onChange={(event) =>
                  updateDraft("notes", {
                    ...draft.notes,
                    speciesTraits: event.target.value,
                  })
                }
                rows={4}
                value={draft.notes.speciesTraits}
              />
            </label>
            <label>
              <span>Feats / Notes</span>
              <textarea
                onChange={(event) =>
                  updateDraft("notes", {
                    ...draft.notes,
                    feats: event.target.value,
                  })
                }
                rows={4}
                value={draft.notes.feats}
              />
            </label>
          </div>

          <div className="action-row">
            <button
              className="action-button"
              onClick={() => void handleSave()}
              type="button"
            >
              {selectedCharacter ? "Save Changes" : "Create Character"}
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
              className="action-button action-button--ghost"
              onClick={() => void handleDelete()}
              type="button"
            >
              {selectedCharacter ? "Delete Character" : "Reset Draft"}
            </button>
          </div>
          <p className="muted-copy">{message}</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Exact-Style Sheet Preview"
        subtitle="Structural layout pass with live values"
      >
        <SheetPreview
          character={previewCharacter}
          derived={derived}
          onOpenReference={openReferenceSafe}
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
