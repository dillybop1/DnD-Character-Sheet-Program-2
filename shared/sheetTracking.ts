import type {
  AbilityName,
  CharacterRecord,
  CurrencyWallet,
  SheetProfile,
  TrackedResource,
  TrackedResourceDisplay,
  TrackedResourceRecovery,
} from "./types";

const AUTOMATED_TRACKED_RESOURCE_PREFIX = "auto-resource:";
const AUTOMATED_BARDIC_INSPIRATION_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}bard-bardic-inspiration`;
const AUTOMATED_RAGE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}barbarian-rage`;
const AUTOMATED_BATTLE_MASTER_SUPERIORITY_DICE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}fighter-battle-master-superiority-dice`;
const AUTOMATED_CLERIC_CHANNEL_DIVINITY_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}cleric-channel-divinity`;
const AUTOMATED_CLERIC_DIVINE_INTERVENTION_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}cleric-divine-intervention`;
const AUTOMATED_LIGHT_DOMAIN_WARDING_FLARE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}cleric-light-domain-warding-flare`;
export const AUTOMATED_DRUID_NATURAL_RECOVERY_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}druid-circle-of-the-land-natural-recovery`;
const AUTOMATED_DRUID_WILD_RESURGENCE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}druid-wild-resurgence`;
const AUTOMATED_WILD_SHAPE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}druid-wild-shape`;
const AUTOMATED_FIGHTER_ACTION_SURGE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}fighter-action-surge`;
const AUTOMATED_FIGHTER_INDOMITABLE_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}fighter-indomitable`;
export const AUTOMATED_FIGHTER_SECOND_WIND_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}fighter-second-wind`;
const AUTOMATED_PALADIN_CHANNEL_DIVINITY_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}paladin-channel-divinity`;
const AUTOMATED_PALADIN_FAITHFUL_STEED_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}paladin-faithful-steed`;
export const AUTOMATED_PALADIN_LAY_ON_HANDS_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}paladin-lay-on-hands`;
const AUTOMATED_RANGER_FAVORED_ENEMY_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}ranger-favored-enemy`;
const AUTOMATED_RANGER_NATURES_VEIL_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}ranger-natures-veil`;
export const AUTOMATED_RANGER_TIRELESS_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}ranger-tireless`;
const AUTOMATED_ROGUE_STROKE_OF_LUCK_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}rogue-stroke-of-luck`;
const AUTOMATED_SORCERER_INNATE_SORCERY_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}sorcerer-innate-sorcery`;
export const AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}sorcerer-sorcerous-restoration`;
export const AUTOMATED_SORCERER_SORCERY_POINTS_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}sorcerer-sorcery-points`;
const AUTOMATED_WARLOCK_CONTACT_PATRON_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}warlock-contact-patron`;
export const AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}warlock-magical-cunning`;
export const AUTOMATED_WIZARD_ARCANE_RECOVERY_ID = `${AUTOMATED_TRACKED_RESOURCE_PREFIX}wizard-arcane-recovery`;

function clampNonNegativeInteger(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function normalizeStringArray(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

function normalizeOptionalString(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function normalizeDisplay(value: string | undefined): TrackedResourceDisplay {
  return value === "checkboxes" ? "checkboxes" : "counter";
}

function normalizeRecovery(value: string | undefined): TrackedResourceRecovery {
  if (value === "shortRest" || value === "longRest" || value === "shortRestOne") {
    return value;
  }

  return "manual";
}

function clampLevel(level: number) {
  return Math.max(1, Math.min(20, Math.floor(Number.isFinite(level) ? level : 1)));
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function getBarbarianRageUses(level: number) {
  if (level >= 17) {
    return 6;
  }

  if (level >= 12) {
    return 5;
  }

  if (level >= 6) {
    return 4;
  }

  if (level >= 3) {
    return 3;
  }

  return 2;
}

function getBardicInspirationUses(charismaModifier: number) {
  return Math.max(1, charismaModifier);
}

function getBardicInspirationRecovery(level: number): TrackedResourceRecovery {
  return level >= 5 ? "shortRest" : "longRest";
}

function getBattleMasterSuperiorityDice(level: number) {
  if (level < 3) {
    return 0;
  }

  return level >= 15 ? 5 : 4;
}

function getClericChannelDivinityUses(level: number) {
  if (level < 2) {
    return 0;
  }

  if (level >= 18) {
    return 4;
  }

  if (level >= 10) {
    return 3;
  }

  return 2;
}

function getDruidWildShapeUses(level: number) {
  if (level < 2) {
    return 0;
  }

  if (level >= 17) {
    return 4;
  }

  if (level >= 6) {
    return 3;
  }

  return 2;
}

function getDruidNaturalRecoveryUses(level: number) {
  return level >= 6 ? 1 : 0;
}

function getDruidWildResurgenceUses(level: number) {
  return level >= 5 ? 1 : 0;
}

function getFighterActionSurgeUses(level: number) {
  if (level < 2) {
    return 0;
  }

  if (level >= 17) {
    return 2;
  }

  return 1;
}

function getFighterIndomitableUses(level: number) {
  if (level < 9) {
    return 0;
  }

  if (level >= 17) {
    return 3;
  }

  if (level >= 13) {
    return 2;
  }

  return 1;
}

function getFighterSecondWindUses(level: number) {
  if (level >= 10) {
    return 4;
  }

  if (level >= 4) {
    return 3;
  }

  return 2;
}

function getClericDivineInterventionUses(level: number) {
  return level >= 10 ? 1 : 0;
}

function getLightDomainWardingFlareUses(wisdomModifier: number) {
  return Math.max(1, wisdomModifier);
}

function getPaladinChannelDivinityUses(level: number) {
  if (level < 3) {
    return 0;
  }

  if (level >= 11) {
    return 3;
  }

  return 2;
}

function getPaladinFaithfulSteedUses(level: number) {
  return level >= 5 ? 1 : 0;
}

function getPaladinLayOnHandsPool(level: number) {
  return level * 5;
}

function getRangerTirelessUses(level: number, wisdomModifier: number) {
  if (level < 10) {
    return 0;
  }

  return Math.max(1, wisdomModifier);
}

function getRangerFavoredEnemyUses(level: number) {
  if (level >= 17) {
    return 6;
  }

  if (level >= 13) {
    return 5;
  }

  if (level >= 9) {
    return 4;
  }

  if (level >= 5) {
    return 3;
  }

  return 2;
}

function getRangerNaturesVeilUses(level: number, wisdomModifier: number) {
  if (level < 14) {
    return 0;
  }

  return Math.max(1, wisdomModifier);
}

function getSorcererInnateSorceryUses(level: number) {
  return level >= 1 ? 2 : 0;
}

function getSorcerousRestorationUses(level: number) {
  return level >= 5 ? 1 : 0;
}

function getSorceryPoints(level: number) {
  if (level < 2) {
    return 0;
  }

  return level;
}

function getRogueStrokeOfLuckUses(level: number) {
  return level >= 20 ? 1 : 0;
}

function getWarlockContactPatronUses(level: number) {
  return level >= 9 ? 1 : 0;
}

function getWarlockMagicalCunningUses(level: number) {
  return level >= 2 ? 1 : 0;
}

function getWizardArcaneRecoveryUses(level: number) {
  return level >= 1 ? 1 : 0;
}

function resolveAbilityModifier(
  ability: AbilityName,
  record: Pick<CharacterRecord, "abilities">,
  abilityModifiers?: Partial<Record<AbilityName, number>>,
) {
  return abilityModifiers?.[ability] ?? abilityModifier(record.abilities[ability]);
}

function createAutomatedTrackedResource(config: {
  id: string;
  label: string;
  max: number;
  recovery: TrackedResourceRecovery;
  referenceSlug: string;
  notes: string;
}): TrackedResource {
  return {
    id: config.id,
    label: config.label,
    current: config.max,
    max: config.max,
    display: "counter",
    recovery: config.recovery,
    referenceSlug: config.referenceSlug,
    notes: config.notes,
  };
}

function buildAutomatedTrackedResources(
  record: Pick<CharacterRecord, "abilities" | "classId" | "level" | "subclass">,
  abilityModifiers?: Partial<Record<AbilityName, number>>,
): TrackedResource[] {
  const level = clampLevel(record.level);
  const resources: TrackedResource[] = [];

  if (record.classId === "bard") {
    resources.push(
      createAutomatedTrackedResource({
        id: AUTOMATED_BARDIC_INSPIRATION_ID,
        label: "Bardic Inspiration",
        max: getBardicInspirationUses(resolveAbilityModifier("charisma", record, abilityModifiers)),
        recovery: getBardicInspirationRecovery(level),
        referenceSlug: "bard",
        notes: "Spend 1 use when granting Bardic Inspiration to another creature.",
      }),
    );
  }

  if (record.classId === "barbarian") {
    resources.push(
      createAutomatedTrackedResource({
        id: AUTOMATED_RAGE_ID,
        label: "Rage",
        max: getBarbarianRageUses(level),
        recovery: "shortRestOne",
        referenceSlug: "barbarian",
        notes: "Spend 1 use when entering Rage.",
      }),
    );
  }

  if (record.classId === "cleric") {
    const channelDivinityUses = getClericChannelDivinityUses(level);
    const divineInterventionUses = getClericDivineInterventionUses(level);
    const wisdomModifier = resolveAbilityModifier("wisdom", record, abilityModifiers);

    if (channelDivinityUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_CLERIC_CHANNEL_DIVINITY_ID,
          label: "Channel Divinity",
          max: channelDivinityUses,
          recovery: "shortRestOne",
          referenceSlug: "cleric",
          notes: "Spend 1 use when activating a Cleric Channel Divinity effect.",
        }),
      );
    }

    if (divineInterventionUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_CLERIC_DIVINE_INTERVENTION_ID,
          label: "Divine Intervention",
          max: divineInterventionUses,
          recovery: "longRest",
          referenceSlug: "cleric",
          notes: "Spend 1 use after casting a Cleric spell through Divine Intervention.",
        }),
      );
    }

    if (record.subclass === "cleric-light-domain") {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_LIGHT_DOMAIN_WARDING_FLARE_ID,
          label: "Warding Flare",
          max: getLightDomainWardingFlareUses(wisdomModifier),
          recovery: "longRest",
          referenceSlug: "cleric-light-domain",
          notes: "Spend 1 use when using Warding Flare to impose disadvantage on an attack roll.",
        }),
      );
    }
  }

  if (record.classId === "druid") {
    const naturalRecoveryUses = getDruidNaturalRecoveryUses(level);
    const wildShapeUses = getDruidWildShapeUses(level);
    const wildResurgenceUses = getDruidWildResurgenceUses(level);

    if (record.subclass === "druid-circle-of-the-land" && naturalRecoveryUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_DRUID_NATURAL_RECOVERY_ID,
          label: "Natural Recovery",
          max: naturalRecoveryUses,
          recovery: "longRest",
          referenceSlug: "druid-circle-of-the-land",
          notes: "Spend 1 use after recovering spell slots with Natural Recovery during a Short Rest.",
        }),
      );
    }

    if (wildShapeUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_WILD_SHAPE_ID,
          label: "Wild Shape",
          max: wildShapeUses,
          recovery: "shortRestOne",
          referenceSlug: "druid",
          notes: "Spend 1 use to activate Wild Shape.",
        }),
      );
    }

    if (wildResurgenceUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_DRUID_WILD_RESURGENCE_ID,
          label: "Wild Resurgence",
          max: wildResurgenceUses,
          recovery: "longRest",
          referenceSlug: "druid",
          notes: "Spend 1 use after converting 1 use of Wild Shape into a level 1 spell slot.",
        }),
      );
    }
  }

  if (record.classId === "fighter") {
    resources.push(
      createAutomatedTrackedResource({
        id: AUTOMATED_FIGHTER_SECOND_WIND_ID,
        label: "Second Wind",
        max: getFighterSecondWindUses(level),
        recovery: "shortRestOne",
        referenceSlug: "fighter",
        notes: "Spend 1 use to heal or to fuel Tactical Mind.",
      }),
    );

    if (record.subclass === "fighter-battle-master") {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_BATTLE_MASTER_SUPERIORITY_DICE_ID,
          label: "Superiority Dice",
          max: getBattleMasterSuperiorityDice(level),
          recovery: "shortRest",
          referenceSlug: "fighter-battle-master",
          notes: "Spend 1 die when using a Battle Master maneuver.",
        }),
      );
    }

    const actionSurgeUses = getFighterActionSurgeUses(level);

    if (actionSurgeUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_FIGHTER_ACTION_SURGE_ID,
          label: "Action Surge",
          max: actionSurgeUses,
          recovery: "shortRest",
          referenceSlug: "fighter",
          notes: "Spend 1 use to take an extra action.",
        }),
      );
    }

    const indomitableUses = getFighterIndomitableUses(level);

    if (indomitableUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_FIGHTER_INDOMITABLE_ID,
          label: "Indomitable",
          max: indomitableUses,
          recovery: "longRest",
          referenceSlug: "fighter",
          notes: "Spend 1 use after rerolling a failed saving throw with Indomitable.",
        }),
      );
    }
  }

  if (record.classId === "paladin") {
    resources.push(
      createAutomatedTrackedResource({
        id: AUTOMATED_PALADIN_LAY_ON_HANDS_ID,
        label: "Lay on Hands",
        max: getPaladinLayOnHandsPool(level),
        recovery: "longRest",
        referenceSlug: "paladin",
        notes: "Spend points from the healing pool as you use Lay on Hands.",
      }),
    );

    const faithfulSteedUses = getPaladinFaithfulSteedUses(level);

    if (faithfulSteedUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_PALADIN_FAITHFUL_STEED_ID,
          label: "Faithful Steed",
          max: faithfulSteedUses,
          recovery: "longRest",
          referenceSlug: "paladin",
          notes: "Spend 1 use after casting Find Steed without expending a spell slot.",
        }),
      );
    }

    const channelDivinityUses = getPaladinChannelDivinityUses(level);

    if (channelDivinityUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_PALADIN_CHANNEL_DIVINITY_ID,
          label: "Channel Divinity",
          max: channelDivinityUses,
          recovery: "shortRestOne",
          referenceSlug: "paladin",
          notes: "Spend 1 use when activating a Paladin Channel Divinity effect.",
        }),
      );
    }
  }

  if (record.classId === "ranger") {
    const wisdomModifier = resolveAbilityModifier("wisdom", record, abilityModifiers);

    resources.push(
      createAutomatedTrackedResource({
        id: AUTOMATED_RANGER_FAVORED_ENEMY_ID,
        label: "Favored Enemy",
        max: getRangerFavoredEnemyUses(level),
        recovery: "longRest",
        referenceSlug: "ranger",
        notes: "Spend 1 use to cast Hunter's Mark without expending a spell slot.",
      }),
    );

    const tirelessUses = getRangerTirelessUses(level, wisdomModifier);

    if (tirelessUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_RANGER_TIRELESS_ID,
          label: "Tireless",
          max: tirelessUses,
          recovery: "longRest",
          referenceSlug: "ranger",
          notes: "Spend 1 use when using Tireless to gain temporary Hit Points.",
        }),
      );
    }

    const naturesVeilUses = getRangerNaturesVeilUses(level, wisdomModifier);

    if (naturesVeilUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_RANGER_NATURES_VEIL_ID,
          label: "Nature's Veil",
          max: naturesVeilUses,
          recovery: "longRest",
          referenceSlug: "ranger",
          notes: "Spend 1 use when activating Nature's Veil.",
        }),
      );
    }
  }

  if (record.classId === "rogue") {
    const strokeOfLuckUses = getRogueStrokeOfLuckUses(level);

    if (strokeOfLuckUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_ROGUE_STROKE_OF_LUCK_ID,
          label: "Stroke of Luck",
          max: strokeOfLuckUses,
          recovery: "shortRest",
          referenceSlug: "rogue",
          notes: "Spend 1 use when turning a missed d20 Test into a 20 or a failed Sneak Attack roll into a normal hit.",
        }),
      );
    }
  }

  if (record.classId === "sorcerer") {
    const innateSorceryUses = getSorcererInnateSorceryUses(level);
    const sorcerousRestorationUses = getSorcerousRestorationUses(level);
    const sorceryPoints = getSorceryPoints(level);

    if (innateSorceryUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_SORCERER_INNATE_SORCERY_ID,
          label: "Innate Sorcery",
          max: innateSorceryUses,
          recovery: "longRest",
          referenceSlug: "sorcerer",
          notes: "Spend 1 use when you activate Innate Sorcery.",
        }),
      );
    }

    if (sorceryPoints > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_SORCERER_SORCERY_POINTS_ID,
          label: "Sorcery Points",
          max: sorceryPoints,
          recovery: "longRest",
          referenceSlug: "sorcerer",
          notes: "Spend points to fuel Metamagic or convert them through Font of Magic.",
        }),
      );
    }

    if (sorcerousRestorationUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_SORCERER_SORCEROUS_RESTORATION_ID,
          label: "Sorcerous Restoration",
          max: sorcerousRestorationUses,
          recovery: "longRest",
          referenceSlug: "sorcerer",
          notes: "Spend 1 use after regaining up to half your Sorcerer level in Sorcery Points when you finish a Short Rest.",
        }),
      );
    }
  }

  if (record.classId === "warlock") {
    const contactPatronUses = getWarlockContactPatronUses(level);
    const magicalCunningUses = getWarlockMagicalCunningUses(level);

    if (contactPatronUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_WARLOCK_CONTACT_PATRON_ID,
          label: "Contact Patron",
          max: contactPatronUses,
          recovery: "longRest",
          referenceSlug: "warlock",
          notes: "Spend 1 use after casting Contact Other Plane through Contact Patron.",
        }),
      );
    }

    if (magicalCunningUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_WARLOCK_MAGICAL_CUNNING_ID,
          label: "Magical Cunning",
          max: magicalCunningUses,
          recovery: "longRest",
          referenceSlug: "warlock",
          notes: "Spend 1 use after regaining Pact Magic spell slots with Magical Cunning.",
        }),
      );
    }
  }

  if (record.classId === "wizard") {
    const arcaneRecoveryUses = getWizardArcaneRecoveryUses(level);

    if (arcaneRecoveryUses > 0) {
      resources.push(
        createAutomatedTrackedResource({
          id: AUTOMATED_WIZARD_ARCANE_RECOVERY_ID,
          label: "Arcane Recovery",
          max: arcaneRecoveryUses,
          recovery: "longRest",
          referenceSlug: "wizard",
          notes: "Spend 1 use after recovering spell slots with Arcane Recovery.",
        }),
      );
    }
  }

  return resources;
}

export function isAutomatedTrackedResource(resource: Pick<TrackedResource, "id">) {
  return resource.id.startsWith(AUTOMATED_TRACKED_RESOURCE_PREFIX);
}

export function buildTrackedResourcesForCharacter(
  record: Pick<CharacterRecord, "abilities" | "classId" | "level" | "subclass" | "trackedResources">,
  manualOverride?: TrackedResource[],
  abilityModifiers?: Partial<Record<AbilityName, number>>,
): TrackedResource[] {
  const normalizedExistingResources = normalizeTrackedResources(record.trackedResources);
  const existingAutomatedById = new Map(
    normalizedExistingResources
      .filter((resource) => isAutomatedTrackedResource(resource))
      .map((resource) => [resource.id, resource] as const),
  );
  const manualResources = normalizeTrackedResources(
    manualOverride ?? normalizedExistingResources.filter((resource) => !isAutomatedTrackedResource(resource)),
  );
  const automatedResources = buildAutomatedTrackedResources(record, abilityModifiers).map((resource) => {
    const existing = existingAutomatedById.get(resource.id);

    return {
      ...resource,
      current: Math.min(resource.max, Math.max(0, existing?.current ?? resource.max)),
    };
  });

  return normalizeTrackedResources([...automatedResources, ...manualResources]);
}

export function createDefaultCurrencyWallet(): CurrencyWallet {
  return {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0,
  };
}

export function normalizeCurrencyWallet(input?: Partial<CurrencyWallet>): CurrencyWallet {
  return {
    cp: clampNonNegativeInteger(input?.cp ?? 0),
    sp: clampNonNegativeInteger(input?.sp ?? 0),
    ep: clampNonNegativeInteger(input?.ep ?? 0),
    gp: clampNonNegativeInteger(input?.gp ?? 0),
    pp: clampNonNegativeInteger(input?.pp ?? 0),
  };
}

export function createDefaultSheetProfile(): SheetProfile {
  return {
    appearance: "",
    alignment: "",
    languages: [],
    equipmentNotes: "",
    currencies: createDefaultCurrencyWallet(),
  };
}

export function normalizeSheetProfile(input?: Partial<SheetProfile>): SheetProfile {
  return {
    appearance: input?.appearance ?? "",
    alignment: input?.alignment ?? "",
    languages: normalizeStringArray(input?.languages),
    equipmentNotes: input?.equipmentNotes ?? "",
    currencies: normalizeCurrencyWallet(input?.currencies),
  };
}

export function normalizeTrackedResources(resources?: Array<Partial<TrackedResource>>): TrackedResource[] {
  const normalizedResources: TrackedResource[] = [];

  for (const [index, resource] of (resources ?? []).entries()) {
    const label = resource.label?.trim() ?? "";

    if (!label) {
      continue;
    }

    const display = normalizeDisplay(resource.display);
    const max = Math.max(1, clampNonNegativeInteger(resource.max ?? 0));
    const current = Math.min(max, clampNonNegativeInteger(resource.current ?? max));
    const normalizedResource: TrackedResource = {
      id: normalizeOptionalString(resource.id) ?? `tracked-resource-${index + 1}`,
      label,
      current,
      max,
      display,
      recovery: normalizeRecovery(resource.recovery),
    };
    const referenceSlug = normalizeOptionalString(resource.referenceSlug);
    const notes = normalizeOptionalString(resource.notes);

    if (referenceSlug) {
      normalizedResource.referenceSlug = referenceSlug;
    }

    if (notes) {
      normalizedResource.notes = notes;
    }

    normalizedResources.push(normalizedResource);
  }

  return normalizedResources;
}

export function updateTrackedResourceCurrent(
  resources: TrackedResource[],
  resourceId: string,
  nextCurrent: number,
): TrackedResource[] {
  return normalizeTrackedResources(
    resources.map((resource) => (
      resource.id === resourceId
        ? {
            ...resource,
            current: Math.max(0, Math.min(resource.max, Math.floor(Number.isFinite(nextCurrent) ? nextCurrent : resource.current))),
          }
        : resource
    )),
  );
}

export function recoverTrackedResourcesForRest(
  resources: TrackedResource[],
  restKind: "shortRest" | "longRest",
): TrackedResource[] {
  return normalizeTrackedResources(
    resources.map((resource) => {
      if (restKind === "shortRest") {
        if (resource.recovery === "shortRest") {
          return {
            ...resource,
            current: resource.max,
          };
        }

        if (resource.recovery === "shortRestOne") {
          return {
            ...resource,
            current: Math.min(resource.max, resource.current + 1),
          };
        }

        return resource;
      }

      if (restKind === "longRest" && resource.recovery === "manual") {
        return resource;
      }

      return {
        ...resource,
        current: resource.max,
      };
    }),
  );
}
