import { useEffect, useState } from "react";
import { calculateDerivedState } from "../../shared/calculations";
import { ARMORS, BACKGROUNDS, CLASSES, SPECIES, WEAPONS } from "../../shared/data/reference";
import { COMPENDIUM_SEED } from "../../shared/data/compendiumSeed";
import { ABILITY_NAMES, SKILL_NAMES } from "../../shared/types";
import type { AbilityName, BuilderInput, CharacterRecord, CharacterSummary, HomebrewEntry, SkillName } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { SheetPreview } from "../components/SheetPreview";
import { dndApi } from "../lib/api";
import { buildPreviewCharacter, builderInputFromCharacter, createDefaultBuilderInput, humanizeLabel } from "../lib/editor";

const SPELL_OPTIONS = COMPENDIUM_SEED.filter((entry) => entry.type === "spell");

export function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRecord | null>(null);
  const [draft, setDraft] = useState<BuilderInput>(createDefaultBuilderInput());
  const [homebrewEntries, setHomebrewEntries] = useState<HomebrewEntry[]>([]);
  const [message, setMessage] = useState("Create a new character or select one from the library.");
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

  function toggleArrayEntry(key: "weaponIds" | "spellIds" | "preparedSpellIds" | "homebrewIds", value: string) {
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
              {CLASSES.map((entry) => (
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
              {SPECIES.map((entry) => (
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
              {BACKGROUNDS.map((entry) => (
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
              {ARMORS.map((entry) => (
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

          <div className="checkbox-grid">
            <div>
              <h3 className="subheading">Weapons</h3>
              {WEAPONS.map((weapon) => (
                <label
                  key={weapon.id}
                  className="checkbox-field"
                >
                  <input
                    checked={draft.weaponIds.includes(weapon.id)}
                    onChange={() => toggleArrayEntry("weaponIds", weapon.id)}
                    type="checkbox"
                  />
                  <span>{weapon.name}</span>
                </label>
              ))}
            </div>
            <div>
              <h3 className="subheading">Spells</h3>
              {SPELL_OPTIONS.map((spell) => (
                <label
                  key={spell.slug}
                  className="checkbox-field"
                >
                  <input
                    checked={draft.spellIds.includes(spell.slug)}
                    onChange={() => toggleArrayEntry("spellIds", spell.slug)}
                    type="checkbox"
                  />
                  <span>{spell.name}</span>
                </label>
              ))}
            </div>
            <div>
              <h3 className="subheading">Prepared Spells</h3>
              {draft.spellIds.length === 0 ? <p className="muted-copy">Select spells first.</p> : null}
              {draft.spellIds.map((spellId) => (
                <label
                  key={spellId}
                  className="checkbox-field"
                >
                  <input
                    checked={draft.preparedSpellIds.includes(spellId)}
                    onChange={() => toggleArrayEntry("preparedSpellIds", spellId)}
                    type="checkbox"
                  />
                  <span>{humanizeLabel(spellId.replaceAll("-", " "))}</span>
                </label>
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
        />
      </SectionCard>
    </div>
  );
}
