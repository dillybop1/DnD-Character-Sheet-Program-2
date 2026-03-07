import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateDerivedState } from "../../shared/calculations";
import {
  getArmorTemplate,
  getBackgroundTemplate,
  getFeatChoiceLabel,
  getFeatSelectionConstraintMessage,
  getFeatSupportLabel,
  getFeatTemplate,
  getGearTemplate,
  getClassTemplate,
  getSpeciesTemplate,
  getSubclassLabel,
  isFeatSelectable,
  getWeaponTemplate,
  listAvailableFeatChoiceOptions,
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
import { ABILITY_NAMES, SKILL_NAMES } from "../../shared/types";
import type { AbilityName, BuilderInput, CharacterRecord, CharacterSummary, CompendiumEntry, HomebrewEntry, InventoryItemRecord, InventoryItemKind, SkillName } from "../../shared/types";
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

    return `${spellcasting.pactSlotsMax} pact slots at level ${spellcasting.pactSlotLevel}`;
  }

  if (spellcasting.spellSlotsMax.length === 0) {
    return "No class slots";
  }

  return spellcasting.spellSlotsMax.map((value, index) => `L${index + 1}:${value}`).join(" ");
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

export function CharactersPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRecord | null>(null);
  const [draft, setDraft] = useState<BuilderInput>(createDefaultBuilderInput());
  const [homebrewEntries, setHomebrewEntries] = useState<HomebrewEntry[]>([]);
  const [message, setMessage] = useState("Create a new character or select one from the library.");
  const [referenceEntry, setReferenceEntry] = useState<CompendiumEntry | null>(null);
  const [referenceStatus, setReferenceStatus] = useState(
    "Click a class, subclass, spell, weapon, armor, gear, or rule label to inspect it here.",
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
  const availableArmor = listArmorTemplates(draft.enabledSourceIds);
  const availableWeapons = listWeaponTemplates(draft.enabledSourceIds);
  const availableGear = listGearTemplates(draft.enabledSourceIds);
  const availableFeats = listCompendiumEntries("feat", draft.enabledSourceIds);
  const featContext = {
    classId: draft.classId,
    skillProficiencies: draft.skillProficiencies,
    featSelections: draft.featSelections,
  };
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
  const classSpellOptions =
    selectedClass.spellcastingAbility === null ? [] : listCompendiumSpells(draft.enabledSourceIds, selectedClass.name);
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
      const nextDeathSaves = {
        successes: sanitizeTrackCount(current.deathSaves.successes, 3),
        failures: sanitizeTrackCount(current.deathSaves.failures, 3),
      };

      if (
        nextCurrentHitPoints === current.currentHitPoints &&
        nextTempHitPoints === current.tempHitPoints &&
        nextHitDiceSpent === current.hitDiceSpent &&
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
        deathSaves: nextDeathSaves,
      };
    });
  }, [derived.hitDiceMax, derived.hitPointsMax]);

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

      return {
        ...current,
        classId,
        subclass: nextSubclass,
      };
    });
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

  function toggleInventoryEquipped(itemId: string) {
    applyInventoryUpdate((currentInventory) => {
      const targetItem = currentInventory.find((item) => item.id === itemId);

      if (!targetItem || !isInventoryItemEquipable(targetItem)) {
        return currentInventory;
      }

      const nextEquipped = !targetItem.equipped;

      return currentInventory.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            equipped: nextEquipped,
          };
        }

        if (nextEquipped && targetItem.templateType === "armor" && item.templateType === "armor") {
          return {
            ...item,
            equipped: false,
          };
        }

        return item;
      });
    });
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

  async function handleImport() {
    try {
      const imported = await dndApi.characters.importJson();

      if (!imported) {
        setMessage("Import canceled.");
        return;
      }

      setSelectedCharacter(imported);
      setDraft(builderInputFromCharacter(imported));
      await loadCharacters(imported.id);
      setMessage(`Imported ${imported.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import character JSON.");
    }
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
    return <div className="empty-state">Loading character library...</div>;
  }

  return (
    <div className="workspace">
      <SectionCard
        title="Character Library"
        subtitle="Saved locally"
      >
        <div className="stack-sm">
          <div className="action-row">
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
            <button
              className="action-button action-button--secondary"
              onClick={() => void handleImport()}
              type="button"
            >
              Import JSON
            </button>
          </div>
          <div className="library-list">
            {characters.length === 0 ? <p className="muted-copy">No saved characters yet.</p> : null}
            {characters.map((character) => {
              const classLabel = getClassTemplate(character.classId).name;
              const speciesLabel = getSpeciesTemplate(character.speciesId).name;

              return (
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
                  <div className="library-item__meta">
                    <span className="library-item__pill">Level {character.level}</span>
                    <span>{classLabel}</span>
                    <span>{speciesLabel}</span>
                  </div>
                </button>
              );
            })}
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
                <div className="stack-sm">
                  <div>
                    <h3 className="subheading">Armor</h3>
                    <div className="filter-row">
                      {availableArmor.map((armor) => (
                        <button
                          key={armor.id}
                          className="chip"
                          onClick={() => addInventoryItem("armor", armor.id)}
                          type="button"
                        >
                          {armor.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="subheading">Weapons</h3>
                    <div className="filter-row">
                      {availableWeapons.map((weapon) => (
                        <button
                          key={weapon.id}
                          className="chip"
                          onClick={() => addInventoryItem("weapon", weapon.id)}
                          type="button"
                        >
                          {weapon.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="subheading">Gear</h3>
                    <div className="filter-row">
                      {availableGear.map((gear) => (
                        <button
                          key={gear.id}
                          className="chip"
                          onClick={() => addInventoryItem("gear", gear.id)}
                          type="button"
                        >
                          {gear.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                <div className="inventory-list">
                  {inventoryEntries.length === 0 ? <p className="muted-copy">No tracked inventory yet.</p> : null}
                  {inventoryEntries.map((entry) => {
                    const rawInventoryEntry = draftInventoryById.get(entry.id);

                    return (
                      <div
                        key={entry.id}
                        className="inventory-item"
                      >
                        <div>
                          <strong>{entry.name}</strong>
                          {entry.notes ? <p className="muted-copy">{entry.notes}</p> : null}
                        </div>
                        <div className="inventory-actions">
                          <input
                            className="inventory-qty-input"
                            min={1}
                            onChange={(event) => updateInventoryQuantity(entry.id, Number(event.target.value))}
                            type="number"
                            value={entry.quantity}
                          />
                          {rawInventoryEntry && isInventoryItemEquipable(rawInventoryEntry) ? (
                            <button
                              className="inline-link-button"
                              onClick={() => toggleInventoryEquipped(entry.id)}
                              type="button"
                            >
                              {entry.equipped ? "Unequip" : "Equip"}
                            </button>
                          ) : null}
                          {entry.referenceSlug ? (
                            <button
                              className="inline-link-button"
                              onClick={() => {
                                if (entry.referenceSlug) {
                                  openReferenceSafe(entry.referenceSlug);
                                }
                              }}
                              type="button"
                            >
                              Ref
                            </button>
                          ) : null}
                          <button
                            className="inline-link-button"
                            onClick={() => removeInventoryItem(entry.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="checkbox-grid">
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
                {magicInitiateSelected && draft.bonusSpellClassId
                  ? magicInitiateSpellOptions
                      .filter((spell) => readSpellLevel(spell) === 0)
                      .map((spell) => (
                        <div
                          key={`magic-initiate-${spell.slug}`}
                          className="choice-row"
                        >
                          <label className="checkbox-field">
                            <input
                              checked={draft.bonusSpellIds.includes(spell.slug)}
                              onChange={() => toggleMagicInitiateSpell(spell.slug)}
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
                      ))
                  : null}
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
                {magicInitiateSelected && draft.bonusSpellClassId
                  ? magicInitiateSpellOptions
                      .filter((spell) => readSpellLevel(spell) > 0)
                      .map((spell) => (
                        <div
                          key={`magic-initiate-${spell.slug}`}
                          className="choice-row"
                        >
                          <label className="checkbox-field">
                            <input
                              checked={draft.bonusSpellIds.includes(spell.slug)}
                              onChange={() => toggleMagicInitiateSpell(spell.slug)}
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
                      ))
                  : null}
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

                  if (!feat.choiceGroups || feat.choiceGroups.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={`${feat.id}-choices`}
                      className="detail-card"
                    >
                      <div className="detail-card__header">
                        <div>
                          <strong>{feat.name} Choices</strong>
                          <span className="muted-copy">
                            {getFeatSupportLabel(feat.supportLevel)} support
                          </span>
                        </div>
                        <span>{selectedChoices.length} chosen</span>
                      </div>
                      {feat.automationStatus ? <p className="muted-copy">{feat.automationStatus}</p> : null}
                      <div className="stack-sm">
                        {feat.choiceGroups.map((choiceGroup) => {
                          const groupChoices = selectedChoices.filter((optionId) => choiceGroup.options.includes(optionId));
                          const availableOptions = new Set(
                            listAvailableFeatChoiceOptions(feat.id, choiceGroup.id, {
                              classId: draft.classId,
                              skillProficiencies: draft.skillProficiencies,
                              featSelections: draftFeatState.featSelections,
                            }),
                          );
                          const visibleOptions = choiceGroup.options.filter(
                            (optionId) => groupChoices.includes(optionId) || availableOptions.has(optionId),
                          );

                          return (
                            <div
                              key={`${feat.id}-${choiceGroup.id}`}
                              className="stack-sm"
                            >
                              <p className="muted-copy">
                                {choiceGroup.label}: {choiceGroup.description}
                              </p>
                              <div className="filter-row">
                                {groupChoices.length > 0 ? (
                                  groupChoices.map((optionId) => (
                                    <span
                                      key={`${feat.id}-${choiceGroup.id}-${optionId}`}
                                      className="chip chip--active"
                                    >
                                      {getFeatChoiceLabel(feat.id, optionId)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="chip">No choices selected</span>
                                )}
                              </div>
                              {visibleOptions.length === 0 ? (
                                <p className="muted-copy">No eligible options right now.</p>
                              ) : null}
                              <div className="stack-sm">
                                {visibleOptions.map((optionId) => (
                                  <div
                                    key={`${feat.id}-${choiceGroup.id}-${optionId}-toggle`}
                                    className="choice-row"
                                  >
                                    <label className="checkbox-field">
                                      <input
                                        checked={selectedChoices.includes(optionId)}
                                        disabled={!selectedChoices.includes(optionId) && !availableOptions.has(optionId)}
                                        onChange={() => toggleFeatSelection(feat.id, optionId)}
                                        type="checkbox"
                                      />
                                      <span>{getFeatChoiceLabel(feat.id, optionId)}</span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {availableFeats.map((feat) => (
                  <div
                    key={feat.slug}
                    className="stack-sm"
                  >
                    <div className="choice-row">
                      <label className="checkbox-field">
                        <input
                          checked={draft.featIds.includes(feat.slug)}
                          disabled={!draft.featIds.includes(feat.slug) && !featAvailabilityById.get(feat.slug)?.selectable}
                          onChange={() => toggleArrayEntry("featIds", feat.slug)}
                          type="checkbox"
                        />
                        <span>{feat.name}</span>
                      </label>
                      <button
                        className="inline-link-button"
                        onClick={() => openReferenceSafe(feat.slug)}
                        type="button"
                      >
                        Ref
                      </button>
                    </div>
                    {getFeatTemplate(feat.slug)?.automationStatus ? (
                      <p className="muted-copy">
                        {getFeatSupportLabel(getFeatTemplate(feat.slug)?.supportLevel ?? "reference")} support:{" "}
                        {getFeatTemplate(feat.slug)?.automationStatus}
                      </p>
                    ) : null}
                    {featAvailabilityById.get(feat.slug)?.constraintMessage && !draft.featIds.includes(feat.slug) ? (
                      <p className="muted-copy">{featAvailabilityById.get(feat.slug)?.constraintMessage}</p>
                    ) : null}
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
              <div>
                <h3 className="subheading">Prepared / Ready Spells</h3>
                <div className="detail-card">
                  <p className="muted-copy">Cantrips are always available. Mark leveled spells you want surfaced as ready.</p>
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
