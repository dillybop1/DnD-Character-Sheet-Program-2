import type { ReactNode } from "react";
import { findCompendiumEntry } from "../../shared/data/compendiumSeed";
import {
  SKILL_TO_ABILITY,
  getArmorTemplate,
  getBackgroundTemplate,
  getClassTemplate,
  listFeatSelectionLabels,
  getSpeciesTemplate,
  getSubclassLabel,
  getSubclassTemplate,
  sanitizeFeatState,
} from "../../shared/data/reference";
import { ABILITY_NAMES } from "../../shared/types";
import type { AbilityName, CharacterRecord, DerivedSheetState, SkillName } from "../../shared/types";
import { getArmorReferenceSlug, getSpellcastingReferenceSlug, RULE_REFERENCE_SLUGS } from "../lib/compendiumLinks";
import { formatModifier, humanizeLabel } from "../lib/editor";

interface SheetPreviewProps {
  character: CharacterRecord;
  derived: DerivedSheetState;
  onOpenReference?: (slug: string) => void;
}

interface OffenseRow {
  id: string;
  name: string;
  attack: string;
  damage: string;
  notes: string;
}

const SKILL_COLUMNS: SkillName[][] = [
  ["acrobatics", "animalHandling", "arcana", "athletics", "deception", "history", "insight", "investigation", "medicine"],
  ["nature", "perception", "performance", "persuasion", "religion", "sleightOfHand", "stealth", "survival", "intimidation"],
];

const ABILITY_LABELS: Record<AbilityName, { long: string; short: string }> = {
  strength: { long: "Strength", short: "STR" },
  dexterity: { long: "Dexterity", short: "DEX" },
  constitution: { long: "Constitution", short: "CON" },
  intelligence: { long: "Intelligence", short: "INT" },
  wisdom: { long: "Wisdom", short: "WIS" },
  charisma: { long: "Charisma", short: "CHA" },
};

const PASSIVE_SKILL_LABELS: Array<{ key: "perception" | "investigation" | "insight"; label: string }> = [
  { key: "perception", label: "Per" },
  { key: "investigation", label: "Inv" },
  { key: "insight", label: "Ins" },
];

function splitStructuredEntries(items: string[], manualNote: string) {
  const trimmedManualNote = manualNote.trim();

  return {
    entries: trimmedManualNote ? items.filter((item) => item !== trimmedManualNote) : items,
    manualNote: trimmedManualNote,
  };
}

function buildPips(total: number, filled: number, keyPrefix: string) {
  return Array.from({ length: total }, (_, index) => (
    <span
      key={`${keyPrefix}-${index}`}
      className={`record-sheet__pip ${index < filled ? "record-sheet__pip--filled" : ""}`}
    />
  ));
}

function buildOffenseRows(derived: DerivedSheetState): OffenseRow[] {
  const weaponRows = derived.weaponEntries.map((weapon) => ({
    id: weapon.id,
    name: weapon.name,
    attack: formatModifier(weapon.attackBonus),
    damage: weapon.damage,
    notes: weapon.notes ?? "Combat entry",
  }));

  const cantripRows = derived.spellcasting.knownSpells
    .filter((spell) => spell.level === 0)
    .map((spell) => {
      const bonusSpellcasting = derived.spellcasting.bonusSpellcasting;
      const usesBonusSpellcasting = bonusSpellcasting?.spellIds.includes(spell.id) ?? false;
      const spellAttackBonus = usesBonusSpellcasting
        ? bonusSpellcasting?.spellAttackBonus ?? null
        : derived.spellcasting.spellAttackBonus;
      const spellSaveDC = usesBonusSpellcasting ? bonusSpellcasting?.spellSaveDC ?? null : derived.spellcasting.spellSaveDC;

      return {
        id: spell.id,
        name: spell.name,
        attack:
          spell.attackType === "save"
          ? spellSaveDC === null
            ? "None"
            : `DC ${spellSaveDC}`
          : spellAttackBonus === null
            ? "None"
            : formatModifier(spellAttackBonus),
        damage: spell.cantripDamage ?? spell.summary,
        notes: spell.attackType === "save" ? "Saving throw" : spell.attackType === "spellAttack" ? "Spell attack" : spell.school,
      };
    });

  return [...weaponRows, ...cantripRows];
}

function skillRank(skill: SkillName, derived: DerivedSheetState) {
  const baseModifier = derived.abilityModifiers[SKILL_TO_ABILITY[skill]];
  const delta = derived.skills[skill] - baseModifier;

  if (delta >= derived.proficiencyBonus * 2) {
    return 2;
  }

  if (delta >= derived.proficiencyBonus) {
    return 1;
  }

  return 0;
}

function isSaveProficient(ability: AbilityName, derived: DerivedSheetState) {
  return derived.savingThrows[ability] - derived.abilityModifiers[ability] >= derived.proficiencyBonus;
}

function estimateListWeight(item: string) {
  const punctuationWeight = (item.match(/[,:;()]/g)?.length ?? 0) * 6;
  return Math.max(item.length, 18) + punctuationWeight;
}

function splitList(items: string[]) {
  if (items.length <= 1) {
    return [items, []];
  }

  const totalWeight = items.reduce((sum, item) => sum + estimateListWeight(item), 0);
  let runningWeight = 0;
  let bestIndex = 1;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let index = 0; index < items.length - 1; index += 1) {
    runningWeight += estimateListWeight(items[index]);
    const splitIndex = index + 1;
    const delta = Math.abs(totalWeight - runningWeight * 2);

    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = splitIndex;
    }
  }

  return [items.slice(0, bestIndex), items.slice(bestIndex)];
}

function formatSpellSlotSummary(derived: DerivedSheetState) {
  if (derived.spellcasting.slotMode === "pact") {
    if (derived.spellcasting.pactSlotsMax === 0 || derived.spellcasting.pactSlotLevel === null) {
      return "Pact slots pending";
    }

    return `Pact L${derived.spellcasting.pactSlotLevel}:${derived.spellcasting.pactSlotsMax}`;
  }

  if (derived.spellcasting.spellSlotsMax.length > 0) {
    return derived.spellcasting.spellSlotsMax.map((value, index) => `L${index + 1}:${value}`).join(" ");
  }

  return "None";
}

function ReferenceButton({
  children,
  className,
  onOpenReference,
  slug,
}: {
  children: ReactNode;
  className?: string;
  onOpenReference?: (slug: string) => void;
  slug?: string;
}) {
  if (!slug || !onOpenReference) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      className={`record-sheet__link-button ${className ?? ""}`.trim()}
      onClick={() => onOpenReference(slug)}
      type="button"
    >
      {children}
    </button>
  );
}

export function SheetPreview({ character, derived, onOpenReference }: SheetPreviewProps) {
  const classLabel = getClassTemplate(character.classId).name;
  const subclassTemplate = getSubclassTemplate(character.classId, character.subclass, character.enabledSourceIds);
  const subclassLabel = getSubclassLabel(character.classId, character.subclass, character.enabledSourceIds);
  const speciesTemplate = getSpeciesTemplate(character.speciesId);
  const speciesLabel = speciesTemplate.name;
  const backgroundLabel = getBackgroundTemplate(character.backgroundId).name;
  const armor = getArmorTemplate(derived.equippedArmorId);
  const offenseRows = buildOffenseRows(derived);
  const emptyOffenseRows = Math.max(0, 6 - offenseRows.length);
  const classFeatureSection = splitStructuredEntries(derived.classFeatures, character.notes.classFeatures);
  const backgroundFeatureSection = splitStructuredEntries(
    derived.backgroundFeatures,
    character.notes.backgroundFeatures,
  );
  const speciesTraitSection = splitStructuredEntries(derived.speciesTraits, character.notes.speciesTraits);
  const featureColumns = splitList(classFeatureSection.entries);
  const featState = sanitizeFeatState(character.featIds, character.featSelections, {
    classId: character.classId,
    skillProficiencies: character.skillProficiencies,
  });
  const selectedFeatEntries = featState.featIds
    .map((featId) => findCompendiumEntry(featId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry && entry.type === "feat"));
  const selectedFeatRows = selectedFeatEntries.map((entry) => ({
    entry,
    selectionLabels: listFeatSelectionLabels(entry.slug, featState.featSelections, {
      classId: character.classId,
      skillProficiencies: character.skillProficiencies,
    }),
  }));
  const selectedFeatNames = new Set(selectedFeatEntries.map((entry) => entry.name));
  const featNote = character.notes.feats.trim();
  const freeformFeatEntries = derived.feats.filter((entry) => !selectedFeatNames.has(entry) && entry !== featNote);
  const spellSlotSummary = formatSpellSlotSummary(derived);
  const bonusSpellIds = new Set(derived.spellcasting.bonusSpellcasting?.spellIds ?? []);
  const bonusSpellNames = derived.spellcasting.knownSpells
    .filter((spell) => bonusSpellIds.has(spell.id))
    .map((spell) => spell.name);
  const primarySpellAttackSummary =
    derived.spellcasting.spellAttackBonus === null ? "No spell attack" : formatModifier(derived.spellcasting.spellAttackBonus);
  const spellcastingFocusLabel = derived.spellcasting.spellcastingAbility
    ? `${ABILITY_LABELS[derived.spellcasting.spellcastingAbility].long} focus`
    : derived.spellcasting.bonusSpellcasting
      ? "Feat spell line only"
      : "No spellcasting";
  const equippedWeapons = derived.inventoryEntries.filter((entry) => entry.kind === "weapon" && entry.equipped);
  const carriedGear = derived.inventoryEntries.filter((entry) => entry.kind === "gear");
  const denseSheetMode =
    offenseRows.length >= 5 ||
    classFeatureSection.entries.length >= 8 ||
    selectedFeatRows.length + freeformFeatEntries.length >= 5 ||
    carriedGear.length >= 10 ||
    derived.spellcasting.spellSlotsMax.length >= 6 ||
    bonusSpellNames.length >= 3 ||
    derived.activeEffects.length >= 4;

  return (
    <div className={`record-sheet ${denseSheetMode ? "record-sheet--dense" : ""}`.trim()}>
      <section className="record-sheet__masthead">
        <article className="record-sheet__panel record-sheet__identity-panel">
          <div className="record-sheet__field record-sheet__field--wide">
            <span>Character Name</span>
            <strong>{character.name}</strong>
          </div>
          <div className="record-sheet__field">
            <span>Background</span>
            <ReferenceButton
              className="record-sheet__field-link"
              onOpenReference={onOpenReference}
              slug={character.backgroundId}
            >
              {backgroundLabel}
            </ReferenceButton>
          </div>
          <div className="record-sheet__field">
            <span>Class</span>
            <ReferenceButton
              className="record-sheet__field-link"
              onOpenReference={onOpenReference}
              slug={character.classId}
            >
              {classLabel}
            </ReferenceButton>
          </div>
          <div className="record-sheet__field">
            <span>Species</span>
            <ReferenceButton
              className="record-sheet__field-link"
              onOpenReference={onOpenReference}
              slug={character.speciesId}
            >
              {speciesLabel}
            </ReferenceButton>
          </div>
          <div className="record-sheet__field">
            <span>Subclass</span>
            {character.subclass ? (
              <ReferenceButton
                className="record-sheet__field-link"
                onOpenReference={onOpenReference}
                slug={subclassTemplate?.id}
              >
                {subclassLabel}
              </ReferenceButton>
            ) : (
              <strong className="record-sheet__field-placeholder">Not set</strong>
            )}
          </div>
        </article>

        <div className="record-sheet__hero-emblems">
          <article className="record-sheet__medallion">
            <span>Level</span>
            <strong>{character.level}</strong>
          </article>

          <article className="record-sheet__shield">
            <ReferenceButton
              onOpenReference={onOpenReference}
              slug={RULE_REFERENCE_SLUGS.armorClass}
            >
              Armor Class
            </ReferenceButton>
            <strong>{derived.armorClass}</strong>
            <small>{derived.shieldEquipped ? "Shield ready" : "No shield"}</small>
          </article>
        </div>

        <article className="record-sheet__panel record-sheet__vitals-panel">
          <div className="record-sheet__vital">
            <span>Hit Points</span>
            <div className="record-sheet__triple">
              <div>
                <small>Current</small>
                <strong>{character.currentHitPoints}</strong>
              </div>
              <div>
                <small>Temp</small>
                <strong>{character.tempHitPoints}</strong>
              </div>
              <div>
                <small>Max</small>
                <strong>{derived.hitPointsMax}</strong>
              </div>
            </div>
          </div>

          <div className="record-sheet__vital">
            <ReferenceButton
              onOpenReference={onOpenReference}
              slug={RULE_REFERENCE_SLUGS.hitDice}
            >
              Hit Dice
            </ReferenceButton>
            <div className="record-sheet__double">
              <div>
                <small>Spent</small>
                <strong>{character.hitDiceSpent}</strong>
              </div>
              <div>
                <small>Max</small>
                <strong>{derived.hitDiceMax}</strong>
              </div>
            </div>
          </div>

          <div className="record-sheet__vital">
            <span>Death Saves</span>
            <div className="record-sheet__death-saves">
              <div className="record-sheet__pip-row">
                <small>Successes</small>
                <div>{buildPips(3, character.deathSaves.successes, "success")}</div>
              </div>
              <div className="record-sheet__pip-row">
                <small>Failures</small>
                <div>{buildPips(3, character.deathSaves.failures, "failure")}</div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <div className="record-sheet__banner">
        <span className="record-sheet__banner-line" />
        <div className="record-sheet__banner-copy">
          <span>Campaign Record</span>
          <strong>Adventurer Ledger</strong>
        </div>
        <span className="record-sheet__banner-line" />
      </div>

      <section className="record-sheet__body">
        <aside className="record-sheet__left-rail">
          <div className="record-sheet__abilities">
            {ABILITY_NAMES.map((ability) => (
              <article
                key={ability}
                className="record-sheet__ability-card"
              >
                <div className="record-sheet__ability-score">{derived.adjustedAbilities[ability]}</div>
                <div className="record-sheet__ability-content">
                  <h3 title={ABILITY_LABELS[ability].long}>
                    <span className="record-sheet__ability-name-long">{ABILITY_LABELS[ability].long}</span>
                    <span
                      aria-hidden="true"
                      className="record-sheet__ability-name-short"
                    >
                      {ABILITY_LABELS[ability].short}
                    </span>
                  </h3>
                  <strong>{formatModifier(derived.abilityModifiers[ability])}</strong>
                  <div className="record-sheet__save-row">
                    <span
                      className={`record-sheet__toggle ${isSaveProficient(ability, derived) ? "record-sheet__toggle--on" : ""}`}
                    />
                    <small>
                      <span className="record-sheet__save-copy-long">Saving Throw</span>
                      <span
                        aria-hidden="true"
                        className="record-sheet__save-copy-short"
                      >
                        Save
                      </span>{" "}
                      {formatModifier(derived.savingThrows[ability])}
                    </small>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="record-sheet__badge-row">
            <article className="record-sheet__mini-panel record-sheet__mini-panel--metric">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={RULE_REFERENCE_SLUGS.proficiencyBonus}
              >
                Proficiency
              </ReferenceButton>
              <strong>{formatModifier(derived.proficiencyBonus)}</strong>
            </article>
            <article className="record-sheet__mini-panel record-sheet__mini-panel--mark">
              <span>Heroic Inspiration</span>
              <div className="record-sheet__inspiration-mark">
                <span className={character.inspiration ? "record-sheet__inspiration-mark--active" : ""} />
              </div>
            </article>
          </div>

          <article className="record-sheet__panel record-sheet__skills-panel record-sheet__skills-panel--compact">
            <header className="record-sheet__panel-header">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={RULE_REFERENCE_SLUGS.skills}
              >
                Skills
              </ReferenceButton>
            </header>
            <div className="record-sheet__skills-columns">
              {SKILL_COLUMNS.map((column, columnIndex) => (
                <div
                  key={`skill-column-${columnIndex}`}
                  className="record-sheet__skills-column"
                >
                  {column.map((skill) => (
                    <div
                      key={skill}
                      className="record-sheet__skill-row"
                    >
                      <div className="record-sheet__skill-name">
                        <span className="record-sheet__skill-pips">{buildPips(2, skillRank(skill, derived), skill)}</span>
                        <span>{humanizeLabel(skill)}</span>
                      </div>
                      <strong>{formatModifier(derived.skills[skill])}</strong>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="record-sheet__loadout">
              <div className="record-sheet__loadout-group">
                <h4>Weapons</h4>
                <ul className="record-sheet__loadout-list">
                  {equippedWeapons.length > 0
                    ? equippedWeapons.map((entry) => (
                        <li key={entry.id}>
                          <ReferenceButton
                            onOpenReference={onOpenReference}
                            slug={entry.referenceSlug}
                          >
                            {entry.name}
                          </ReferenceButton>
                        </li>
                      ))
                    : <li>None</li>}
                </ul>
              </div>
              <div className="record-sheet__loadout-group">
                <h4>Armors</h4>
                <ul className="record-sheet__loadout-list">
                  <li>
                    <ReferenceButton
                      onOpenReference={onOpenReference}
                      slug={getArmorReferenceSlug(derived.equippedArmorId)}
                    >
                      {armor.name}
                    </ReferenceButton>
                  </li>
                  {derived.shieldEquipped ? (
                    <li>
                      <ReferenceButton
                        onOpenReference={onOpenReference}
                        slug="shield"
                      >
                        Shield
                      </ReferenceButton>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </article>
        </aside>

        <div className="record-sheet__right-rail">
          <div className="record-sheet__summary-row">
            <article className="record-sheet__summary-panel record-sheet__summary-panel--metric">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={RULE_REFERENCE_SLUGS.initiative}
              >
                Initiative
              </ReferenceButton>
              <strong>{formatModifier(derived.initiative)}</strong>
              <small>Dex {formatModifier(derived.abilityModifiers.dexterity)}</small>
            </article>
            <article className="record-sheet__summary-panel record-sheet__summary-panel--metric">
              <span>Speed</span>
              <strong>{derived.speed} ft</strong>
              <small>
                {speciesTemplate.size === derived.size ? speciesTemplate.name : `${speciesTemplate.name} | ${derived.size}`}
              </small>
            </article>
            <article className="record-sheet__summary-panel record-sheet__summary-panel--senses">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={RULE_REFERENCE_SLUGS.skills}
              >
                Passive Senses
              </ReferenceButton>
              <div className="record-sheet__passive-grid">
                {PASSIVE_SKILL_LABELS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="record-sheet__passive-cell"
                  >
                    <small>{label}</small>
                    <strong>{derived.passiveSkills[key]}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="record-sheet__summary-panel record-sheet__summary-panel--wide record-sheet__summary-panel--spellcasting">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={getSpellcastingReferenceSlug(derived.spellcasting.spellAttackBonus !== null)}
              >
                Spellcasting
              </ReferenceButton>
              <strong>{derived.spellcasting.spellSaveDC === null ? "None" : `DC ${derived.spellcasting.spellSaveDC}`}</strong>
              <small className="record-sheet__spellcasting-focus">{spellcastingFocusLabel}</small>
              <div className="record-sheet__spellcasting-summary record-sheet__spellcasting-summary--grid">
                <div className="record-sheet__spellcasting-cell">
                  <span>Attack</span>
                  <small>{primarySpellAttackSummary}</small>
                </div>
                <div className="record-sheet__spellcasting-cell">
                  <span>Slots</span>
                  <small>{spellSlotSummary}</small>
                </div>
                <div className="record-sheet__spellcasting-cell">
                  <span>Ready</span>
                  <small>{derived.spellcasting.preparedSpells.length}</small>
                </div>
                <div className="record-sheet__spellcasting-cell">
                  <span>Known</span>
                  <small>{derived.spellcasting.knownSpells.length}</small>
                </div>
              </div>
              {derived.spellcasting.bonusSpellcasting ? (
                <div className="record-sheet__spellcasting-summary">
                  <div className="record-sheet__spellcasting-line">
                    <span>{derived.spellcasting.bonusSpellcasting.sourceLabel}</span>
                    <small>
                      DC {derived.spellcasting.bonusSpellcasting.spellSaveDC} | Atk{" "}
                      {formatModifier(derived.spellcasting.bonusSpellcasting.spellAttackBonus)}
                    </small>
                  </div>
                  {bonusSpellNames.length > 0 ? (
                    <div className="record-sheet__spellcasting-line">
                      <span>Feat Spells</span>
                      <small>{bonusSpellNames.join(", ")}</small>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          </div>

          <article className="record-sheet__panel record-sheet__panel--splittable record-sheet__weapons-panel">
            <header className="record-sheet__panel-header">Weapons & Damage Cantrips</header>
            <div className="record-sheet__table record-sheet__table--compact">
              <div className="record-sheet__table-head">Name</div>
              <div className="record-sheet__table-head">Atk Bonus / DC</div>
              <div className="record-sheet__table-head">Damage & Type</div>
              <div className="record-sheet__table-head">Notes</div>

              {offenseRows.map((row) => (
                <div
                  key={row.id}
                  className="record-sheet__table-row"
                >
                  <div data-label="Name">
                    <ReferenceButton
                      onOpenReference={onOpenReference}
                      slug={row.id}
                    >
                      {row.name}
                    </ReferenceButton>
                  </div>
                  <div data-label="Atk / DC">{row.attack}</div>
                  <div data-label="Damage">{row.damage}</div>
                  <div data-label="Notes">{row.notes}</div>
                </div>
              ))}

              {Array.from({ length: emptyOffenseRows }, (_, index) => (
                <div
                  key={`empty-row-${index}`}
                  className="record-sheet__table-row record-sheet__table-row--empty"
                >
                  <div />
                  <div />
                  <div />
                  <div />
                </div>
              ))}
            </div>
          </article>

          <article className="record-sheet__panel record-sheet__panel--splittable record-sheet__notes-panel">
            <header className="record-sheet__panel-header">Class &amp; Subclass Features</header>
            <div className="record-sheet__notes-columns">
              {featureColumns.map((column, columnIndex) => (
                <ul
                  key={`feature-column-${columnIndex}`}
                  className="record-sheet__notes-list record-sheet__notes-list--dense"
                >
                  {column.length === 0 ? <li>Class features pending.</li> : null}
                  {column.map((feature) => (
                    <li key={`${feature}-${columnIndex}`}>{feature}</li>
                  ))}
                </ul>
              ))}
            </div>
            {classFeatureSection.manualNote ? (
              <div className="record-sheet__notes-subsection">
                <span className="record-sheet__notes-kicker">Notes</span>
                <p className="record-sheet__notes-paragraph">{classFeatureSection.manualNote}</p>
              </div>
            ) : null}
          </article>

          <div className="record-sheet__bottom-row">
            <article className="record-sheet__panel record-sheet__notes-panel record-sheet__notes-panel--compact">
              <header className="record-sheet__panel-header">
                <ReferenceButton
                  onOpenReference={onOpenReference}
                  slug={character.backgroundId}
                >
                  {backgroundLabel}
                </ReferenceButton>
              </header>
              <ul className="record-sheet__notes-list">
                {backgroundFeatureSection.entries.length === 0 ? <li>Background features pending.</li> : null}
                {backgroundFeatureSection.entries.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {backgroundFeatureSection.manualNote ? (
                <div className="record-sheet__notes-subsection">
                  <span className="record-sheet__notes-kicker">Notes</span>
                  <p className="record-sheet__notes-paragraph">{backgroundFeatureSection.manualNote}</p>
                </div>
              ) : null}
            </article>

            <article className="record-sheet__panel record-sheet__notes-panel record-sheet__notes-panel--compact">
              <header className="record-sheet__panel-header">Species Traits</header>
              <ul className="record-sheet__notes-list">
                {speciesTraitSection.entries.length === 0 ? <li>Species traits pending.</li> : null}
                {speciesTraitSection.entries.map((trait) => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>
              {speciesTraitSection.manualNote ? (
                <div className="record-sheet__notes-subsection">
                  <span className="record-sheet__notes-kicker">Notes</span>
                  <p className="record-sheet__notes-paragraph">{speciesTraitSection.manualNote}</p>
                </div>
              ) : null}
            </article>

            <article className="record-sheet__panel record-sheet__panel--splittable record-sheet__notes-panel record-sheet__notes-panel--compact">
              <header className="record-sheet__panel-header">Feats</header>
              <ul className="record-sheet__notes-list">
                {selectedFeatRows.length === 0 && freeformFeatEntries.length === 0 ? <li>No feats selected.</li> : null}
                {selectedFeatRows.map(({ entry, selectionLabels }) => (
                  <li key={entry.slug}>
                    <ReferenceButton
                      onOpenReference={onOpenReference}
                      slug={entry.slug}
                    >
                      {entry.name}
                    </ReferenceButton>
                    {selectionLabels.length > 0 ? (
                      <div className="record-sheet__notes-detail">{selectionLabels.join(", ")}</div>
                    ) : null}
                  </li>
                ))}
                {freeformFeatEntries.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
              {featNote ? (
                <div className="record-sheet__notes-subsection">
                  <span className="record-sheet__notes-kicker">Notes</span>
                  <p className="record-sheet__notes-paragraph">{featNote}</p>
                </div>
              ) : null}
              {derived.spellcasting.bonusSpellcasting ? (
                <div className="record-sheet__notes-subsection">
                  <span className="record-sheet__notes-kicker">Feat Spellcasting</span>
                  <p className="record-sheet__notes-paragraph">
                    {bonusSpellNames.length > 0 ? bonusSpellNames.join(", ") : "No feat-granted spells selected."}
                  </p>
                  <p className="record-sheet__notes-detail">
                    {derived.spellcasting.bonusSpellcasting.sourceLabel}: DC{" "}
                    {derived.spellcasting.bonusSpellcasting.spellSaveDC} | Atk{" "}
                    {formatModifier(derived.spellcasting.bonusSpellcasting.spellAttackBonus)}
                  </p>
                </div>
              ) : null}
              {derived.activeEffects.length > 0 ? (
                <div className="record-sheet__notes-subsection">
                  <span className="record-sheet__notes-kicker">Active Effects</span>
                  <ul className="record-sheet__notes-list">
                    {derived.activeEffects.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          </div>

          <article className="record-sheet__panel record-sheet__panel--splittable record-sheet__notes-panel record-sheet__notes-panel--compact">
            <header className="record-sheet__panel-header">Carried Gear</header>
            <ul className="record-sheet__notes-list record-sheet__notes-list--gear">
              {carriedGear.length === 0 ? <li>No extra gear tracked.</li> : null}
              {carriedGear.map((entry) => (
                <li key={entry.id}>
                  <ReferenceButton
                    className="record-sheet__field-link"
                    onOpenReference={onOpenReference}
                    slug={entry.referenceSlug}
                  >
                    {entry.name}
                  </ReferenceButton>
                  {entry.quantity > 1 || entry.equipped ? (
                    <span className="record-sheet__gear-meta">
                      {entry.quantity > 1 ? `x${entry.quantity}` : ""}
                      {entry.quantity > 1 && entry.equipped ? " | " : ""}
                      {entry.equipped ? "equipped" : ""}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
