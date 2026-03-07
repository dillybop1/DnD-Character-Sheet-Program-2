import type { ReactNode } from "react";
import { SKILL_TO_ABILITY, getArmorTemplate, getBackgroundTemplate, getClassTemplate, getSpeciesTemplate } from "../../shared/data/reference";
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
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      attack:
        spell.attackType === "save"
          ? derived.spellcasting.spellSaveDC === null
            ? "None"
            : `DC ${derived.spellcasting.spellSaveDC}`
          : derived.spellcasting.spellAttackBonus === null
            ? "None"
            : formatModifier(derived.spellcasting.spellAttackBonus),
      damage: spell.cantripDamage ?? spell.summary,
      notes: spell.attackType === "save" ? "Saving throw" : spell.attackType === "spellAttack" ? "Spell attack" : spell.school,
    }));

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

function splitList(items: string[]) {
  const midpoint = Math.max(1, Math.ceil(items.length / 2));
  return [items.slice(0, midpoint), items.slice(midpoint)];
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
  const speciesLabel = getSpeciesTemplate(character.speciesId).name;
  const backgroundLabel = getBackgroundTemplate(character.backgroundId).name;
  const armor = getArmorTemplate(character.armorId);
  const offenseRows = buildOffenseRows(derived);
  const emptyOffenseRows = Math.max(0, 6 - offenseRows.length);
  const featureColumns = splitList(derived.classFeatures);
  const featEntries = [...derived.feats, ...derived.activeEffects];
  const spellSlotSummary = formatSpellSlotSummary(derived);

  return (
    <div className="record-sheet">
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
            <strong>Pending</strong>
          </div>
        </article>

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
          <small>{character.shieldEquipped ? "Shield ready" : "No shield"}</small>
        </article>

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
                <div>{buildPips(3, 0, "success")}</div>
              </div>
              <div className="record-sheet__pip-row">
                <small>Failures</small>
                <div>{buildPips(3, 0, "failure")}</div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <div className="record-sheet__banner">
        <span className="record-sheet__banner-line" />
        <strong>Adventurer Ledger</strong>
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
                <div className="record-sheet__ability-score">{character.abilities[ability]}</div>
                <div className="record-sheet__ability-content">
                  <h3>{humanizeLabel(ability)}</h3>
                  <strong>{formatModifier(derived.abilityModifiers[ability])}</strong>
                  <div className="record-sheet__save-row">
                    <span
                      className={`record-sheet__toggle ${isSaveProficient(ability, derived) ? "record-sheet__toggle--on" : ""}`}
                    />
                    <small>Saving Throw {formatModifier(derived.savingThrows[ability])}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="record-sheet__badge-row">
            <article className="record-sheet__mini-panel">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={RULE_REFERENCE_SLUGS.proficiencyBonus}
              >
                Proficiency
              </ReferenceButton>
              <strong>{formatModifier(derived.proficiencyBonus)}</strong>
            </article>
            <article className="record-sheet__mini-panel">
              <span>Heroic Inspiration</span>
              <div className="record-sheet__inspiration-mark">
                <span className={character.inspiration ? "record-sheet__inspiration-mark--active" : ""} />
              </div>
            </article>
          </div>

          <article className="record-sheet__panel record-sheet__skills-panel">
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
              <div>
                <h4>Weapons</h4>
                <p className="record-sheet__link-list">
                  {derived.weaponEntries.length > 0
                    ? derived.weaponEntries.map((entry) => (
                        <ReferenceButton
                          key={entry.id}
                          onOpenReference={onOpenReference}
                          slug={entry.id}
                        >
                          {entry.name}
                        </ReferenceButton>
                      ))
                    : "None"}
                </p>
              </div>
              <div>
                <h4>Armors</h4>
                <p className="record-sheet__link-list">
                  <ReferenceButton
                    onOpenReference={onOpenReference}
                    slug={getArmorReferenceSlug(character.armorId)}
                  >
                    {armor.name}
                  </ReferenceButton>
                  {character.shieldEquipped ? (
                    <ReferenceButton
                      onOpenReference={onOpenReference}
                      slug="shield"
                    >
                      Shield
                    </ReferenceButton>
                  ) : null}
                </p>
              </div>
            </div>
          </article>
        </aside>

        <div className="record-sheet__right-rail">
          <div className="record-sheet__summary-row">
            <article className="record-sheet__summary-panel">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={RULE_REFERENCE_SLUGS.initiative}
              >
                Initiative
              </ReferenceButton>
              <strong>{formatModifier(derived.initiative)}</strong>
            </article>
            <article className="record-sheet__summary-panel">
              <span>Speed</span>
              <strong>{derived.speed} ft</strong>
            </article>
            <article className="record-sheet__summary-panel">
              <span>Size</span>
              <strong>Medium</strong>
            </article>
            <article className="record-sheet__summary-panel">
              <ReferenceButton
                onOpenReference={onOpenReference}
                slug={getSpellcastingReferenceSlug(derived.spellcasting.spellAttackBonus !== null)}
              >
                Spellcasting
              </ReferenceButton>
              <strong>{derived.spellcasting.spellSaveDC === null ? "None" : `DC ${derived.spellcasting.spellSaveDC}`}</strong>
              <small>
                {derived.spellcasting.spellAttackBonus === null
                  ? "No spell attack"
                  : `Atk ${formatModifier(derived.spellcasting.spellAttackBonus)} | ${spellSlotSummary}`}
              </small>
            </article>
          </div>

          <article className="record-sheet__panel record-sheet__weapons-panel">
            <header className="record-sheet__panel-header">Weapons & Damage Cantrips</header>
            <div className="record-sheet__table">
              <div className="record-sheet__table-head">Name</div>
              <div className="record-sheet__table-head">Atk Bonus / DC</div>
              <div className="record-sheet__table-head">Damage & Type</div>
              <div className="record-sheet__table-head">Notes</div>

              {offenseRows.map((row) => (
                <div
                  key={row.id}
                  className="record-sheet__table-row"
                >
                  <div>
                    <ReferenceButton
                      onOpenReference={onOpenReference}
                      slug={row.id}
                    >
                      {row.name}
                    </ReferenceButton>
                  </div>
                  <div>{row.attack}</div>
                  <div>{row.damage}</div>
                  <div>{row.notes}</div>
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

          <article className="record-sheet__panel record-sheet__notes-panel">
            <header className="record-sheet__panel-header">Class Features</header>
            <div className="record-sheet__notes-columns">
              {featureColumns.map((column, columnIndex) => (
                <ul
                  key={`feature-column-${columnIndex}`}
                  className="record-sheet__notes-list"
                >
                  {column.length === 0 ? <li>Class notes pending.</li> : null}
                  {column.map((feature) => (
                    <li key={`${feature}-${columnIndex}`}>{feature}</li>
                  ))}
                </ul>
              ))}
            </div>
          </article>

          <div className="record-sheet__bottom-row">
            <article className="record-sheet__panel record-sheet__notes-panel">
              <header className="record-sheet__panel-header">Species Traits</header>
              <ul className="record-sheet__notes-list">
                {derived.speciesTraits.length === 0 ? <li>Species traits pending.</li> : null}
                {derived.speciesTraits.map((trait) => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>
            </article>

            <article className="record-sheet__panel record-sheet__notes-panel">
              <header className="record-sheet__panel-header">Feats</header>
              <ul className="record-sheet__notes-list">
                {featEntries.length === 0 ? <li>No feats or active homebrew.</li> : null}
                {featEntries.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
