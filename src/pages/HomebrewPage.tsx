import { useEffect, useState } from "react";
import type { HomebrewEntry, EffectType } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

interface HomebrewDraft {
  name: string;
  type: HomebrewEntry["type"];
  summary: string;
  effectType: EffectType;
  target: string;
  value: number;
}

function createEmptyDraft(): HomebrewDraft {
  return {
    name: "",
    type: "feat",
    summary: "",
    effectType: "ac_bonus",
    target: "armor_class",
    value: 1,
  };
}

export function HomebrewPage() {
  const [entries, setEntries] = useState<HomebrewEntry[]>([]);
  const [draft, setDraft] = useState<HomebrewDraft>(createEmptyDraft());
  const [status, setStatus] = useState("Create bounded effect entries that characters can opt into.");

  async function refresh() {
    const nextEntries = await dndApi.homebrew.list();
    setEntries(nextEntries);
  }

  useEffect(() => {
    refresh().catch((error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Failed to load homebrew entries.");
    });
  }, []);

  async function handleSave() {
    const now = new Date().toISOString();
    const entry: HomebrewEntry = {
      id: crypto.randomUUID(),
      name: draft.name,
      type: draft.type,
      summary: draft.summary,
      effects: [
        {
          id: crypto.randomUUID(),
          type: draft.effectType,
          target: draft.target,
          value: draft.value,
        },
      ],
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
          <div className="form-grid">
            <label>
              <span>Effect Type</span>
              <select
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    effectType: event.target.value as EffectType,
                  }))
                }
                value={draft.effectType}
              >
                <option value="ac_bonus">AC Bonus</option>
                <option value="speed_bonus">Speed Bonus</option>
                <option value="hp_bonus">HP Bonus</option>
                <option value="ability_bonus">Ability Bonus</option>
                <option value="grant_skill_proficiency">Skill Proficiency</option>
                <option value="grant_save_proficiency">Save Proficiency</option>
              </select>
            </label>
            <label>
              <span>Target</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, target: event.target.value }))}
                value={draft.target}
              />
            </label>
            <label>
              <span>Value</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, value: Number(event.target.value) }))}
                type="number"
                value={draft.value}
              />
            </label>
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
                  <span>{entry.type}</span>
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
              <pre className="payload-view">{JSON.stringify(entry.effects, null, 2)}</pre>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
