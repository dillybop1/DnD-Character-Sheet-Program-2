import { SKILL_TO_ABILITY, getArmorTemplate, getBackgroundTemplate, getClassTemplate, getSpeciesTemplate, getSubclassLabel } from "../../shared/data/reference";
import {
  AUTOMATED_DRUID_NATURAL_RECOVERY_ID,
  AUTOMATED_FIGHTER_SECOND_WIND_ID,
  AUTOMATED_PALADIN_LAY_ON_HANDS_ID,
  AUTOMATED_RANGER_TIRELESS_ID,
  AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
  AUTOMATED_SORCERER_SORCERY_POINTS_ID,
  AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID,
  AUTOMATED_WIZARD_ARCANE_RECOVERY_ID,
  buildTrackedResourcesForCharacter,
  isAutomatedTrackedResource,
  normalizeSheetProfile,
  normalizeTrackedResources,
  recoverTrackedResourcesForRest,
  updateTrackedResourceCurrent,
} from "../../shared/sheetTracking";
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

export type SavedSheetSpellBrowseMode = "all" | "prepared" | "cantrips" | "leveled";

export interface SavedSheetSpellFilterOptions {
  query: string;
  mode: SavedSheetSpellBrowseMode;
}

export interface SavedSheetSpellInspectorNavigation {
  currentPosition: number | null;
  previousSpellId: string | null;
  nextSpellId: string | null;
  total: number;
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

export interface SavedSheetHitDiceSummary {
  available: number;
  spent: number;
  max: number;
  hitDie: number;
  hitDieLabel: string;
  averageHealingPerDie: number;
}

export interface SavedSheetTrackedResourceSections {
  needsAttention: TrackedResource[];
  ready: TrackedResource[];
}

export type SavedSheetRecoveryAction =
  | {
      kind: "spellSlots";
      resourceId: string;
      label: string;
      usesRemaining: number;
      usesMax: number;
      notes?: string;
      disabledReason: string | null;
      slotBudget: number;
      maxRecoverableSlotLevel: number;
      recoverableSlotLevels: number[];
    }
  | {
      kind: "pactSlots";
      resourceId: string;
      label: string;
      usesRemaining: number;
      usesMax: number;
      notes?: string;
      disabledReason: string | null;
      recoverAmount: number;
      pactSlotsRemaining: number;
      pactSlotsMax: number;
      pactSlotLevel: number | null;
    }
  | {
      kind: "trackedResource";
      resourceId: string;
      label: string;
      usesRemaining: number;
      usesMax: number;
      notes?: string;
      disabledReason: string | null;
      recoverAmount: number;
      targetResourceId: string;
      targetLabel: string;
      targetCurrent: number;
      targetMax: number;
    };

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
    description: "Spellcasting header, slot and recovery controls, spell table, and spell detail.",
  },
];

function formatSignedValue(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function clampNonNegativeInteger(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
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

function findTrackedResource(resources: TrackedResource[], resourceId: string) {
  return resources.find((resource) => resource.id === resourceId) ?? null;
}

function buildSavedSheetTrackedResources(character: CharacterRecord, derived: DerivedSheetState) {
  return buildTrackedResourcesForCharacter(character, undefined, derived.abilityModifiers);
}

export function buildSavedSheetTrackedResourceSections(
  resources: TrackedResource[],
): SavedSheetTrackedResourceSections {
  const needsAttention: TrackedResource[] = [];
  const ready: TrackedResource[] = [];

  for (const resource of resources) {
    if (resource.current < resource.max) {
      needsAttention.push(resource);
      continue;
    }

    ready.push(resource);
  }

  return {
    needsAttention,
    ready,
  };
}

function getSavedSheetSpellSlotRecoveryBudget(resourceId: string, level: number) {
  if (resourceId !== AUTOMATED_WIZARD_ARCANE_RECOVERY_ID && resourceId !== AUTOMATED_DRUID_NATURAL_RECOVERY_ID) {
    return 0;
  }

  return Math.max(1, Math.ceil(level / 2));
}

function getSavedSheetSpellSlotRecoveryMaxLevel(resourceId: string) {
  if (resourceId !== AUTOMATED_WIZARD_ARCANE_RECOVERY_ID && resourceId !== AUTOMATED_DRUID_NATURAL_RECOVERY_ID) {
    return 0;
  }

  return 5;
}

function getSavedSheetSorcerousRestorationAmount(level: number) {
  return Math.max(0, Math.floor(level / 2));
}

function getSavedSheetAverageHitDieGain(hitDie: number) {
  return Math.floor(hitDie / 2) + 1;
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
    trackedResources: normalizeTrackedResources(character.trackedResources).filter((resource) => !isAutomatedTrackedResource(resource)),
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

export function buildSavedSheetHitDiceSummary(
  character: CharacterRecord,
  derived: DerivedSheetState,
): SavedSheetHitDiceSummary {
  const hitDie = getClassTemplate(character.classId).hitDie;

  return {
    available: Math.max(0, derived.hitDiceMax - character.hitDiceSpent),
    spent: character.hitDiceSpent,
    max: derived.hitDiceMax,
    hitDie,
    hitDieLabel: `d${hitDie}`,
    averageHealingPerDie: Math.max(1, getSavedSheetAverageHitDieGain(hitDie) + derived.abilityModifiers.constitution),
  };
}

export function buildSavedSheetPageOneSummary(character: CharacterRecord, derived: DerivedSheetState) {
  const classLabel = getClassTemplate(character.classId).name;
  const speciesLabel = getSpeciesTemplate(character.speciesId).name;
  const backgroundLabel = getBackgroundTemplate(character.backgroundId).name;
  const subclassLabel = character.subclass
    ? getSubclassLabel(character.classId, character.subclass, character.enabledSourceIds)
    : "No subclass";
  const carriedGear = derived.inventoryEntries.filter((entry) => entry.kind === "gear");
  const trackedResources = buildTrackedResourcesForCharacter(character, undefined, derived.abilityModifiers);

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
    trackedResourceCount: trackedResources.length,
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

export function filterSavedSheetSpellTableRows(
  rows: SavedSheetSpellTableRow[],
  options: SavedSheetSpellFilterOptions,
) {
  const query = options.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (options.mode === "prepared" && !row.prepared) {
      return false;
    }

    if (options.mode === "cantrips" && row.levelLabel !== "Cantrip") {
      return false;
    }

    if (options.mode === "leveled" && row.levelLabel === "Cantrip") {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchText = [
      row.name,
      row.levelLabel,
      row.ritualLabel,
      row.rangeLabel,
      row.saveLabel,
      row.castLabel,
      row.durationLabel,
      row.summary,
      row.description,
      row.higherLevel ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchText.includes(query);
  });
}

export function buildSavedSheetSpellInspectorNavigation(
  rows: SavedSheetSpellTableRow[],
  currentSpellId: string | null,
): SavedSheetSpellInspectorNavigation {
  if (!currentSpellId) {
    return {
      currentPosition: null,
      previousSpellId: null,
      nextSpellId: null,
      total: rows.length,
    };
  }

  const currentIndex = rows.findIndex((row) => row.id === currentSpellId);

  if (currentIndex === -1) {
    return {
      currentPosition: null,
      previousSpellId: null,
      nextSpellId: null,
      total: rows.length,
    };
  }

  return {
    currentPosition: currentIndex + 1,
    previousSpellId: currentIndex > 0 ? rows[currentIndex - 1]?.id ?? null : null,
    nextSpellId: currentIndex < rows.length - 1 ? rows[currentIndex + 1]?.id ?? null : null,
    total: rows.length,
  };
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

export function buildSavedSheetRecoveryActions(
  character: CharacterRecord,
  derived: DerivedSheetState,
): SavedSheetRecoveryAction[] {
  const trackedResources = buildSavedSheetTrackedResources(character, derived);
  const actions: SavedSheetRecoveryAction[] = [];

  for (const resourceId of [AUTOMATED_WIZARD_ARCANE_RECOVERY_ID, AUTOMATED_DRUID_NATURAL_RECOVERY_ID]) {
    const resource = findTrackedResource(trackedResources, resourceId);

    if (!resource) {
      continue;
    }

    const maxRecoverableSlotLevel = getSavedSheetSpellSlotRecoveryMaxLevel(resourceId);
    const slotBudget = getSavedSheetSpellSlotRecoveryBudget(resourceId, character.level);
    const recoverableSlotLevels =
      derived.spellcasting.slotMode === "standard"
        ? derived.spellcasting.spellSlotsMax.flatMap((total, index) => {
            const level = index + 1;
            const remaining = derived.spellcasting.spellSlotsRemaining[index] ?? total;

            if (total <= 0 || remaining >= total || level > maxRecoverableSlotLevel) {
              return [];
            }

            return [level];
          })
        : [];
    const disabledReason =
      resource.current <= 0
        ? "No uses remaining."
        : derived.spellcasting.slotMode !== "standard"
          ? "No standard spell slots are currently tracked."
          : recoverableSlotLevels.length === 0
            ? `No expended spell slots within the level ${maxRecoverableSlotLevel} recovery cap.`
            : null;

    actions.push({
      kind: "spellSlots",
      resourceId: resource.id,
      label: resource.label,
      usesRemaining: resource.current,
      usesMax: resource.max,
      notes: resource.notes,
      disabledReason,
      slotBudget,
      maxRecoverableSlotLevel,
      recoverableSlotLevels,
    });
  }

  const magicalCunning = findTrackedResource(trackedResources, AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID);

  if (magicalCunning) {
    const recoverAmount = Math.max(0, derived.spellcasting.pactSlotsMax - derived.spellcasting.pactSlotsRemaining);
    const disabledReason =
      magicalCunning.current <= 0
        ? "No uses remaining."
        : derived.spellcasting.pactSlotsMax <= 0
          ? "No Pact Magic slots are currently tracked."
          : recoverAmount <= 0
            ? "All Pact Magic slots are already available."
            : null;

    actions.push({
      kind: "pactSlots",
      resourceId: magicalCunning.id,
      label: magicalCunning.label,
      usesRemaining: magicalCunning.current,
      usesMax: magicalCunning.max,
      notes: magicalCunning.notes,
      disabledReason,
      recoverAmount,
      pactSlotsRemaining: derived.spellcasting.pactSlotsRemaining,
      pactSlotsMax: derived.spellcasting.pactSlotsMax,
      pactSlotLevel: derived.spellcasting.pactSlotLevel,
    });
  }

  const sorcerousRestoration = findTrackedResource(trackedResources, AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID);
  const sorceryPoints = findTrackedResource(trackedResources, AUTOMATED_SORCERER_SORCERY_POINTS_ID);

  if (sorcerousRestoration) {
    const recoverAmount = sorceryPoints
      ? Math.min(
          Math.max(0, sorceryPoints.max - sorceryPoints.current),
          getSavedSheetSorcerousRestorationAmount(character.level),
        )
      : 0;
    const disabledReason =
      sorcerousRestoration.current <= 0
        ? "No uses remaining."
        : !sorceryPoints
          ? "No Sorcery Points tracker is currently available."
          : recoverAmount <= 0
            ? "Sorcery Points are already full."
            : null;

    actions.push({
      kind: "trackedResource",
      resourceId: sorcerousRestoration.id,
      label: sorcerousRestoration.label,
      usesRemaining: sorcerousRestoration.current,
      usesMax: sorcerousRestoration.max,
      notes: sorcerousRestoration.notes,
      disabledReason,
      recoverAmount,
      targetResourceId: sorceryPoints?.id ?? AUTOMATED_SORCERER_SORCERY_POINTS_ID,
      targetLabel: sorceryPoints?.label ?? "Sorcery Points",
      targetCurrent: sorceryPoints?.current ?? 0,
      targetMax: sorceryPoints?.max ?? 0,
    });
  }

  return actions;
}

export function getSavedSheetDefaultSpellId(spells: SavedSheetSpellTableRow[]) {
  return spells.find((spell) => spell.prepared)?.id ?? spells[0]?.id ?? null;
}

export function applySavedSheetRest(
  character: CharacterRecord,
  derived: DerivedSheetState,
  restKind: SavedSheetRestKind,
): CharacterRecord {
  const trackedResources = recoverTrackedResourcesForRest(
    buildTrackedResourcesForCharacter(character, undefined, derived.abilityModifiers),
    restKind,
  );

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

export function applySavedSheetHitDiceSpend(
  character: CharacterRecord,
  derived: DerivedSheetState,
  spendAmount: number,
  mode: "spendOnly" | "averageHeal" = "spendOnly",
): CharacterRecord {
  const summary = buildSavedSheetHitDiceSummary(character, derived);
  const requestedAmount = clampNonNegativeInteger(spendAmount);

  if (requestedAmount <= 0 || summary.available <= 0) {
    return character;
  }

  if (mode === "averageHeal" && character.currentHitPoints >= derived.hitPointsMax) {
    return character;
  }

  const appliedAmount = Math.min(requestedAmount, summary.available);
  const nextHitDiceSpent = Math.min(derived.hitDiceMax, character.hitDiceSpent + appliedAmount);
  const nextCurrentHitPoints =
    mode === "averageHeal"
      ? Math.min(derived.hitPointsMax, character.currentHitPoints + appliedAmount * summary.averageHealingPerDie)
      : character.currentHitPoints;

  if (
    nextHitDiceSpent === character.hitDiceSpent &&
    nextCurrentHitPoints === character.currentHitPoints
  ) {
    return character;
  }

  return {
    ...character,
    currentHitPoints: nextCurrentHitPoints,
    hitDiceSpent: nextHitDiceSpent,
  };
}

export function updateSavedSheetSpellSlotsRemaining(
  character: CharacterRecord,
  derived: DerivedSheetState,
  slotIndex: number,
  nextRemaining: number,
): CharacterRecord {
  const nextSpellSlotsRemaining = [...character.spellSlotsRemaining];
  nextSpellSlotsRemaining[slotIndex] = nextRemaining;

  return {
    ...character,
    spellSlotsRemaining: normalizeSpellSlotsRemaining(nextSpellSlotsRemaining, derived.spellcasting.spellSlotsMax),
  };
}

export function updateSavedSheetPactSlotsRemaining(
  character: CharacterRecord,
  derived: DerivedSheetState,
  nextRemaining: number,
): CharacterRecord {
  return {
    ...character,
    pactSlotsRemaining: normalizePactSlotsRemaining(nextRemaining, derived.spellcasting.pactSlotsMax),
  };
}

export function applySavedSheetTrackedResourceDelta(
  character: CharacterRecord,
  derived: DerivedSheetState,
  resourceId: string,
  delta: number,
): CharacterRecord {
  if (delta === 0) {
    return character;
  }

  const trackedResources = buildSavedSheetTrackedResources(character, derived);
  const resource = findTrackedResource(trackedResources, resourceId);

  if (!resource) {
    return character;
  }

  const nextCurrent = Math.max(0, Math.min(resource.max, resource.current + delta));

  if (nextCurrent === resource.current) {
    return character;
  }

  return {
    ...character,
    trackedResources: updateTrackedResourceCurrent(trackedResources, resourceId, nextCurrent),
  };
}

export function applySavedSheetLayOnHandsHealing(
  character: CharacterRecord,
  derived: DerivedSheetState,
  healAmount: number,
): CharacterRecord {
  const trackedResources = buildSavedSheetTrackedResources(character, derived);
  const resource = findTrackedResource(trackedResources, AUTOMATED_PALADIN_LAY_ON_HANDS_ID);
  const requestedAmount = clampNonNegativeInteger(healAmount);
  const missingHitPoints = Math.max(0, derived.hitPointsMax - character.currentHitPoints);

  if (!resource || requestedAmount <= 0 || missingHitPoints <= 0 || resource.current <= 0) {
    return character;
  }

  const appliedAmount = Math.min(requestedAmount, resource.current, missingHitPoints);

  if (appliedAmount <= 0) {
    return character;
  }

  return {
    ...character,
    currentHitPoints: character.currentHitPoints + appliedAmount,
    trackedResources: updateTrackedResourceCurrent(trackedResources, resource.id, resource.current - appliedAmount),
  };
}

export function applySavedSheetSecondWindHealing(
  character: CharacterRecord,
  derived: DerivedSheetState,
): CharacterRecord {
  const trackedResources = buildSavedSheetTrackedResources(character, derived);
  const resource = findTrackedResource(trackedResources, AUTOMATED_FIGHTER_SECOND_WIND_ID);
  const missingHitPoints = Math.max(0, derived.hitPointsMax - character.currentHitPoints);
  const averageHealing = 6 + character.level;

  if (!resource || resource.current <= 0 || missingHitPoints <= 0) {
    return character;
  }

  const appliedHealing = Math.min(missingHitPoints, averageHealing);

  if (appliedHealing <= 0) {
    return character;
  }

  return {
    ...character,
    currentHitPoints: character.currentHitPoints + appliedHealing,
    trackedResources: updateTrackedResourceCurrent(trackedResources, resource.id, resource.current - 1),
  };
}

export function applySavedSheetTirelessTempHitPoints(
  character: CharacterRecord,
  derived: DerivedSheetState,
): CharacterRecord {
  const trackedResources = buildSavedSheetTrackedResources(character, derived);
  const resource = findTrackedResource(trackedResources, AUTOMATED_RANGER_TIRELESS_ID);
  const nextTempHitPoints = Math.max(1, 5 + derived.abilityModifiers.wisdom);

  if (!resource || resource.current <= 0 || nextTempHitPoints <= character.tempHitPoints) {
    return character;
  }

  return {
    ...character,
    tempHitPoints: nextTempHitPoints,
    trackedResources: updateTrackedResourceCurrent(trackedResources, resource.id, resource.current - 1),
  };
}

export function applySavedSheetMagicalCunning(
  character: CharacterRecord,
  derived: DerivedSheetState,
): CharacterRecord {
  const action = buildSavedSheetRecoveryActions(character, derived).find(
    (candidate): candidate is Extract<SavedSheetRecoveryAction, { kind: "pactSlots" }> =>
      candidate.kind === "pactSlots" && candidate.resourceId === AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID,
  );

  if (!action || action.disabledReason) {
    return character;
  }

  const trackedResources = updateTrackedResourceCurrent(
    buildSavedSheetTrackedResources(character, derived),
    action.resourceId,
    action.usesRemaining - 1,
  );

  return {
    ...character,
    pactSlotsRemaining: normalizePactSlotsRemaining(action.pactSlotsMax, action.pactSlotsMax),
    trackedResources,
  };
}

export function applySavedSheetSorcerousRestoration(
  character: CharacterRecord,
  derived: DerivedSheetState,
): CharacterRecord {
  const action = buildSavedSheetRecoveryActions(character, derived).find(
    (candidate): candidate is Extract<SavedSheetRecoveryAction, { kind: "trackedResource" }> =>
      candidate.kind === "trackedResource" && candidate.resourceId === AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
  );

  if (!action || action.disabledReason) {
    return character;
  }

  const trackedResources = updateTrackedResourceCurrent(
    updateTrackedResourceCurrent(
      buildSavedSheetTrackedResources(character, derived),
      action.targetResourceId,
      action.targetCurrent + action.recoverAmount,
    ),
    action.resourceId,
    action.usesRemaining - 1,
  );

  return {
    ...character,
    trackedResources,
  };
}

export function applySavedSheetSpellSlotRecovery(
  character: CharacterRecord,
  derived: DerivedSheetState,
  resourceId: string,
  recoveriesBySlotIndex: number[],
): CharacterRecord {
  const action = buildSavedSheetRecoveryActions(character, derived).find(
    (candidate): candidate is Extract<SavedSheetRecoveryAction, { kind: "spellSlots" }> =>
      candidate.kind === "spellSlots" && candidate.resourceId === resourceId,
  );

  if (!action || action.disabledReason || derived.spellcasting.slotMode !== "standard") {
    return character;
  }

  const nextRecoveries = derived.spellcasting.spellSlotsMax.map((_, index) =>
    clampNonNegativeInteger(recoveriesBySlotIndex[index] ?? 0),
  );
  let totalRecoveredLevels = 0;

  for (const [index, quantity] of nextRecoveries.entries()) {
    if (quantity <= 0) {
      continue;
    }

    const slotLevel = index + 1;
    const total = derived.spellcasting.spellSlotsMax[index] ?? 0;
    const remaining = derived.spellcasting.spellSlotsRemaining[index] ?? total;
    const expended = Math.max(0, total - remaining);

    if (
      slotLevel > action.maxRecoverableSlotLevel ||
      total <= 0 ||
      quantity > expended
    ) {
      return character;
    }

    totalRecoveredLevels += slotLevel * quantity;
  }

  if (totalRecoveredLevels <= 0 || totalRecoveredLevels > action.slotBudget) {
    return character;
  }

  const nextSpellSlotsRemaining = derived.spellcasting.spellSlotsMax.map((total, index) => {
    const remaining = derived.spellcasting.spellSlotsRemaining[index] ?? total;
    return remaining + nextRecoveries[index];
  });
  const trackedResources = updateTrackedResourceCurrent(
    buildSavedSheetTrackedResources(character, derived),
    action.resourceId,
    action.usesRemaining - 1,
  );

  return {
    ...character,
    spellSlotsRemaining: normalizeSpellSlotsRemaining(nextSpellSlotsRemaining, derived.spellcasting.spellSlotsMax),
    trackedResources,
  };
}

export function buildSavedSheetPageTwoSummary(character: CharacterRecord, derived: DerivedSheetState) {
  const trackedResources = buildTrackedResourcesForCharacter(character, undefined, derived.abilityModifiers);
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
    trackedResources,
  };
}
