import {
  getArmorTemplate,
  getGearTemplate,
  getWeaponTemplate,
} from "./data/reference";
import type {
  BackgroundStartingInventoryEntry,
  BuilderInput,
  CharacterRecord,
  DerivedInventoryEntry,
  InventoryItemKind,
  InventoryItemRecord,
} from "./types";

type InventorySource = Pick<
  BuilderInput | CharacterRecord,
  "inventory" | "armorId" | "shieldEquipped" | "weaponIds"
>;

function sanitizeQuantity(quantity: number | undefined) {
  const normalized = Number.isFinite(quantity) ? Math.floor(quantity as number) : 1;
  return Math.max(1, normalized || 1);
}

export function createInventoryItem(
  templateType: InventoryItemKind,
  templateId: string,
  options: Partial<Pick<InventoryItemRecord, "quantity" | "equipped" | "notes">> = {},
): InventoryItemRecord {
  return {
    id: crypto.randomUUID(),
    templateType,
    templateId,
    quantity: sanitizeQuantity(options.quantity),
    equipped: options.equipped ?? false,
    notes: options.notes,
  };
}

export function mergeInventorySuggestions(
  inventory: InventoryItemRecord[],
  suggestions: BackgroundStartingInventoryEntry[],
) {
  const nextInventory = inventory.map((item) => ({
    ...item,
    quantity: sanitizeQuantity(item.quantity),
  }));
  let addedCount = 0;
  let updatedCount = 0;

  for (const suggestion of suggestions) {
    const suggestionQuantity = sanitizeQuantity(suggestion.quantity);
    const existingIndex = nextInventory.findIndex(
      (item) => item.templateType === suggestion.templateType && item.templateId === suggestion.templateId,
    );

    if (existingIndex === -1) {
      nextInventory.push(
        createInventoryItem(suggestion.templateType, suggestion.templateId, {
          quantity: suggestionQuantity,
          equipped: suggestion.equipped,
        }),
      );
      addedCount += 1;
      continue;
    }

    const existingItem = nextInventory[existingIndex];
    const nextQuantity = Math.max(existingItem.quantity, suggestionQuantity);
    const nextEquipped = existingItem.equipped || Boolean(suggestion.equipped);

    if (nextQuantity === existingItem.quantity && nextEquipped === existingItem.equipped) {
      continue;
    }

    nextInventory[existingIndex] = {
      ...existingItem,
      quantity: nextQuantity,
      equipped: nextEquipped,
    };
    updatedCount += 1;
  }

  return {
    inventory: nextInventory,
    addedCount,
    updatedCount,
  };
}

export function legacyLoadoutToInventory(source: Pick<InventorySource, "armorId" | "shieldEquipped" | "weaponIds">) {
  const inventory: InventoryItemRecord[] = [];

  if (source.armorId) {
    inventory.push(createInventoryItem("armor", source.armorId, { equipped: true }));
  }

  if (source.shieldEquipped) {
    inventory.push(createInventoryItem("gear", "shield", { equipped: true }));
  }

  for (const weaponId of source.weaponIds) {
    inventory.push(createInventoryItem("weapon", weaponId, { equipped: true }));
  }

  return inventory;
}

export function normalizeInventory(source: InventorySource) {
  if (source.inventory && source.inventory.length > 0) {
    return source.inventory.map((item) => ({
      ...item,
      quantity: sanitizeQuantity(item.quantity),
    }));
  }

  return legacyLoadoutToInventory(source);
}

export function deriveLegacyLoadout(inventory: InventoryItemRecord[]) {
  const equippedArmorId =
    inventory.find((item) => item.templateType === "armor" && item.equipped)?.templateId ?? null;

  return {
    armorId: equippedArmorId,
    shieldEquipped: inventory.some(
      (item) => item.templateType === "gear" && item.templateId === "shield" && item.equipped,
    ),
    weaponIds: inventory
      .filter((item) => item.templateType === "weapon" && item.equipped)
      .map((item) => item.templateId),
  };
}

export function isInventoryItemEquipable(item: InventoryItemRecord) {
  if (item.templateType === "weapon" || item.templateType === "armor") {
    return true;
  }

  return getGearTemplate(item.templateId)?.equipable ?? false;
}

export function inventoryEntryFromItem(item: InventoryItemRecord): DerivedInventoryEntry | null {
  if (item.templateType === "weapon") {
    const weapon = getWeaponTemplate(item.templateId);

    if (!weapon) {
      return null;
    }

    return {
      id: item.id,
      kind: "weapon",
      name: weapon.name,
      quantity: sanitizeQuantity(item.quantity),
      equipped: item.equipped,
      notes: item.notes ?? weapon.notes,
      referenceSlug: weapon.id,
    };
  }

  if (item.templateType === "armor") {
    const armor = getArmorTemplate(item.templateId);

    if (!armor) {
      return null;
    }

    return {
      id: item.id,
      kind: "armor",
      name: armor.name,
      quantity: sanitizeQuantity(item.quantity),
      equipped: item.equipped,
      notes: item.notes ?? armor.notes,
      referenceSlug: armor.id,
    };
  }

  const gear = getGearTemplate(item.templateId);

  if (!gear) {
    return null;
  }

  return {
    id: item.id,
    kind: "gear",
    name: gear.name,
    quantity: sanitizeQuantity(item.quantity),
    equipped: item.equipped,
    notes: item.notes ?? gear.notes,
    referenceSlug: gear.id,
  };
}

export function listInventoryEntries(source: InventorySource) {
  return normalizeInventory(source)
    .map((item) => inventoryEntryFromItem(item))
    .filter((item): item is DerivedInventoryEntry => Boolean(item));
}
