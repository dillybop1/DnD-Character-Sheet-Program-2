import type { CurrencyWallet, SheetProfile, TrackedResource, TrackedResourceDisplay, TrackedResourceRecovery } from "./types";

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
  if (value === "shortRest" || value === "longRest") {
    return value;
  }

  return "manual";
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
