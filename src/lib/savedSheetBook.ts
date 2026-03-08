import { SKILL_TO_ABILITY, getArmorTemplate, getBackgroundTemplate, getClassTemplate, getSpeciesTemplate, getSubclassLabel } from "../../shared/data/reference";
import { normalizeSheetProfile, normalizeTrackedResources, recoverTrackedResourcesForRest } from "../../shared/sheetTracking";
import { normalizePactSlotsRemaining, normalizeSpellSlotsRemaining } from "../../shared/spellSlots";
import { ABILITY_NAMES } from "../../shared/types";
import type { AbilityName, CharacterRecord, CurrencyWallet, DerivedSheetState, SheetProfile, SkillName, SpellRecord, TrackedResource } from "../../shared/types";

export type SavedSheetPageId = "page-1" | "page-2";

export interface SavedSheetEditorDraft {
  sheetProfile: SheetProfile;
  trackedResources: TrackedResource[];
}

export interface SavedSheetSpellTableRow {
  id: string;
  name: string;
  levelLabel: string;
  castLabel: string;
  rangeLabel: string;
  saveLabel: string;
  durationLabel: string;
  concentrationLabel: string;
  ritualLabel: string;
  prepared: boolean;
  summary: string;
  description: string;
  higherLevel?: string;
}

export interface SavedSheetSpellcastingHeader {
  focusLabel: string;
  focusShortLabel: string;
  spellAttackLabel: string;
  spellSaveLabel: string;
  bonusLine: string | null;
}

export interface SavedSheetSpellSlotRow {
  id: string;
  levelLabel: string;
  total: number;
  expended: number;
  remaining: number;
}

export interface SavedSheetAbilityCard {
  ability: AbilityName;
  longLabel: string;
  shortLabel: string;
  score: number;
  modifierLabel: string;
  saveLabel: string;
  saveProficient: boolean;
}

export interface SavedSheetSkillRow {
  skill: SkillName;
  label: string;
  modifierLabel: string;
  rank: number;
}

export interface SavedSheetOffenseRow {
  id: string;
  name: string;
  attackLabel: string;
  damage: string;
  notes: string;
}

export interface SavedSheetFeatureSection {
  id: string;
  title: string;
  entries: string[];
}

export interface SavedSheetLoadoutEntry {
  id: string;
  name: string;
  quantity?: number;
  referenceSlug?: string;
}

export interface SavedSheetLoadoutSummary {
  armorLabel: string;
  armorId: string | null;
  shieldEquipped: boolean;
  equippedWeapons: SavedSheetLoadoutEntry[];
  carriedGear: SavedSheetLoadoutEntry[];
  passiveSenses: Array<{
    id: "perception" | "investigation" | "insight";
    label: string;
    value: number;
  }>;
}

export type SavedSheetRestKind = "shortRest" | "longRest";

export const SAVED_SHEET_PAGES: Array<{
  id: SavedSheetPageId;
  label: string;
  title: string;
  description: string;
}> = [
  {
    id: "page-1",
    label: "Page 1",
    title: "Character Worksheet",
    description: "Worksheet-style identity, vitals, abilities, offense, and play-state controls.",
  },
  {
    id: "page-2",
    label: "Page 2",
    title: "Spellbook Worksheet",
    description: "Spellcasting header, spell table, detail rail, and saved page-two fields.",
  },
];

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

const ABILITY_LABELS: Record<Exclude<DerivedSheetState["spellcasting"]["spellcastingAbility"], null>, { long: string; short: string }> = {
  strength: { long: "Strength", short: "Str" },
  dexterity: { long: "Dexterity", short: "Dex" },
  constitution: { long: "Constitution", short: "Con" },
  intelligence: { long: "Intelligence", short: "Int" },
  wisdom: { long: "Wisdom", short: "Wis" },
  charisma: { long: "Charisma", short: "Cha" },
};

const PAGE_ONE_SKILL_COLUMNS: SkillName[][] = [
  ["acrobatics", "animalHandling", "arcana", "athletics", "deception", "history", "insight", "investigation", "medicine"],
  ["nature", "perception", "performance", "persuasion", "religion", "sleightOfHand", "stealth", "survival", "intimidation"],
];

function formatSpellLevelLabel(level: number) {
  return level === 0 ? "Cantrip" : `Level ${level}`;
}

function humanizeSavedSheetLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSavedSheetSpellAttack(spell: SpellRecord, derived: DerivedSheetState) {
  const bonusSpellcasting = derived.spellcasting.bonusSpellcasting;
  const usesBonusSpellcasting = bonusSpellcasting?.spellIds.includes(spell.id) ?? false;
  const spellAttackBonus = usesBonusSpellcasting
    ? bonusSpellcasting?.spellAttackBonus ?? null
    : derived.spellcasting.spellAttackBonus;
  const spellSaveDC = usesBonusSpellcasting ? bonusSpellcasting?.spellSaveDC ?? null : derived.spellcasting.spellSaveDC;

  if (spell.attackType === "save") {
    return spellSaveDC === null ? "None" : `DC ${spellSaveDC}`;
  }

  if (spell.attackType === "spellAttack") {
    return spellAttackBonus === null ? "None" : formatSignedValue(spellAttackBonus);
  }

  return "None";
}

function formatSavedSheetOffenseNotes(spell: SpellRecord) {
  if (spell.attackType === "save") {
    return "Saving throw";
  }

  if (spell.attackType === "spellAttack") {
    return "Spell attack";
  }

  return spell.school;
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

function formatSpellSaveLabel(spell: SpellRecord) {
  if (spell.attackType === "save") {
    return spell.saveAbility
      ? `${spell.saveAbility.slice(0, 1).toUpperCase()}${spell.saveAbility.slice(1, 3)} save`
      : "Save";
  }

  if (spell.attackType === "spellAttack") {
    return "Spell attack";
  }

  return "None";
}

export function formatSavedSheetSpellSlotSummary(derived: DerivedSheetState) {
  if (derived.spellcasting.slotMode === "pact") {
    if (derived.spellcasting.pactSlotsMax === 0 || derived.spellcasting.pactSlotLevel === null) {
      return "Pact slots pending";
    }

    return `${derived.spellcasting.pactSlotsRemaining}/${derived.spellcasting.pactSlotsMax} at level ${derived.spellcasting.pactSlotLevel}`;
  }

  if (derived.spellcasting.spellSlotsMax.length === 0) {
    return "None";
  }

  return derived.spellcasting.spellSlotsMax
    .map((slotMax, index) => `L${index + 1}:${derived.spellcasting.spellSlotsRemaining[index] ?? slotMax}/${slotMax}`)
    .join(" ");
}

export function formatSavedSheetCurrencySummary(currencies: CurrencyWallet) {
  const labels = ([
    ["pp", currencies.pp],
    ["gp", currencies.gp],
    ["ep", currencies.ep],
    ["sp", currencies.sp],
    ["cp", currencies.cp],
  ] as const)
    .filter(([, value]) => value > 0)
    .map(([label, value]) => `${value} ${label.toUpperCase()}`);

  return labels.length > 0 ? labels.join(" | ") : "No coins tracked";
}

export function parseSavedSheetLanguages(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

export function createSavedSheetEditorDraft(character: CharacterRecord): SavedSheetEditorDraft {
  return {
    sheetProfile: normalizeSheetProfile(character.sheetProfile),
    trackedResources: normalizeTrackedResources(character.trackedResources),
  };
}

export function createSavedSheetTrackedResource(nextIndex: number): TrackedResource {
  const labelIndex = nextIndex + 1;

  return {
    id: `tracked-resource-draft-${labelIndex}-${Date.now()}`,
    label: `Resource ${labelIndex}`,
    current: 1,
    max: 1,
    display: "checkboxes",
    recovery: "manual",
  };
}

export function canTakeSavedSheetRest(character: CharacterRecord) {
  return character.currentHitPoints >= 0;
}

export function buildSavedSheetPageOneSummary(character: CharacterRecord, derived: DerivedSheetState) {
  const classLabel = getClassTemplate(character.classId).name;
  const speciesLabel = getSpeciesTemplate(character.speciesId).name;
  const backgroundLabel = getBackgroundTemplate(character.backgroundId).name;
  const subclassLabel = character.subclass
    ? getSubclassLabel(character.classId, character.subclass, character.enabledSourceIds)
    : "No subclass";
  const carriedGear = derived.inventoryEntries.filter((entry) => entry.kind === "gear");

  return {
    headline: `Level ${character.level} ${classLabel}`,
    classLabel,
    speciesLabel,
    backgroundLabel,
    subclassLabel,
    armorClass: `${derived.armorClass}`,
    hitPoints: `${character.currentHitPoints}/${derived.hitPointsMax}`,
    initiative: formatSignedValue(derived.initiative),
    speed: `${derived.speed} ft`,
    size: derived.size,
    proficiencyBonus: formatSignedValue(derived.proficiencyBonus),
    passivePerception: `${derived.passiveSkills.perception}`,
    spellLine:
      derived.spellcasting.spellSaveDC === null
        ? derived.spellcasting.bonusSpellcasting?.sourceLabel ?? "None"
        : `DC ${derived.spellcasting.spellSaveDC}`,
    slotSummary: formatSavedSheetSpellSlotSummary(derived),
    hitDice: `${character.hitDiceSpent}/${derived.hitDiceMax} spent`,
    deathSaves: `${character.deathSaves.successes} success, ${character.deathSaves.failures} failure`,
    inspiration: character.inspiration ? "Marked" : "Open",
    weaponCount: derived.weaponEntries.length,
    gearCount: carriedGear.length,
    featureCount: derived.classFeatures.length + derived.backgroundFeatures.length + derived.speciesTraits.length + derived.feats.length,
    trackedResourceCount: character.trackedResources.length,
  };
}

export function buildSavedSheetSpellTableRows(derived: DerivedSheetState): SavedSheetSpellTableRow[] {
  const preparedSpellIds = new Set(derived.spellcasting.preparedSpells.map((spell) => spell.id));

  return [...derived.spellcasting.knownSpells]
    .sort((leftSpell, rightSpell) => leftSpell.level - rightSpell.level || leftSpell.name.localeCompare(rightSpell.name))
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      levelLabel: formatSpellLevelLabel(spell.level),
      castLabel: spell.castingTime ?? "Unknown",
      rangeLabel: spell.range ?? "Unknown",
      saveLabel: formatSpellSaveLabel(spell),
      durationLabel: spell.duration ?? "Unknown",
      concentrationLabel: spell.concentration ? "Yes" : "No",
      ritualLabel: spell.ritual ? "Ritual" : "Standard",
      prepared: preparedSpellIds.has(spell.id),
      summary: spell.summary,
      description: spell.description?.trim() || spell.summary,
      higherLevel: spell.higherLevel?.trim() || undefined,
    }));
}

export function buildSavedSheetSpellcastingHeader(derived: DerivedSheetState): SavedSheetSpellcastingHeader {
  const primaryAbility = derived.spellcasting.spellcastingAbility;
  const fallbackAbility = derived.spellcasting.bonusSpellcasting?.spellcastingAbility ?? null;
  const focusAbility = primaryAbility ?? fallbackAbility;
  const focusLabel = focusAbility ? `${ABILITY_LABELS[focusAbility].long} focus` : "No spellcasting";
  const focusShortLabel = focusAbility ? ABILITY_LABELS[focusAbility].short : "None";
  const bonusLine = derived.spellcasting.bonusSpellcasting
    ? `${derived.spellcasting.bonusSpellcasting.sourceLabel}: DC ${derived.spellcasting.bonusSpellcasting.spellSaveDC} | Atk ${formatSignedValue(derived.spellcasting.bonusSpellcasting.spellAttackBonus)}`
    : null;

  return {
    focusLabel,
    focusShortLabel,
    spellAttackLabel:
      derived.spellcasting.spellAttackBonus === null ? "None" : formatSignedValue(derived.spellcasting.spellAttackBonus),
    spellSaveLabel: derived.spellcasting.spellSaveDC === null ? "None" : `DC ${derived.spellcasting.spellSaveDC}`,
    bonusLine,
  };
}

export function buildSavedSheetAbilityCards(derived: DerivedSheetState): SavedSheetAbilityCard[] {
  return ABILITY_NAMES.map((ability) => ({
    ability,
    longLabel: ABILITY_LABELS[ability].long,
    shortLabel: ABILITY_LABELS[ability].short.toUpperCase(),
    score: derived.adjustedAbilities[ability],
    modifierLabel: formatSignedValue(derived.abilityModifiers[ability]),
    saveLabel: formatSignedValue(derived.savingThrows[ability]),
    saveProficient: isSaveProficient(ability, derived),
  }));
}

export function buildSavedSheetSkillColumns(derived: DerivedSheetState): SavedSheetSkillRow[][] {
  return PAGE_ONE_SKILL_COLUMNS.map((column) =>
    column.map((skill) => ({
      skill,
      label: humanizeSavedSheetLabel(skill),
      modifierLabel: formatSignedValue(derived.skills[skill]),
      rank: skillRank(skill, derived),
    })),
  );
}

export function buildSavedSheetOffenseRows(derived: DerivedSheetState): SavedSheetOffenseRow[] {
  const weaponRows = derived.weaponEntries.map((weapon) => ({
    id: weapon.id,
    name: weapon.name,
    attackLabel: formatSignedValue(weapon.attackBonus),
    damage: weapon.damage,
    notes: weapon.notes ?? "Combat entry",
  }));

  const cantripRows = derived.spellcasting.knownSpells
    .filter((spell) => spell.level === 0)
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      attackLabel: formatSavedSheetSpellAttack(spell, derived),
      damage: spell.cantripDamage ?? spell.summary,
      notes: formatSavedSheetOffenseNotes(spell),
    }));

  return [...weaponRows, ...cantripRows];
}

export function buildSavedSheetFeatureSections(derived: DerivedSheetState): SavedSheetFeatureSection[] {
  return [
    {
      id: "class-features",
      title: "Class & Subclass Features",
      entries: derived.classFeatures,
    },
    {
      id: "species-background",
      title: "Species & Background",
      entries: [...derived.speciesTraits, ...derived.backgroundFeatures],
    },
    {
      id: "feats-effects",
      title: "Feats & Effects",
      entries: [...derived.feats, ...derived.activeEffects],
    },
  ];
}

export function buildSavedSheetLoadoutSummary(derived: DerivedSheetState): SavedSheetLoadoutSummary {
  const armor = getArmorTemplate(derived.equippedArmorId);

  return {
    armorLabel: armor.name,
    armorId: armor.id,
    shieldEquipped: derived.shieldEquipped,
    equippedWeapons: derived.inventoryEntries
      .filter((entry) => entry.kind === "weapon" && entry.equipped)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        referenceSlug: entry.referenceSlug,
      })),
    carriedGear: derived.inventoryEntries
      .filter((entry) => entry.kind === "gear")
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        quantity: entry.quantity,
        referenceSlug: entry.referenceSlug,
      })),
    passiveSenses: [
      { id: "perception", label: "Per", value: derived.passiveSkills.perception },
      { id: "investigation", label: "Inv", value: derived.passiveSkills.investigation },
      { id: "insight", label: "Ins", value: derived.passiveSkills.insight },
    ],
  };
}

export function buildSavedSheetSpellSlotRows(derived: DerivedSheetState): SavedSheetSpellSlotRow[] {
  if (derived.spellcasting.slotMode === "pact") {
    if (derived.spellcasting.pactSlotsMax === 0 || derived.spellcasting.pactSlotLevel === null) {
      return [];
    }

    return [
      {
        id: "pact-slots",
        levelLabel: `Level ${derived.spellcasting.pactSlotLevel}`,
        total: derived.spellcasting.pactSlotsMax,
        expended: derived.spellcasting.pactSlotsMax - derived.spellcasting.pactSlotsRemaining,
        remaining: derived.spellcasting.pactSlotsRemaining,
      },
    ];
  }

  return derived.spellcasting.spellSlotsMax
    .map((total, index) => {
      if (total <= 0) {
        return null;
      }

      const remaining = derived.spellcasting.spellSlotsRemaining[index] ?? total;

      return {
        id: `spell-slot-${index + 1}`,
        levelLabel: `Level ${index + 1}`,
        total,
        expended: total - remaining,
        remaining,
      };
    })
    .filter((row): row is SavedSheetSpellSlotRow => row !== null);
}

export function getSavedSheetDefaultSpellId(spells: SavedSheetSpellTableRow[]) {
  return spells.find((spell) => spell.prepared)?.id ?? spells[0]?.id ?? null;
}

export function applySavedSheetRest(
  character: CharacterRecord,
  derived: DerivedSheetState,
  restKind: SavedSheetRestKind,
): CharacterRecord {
  const trackedResources = recoverTrackedResourcesForRest(character.trackedResources, restKind);

  if (restKind === "shortRest") {
    return {
      ...character,
      trackedResources,
      pactSlotsRemaining: normalizePactSlotsRemaining(derived.spellcasting.pactSlotsMax, derived.spellcasting.pactSlotsMax),
      deathSaves: {
        successes: 0,
        failures: 0,
      },
    };
  }

  return {
    ...character,
    currentHitPoints: derived.hitPointsMax,
    tempHitPoints: 0,
    hitDiceSpent: 0,
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    spellSlotsRemaining: normalizeSpellSlotsRemaining(derived.spellcasting.spellSlotsMax, derived.spellcasting.spellSlotsMax),
    pactSlotsRemaining: normalizePactSlotsRemaining(derived.spellcasting.pactSlotsMax, derived.spellcasting.pactSlotsMax),
    trackedResources,
  };
}

export function buildSavedSheetPageTwoSummary(character: CharacterRecord, derived: DerivedSheetState) {
  const knownSpells = derived.spellcasting.knownSpells;
  const preparedSpells = derived.spellcasting.preparedSpells;
  const cantripCount = knownSpells.filter((spell) => spell.level === 0).length;
  const leveledSpellCount = knownSpells.length - cantripCount;

  return {
    knownSpellCount: knownSpells.length,
    preparedSpellCount: preparedSpells.length,
    cantripCount,
    leveledSpellCount,
    slotSummary: formatSavedSheetSpellSlotSummary(derived),
    spellNames: knownSpells.map((spell) => spell.name),
    preparedSpellNames: preparedSpells.map((spell) => spell.name),
    appearance: character.sheetProfile.appearance.trim() || "No appearance notes yet.",
    alignment: character.sheetProfile.alignment.trim() || "Unset",
    languages: character.sheetProfile.languages.length > 0 ? character.sheetProfile.languages.join(", ") : "No languages tracked",
    equipmentNotes: character.sheetProfile.equipmentNotes.trim() || "No equipment notes yet.",
    currencySummary: formatSavedSheetCurrencySummary(character.sheetProfile.currencies),
    trackedResources: character.trackedResources,
  };
}
