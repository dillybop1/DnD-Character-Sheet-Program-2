import type { ContentSource, ContentSourceId } from "../types";

export const CORE_OPEN_SOURCE_ID = "srd-5.2.1";

export const CONTENT_SOURCES: ContentSource[] = [
  {
    id: CORE_OPEN_SOURCE_ID,
    shortCode: "SRD 5.2.1",
    name: "System Reference Document 5.2.1",
    ruleset: "2024",
    category: "core",
    availability: "installed",
    licenseMode: "open",
    summary: "Current open baseline content used by the app today.",
  },
  {
    id: "tashas-cauldron-of-everything",
    shortCode: "TCE",
    name: "Tasha's Cauldron of Everything",
    ruleset: "5e",
    category: "sourcebook",
    availability: "planned",
    licenseMode: "licensed",
    summary: "Future optional expansion source once licensed content support is added.",
  },
  {
    id: "exploring-eberron",
    shortCode: "EE",
    name: "Exploring Eberron",
    ruleset: "5e",
    category: "setting",
    availability: "planned",
    licenseMode: "licensed",
    summary: "Future setting source once non-core content packages are implemented.",
  },
];

export const DEFAULT_ENABLED_SOURCE_IDS: ContentSourceId[] = [CORE_OPEN_SOURCE_ID];

const CONTENT_SOURCE_MAP = new Map(CONTENT_SOURCES.map((source) => [source.id, source] as const));

export function listContentSources() {
  return CONTENT_SOURCES;
}

export function listInstalledContentSources() {
  return CONTENT_SOURCES.filter((source) => source.availability === "installed");
}

export function findContentSource(sourceId: ContentSourceId) {
  return CONTENT_SOURCE_MAP.get(sourceId) ?? null;
}

export function resolveEnabledSourceIds(sourceIds?: ContentSourceId[]) {
  const requestedSourceIds = sourceIds?.filter(Boolean) ?? [];
  const installedSourceIds = new Set(listInstalledContentSources().map((source) => source.id));
  const validSourceIds = requestedSourceIds.filter((sourceId) => installedSourceIds.has(sourceId));

  return validSourceIds.length > 0 ? validSourceIds : [...DEFAULT_ENABLED_SOURCE_IDS];
}

export function isSourceEnabled(sourceId: ContentSourceId, enabledSourceIds?: ContentSourceId[]) {
  return resolveEnabledSourceIds(enabledSourceIds).includes(sourceId);
}
