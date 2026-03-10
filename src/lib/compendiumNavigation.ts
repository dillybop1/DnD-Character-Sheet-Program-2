import type { CompendiumEntry } from "../../shared/types";

export interface CompendiumHandoffState {
  returnTo: string;
  returnLabel: string;
  originLabel: string;
}

export function buildCompendiumEntryPath(entry: Pick<CompendiumEntry, "slug" | "type">) {
  const searchParams = new URLSearchParams();
  searchParams.set("slug", entry.slug);
  searchParams.set("type", entry.type);
  return `/compendium?${searchParams.toString()}`;
}

export function readCompendiumHandoffState(value: unknown): CompendiumHandoffState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const returnTo = "returnTo" in value ? value.returnTo : null;
  const returnLabel = "returnLabel" in value ? value.returnLabel : null;
  const originLabel = "originLabel" in value ? value.originLabel : null;

  if (
    typeof returnTo !== "string" ||
    returnTo.trim().length === 0 ||
    typeof returnLabel !== "string" ||
    returnLabel.trim().length === 0 ||
    typeof originLabel !== "string" ||
    originLabel.trim().length === 0
  ) {
    return null;
  }

  return {
    returnTo,
    returnLabel,
    originLabel,
  };
}
