import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { calculateDerivedState } from "../../shared/calculations";
import {
  getArmorTemplate,
  getBackgroundTemplate,
  getFeatSelectionConstraintMessage,
  getFeatTemplate,
  getGearTemplate,
  getClassTemplate,
  getSubclassLabel,
  isFeatSelectable,
  getWeaponTemplate,
  listArmorTemplates,
  listBackgroundTemplates,
  listClassTemplates,
  listGearTemplates,
  listSubclassTemplates,
  listSpeciesTemplates,
  listWeaponTemplates,
  sanitizeFeatState,
  normalizeSubclassSelection,
} from "../../shared/data/reference";
import { findCompendiumEntry, listCompendiumEntries, listCompendiumSpells, spellRecordFromCompendium } from "../../shared/data/compendiumSeed";
import {
  createInventoryItem,
  deriveLegacyLoadout,
  isInventoryItemEquipable,
  listInventoryEntries,
  mergeInventorySuggestions,
  normalizeInventory,
} from "../../shared/inventory";
import { normalizePactSlotsRemaining, normalizeSpellSlotsRemaining } from "../../shared/spellSlots";
import { ABILITY_NAMES, SKILL_NAMES } from "../../shared/types";
import type { AbilityName, BuilderInput, CharacterRecord, CompendiumEntry, HomebrewEntry, InventoryItemRecord, InventoryItemKind, SkillName } from "../../shared/types";
import { CompendiumEntryDetail } from "../components/CompendiumEntryDetail";
import { EquipmentSelectionBrowser, type EquipmentBrowserEntry } from "../components/EquipmentSelectionBrowser";
import { FeatChoiceBrowser } from "../components/FeatChoiceBrowser";
import { FeatSelectionBrowser } from "../components/FeatSelectionBrowser";
import { InventoryManagerBrowser, type InventoryBrowserEntry } from "../components/InventoryManagerBrowser";
import { LockedSheetViewport } from "../components/LockedSheetViewport";
import { LoadoutManagerCard } from "../components/LoadoutManagerCard";
import { SectionCard } from "../components/SectionCard";
import { SheetPreview } from "../components/SheetPreview";
import { SpellSelectionBrowser } from "../components/SpellSelectionBrowser";
import { getArmorReferenceSlug, RULE_REFERENCE_SLUGS } from "../lib/compendiumLinks";
import { buildCompendiumEntryPath, type CompendiumHandoffState } from "../lib/compendiumNavigation";
import { dndApi } from "../lib/api";
import {
  areSameAbilityScores,
  areSameSkillProficiencies,
  areSameSpellSelections,
  buildClassStarterSkillProficiencies,
  buildClassStarterSpellSelection,
  buildClassStandardAbilityScores,
  buildPreviewCharacter,
  builderInputFromCharacter,
  createDefaultBuilderInput,
  humanizeLabel,
  mergeSuggestedSkillProficiencies,
} from "../lib/editor";

const ABILITY_SHORT_LABELS: Record<AbilityName, string> = {
  strength: "Str",
  dexterity: "Dex",
  constitution: "Con",
  intelligence: "Int",
  wisdom: "Wis",
  charisma: "Cha",
};

function readSpellLevel(entry: CompendiumEntry) {
  return typeof entry.payload.level === "number" ? entry.payload.level : 0;
}

function areSameStringArrays(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function areSameNumberArrays(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function areSameStringArrayRecords(left: Record<string, string[]>, right: Record<string, string[]>) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();

  return (
    areSameStringArrays(leftKeys, rightKeys) &&
    leftKeys.every((key) => areSameStringArrays(left[key] ?? [], right[key] ?? []))
  );
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

function sanitizeMagicInitiateSelections(
  bonusSpellIds: string[],
  availableSpells: CompendiumEntry[],
) {
  const availableIds = new Set(availableSpells.map((entry) => entry.slug));
  const cantripIds = new Set(availableSpells.filter((entry) => readSpellLevel(entry) === 0).map((entry) => entry.slug));
  const leveledIds = new Set(availableSpells.filter((entry) => readSpellLevel(entry) > 0).map((entry) => entry.slug));
  const filteredIds = bonusSpellIds.filter((spellId) => availableIds.has(spellId));
  const nextCantripIds = filteredIds.filter((spellId) => cantripIds.has(spellId)).slice(0, 2);
  const nextLeveledIds = filteredIds.filter((spellId) => leveledIds.has(spellId)).slice(0, 1);
  const nextBonusSpellIds = [...nextCantripIds, ...nextLeveledIds];

  return {
    bonusSpellIds: nextBonusSpellIds,
    changed: !areSameStringArrays(bonusSpellIds, nextBonusSpellIds),
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

    return `${spellcasting.pactSlotsRemaining}/${spellcasting.pactSlotsMax} pact slots at level ${spellcasting.pactSlotLevel}`;
  }

  if (spellcasting.spellSlotsMax.length === 0) {
    return "No class slots";
  }

  return spellcasting.spellSlotsMax
    .map((value, index) => `L${index + 1}:${spellcasting.spellSlotsRemaining[index] ?? value}/${value}`)
    .join(" ");
}

function sanitizeInventoryQuantity(value: number) {
  return Math.max(1, Math.floor(Number.isFinite(value) ? value : 1) || 1);
}

function sanitizeNonNegativeInteger(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function sanitizeTrackCount(value: number, max: number) {
  return Math.max(0, Math.min(max, sanitizeNonNegativeInteger(value)));
}

function inventoryTemplateLabel(templateType: InventoryItemKind, templateId: string) {
  if (templateType === "armor") {
    return getArmorTemplate(templateId).name;
  }

  if (templateType === "weapon") {
    return getWeaponTemplate(templateId)?.name ?? humanizeLabel(templateId.replaceAll("-", " "));
  }

  return getGearTemplate(templateId)?.name ?? humanizeLabel(templateId.replaceAll("-", " "));
}

function formatAbilityScoreRecommendation(
  abilityOrder: AbilityName[],
  abilities: Record<AbilityName, number>,
) {
  return abilityOrder.map((ability) => `${ABILITY_SHORT_LABELS[ability]} ${abilities[ability]}`).join(", ");
}

function buildArmorBrowseCategory(armorId: string) {
  if (armorId === "unarmored") {
    return "Unarmored";
  }

  if (armorId === "leather" || armorId === "studded-leather") {
    return "Light";
  }

  if (armorId === "scale-mail" || armorId === "breastplate") {
    return "Medium";
  }

  return "Heavy";
}

function buildEquipmentBrowseEntries(
  availableArmor: ReturnType<typeof listArmorTemplates>,
  availableWeapons: ReturnType<typeof listWeaponTemplates>,
  availableGear: ReturnType<typeof listGearTemplates>,
) {
  const armorEntries: EquipmentBrowserEntry[] = availableArmor.map((armor) => ({
    key: `armor:${armor.id}`,
    templateType: "armor",
    templateId: armor.id,
    referenceSlug: armor.id,
    name: armor.name,
    category: buildArmorBrowseCategory(armor.id),
    summary: armor.notes ?? `AC ${armor.baseArmorClass}`,
    searchText: [armor.name, buildArmorBrowseCategory(armor.id), armor.notes ?? "", "armor"].join(" ").toLowerCase(),
  }));
  const weaponEntries: EquipmentBrowserEntry[] = availableWeapons.map((weapon) => ({
    key: `weapon:${weapon.id}`,
    templateType: "weapon",
    templateId: weapon.id,
    referenceSlug: weapon.id,
    name: weapon.name,
    category: weapon.ranged ? "Ranged" : "Melee",
    summary: `${weapon.damage} ${weapon.damageType}${weapon.notes ? `, ${weapon.notes}` : ""}`,
    searchText: [weapon.name, weapon.damage, weapon.damageType, weapon.notes ?? "", weapon.ranged ? "ranged" : "melee", weapon.finesse ? "finesse" : ""]
      .join(" ")
      .toLowerCase(),
  }));
  const gearEntries: EquipmentBrowserEntry[] = availableGear.map((gear) => ({
    key: `gear:${gear.id}`,
    templateType: "gear",
    templateId: gear.id,
    referenceSlug: gear.id,
    name: gear.name,
    category: humanizeLabel(gear.category),
    summary:
      gear.notes ?? (gear.armorClassBonus ? `+${gear.armorClassBonus} Armor Class while equipped` : humanizeLabel(gear.category)),
    searchText: [gear.name, gear.category, gear.notes ?? "", gear.equipable ? "equipable" : ""].join(" ").toLowerCase(),
  }));

  return [...armorEntries, ...weaponEntries, ...gearEntries];
}

function buildInventoryBrowseEntries(
  inventoryEntries: ReturnType<typeof listInventoryEntries>,
  draftInventoryById: Map<string, InventoryItemRecord>,
) {
  return inventoryEntries.map((entry): InventoryBrowserEntry => {
    const rawInventoryEntry = draftInventoryById.get(entry.id);

    if (entry.kind === "armor") {
      const armor = getArmorTemplate(rawInventoryEntry?.templateId ?? "unarmored");

      return {
        id: entry.id,
        kind: entry.kind,
        templateId: rawInventoryEntry?.templateId ?? "unarmored",
        name: entry.name,
        quantity: entry.quantity,
        equipped: entry.equipped,
        equipable: Boolean(rawInventoryEntry && isInventoryItemEquipable(rawInventoryEntry)),
        category: buildArmorBrowseCategory(rawInventoryEntry?.templateId ?? "unarmored"),
        summary: entry.notes ?? armor.notes ?? `AC ${armor.baseArmorClass}`,
        searchText: [entry.name, buildArmorBrowseCategory(rawInventoryEntry?.templateId ?? "unarmored"), entry.notes ?? armor.notes ?? "", entry.kind]
          .join(" ")
          .toLowerCase(),
        referenceSlug: entry.referenceSlug,
      };
    }

    if (entry.kind === "weapon") {
      const weapon = rawInventoryEntry ? getWeaponTemplate(rawInventoryEntry.templateId) : null;

      return {
        id: entry.id,
        kind: entry.kind,
        templateId: rawInventoryEntry?.templateId ?? "",
        name: entry.name,
        quantity: entry.quantity,
        equipped: entry.equipped,
        equipable: Boolean(rawInventoryEntry && isInventoryItemEquipable(rawInventoryEntry)),
        category: weapon?.ranged ? "Ranged" : "Melee",
        summary: entry.notes ?? (weapon ? `${weapon.damage} ${weapon.damageType}` : "Tracked weapon"),
        searchText: [entry.name, weapon?.damage ?? "", weapon?.damageType ?? "", weapon?.notes ?? "", weapon?.ranged ? "ranged" : "melee", entry.notes ?? "", entry.kind]
          .join(" ")
          .toLowerCase(),
        referenceSlug: entry.referenceSlug,
      };
    }

    const gear = rawInventoryEntry ? getGearTemplate(rawInventoryEntry.templateId) : null;

    return {
      id: entry.id,
      kind: entry.kind,
      templateId: rawInventoryEntry?.templateId ?? "",
      name: entry.name,
      quantity: entry.quantity,
      equipped: entry.equipped,
      equipable: Boolean(rawInventoryEntry && isInventoryItemEquipable(rawInventoryEntry)),
      category: humanizeLabel(gear?.category ?? "gear"),
      summary: entry.notes ?? gear?.notes ?? "Tracked gear",
      searchText: [entry.name, gear?.category ?? "", gear?.notes ?? "", entry.notes ?? "", entry.kind].join(" ").toLowerCase(),
      referenceSlug: entry.referenceSlug,
    };
  });
}

export function CharactersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { characterId } = useParams();
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRecord | null>(null);
  const [draft, setDraft] = useState<BuilderInput>(createDefaultBuilderInput());
  const [homebrewEntries, setHomebrewEntries] = useState<HomebrewEntry[]>([]);
  const [message, setMessage] = useState(
    characterId ? "Update the builder fields and save changes." : "Create a new character draft.",
  );
  const [referenceEntry, setReferenceEntry] = useState<CompendiumEntry | null>(null);
  const [referenceStatus, setReferenceStatus] = useState(
    "Click a class, subclass, spell, weapon, armor, gear, or rule label to inspect it here.",
  );
  const [loading, setLoading] = useState(true);
  const [missingCharacter, setMissingCharacter] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      const [entries, record] = await Promise.all([
        dndApi.homebrew.list(),
        characterId ? dndApi.characters.get(characterId) : Promise.resolve(null),
      ]);

      if (isCancelled) {
        return;
      }

      setHomebrewEntries(entries);

      if (!characterId) {
        setMissingCharacter(false);
        setSelectedCharacter(null);
        setDraft(createDefaultBuilderInput());
        setLoading(false);
        return;
      }

      if (!record) {
        setMissingCharacter(true);
        setSelectedCharacter(null);
        setDraft(createDefaultBuilderInput());
        setMessage("The requested character could not be loaded.");
        setLoading(false);
        return;
      }

      setMissingCharacter(false);
      setSelectedCharacter(record);
      setDraft(builderInputFromCharacter(record));
      setLoading(false);
    }

    setLoading(true);
    bootstrap().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }

      setMessage(error instanceof Error ? error.message : "Failed to load local data.");
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [characterId]);

  const activeHomebrew = homebrewEntries.filter((entry) => draft.homebrewIds.includes(entry.id));
  const previewCharacter = buildPreviewCharacter(draft, selectedCharacter, activeHomebrew);
  const derived = calculateDerivedState(previewCharacter, activeHomebrew);
  const selectedClass = getClassTemplate(draft.classId);
  const classStandardAbilities = buildClassStandardAbilityScores(draft.classId);
  const classStandardAbilitySummary = formatAbilityScoreRecommendation(
    selectedClass.standardAbilityOrder,
    classStandardAbilities,
  );
  const classStandardArrayApplied = areSameAbilityScores(draft.abilities, classStandardAbilities);
  const availableClasses = listClassTemplates(draft.enabledSourceIds);
  const availableSubclasses = listSubclassTemplates(draft.classId, draft.enabledSourceIds);
  const availableSpecies = listSpeciesTemplates(draft.enabledSourceIds);
  const availableBackgrounds = listBackgroundTemplates(draft.enabledSourceIds);
  const selectedBackground = getBackgroundTemplate(draft.backgroundId);
  const backgroundTheme = selectedBackground.theme;
  const backgroundSuggestedSkills = selectedBackground.suggestedSkills.filter((skill): skill is SkillName =>
    SKILL_NAMES.includes(skill),
  );
  const backgroundFeatureSummary = selectedBackground.featureSummary;
  const backgroundStartingInventory = selectedBackground.startingInventory;
  const classStarterSkills = selectedClass.starterSkillIds.filter((skill): skill is SkillName =>
    SKILL_NAMES.includes(skill),
  );
  const classStarterSkillsApplied = classStarterSkills.every((skill) => {
    const level = draft.skillProficiencies[skill];
    return level === "proficient" || level === "expertise";
  });
  const backgroundSuggestedSkillsApplied = backgroundSuggestedSkills.every((skill) => {
    const level = draft.skillProficiencies[skill];
    return level === "proficient" || level === "expertise";
  });
  const availableArmor = listArmorTemplates(draft.enabledSourceIds);
  const availableWeapons = listWeaponTemplates(draft.enabledSourceIds);
  const availableGear = listGearTemplates(draft.enabledSourceIds);
  const availableFeats = listCompendiumEntries("feat", draft.enabledSourceIds);
  const featContext = {
    classId: draft.classId,
    skillProficiencies: draft.skillProficiencies,
    featSelections: draft.featSelections,
  };
  const skillProficiencyScopeKey = Object.entries(draft.skillProficiencies)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([skill, level]) => `${skill}:${level}`)
    .join("|");
  const featBrowseScopeKey = `feats:${draft.classId}:${draft.enabledSourceIds.join("|")}:${skillProficiencyScopeKey}`;
  const draftFeatState = sanitizeFeatState(draft.featIds, draft.featSelections, featContext);
  const featAvailabilityById = new Map(
    availableFeats.map((feat) => [
      feat.slug,
      {
        selectable: isFeatSelectable(feat.slug, featContext),
        constraintMessage: getFeatSelectionConstraintMessage(feat.slug, featContext),
      },
    ] as const),
  );
  const magicInitiateSelected = draftFeatState.featIds.includes("magic-initiate");
  const magicInitiateSourceClasses = availableClasses.filter(
    (entry) => entry.spellcastingAbility !== null && listCompendiumSpells(draft.enabledSourceIds, entry.name).length > 0,
  );
  const selectedMagicInitiateClass =
    magicInitiateSelected && draft.bonusSpellClassId ? getClassTemplate(draft.bonusSpellClassId) : null;
  const magicInitiateSpellOptions =
    magicInitiateSelected && selectedMagicInitiateClass
      ? listCompendiumSpells(draft.enabledSourceIds, selectedMagicInitiateClass.name)
      : [];
  const magicInitiateUsesSeparateLine =
    Boolean(
      magicInitiateSelected &&
        selectedMagicInitiateClass?.spellcastingAbility &&
        derived.spellcasting.spellcastingAbility &&
        selectedMagicInitiateClass.spellcastingAbility !== derived.spellcasting.spellcastingAbility,
    );
  const draftInventory = normalizeInventory(draft);
  const draftInventoryById = new Map(draftInventory.map((item) => [item.id, item] as const));
  const inventoryEntries = listInventoryEntries(draft);
  const inventoryLoadout = deriveLegacyLoadout(draftInventory);
  const suggestedBackgroundInventoryMerge = mergeInventorySuggestions(draftInventory, backgroundStartingInventory);
  const backgroundStartingGearApplied =
    suggestedBackgroundInventoryMerge.addedCount === 0 && suggestedBackgroundInventoryMerge.updatedCount === 0;
  const inventoryBrowseEntries = buildInventoryBrowseEntries(inventoryEntries, draftInventoryById);
  const loadoutArmorEntries = inventoryBrowseEntries.filter((entry) => entry.kind === "armor");
  const loadoutShieldEntries = inventoryBrowseEntries.filter(
    (entry) => entry.kind === "gear" && entry.templateId === "shield",
  );
  const loadoutWeaponEntries = inventoryBrowseEntries.filter((entry) => entry.kind === "weapon");
  const trackedEquipmentStateByKey = draftInventory.reduce((accumulator, item) => {
    const key = `${item.templateType}:${item.templateId}`;
    const current = accumulator.get(key) ?? { quantity: 0, equippedCount: 0 };

    accumulator.set(key, {
      quantity: current.quantity + item.quantity,
      equippedCount: current.equippedCount + (item.equipped ? 1 : 0),
    });

    return accumulator;
  }, new Map<string, { quantity: number; equippedCount: number }>());
  const equipmentBrowseEntries = buildEquipmentBrowseEntries(availableArmor, availableWeapons, availableGear);
  const classSpellOptions =
    selectedClass.spellcastingAbility === null ? [] : listCompendiumSpells(draft.enabledSourceIds, selectedClass.name);
  const classStarterSpellSelection = buildClassStarterSpellSelection(draft.classId, draft.enabledSourceIds);
  const classStarterSpellEntries = classStarterSpellSelection.spellIds
    .map((spellId) => classSpellOptions.find((entry) => entry.slug === spellId))
    .filter((entry): entry is CompendiumEntry => Boolean(entry));
  const classHasStarterSpellPackage = classStarterSpellEntries.length > 0;
  const classStarterCantripEntries = classStarterSpellEntries.filter((entry) => readSpellLevel(entry) === 0);
  const classStarterLeveledEntries = classStarterSpellEntries.filter((entry) => readSpellLevel(entry) > 0);
  const classStarterSpellsApplied =
    !classHasStarterSpellPackage ||
    areSameSpellSelections(
      draft.spellIds,
      draft.preparedSpellIds,
      classStarterSpellSelection.spellIds,
      classStarterSpellSelection.preparedSpellIds,
    );
  const quickStartSetupApplied =
    classStandardArrayApplied &&
    classStarterSkillsApplied &&
    backgroundSuggestedSkillsApplied &&
    backgroundStartingGearApplied &&
    classStarterSpellsApplied;
  const selectedSpellEntries = draft.spellIds
    .map((spellId) => classSpellOptions.find((entry) => entry.slug === spellId))
    .filter((entry): entry is CompendiumEntry => Boolean(entry));
  const selectedCantripEntries = selectedSpellEntries.filter((entry) => readSpellLevel(entry) === 0);
  const selectedLeveledEntries = selectedSpellEntries.filter((entry) => readSpellLevel(entry) > 0);
  const selectedMagicInitiateEntries = draft.bonusSpellIds
    .map((spellId) => magicInitiateSpellOptions.find((entry) => entry.slug === spellId))
    .filter((entry): entry is CompendiumEntry => Boolean(entry));
  const selectedMagicInitiateCantrips = selectedMagicInitiateEntries.filter((entry) => readSpellLevel(entry) === 0);
  const selectedMagicInitiateLeveled = selectedMagicInitiateEntries.filter((entry) => readSpellLevel(entry) > 0);
  const selectedFeatTemplates = draftFeatState.featIds
    .map((featId) => getFeatTemplate(featId))
    .filter((entry): entry is NonNullable<ReturnType<typeof getFeatTemplate>> => Boolean(entry));
  const selectedConfigurableFeats = selectedFeatTemplates.filter((entry) => (entry.choiceGroups?.length ?? 0) > 0);
  const selectedFeatEntries = draftFeatState.featIds
    .map((featId) => findCompendiumEntry(featId))
    .filter((entry): entry is CompendiumEntry => Boolean(entry && entry.type === "feat"));
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
  const magicInitiateMessage = !magicInitiateSelected
    ? ""
    : !draft.bonusSpellClassId
        ? "Choose a supported spell list, then pick up to two cantrips and one leveled spell."
        : magicInitiateUsesSeparateLine
          ? `Choose up to two cantrips and one leveled spell from the seeded ${selectedMagicInitiateClass?.name.toLowerCase() ?? "selected"} list. These feat spells use a separate spell attack bonus and save DC line.`
          : `Choose up to two cantrips and one leveled spell from the seeded ${selectedMagicInitiateClass?.name.toLowerCase() ?? "selected"} list. These feat spells share the current spell attack bonus and save DC line.`;
  const hasLegacySubclassValue =
    draft.subclass.trim().length > 0 &&
    !availableSubclasses.some((entry) => entry.id === draft.subclass);

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

  useEffect(() => {
    setDraft((current) => {
      const nextFeatState = sanitizeFeatState(current.featIds, current.featSelections, {
        classId: current.classId,
        skillProficiencies: current.skillProficiencies,
      });
      const featIdsChanged = !areSameStringArrays(current.featIds, nextFeatState.featIds);
      const featSelectionsChanged = !areSameStringArrayRecords(current.featSelections, nextFeatState.featSelections);

      if (!featIdsChanged && !featSelectionsChanged) {
        return current;
      }

      if (featIdsChanged) {
        setMessage("Some feats were removed because the current class or skill state no longer supports their required choices.");
      }

      return {
        ...current,
        featIds: nextFeatState.featIds,
        featSelections: nextFeatState.featSelections,
      };
    });
  }, [draft.classId, draft.skillProficiencies, draft.featIds, draft.featSelections]);

  useEffect(() => {
    setDraft((current) => {
      const magicInitiateEnabled = current.featIds.includes("magic-initiate");

      if (!magicInitiateEnabled) {
        if (!current.bonusSpellClassId && current.bonusSpellIds.length === 0) {
          return current;
        }

        return {
          ...current,
          bonusSpellClassId: "",
          bonusSpellIds: [],
        };
      }

      const validSourceClass = listClassTemplates(current.enabledSourceIds).filter(
        (entry) => entry.spellcastingAbility !== null && listCompendiumSpells(current.enabledSourceIds, entry.name).length > 0,
      );
      const nextBonusSpellClassId = validSourceClass.some((entry) => entry.id === current.bonusSpellClassId)
        ? current.bonusSpellClassId
        : "";
      const availableBonusSpells = nextBonusSpellClassId
        ? listCompendiumSpells(current.enabledSourceIds, getClassTemplate(nextBonusSpellClassId).name)
        : [];
      const sanitizedBonusSpells = sanitizeMagicInitiateSelections(current.bonusSpellIds, availableBonusSpells);

      if (
        nextBonusSpellClassId === current.bonusSpellClassId &&
        !sanitizedBonusSpells.changed
      ) {
        return current;
      }

      return {
        ...current,
        bonusSpellClassId: nextBonusSpellClassId,
        bonusSpellIds: sanitizedBonusSpells.bonusSpellIds,
      };
    });
  }, [draft.classId, draft.enabledSourceIds, draft.featIds, draft.bonusSpellClassId, draft.bonusSpellIds]);

  useEffect(() => {
    setDraft((current) => {
      const normalizedSubclass = normalizeSubclassSelection(current.classId, current.subclass, current.enabledSourceIds);

      if (normalizedSubclass === current.subclass) {
        return current;
      }

      return {
        ...current,
        subclass: normalizedSubclass,
      };
    });
  }, [draft.classId, draft.enabledSourceIds, draft.subclass]);

  useEffect(() => {
    setDraft((current) => {
      const nextCurrentHitPoints = Math.min(sanitizeNonNegativeInteger(current.currentHitPoints), derived.hitPointsMax);
      const nextTempHitPoints = sanitizeNonNegativeInteger(current.tempHitPoints);
      const nextHitDiceSpent = Math.min(sanitizeNonNegativeInteger(current.hitDiceSpent), derived.hitDiceMax);
      const nextSpellSlotsRemaining = normalizeSpellSlotsRemaining(
        current.spellSlotsRemaining,
        derived.spellcasting.spellSlotsMax,
      );
      const nextPactSlotsRemaining = normalizePactSlotsRemaining(
        current.pactSlotsRemaining,
        derived.spellcasting.pactSlotsMax,
      );
      const nextDeathSaves = {
        successes: sanitizeTrackCount(current.deathSaves.successes, 3),
        failures: sanitizeTrackCount(current.deathSaves.failures, 3),
      };

      if (
        nextCurrentHitPoints === current.currentHitPoints &&
        nextTempHitPoints === current.tempHitPoints &&
        nextHitDiceSpent === current.hitDiceSpent &&
        areSameNumberArrays(nextSpellSlotsRemaining, current.spellSlotsRemaining) &&
        nextPactSlotsRemaining === current.pactSlotsRemaining &&
        nextDeathSaves.successes === current.deathSaves.successes &&
        nextDeathSaves.failures === current.deathSaves.failures
      ) {
        return current;
      }

      return {
        ...current,
        currentHitPoints: nextCurrentHitPoints,
        tempHitPoints: nextTempHitPoints,
        hitDiceSpent: nextHitDiceSpent,
        spellSlotsRemaining: nextSpellSlotsRemaining,
        pactSlotsRemaining: nextPactSlotsRemaining,
        deathSaves: nextDeathSaves,
      };
    });
  }, [derived.hitDiceMax, derived.hitPointsMax, derived.spellcasting.pactSlotsMax, derived.spellcasting.spellSlotsMax]);

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

  function updateClass(classId: string) {
    setDraft((current) => {
      const normalizedCurrentSubclass = normalizeSubclassSelection(
        current.classId,
        current.subclass,
        current.enabledSourceIds,
      );
      const nextSubclassOptions = listSubclassTemplates(classId, current.enabledSourceIds);
      const nextSubclass = nextSubclassOptions.some((entry) => entry.id === normalizedCurrentSubclass)
        ? normalizedCurrentSubclass
        : "";
      const currentClassStandardAbilities = buildClassStandardAbilityScores(current.classId);
      const nextClassStandardAbilities = buildClassStandardAbilityScores(classId);
      const currentClassStarterSkillProficiencies = buildClassStarterSkillProficiencies(current.classId);
      const nextClassStarterSkillProficiencies = buildClassStarterSkillProficiencies(classId);
      const currentClassStarterSpellSelection = buildClassStarterSpellSelection(current.classId, current.enabledSourceIds);
      const nextClassStarterSpellSelection = buildClassStarterSpellSelection(classId, current.enabledSourceIds);
      const shouldAutoCarryStarterSkills = areSameSkillProficiencies(
        current.skillProficiencies,
        currentClassStarterSkillProficiencies,
      );
      const shouldAutoCarryStarterSpells = areSameSpellSelections(
        current.spellIds,
        current.preparedSpellIds,
        currentClassStarterSpellSelection.spellIds,
        currentClassStarterSpellSelection.preparedSpellIds,
      );
      const shouldApplyNextStarterSpells =
        shouldAutoCarryStarterSpells && nextClassStarterSpellSelection.spellIds.length > 0;

      return {
        ...current,
        classId,
        subclass: nextSubclass,
        abilities: areSameAbilityScores(current.abilities, currentClassStandardAbilities)
          ? nextClassStandardAbilities
          : current.abilities,
        skillProficiencies: shouldAutoCarryStarterSkills
          ? nextClassStarterSkillProficiencies
          : current.skillProficiencies,
        spellIds: shouldApplyNextStarterSpells ? nextClassStarterSpellSelection.spellIds : current.spellIds,
        preparedSpellIds: shouldApplyNextStarterSpells
          ? nextClassStarterSpellSelection.preparedSpellIds
          : current.preparedSpellIds,
        spellSlotsRemaining: [],
        pactSlotsRemaining: undefined,
      };
    });
  }

  function applyClassStandardArray() {
    setDraft((current) => ({
      ...current,
      abilities: buildClassStandardAbilityScores(current.classId),
    }));
  }

  function applyQuickStartSetup() {
    const nextAbilities = buildClassStandardAbilityScores(draft.classId);
    const nextStarterSpellSelection = buildClassStarterSpellSelection(draft.classId, draft.enabledSourceIds);
    const nextSuggestedSkills = Array.from(new Set([...classStarterSkills, ...backgroundSuggestedSkills]));
    const nextSkillProficiencies = mergeSuggestedSkillProficiencies(draft.skillProficiencies, nextSuggestedSkills);
    const nextSuggestedInventoryMerge = mergeInventorySuggestions(draftInventory, backgroundStartingInventory);
    const nextLegacyLoadout = deriveLegacyLoadout(nextSuggestedInventoryMerge.inventory);
    const abilityChanged = !areSameAbilityScores(draft.abilities, nextAbilities);
    const classSkillChanges = classStarterSkills.filter((skill) => {
      const currentLevel = draft.skillProficiencies[skill];
      return currentLevel !== "proficient" && currentLevel !== "expertise";
    });
    const backgroundSkillChanges = backgroundSuggestedSkills.filter((skill) => {
      const currentLevel = draft.skillProficiencies[skill];
      return currentLevel !== "proficient" && currentLevel !== "expertise";
    });
    const inventoryChanged =
      nextSuggestedInventoryMerge.addedCount > 0 || nextSuggestedInventoryMerge.updatedCount > 0;
    const starterSpellsChanged =
      nextStarterSpellSelection.spellIds.length > 0 &&
      !areSameSpellSelections(
        draft.spellIds,
        draft.preparedSpellIds,
        nextStarterSpellSelection.spellIds,
        nextStarterSpellSelection.preparedSpellIds,
      );

    if (
      !abilityChanged &&
      classSkillChanges.length === 0 &&
      backgroundSkillChanges.length === 0 &&
      !inventoryChanged &&
      !starterSpellsChanged
    ) {
      setMessage(`${selectedClass.name} + ${selectedBackground.name} quick start is already represented in the draft.`);
      return;
    }

    const updates: string[] = [];

    if (abilityChanged) {
      updates.push("class array applied");
    }

    if (classSkillChanges.length > 0) {
      updates.push(`${classSkillChanges.length} class skill suggestion${classSkillChanges.length === 1 ? "" : "s"} applied`);
    }

    if (backgroundSkillChanges.length > 0) {
      updates.push(`${backgroundSkillChanges.length} background skill suggestion${backgroundSkillChanges.length === 1 ? "" : "s"} applied`);
    }

    if (nextSuggestedInventoryMerge.addedCount > 0) {
      updates.push(`${nextSuggestedInventoryMerge.addedCount} gear item${nextSuggestedInventoryMerge.addedCount === 1 ? "" : "s"} added`);
    }

    if (nextSuggestedInventoryMerge.updatedCount > 0) {
      updates.push(`${nextSuggestedInventoryMerge.updatedCount} gear item${nextSuggestedInventoryMerge.updatedCount === 1 ? "" : "s"} updated`);
    }

    if (starterSpellsChanged && nextStarterSpellSelection.spellIds.length > 0) {
      updates.push(`${nextStarterSpellSelection.spellIds.length} starter spell${nextStarterSpellSelection.spellIds.length === 1 ? "" : "s"} applied`);
    }

    setDraft((current) => ({
      ...current,
      abilities: nextAbilities,
      skillProficiencies: nextSkillProficiencies,
      inventory: nextSuggestedInventoryMerge.inventory,
      armorId: nextLegacyLoadout.armorId,
      shieldEquipped: nextLegacyLoadout.shieldEquipped,
      weaponIds: nextLegacyLoadout.weaponIds,
      spellIds: nextStarterSpellSelection.spellIds.length > 0 ? nextStarterSpellSelection.spellIds : current.spellIds,
      preparedSpellIds:
        nextStarterSpellSelection.spellIds.length > 0
          ? nextStarterSpellSelection.preparedSpellIds
          : current.preparedSpellIds,
    }));
    setMessage(`Applied ${selectedClass.name} + ${selectedBackground.name} quick start: ${updates.join(", ")}.`);
  }

  function applyClassStarterSkills() {
    if (classStarterSkills.length === 0) {
      setMessage(`${selectedClass.name} has no seeded starter skill package yet.`);
      return;
    }

    if (classStarterSkillsApplied) {
      setMessage(`${selectedClass.name} starter skills are already represented in the draft.`);
      return;
    }

    setDraft((current) => ({
      ...current,
      skillProficiencies: mergeSuggestedSkillProficiencies(current.skillProficiencies, classStarterSkills),
    }));
    setMessage(`Applied ${selectedClass.name} starter skills: ${classStarterSkills.length} suggested ${classStarterSkills.length === 1 ? "proficiency" : "proficiencies"}.`);
  }

  function applyClassStarterSpells() {
    const nextStarterSpellSelection = buildClassStarterSpellSelection(draft.classId, draft.enabledSourceIds);

    if (nextStarterSpellSelection.spellIds.length === 0) {
      setMessage(`${selectedClass.name} has no seeded starter spell package yet.`);
      return;
    }

    if (
      areSameSpellSelections(
        draft.spellIds,
        draft.preparedSpellIds,
        nextStarterSpellSelection.spellIds,
        nextStarterSpellSelection.preparedSpellIds,
      )
    ) {
      setMessage(`${selectedClass.name} starter spells are already represented in the draft.`);
      return;
    }

    setDraft((current) => ({
      ...current,
      spellIds: nextStarterSpellSelection.spellIds,
      preparedSpellIds: nextStarterSpellSelection.preparedSpellIds,
    }));
    setMessage(
      `Applied ${selectedClass.name} starter spells: ${nextStarterSpellSelection.spellIds.length} selected, ${nextStarterSpellSelection.preparedSpellIds.length} marked ready.`,
    );
  }

  function updateDraftVital(key: "currentHitPoints" | "tempHitPoints" | "hitDiceSpent", value: number) {
    setDraft((current) => ({
      ...current,
      [key]:
        key === "currentHitPoints"
          ? Math.min(sanitizeNonNegativeInteger(value), derived.hitPointsMax)
          : key === "hitDiceSpent"
            ? Math.min(sanitizeNonNegativeInteger(value), derived.hitDiceMax)
            : sanitizeNonNegativeInteger(value),
    }));
  }

  function updateDeathSaveTrack(key: "successes" | "failures", value: number) {
    setDraft((current) => ({
      ...current,
      deathSaves: {
        ...current.deathSaves,
        [key]: sanitizeTrackCount(value, 3),
      },
    }));
  }

  function updateSpellSlotRemaining(slotIndex: number, value: number) {
    setDraft((current) => {
      const nextSpellSlotsRemaining = [...current.spellSlotsRemaining];
      nextSpellSlotsRemaining[slotIndex] = value;

      return {
        ...current,
        spellSlotsRemaining: normalizeSpellSlotsRemaining(nextSpellSlotsRemaining, derived.spellcasting.spellSlotsMax),
      };
    });
  }

  function updatePactSlotsRemaining(value: number) {
    setDraft((current) => ({
      ...current,
      pactSlotsRemaining: normalizePactSlotsRemaining(value, derived.spellcasting.pactSlotsMax),
    }));
  }

  function refreshSpellSlotsToMax() {
    setDraft((current) => ({
      ...current,
      spellSlotsRemaining: [...derived.spellcasting.spellSlotsMax],
      pactSlotsRemaining: derived.spellcasting.pactSlotsMax,
    }));
    setMessage("Reset tracked spell slots to their current maximum values.");
  }

  function applyInventoryUpdate(updater: (inventory: InventoryItemRecord[]) => InventoryItemRecord[]) {
    setDraft((current) => {
      const nextInventory = updater(normalizeInventory(current));
      const legacyLoadout = deriveLegacyLoadout(nextInventory);

      return {
        ...current,
        inventory: nextInventory,
        armorId: legacyLoadout.armorId,
        shieldEquipped: legacyLoadout.shieldEquipped,
        weaponIds: legacyLoadout.weaponIds,
      };
    });
  }

  function toggleArrayEntry(key: "homebrewIds" | "featIds", value: string) {
    setDraft((current) => {
      const entries = current[key];

      if (
        key === "featIds" &&
        !entries.includes(value) &&
        !isFeatSelectable(value, {
          classId: current.classId,
          skillProficiencies: current.skillProficiencies,
          featSelections: current.featSelections,
        })
      ) {
        setMessage(
          getFeatSelectionConstraintMessage(value, {
            classId: current.classId,
            skillProficiencies: current.skillProficiencies,
            featSelections: current.featSelections,
          }) ?? "This feat is unavailable right now.",
        );
        return current;
      }

      const nextEntries = entries.includes(value)
        ? entries.filter((entry) => entry !== value)
        : [...entries, value];

      return {
        ...current,
        [key]: nextEntries,
      };
    });
  }

  function toggleFeatSelection(featId: string, optionId: string) {
    const template = getFeatTemplate(featId);
    const choiceGroup = template?.choiceGroups?.find((group) => group.options.includes(optionId));
    const templateName = template?.name ?? "This feat";

    if (!choiceGroup) {
      return;
    }

    setDraft((current) => {
      const currentSelections = current.featSelections[featId] ?? [];
      const currentGroupSelections = currentSelections.filter((selection) => choiceGroup.options.includes(selection));

      if (currentSelections.includes(optionId)) {
        return {
          ...current,
          featSelections: {
            ...current.featSelections,
            [featId]: currentSelections.filter((value) => value !== optionId),
          },
        };
      }

      if (choiceGroup.maxChoices === 1) {
        return {
          ...current,
          featSelections: {
            ...current.featSelections,
            [featId]: [...currentSelections.filter((selection) => !choiceGroup.options.includes(selection)), optionId],
          },
        };
      }

      if (currentGroupSelections.length >= choiceGroup.maxChoices) {
        setMessage(`${templateName} only allows ${choiceGroup.maxChoices} choice${choiceGroup.maxChoices === 1 ? "" : "s"}.`);
        return current;
      }

      return {
        ...current,
        featSelections: {
          ...current.featSelections,
          [featId]: [...currentSelections, optionId],
        },
      };
    });
  }

  function applySuggestedSkills(skills: SkillName[]) {
    setDraft((current) => ({
      ...current,
      skillProficiencies: {
        ...current.skillProficiencies,
        ...Object.fromEntries(
          skills.map((skill) => [
            skill,
            current.skillProficiencies[skill] === "expertise" ? "expertise" : "proficient",
          ]),
        ),
      },
    }));
    setMessage(`Applied ${skills.map((skill) => humanizeLabel(skill)).join(", ")} as background skill suggestions.`);
  }

  function applyBackgroundStartingInventory() {
    if (backgroundStartingInventory.length === 0) {
      setMessage("The selected background does not have seeded starting gear yet.");
      return;
    }

    const merged = mergeInventorySuggestions(draftInventory, backgroundStartingInventory);

    if (merged.addedCount === 0 && merged.updatedCount === 0) {
      setMessage(`${selectedBackground.name} starting gear is already represented in the current inventory.`);
      return;
    }

    const legacyLoadout = deriveLegacyLoadout(merged.inventory);
    const updates: string[] = [];

    if (merged.addedCount > 0) {
      updates.push(`${merged.addedCount} item${merged.addedCount === 1 ? "" : "s"} added`);
    }

    if (merged.updatedCount > 0) {
      updates.push(`${merged.updatedCount} item${merged.updatedCount === 1 ? "" : "s"} updated`);
    }

    setDraft((current) => ({
      ...current,
      inventory: merged.inventory,
      armorId: legacyLoadout.armorId,
      shieldEquipped: legacyLoadout.shieldEquipped,
      weaponIds: legacyLoadout.weaponIds,
    }));
    setMessage(`Applied ${selectedBackground.name} starting gear: ${updates.join(", ")}.`);
  }

  function addInventoryItem(templateType: InventoryItemRecord["templateType"], templateId: string) {
    applyInventoryUpdate((currentInventory) => {
      const gearTemplate = templateType === "gear" ? getGearTemplate(templateId) : null;
      const gearIsEquipable = gearTemplate?.equipable ?? false;
      const existingIndex = currentInventory.findIndex(
        (item) => item.templateType === templateType && item.templateId === templateId,
      );

      if (existingIndex >= 0 && templateType === "gear" && templateId === "shield") {
        return currentInventory.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                equipped: true,
              }
            : item,
        );
      }

      if (existingIndex >= 0 && templateType === "gear" && !gearIsEquipable) {
        return currentInventory.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      const nextItem = createInventoryItem(templateType, templateId, {
        equipped: templateType === "gear" ? gearIsEquipable : true,
      });

      if (templateType === "armor" && nextItem.equipped) {
        return [
          ...currentInventory.map((item) =>
            item.templateType === "armor"
              ? {
                  ...item,
                  equipped: false,
                }
              : item,
          ),
          nextItem,
        ];
      }

      return [...currentInventory, nextItem];
    });
  }

  function updateInventoryQuantity(itemId: string, quantity: number) {
    applyInventoryUpdate((currentInventory) =>
      currentInventory.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: sanitizeInventoryQuantity(quantity),
            }
          : item,
      ),
    );
  }

  function setInventoryEquipped(itemId: string, equipped: boolean) {
    applyInventoryUpdate((currentInventory) => {
      const targetItem = currentInventory.find((item) => item.id === itemId);

      if (!targetItem || !isInventoryItemEquipable(targetItem) || targetItem.equipped === equipped) {
        return currentInventory;
      }

      return currentInventory.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            equipped,
          };
        }

        if (equipped && targetItem.templateType === "armor" && item.templateType === "armor") {
          return {
            ...item,
            equipped: false,
          };
        }

        return item;
      });
    });
  }

  function toggleInventoryEquipped(itemId: string) {
    const currentItem = draftInventory.find((item) => item.id === itemId);

    if (!currentItem) {
      return;
    }

    setInventoryEquipped(itemId, !currentItem.equipped);
  }

  function useUnarmoredLoadout() {
    applyInventoryUpdate((currentInventory) =>
      currentInventory.map((item) =>
        item.templateType === "armor"
          ? {
              ...item,
              equipped: false,
            }
          : item,
      ),
    );
  }

  function removeInventoryItem(itemId: string) {
    applyInventoryUpdate((currentInventory) => currentInventory.filter((item) => item.id !== itemId));
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

  function updateMagicInitiateClass(classId: string) {
    setDraft((current) => ({
      ...current,
      bonusSpellClassId: classId,
      bonusSpellIds: [],
    }));
  }

  function toggleMagicInitiateSpell(spellId: string) {
    setDraft((current) => {
      const nextBonusSpellIds = current.bonusSpellIds.includes(spellId)
        ? current.bonusSpellIds.filter((entry) => entry !== spellId)
        : [...current.bonusSpellIds, spellId];

      const availableBonusSpells =
        current.bonusSpellClassId.length > 0
          ? listCompendiumSpells(current.enabledSourceIds, getClassTemplate(current.bonusSpellClassId).name)
          : [];
      const sanitized = sanitizeMagicInitiateSelections(nextBonusSpellIds, availableBonusSpells);

      return {
        ...current,
        bonusSpellIds: sanitized.bonusSpellIds,
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

  function openFullCompendiumView() {
    if (!referenceEntry) {
      return;
    }

    const handoffState: CompendiumHandoffState = {
      returnTo: `${location.pathname}${location.search}`,
      returnLabel: "Back to Builder",
      originLabel: selectedCharacter ? `${selectedCharacter.name} Builder` : "Character Builder",
    };

    navigate(buildCompendiumEntryPath(referenceEntry), { state: handoffState });
  }

  async function handleSave() {
    try {
      if (!selectedCharacter) {
        const created = await dndApi.builder.createFromWizard(draft);
        setSelectedCharacter(created);
        setDraft(builderInputFromCharacter(created));
        setMissingCharacter(false);
        navigate(`/characters/${created.id}/edit`, { replace: true });
        setMessage(`Created ${created.name}.`);
        return;
      }

      const updated = await dndApi.characters.save({
        ...previewCharacter,
        currentHitPoints: Math.min(previewCharacter.currentHitPoints, derived.hitPointsMax),
      });
      setSelectedCharacter(updated);
      setDraft(builderInputFromCharacter(updated));
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
    navigate("/characters", { replace: true });
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
    return <div className="empty-state">Loading character editor...</div>;
  }

  if (missingCharacter) {
    return (
      <div className="workspace">
        <SectionCard
          title="Character Not Found"
          subtitle="Editor route"
        >
          <div className="stack-sm">
            <p className="muted-copy">The requested character could not be loaded for editing.</p>
            <div className="action-row">
              <button
                className="action-button"
                onClick={() => navigate("/characters")}
                type="button"
              >
                Back to Roster
              </button>
              <button
                className="action-button action-button--secondary"
                onClick={() => navigate("/characters/new", { replace: true })}
                type="button"
              >
                New Character
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="workspace">
      <SectionCard
        title={selectedCharacter ? `Edit ${selectedCharacter.name}` : "Create Character"}
        subtitle={selectedCharacter ? "Creator / editor route" : "New character draft"}
      >
        <div className="detail-card">
          <div className="detail-card__header">
            <strong>Editor Actions</strong>
            <span>{selectedCharacter ? "Saved character" : "Unsaved draft"}</span>
          </div>
          <div className="action-row">
            <button
              className="action-button action-button--secondary"
              onClick={() => navigate("/characters")}
              type="button"
            >
              Back to Roster
            </button>
            {selectedCharacter ? (
              <button
                className="action-button action-button--secondary"
                onClick={() => navigate(`/characters/${selectedCharacter.id}`)}
                type="button"
              >
                Open Sheet
              </button>
            ) : null}
            {!selectedCharacter ? (
              <button
                className="action-button action-button--secondary"
                onClick={() => {
                  setDraft(createDefaultBuilderInput());
                  setMessage("Draft reset.");
                }}
                type="button"
              >
                Reset Draft
              </button>
            ) : null}
          </div>
          <p className="muted-copy">
            {selectedCharacter
              ? "This route keeps the full guided builder and live preview for an existing saved character."
              : "Build a new character here, then save to convert this draft into a routed saved sheet."}
          </p>
        </div>

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
              onChange={(event) => updateClass(event.target.value)}
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
            <span>Subclass / Archetype</span>
            <select
              onChange={(event) => updateDraft("subclass", event.target.value)}
              value={draft.subclass}
            >
              <option value="">No subclass selected</option>
              {hasLegacySubclassValue ? (
                <option value={draft.subclass}>
                  {getSubclassLabel(draft.classId, draft.subclass, draft.enabledSourceIds)} (legacy saved value)
                </option>
              ) : null}
              {availableSubclasses.map((entry) => (
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
          <div className="detail-card">
            <div className="detail-card__header">
              <strong>Quick Start Setup</strong>
              <span>{selectedClass.name} + {selectedBackground.name}</span>
            </div>
            <p className="muted-copy">
              {classStarterSpellEntries.length > 0
                ? "Apply the current class standard array, the current class's app-authored starter skills, the current background's suggested skills, any seeded starting gear, and the current class's app-authored starter spell package in one bounded onboarding step."
                : "Apply the current class standard array, the current class's app-authored starter skills, the current background's suggested skills, and any seeded starting gear in one bounded onboarding step."}
            </p>
            <div className="filter-row">
              <span className="chip chip--active">{classStandardAbilitySummary}</span>
              {classStarterSkills.map((skill) => (
                <span
                  key={`quick-start-class-skill-${skill}`}
                  className="chip"
                >
                  {humanizeLabel(skill)}
                </span>
              ))}
              {backgroundSuggestedSkills.map((skill) => (
                <span
                  key={`quick-start-skill-${skill}`}
                  className="chip"
                >
                  {humanizeLabel(skill)}
                </span>
              ))}
              {backgroundStartingInventory.length > 0 ? (
                <span className="chip">{backgroundStartingInventory.length} gear item{backgroundStartingInventory.length === 1 ? "" : "s"}</span>
              ) : null}
              {classStarterSpellEntries.length > 0 ? (
                <span className="chip">
                  {classStarterCantripEntries.length} cantrips / {classStarterLeveledEntries.length} leveled starter spells
                </span>
              ) : null}
            </div>
            <div className="action-row">
              <button
                className="action-button action-button--secondary"
                disabled={quickStartSetupApplied}
                onClick={applyQuickStartSetup}
                type="button"
              >
                Apply {selectedClass.name} + {selectedBackground.name} Quick Start
              </button>
            </div>
          </div>

          <div className="stack-sm">
            <h3 className="subheading">Ability Scores</h3>
            <div className="action-row">
              <button
                className="action-button action-button--secondary"
                disabled={classStandardArrayApplied}
                onClick={applyClassStandardArray}
                type="button"
              >
                Apply {selectedClass.name} Standard Array
              </button>
            </div>
            <p className="muted-copy">
              Quick-start class recommendation using the standard `15 / 14 / 13 / 12 / 10 / 8` spread: {classStandardAbilitySummary}.
            </p>
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
            <div className="action-row">
              <button
                className="action-button action-button--secondary"
                disabled={classStarterSkillsApplied}
                onClick={applyClassStarterSkills}
                type="button"
              >
                Apply {selectedClass.name} Starter Skills
              </button>
            </div>
            <p className="muted-copy">
              App-authored class skill recommendation: {classStarterSkills.map((skill) => humanizeLabel(skill)).join(", ")}.
            </p>
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

          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Sheet Vitals</strong>
                <span>Live preview state</span>
              </div>
              <div className="form-grid">
                <label>
                  <span>Current HP</span>
                  <input
                    max={derived.hitPointsMax}
                    min={0}
                    onChange={(event) => updateDraftVital("currentHitPoints", Number(event.target.value))}
                    type="number"
                    value={draft.currentHitPoints}
                  />
                </label>
                <label>
                  <span>Temp HP</span>
                  <input
                    min={0}
                    onChange={(event) => updateDraftVital("tempHitPoints", Number(event.target.value))}
                    type="number"
                    value={draft.tempHitPoints}
                  />
                </label>
                <label>
                  <span>Hit Dice Spent</span>
                  <input
                    max={derived.hitDiceMax}
                    min={0}
                    onChange={(event) => updateDraftVital("hitDiceSpent", Number(event.target.value))}
                    type="number"
                    value={draft.hitDiceSpent}
                  />
                </label>
                <label>
                  <span>Max HP / Dice</span>
                  <input
                    disabled
                    value={`${derived.hitPointsMax} HP / ${derived.hitDiceMax} dice`}
                  />
                </label>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Death Saves</strong>
                <span>Persistent sheet state</span>
              </div>
              <div className="form-grid">
                <label>
                  <span>Successes</span>
                  <input
                    max={3}
                    min={0}
                    onChange={(event) => updateDeathSaveTrack("successes", Number(event.target.value))}
                    type="number"
                    value={draft.deathSaves.successes}
                  />
                </label>
                <label>
                  <span>Failures</span>
                  <input
                    max={3}
                    min={0}
                    onChange={(event) => updateDeathSaveTrack("failures", Number(event.target.value))}
                    type="number"
                    value={draft.deathSaves.failures}
                  />
                </label>
              </div>
              <p className="muted-copy">
                These values now save with the character and render directly on the sheet preview and PDF export.
              </p>
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
                  onClick={() => {
                    if (draft.subclass) {
                      openReferenceSafe(draft.subclass);
                    }
                  }}
                  type="button"
                >
                  {draft.subclass ? getSubclassLabel(draft.classId, draft.subclass, draft.enabledSourceIds) : "No subclass"}
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
                  onClick={() => openReferenceSafe(getArmorReferenceSlug(inventoryLoadout.armorId))}
                  type="button"
                >
                  {availableArmor.find((entry) => entry.id === (inventoryLoadout.armorId ?? "unarmored"))?.name ?? "Armor"}
                </button>
                {inventoryLoadout.shieldEquipped ? (
                  <button
                    className="chip"
                    onClick={() => openReferenceSafe("shield")}
                    type="button"
                  >
                    Shield
                  </button>
                ) : null}
                <button
                  className="chip"
                  onClick={() => openReferenceSafe(RULE_REFERENCE_SLUGS.armorClass)}
                  type="button"
                >
                  Armor Class Rule
                </button>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card__header">
                <strong>Background Guidance</strong>
                <span>{backgroundSuggestedSkills.length} skills / {backgroundStartingInventory.length} gear</span>
              </div>
              <p className="muted-copy">
                {backgroundTheme || "The selected background currently has no extra seeded guidance text."}
              </p>
              {backgroundFeatureSummary.length > 0 ? (
                <div className="filter-row">
                  {backgroundFeatureSummary.map((feature) => (
                    <span
                      key={feature}
                      className="chip chip--active"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}
              {backgroundSuggestedSkills.length > 0 ? (
                <div className="stack-sm">
                  <div className="filter-row">
                    {backgroundSuggestedSkills.map((skill) => (
                      <button
                        key={skill}
                        className="chip"
                        onClick={() => applySuggestedSkills([skill])}
                        type="button"
                      >
                        {humanizeLabel(skill)}
                      </button>
                    ))}
                  </div>
                  <button
                    className="action-button action-button--secondary"
                    onClick={() => applySuggestedSkills(backgroundSuggestedSkills)}
                    type="button"
                  >
                    Apply Suggested Skills
                  </button>
                </div>
              ) : null}
              {backgroundStartingInventory.length > 0 ? (
                <div className="stack-sm">
                  <div className="filter-row">
                    {backgroundStartingInventory.map((entry, index) => (
                      <button
                        key={`${entry.templateType}-${entry.templateId}-${index}`}
                        className="chip"
                        onClick={() => openReferenceSafe(entry.templateId)}
                        type="button"
                      >
                        {inventoryTemplateLabel(entry.templateType, entry.templateId)}
                        {entry.quantity && entry.quantity > 1 ? ` x${entry.quantity}` : ""}
                      </button>
                    ))}
                  </div>
                  <button
                    className="action-button action-button--secondary"
                    onClick={applyBackgroundStartingInventory}
                    type="button"
                  >
                    Apply Starting Gear
                  </button>
                </div>
              ) : null}
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <div className="detail-card__header">
                  <strong>Add Equipment</strong>
                  <span>{inventoryEntries.length} tracked</span>
                </div>
                <EquipmentSelectionBrowser
                  emptyMessage="No equipment is available in the current source set."
                  entries={equipmentBrowseEntries}
                  onAddItem={addInventoryItem}
                  onOpenReference={openReferenceSafe}
                  scopeKey={`equipment:${draft.enabledSourceIds.join("|")}`}
                  title="Available Equipment"
                  trackedStateByKey={trackedEquipmentStateByKey}
                />
              </div>

              <div className="detail-card">
                <div className="detail-card__header">
                  <strong>Inventory</strong>
                  <span>{inventoryEntries.reduce((total, item) => total + item.quantity, 0)} total items</span>
                </div>
                <div className="filter-row">
                  <span className="chip">
                    Armor: {availableArmor.find((entry) => entry.id === (inventoryLoadout.armorId ?? "unarmored"))?.name ?? "Unarmored"}
                  </span>
                  <span className="chip">{inventoryLoadout.shieldEquipped ? "Shield ready" : "No shield"}</span>
                  <span className="chip">{inventoryLoadout.weaponIds.length} equipped weapons</span>
                </div>
                <LoadoutManagerCard
                  armorEntries={loadoutArmorEntries}
                  onOpenReference={openReferenceSafe}
                  onSetEquipped={setInventoryEquipped}
                  onUseUnarmored={useUnarmoredLoadout}
                  shieldEntries={loadoutShieldEntries}
                  weaponEntries={loadoutWeaponEntries}
                />
                <InventoryManagerBrowser
                  emptyMessage="No tracked inventory yet."
                  entries={inventoryBrowseEntries}
                  onOpenReference={openReferenceSafe}
                  onRemoveItem={removeInventoryItem}
                  onToggleEquipped={toggleInventoryEquipped}
                  onUpdateQuantity={updateInventoryQuantity}
                  scopeKey={`inventory:${selectedCharacter?.id ?? "new"}:${draft.enabledSourceIds.join("|")}`}
                />
              </div>
            </div>

            <div className="checkbox-grid">
              <div className="checkbox-grid__panel checkbox-grid__panel--wide">
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
                {classStarterSpellEntries.length > 0 ? (
                  <div className="detail-card">
                    <div className="detail-card__header">
                      <strong>Starter Spell Recommendation</strong>
                      <span>{classStarterSpellEntries.length} seeded picks</span>
                    </div>
                    <p className="muted-copy">
                      App-authored quick-start picks for the seeded {selectedClass.name.toLowerCase()} list. Apply them as a bounded starting point, then adjust the spellbook manually.
                    </p>
                    <div className="filter-row">
                      {classStarterSpellEntries.map((spell) => (
                        <span
                          key={`starter-spell-${spell.slug}`}
                          className={`chip ${draft.spellIds.includes(spell.slug) ? "chip--active" : ""}`}
                        >
                          {spell.name}
                        </span>
                      ))}
                    </div>
                    <div className="action-row">
                      <button
                        className="action-button action-button--secondary"
                        disabled={classStarterSpellsApplied}
                        onClick={applyClassStarterSpells}
                        type="button"
                      >
                        Apply {selectedClass.name} Starter Spells
                      </button>
                    </div>
                  </div>
                ) : null}
                {derived.spellcasting.slotMode !== "none" ? (
                  <div className="detail-card">
                    <div className="detail-card__header">
                      <strong>Tracked Spell Slots</strong>
                      <button
                        className="inline-link-button"
                        onClick={refreshSpellSlotsToMax}
                        type="button"
                      >
                        Reset to Max
                      </button>
                    </div>
                    <div className="form-grid">
                      {derived.spellcasting.slotMode === "pact" ? (
                        <label>
                          <span>Pact Slots Remaining</span>
                          <input
                            max={derived.spellcasting.pactSlotsMax}
                            min={0}
                            onChange={(event) => updatePactSlotsRemaining(Number(event.target.value))}
                            type="number"
                            value={draft.pactSlotsRemaining}
                          />
                        </label>
                      ) : (
                        derived.spellcasting.spellSlotsMax.map((slotMax, index) => (
                          <label key={`spell-slot-${index + 1}`}>
                            <span>Level {index + 1} Remaining</span>
                            <input
                              max={slotMax}
                              min={0}
                              onChange={(event) => updateSpellSlotRemaining(index, Number(event.target.value))}
                              type="number"
                              value={draft.spellSlotsRemaining[index] ?? slotMax}
                            />
                          </label>
                        ))
                      )}
                    </div>
                    <p className="muted-copy">
                      Current slot state saves with the character and carries over to the saved sheet route and PDF export.
                    </p>
                  </div>
                ) : null}
                {magicInitiateSelected ? (
                  <div className="detail-card">
                    <div className="detail-card__header">
                      <strong>Magic Initiate</strong>
                      <span>{selectedMagicInitiateEntries.length} selected</span>
                    </div>
                    <p className="muted-copy">{magicInitiateMessage}</p>
                    <div className="stack-sm">
                      <label>
                        <span>Spell List</span>
                        <select
                          onChange={(event) => updateMagicInitiateClass(event.target.value)}
                          value={draft.bonusSpellClassId}
                        >
                          <option value="">Choose a spell list</option>
                          {magicInitiateSourceClasses.map((entry) => (
                            <option
                              key={entry.id}
                              value={entry.id}
                            >
                              {entry.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="filter-row">
                        <span className="chip">{selectedMagicInitiateCantrips.length} / 2 cantrips</span>
                        <span className="chip">{selectedMagicInitiateLeveled.length} / 1 leveled spell</span>
                        {selectedMagicInitiateClass ? (
                          <span className="chip">
                            {magicInitiateUsesSeparateLine
                              ? "Separate spell DC / Atk"
                              : selectedClass.spellcastingAbility === null
                                ? "Primary spell line"
                                : "Shares class spell line"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                <SpellSelectionBrowser
                  emptyMessage={spellbookMessage}
                  entries={classSpellOptions}
                  onOpenReference={openReferenceSafe}
                  onTogglePreparedSpell={togglePreparedSpell}
                  onToggleSpell={toggleSpell}
                  preparedSpellIds={draft.preparedSpellIds}
                  scopeKey={`${draft.classId}:${draft.enabledSourceIds.join("|")}`}
                  selectedSpellIds={draft.spellIds}
                  title={`${selectedClass.name} Spell List`}
                />
                {magicInitiateSelected && draft.bonusSpellClassId ? (
                  <SpellSelectionBrowser
                    emptyMessage={magicInitiateMessage}
                    entries={magicInitiateSpellOptions}
                    onOpenReference={openReferenceSafe}
                    onToggleSpell={toggleMagicInitiateSpell}
                    scopeKey={`magic-initiate:${draft.bonusSpellClassId}:${draft.enabledSourceIds.join("|")}`}
                    selectedSpellIds={draft.bonusSpellIds}
                    title={`${selectedMagicInitiateClass?.name ?? "Magic Initiate"} Spell List`}
                  />
                ) : null}
              </div>
              <div>
                <h3 className="subheading">Feats</h3>
                <div className="detail-card">
                  <div className="detail-card__header">
                    <strong>Chosen Feats</strong>
                    <span>{selectedFeatEntries.length}</span>
                  </div>
                  <p className="muted-copy">
                    Compendium feats now save as structured character data instead of only living in the notes field.
                  </p>
                  <div className="filter-row">
                    {selectedFeatEntries.length > 0 ? (
                      selectedFeatEntries.map((feat) => (
                        <button
                          key={feat.slug}
                          className="chip chip--active"
                          onClick={() => openReferenceSafe(feat.slug)}
                          type="button"
                        >
                          {feat.name}
                        </button>
                      ))
                    ) : (
                      <span className="chip">No feats selected</span>
                    )}
                  </div>
                </div>
                {selectedConfigurableFeats.map((feat) => {
                  const selectedChoices = draftFeatState.featSelections[feat.id] ?? [];

                  return (
                    <FeatChoiceBrowser
                      classId={draft.classId}
                      feat={feat}
                      featSelections={draftFeatState.featSelections}
                      key={`${feat.id}-choices`}
                      onOpenReference={openReferenceSafe}
                      onToggleChoice={toggleFeatSelection}
                      scopeKey={`feat-choice:${feat.id}:${featBrowseScopeKey}`}
                      selectedChoices={selectedChoices}
                      skillProficiencies={draft.skillProficiencies}
                    />
                  );
                })}
                <FeatSelectionBrowser
                  availabilityById={featAvailabilityById}
                  emptyMessage="No feats are available in the current source set."
                  entries={availableFeats}
                  onOpenReference={openReferenceSafe}
                  onToggleFeat={(featId) => toggleArrayEntry("featIds", featId)}
                  scopeKey={featBrowseScopeKey}
                  selectedFeatIds={draft.featIds}
                  title="Available Feats"
                />
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
              <div>
                <h3 className="subheading">Prepared / Ready Spells</h3>
                <div className="detail-card">
                  <p className="muted-copy">
                    Cantrips are always available. Mark leveled spells you want surfaced as ready here or directly from the spell browser.
                  </p>
                </div>
                {selectedLeveledEntries.length === 0 && selectedMagicInitiateLeveled.length === 0 ? (
                  <p className="muted-copy">Select at least one leveled spell first.</p>
                ) : null}
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
                {selectedMagicInitiateLeveled.length > 0 ? (
                  <div className="detail-card">
                    <p className="muted-copy">
                      Magic Initiate leveled spells are surfaced as ready automatically because they are feat-granted selections.
                    </p>
                  </div>
                ) : null}
                {selectedMagicInitiateLeveled.map((spell) => (
                  <div
                    key={`ready-${spell.slug}`}
                    className="choice-row"
                  >
                    <label className="checkbox-field">
                      <input
                        checked
                        disabled
                        type="checkbox"
                      />
                      <span>{spell.name} (Magic Initiate)</span>
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
              <span>Background Features / Notes</span>
              <textarea
                onChange={(event) =>
                  updateDraft("notes", {
                    ...draft.notes,
                    backgroundFeatures: event.target.value,
                  })
                }
                rows={4}
                value={draft.notes.backgroundFeatures}
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
        className="section-card--sheet-preview"
        title="Exact-Style Sheet Preview"
        subtitle="Structural layout pass with live values"
      >
        <LockedSheetViewport minWidth={1120}>
          <SheetPreview
            character={previewCharacter}
            derived={derived}
            onOpenReference={openReferenceSafe}
          />
        </LockedSheetViewport>
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
                onClick={openFullCompendiumView}
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
