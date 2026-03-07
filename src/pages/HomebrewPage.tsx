import { useEffect, useState } from "react";
import { listCompendiumSpells, spellRecordFromCompendium } from "../../shared/data/compendiumSeed";
import { ABILITY_NAMES, SKILL_NAMES } from "../../shared/types";
import type { Effect, HomebrewEntry, EffectType } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { humanizeLabel } from "../lib/editor";
import { dndApi } from "../lib/api";

type SupportedEffectType = Exclude<EffectType, "resource_max_bonus">;
type EffectTargetMode = "none" | "ability" | "skill" | "spell" | "text" | "acFormula";

interface HomebrewEffectDraft {
  id: string;
  effectType: SupportedEffectType;
  target: string;
  value: number;
  note: string;
}

interface HomebrewDraft {
  name: string;
  type: HomebrewEntry["type"];
  summary: string;
  effects: HomebrewEffectDraft[];
}

interface EffectEditorMeta {
  label: string;
  description: string;
  targetMode: EffectTargetMode;
  valueLabel: string;
  requiresValue: boolean;
  defaultTarget: string;
  defaultValue: number;
}

const SUPPORTED_EFFECTS: SupportedEffectType[] = [
  "ability_bonus",
  "ac_bonus",
  "speed_bonus",
  "hp_bonus",
  "hp_bonus_per_level",
  "initiative_bonus",
  "grant_save_proficiency",
  "grant_skill_proficiency",
  "grant_expertise",
  "passive_skill_bonus",
  "grant_spell",
  "set_base_ac_formula",
  "set_spellcasting_ability",
];

const EFFECT_META: Record<SupportedEffectType, EffectEditorMeta> = {
  ability_bonus: {
    label: "Ability Bonus",
    description: "Adds a flat bonus to one ability score before derived math runs.",
    targetMode: "ability",
    valueLabel: "Bonus",
    requiresValue: true,
    defaultTarget: "strength",
    defaultValue: 1,
  },
  ac_bonus: {
    label: "Armor Class Bonus",
    description: "Applies a flat Armor Class bonus after armor, Dexterity, and shield math.",
    targetMode: "none",
    valueLabel: "AC Bonus",
    requiresValue: true,
    defaultTarget: "",
    defaultValue: 1,
  },
  speed_bonus: {
    label: "Speed Bonus",
    description: "Adds a flat bonus to walking speed.",
    targetMode: "none",
    valueLabel: "Feet",
    requiresValue: true,
    defaultTarget: "",
    defaultValue: 5,
  },
  hp_bonus: {
    label: "Hit Point Bonus",
    description: "Adds a flat bonus to maximum hit points in the derived sheet.",
    targetMode: "none",
    valueLabel: "HP",
    requiresValue: true,
    defaultTarget: "",
    defaultValue: 1,
  },
  hp_bonus_per_level: {
    label: "Hit Points Per Level",
    description: "Adds a flat maximum hit point bonus for each character level.",
    targetMode: "none",
    valueLabel: "HP / Level",
    requiresValue: true,
    defaultTarget: "",
    defaultValue: 1,
  },
  initiative_bonus: {
    label: "Initiative Bonus",
    description: "Adds a flat bonus to initiative in the derived sheet.",
    targetMode: "none",
    valueLabel: "Bonus",
    requiresValue: true,
    defaultTarget: "",
    defaultValue: 1,
  },
  grant_save_proficiency: {
    label: "Save Proficiency",
    description: "Marks an additional saving throw as proficient.",
    targetMode: "ability",
    valueLabel: "Value",
    requiresValue: false,
    defaultTarget: "wisdom",
    defaultValue: 0,
  },
  grant_skill_proficiency: {
    label: "Skill Proficiency",
    description: "Grants proficiency in one skill.",
    targetMode: "skill",
    valueLabel: "Value",
    requiresValue: false,
    defaultTarget: "perception",
    defaultValue: 0,
  },
  grant_expertise: {
    label: "Expertise",
    description: "Upgrades one skill to expertise in the rules engine.",
    targetMode: "skill",
    valueLabel: "Value",
    requiresValue: false,
    defaultTarget: "perception",
    defaultValue: 0,
  },
  passive_skill_bonus: {
    label: "Passive Skill Bonus",
    description: "Adds a flat bonus to one passive skill score after the normal 10 + modifier math.",
    targetMode: "skill",
    valueLabel: "Bonus",
    requiresValue: true,
    defaultTarget: "perception",
    defaultValue: 5,
  },
  grant_spell: {
    label: "Grant Spell",
    description: "Adds a spell directly to the character's known spells through homebrew.",
    targetMode: "spell",
    valueLabel: "Value",
    requiresValue: false,
    defaultTarget: "guidance",
    defaultValue: 0,
  },
  set_base_ac_formula: {
    label: "Set AC Formula",
    description: "Overrides base armor math for supported formulas such as unarmored defense.",
    targetMode: "acFormula",
    valueLabel: "Value",
    requiresValue: false,
    defaultTarget: "unarmored",
    defaultValue: 0,
  },
  set_spellcasting_ability: {
    label: "Spellcasting Ability",
    description: "Overrides the class spellcasting ability used for spell attack bonus and save DC.",
    targetMode: "ability",
    valueLabel: "Value",
    requiresValue: false,
    defaultTarget: "intelligence",
    defaultValue: 0,
  },
};

const ALL_SPELL_OPTIONS = listCompendiumSpells();

function createEffectDraft(effectType: SupportedEffectType = "ac_bonus"): HomebrewEffectDraft {
  const meta = EFFECT_META[effectType];

  return {
    id: crypto.randomUUID(),
    effectType,
    target: meta.defaultTarget,
    value: meta.defaultValue,
    note: "",
  };
}

function createEmptyDraft(): HomebrewDraft {
  return {
    name: "",
    type: "feat",
    summary: "",
    effects: [createEffectDraft()],
  };
}

function targetOptionsForEffect(effectType: SupportedEffectType) {
  const meta = EFFECT_META[effectType];

  if (meta.targetMode === "ability") {
    return ABILITY_NAMES.map((ability) => ({
      value: ability,
      label: humanizeLabel(ability),
    }));
  }

  if (meta.targetMode === "skill") {
    return SKILL_NAMES.map((skill) => ({
      value: skill,
      label: humanizeLabel(skill),
    }));
  }

  if (meta.targetMode === "spell") {
    return ALL_SPELL_OPTIONS.map((spell) => ({
      value: spell.slug,
      label: spell.name,
    }));
  }

  if (meta.targetMode === "acFormula") {
    return [
      {
        value: "unarmored",
        label: "Unarmored",
      },
    ];
  }

  return [];
}

function describeEffect(effect: Effect) {
  const meta = EFFECT_META[effect.type as SupportedEffectType];
  const spell = effect.type === "grant_spell" && effect.target ? spellRecordFromCompendium(effect.target) : null;
  const targetLabel = effect.target
    ? spell?.name ??
      (effect.type === "set_base_ac_formula" ? "Unarmored formula" : humanizeLabel(effect.target.replaceAll("-", " ")))
    : "";

  if (!meta) {
    return effect.type;
  }

  if (!effect.target) {
    return meta.requiresValue ? `${meta.label}: ${effect.value ?? 0}` : meta.label;
  }

  if (!meta.requiresValue) {
    return `${meta.label}: ${targetLabel}`;
  }

  return `${meta.label}: ${targetLabel} (${effect.value ?? 0})`;
}

export function HomebrewPage() {
  const [entries, setEntries] = useState<HomebrewEntry[]>([]);
  const [draft, setDraft] = useState<HomebrewDraft>(createEmptyDraft());
  const [status, setStatus] = useState("Create bounded entries that can combine several supported effects.");

  async function refresh() {
    const nextEntries = await dndApi.homebrew.list();
    setEntries(nextEntries);
  }

  useEffect(() => {
    refresh().catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Failed to load homebrew entries.");
    });
  }, []);

  function updateEffectDraft(effectId: string, next: Partial<HomebrewEffectDraft>) {
    setDraft((current) => ({
      ...current,
      effects: current.effects.map((effect) =>
        effect.id === effectId
          ? {
              ...effect,
              ...next,
            }
          : effect,
      ),
    }));
  }

  function handleEffectTypeChange(effectId: string, effectType: SupportedEffectType) {
    const meta = EFFECT_META[effectType];

    updateEffectDraft(effectId, {
      effectType,
      target: meta.defaultTarget,
      value: meta.defaultValue,
    });
  }

  function addEffect() {
    setDraft((current) => ({
      ...current,
      effects: [...current.effects, createEffectDraft()],
    }));
  }

  function removeEffect(effectId: string) {
    setDraft((current) => ({
      ...current,
      effects: current.effects.length === 1
        ? [createEffectDraft()]
        : current.effects.filter((effect) => effect.id !== effectId),
    }));
  }

  async function handleSave() {
    const name = draft.name.trim();
    const summary = draft.summary.trim();

    if (!name || !summary) {
      setStatus("Name and summary are required.");
      return;
    }

    const effects: Effect[] = draft.effects.map((effect) => {
      const meta = EFFECT_META[effect.effectType];

      return {
        id: effect.id,
        type: effect.effectType,
        target: meta.targetMode === "none" ? undefined : effect.target || undefined,
        value: meta.requiresValue ? effect.value : undefined,
        note: effect.note.trim() || undefined,
      };
    });

    const now = new Date().toISOString();
    const entry: HomebrewEntry = {
      id: crypto.randomUUID(),
      name,
      type: draft.type,
      summary,
      effects,
      createdAt: now,
      updatedAt: now,
    };

    await dndApi.homebrew.save(entry);
    await refresh();
    setDraft(createEmptyDraft());
    setStatus(`Saved ${entry.name}.`);
  }

  return (
    <div className="workspace workspace--two-up">
      <SectionCard
        title="Basic Homebrew"
        subtitle="Bounded effect system"
      >
        <div className="stack-md">
          <label>
            <span>Name</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              value={draft.name}
            />
          </label>
          <label>
            <span>Type</span>
            <select
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as HomebrewEntry["type"],
                }))
              }
              value={draft.type}
            >
              <option value="feat">Feat</option>
              <option value="feature">Feature</option>
              <option value="item">Item</option>
              <option value="spell">Spell</option>
              <option value="speciesTrait">Species Trait</option>
            </select>
          </label>
          <label>
            <span>Summary</span>
            <textarea
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
              rows={4}
              value={draft.summary}
            />
          </label>

          <div className="stack-sm">
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Effects</strong>
                <button
                  className="chip"
                  onClick={addEffect}
                  type="button"
                >
                  Add Effect
                </button>
              </div>
              <p className="muted-copy">
                Supported here: ability, AC, speed, HP, save proficiency, skill proficiency, expertise, granted spells,
                AC formulas, and spellcasting ability overrides.
              </p>
            </div>

            {draft.effects.map((effect) => {
              const meta = EFFECT_META[effect.effectType];
              const targetOptions = targetOptionsForEffect(effect.effectType);

              return (
                <div
                  key={effect.id}
                  className="detail-card"
                >
                  <div className="detail-card__header">
                    <strong>{meta.label}</strong>
                    <button
                      className="chip"
                      onClick={() => removeEffect(effect.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="muted-copy">{meta.description}</p>
                  <div className="form-grid">
                    <label>
                      <span>Effect Type</span>
                      <select
                        onChange={(event) => handleEffectTypeChange(effect.id, event.target.value as SupportedEffectType)}
                        value={effect.effectType}
                      >
                        {SUPPORTED_EFFECTS.map((effectType) => (
                          <option
                            key={effectType}
                            value={effectType}
                          >
                            {EFFECT_META[effectType].label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {meta.targetMode !== "none" ? (
                      <label>
                        <span>Target</span>
                        {targetOptions.length > 0 ? (
                          <select
                            onChange={(event) => updateEffectDraft(effect.id, { target: event.target.value })}
                            value={effect.target}
                          >
                            {targetOptions.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            onChange={(event) => updateEffectDraft(effect.id, { target: event.target.value })}
                            value={effect.target}
                          />
                        )}
                      </label>
                    ) : null}

                    {meta.requiresValue ? (
                      <label>
                        <span>{meta.valueLabel}</span>
                        <input
                          onChange={(event) => updateEffectDraft(effect.id, { value: Number(event.target.value) })}
                          type="number"
                          value={effect.value}
                        />
                      </label>
                    ) : null}

                    <label>
                      <span>Note</span>
                      <input
                        onChange={(event) => updateEffectDraft(effect.id, { note: event.target.value })}
                        placeholder="Optional note for future reference"
                        value={effect.note}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="action-button"
            onClick={() => void handleSave()}
            type="button"
          >
            Save Homebrew Entry
          </button>
          <p className="muted-copy">{status}</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Saved Entries"
        subtitle="Local catalog"
      >
        <div className="stack-sm">
          {entries.length === 0 ? <div className="empty-state">No homebrew entries saved yet.</div> : null}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="detail-card"
            >
              <div className="detail-card__header">
                <div>
                  <strong>{entry.name}</strong>
                  <span className="detail-label">{humanizeLabel(entry.type)}</span>
                </div>
                <button
                  className="chip"
                  onClick={async () => {
                    await dndApi.homebrew.delete(entry.id);
                    await refresh();
                    setStatus(`Deleted ${entry.name}.`);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
              <p>{entry.summary}</p>
              <ul className="instruction-list">
                {entry.effects.map((effect) => (
                  <li key={effect.id}>{describeEffect(effect)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
