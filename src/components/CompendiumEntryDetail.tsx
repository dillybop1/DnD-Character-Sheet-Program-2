import type { ReactNode } from "react";
import type { CompendiumEntry } from "../../shared/types";

interface CompendiumEntryDetailProps {
  entry: CompendiumEntry | null;
  emptyMessage?: string;
  actions?: ReactNode;
}

const LONG_FORM_DETAIL_KEYS = new Set(["description", "higherLevel", "officialText"]);
const SUPPRESSED_LONG_FORM_DETAIL_KEYS = new Set(["effect", "features", "actions"]);

function formatDetailLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDetailValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => formatDetailValue(entry)).filter(Boolean).join(", ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => `${formatDetailLabel(key)}: ${formatDetailValue(entry)}`)
      .filter((entry) => !entry.endsWith(": "))
      .join(", ");
  }

  return "";
}

function hasDetailValue(value: unknown): boolean {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasDetailValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => hasDetailValue(entry));
  }

  return false;
}

function renderLongFormValue(key: string, value: unknown) {
  if (typeof value === "string") {
    return <p className="detail-value">{value}</p>;
  }

  if (Array.isArray(value)) {
    const lines = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);

    return lines.map((line, index) => (
      <p key={`${key}-${index}`} className="detail-value">
        {line}
      </p>
    ));
  }

  return <p className="detail-value">{formatDetailValue(value)}</p>;
}

export function CompendiumEntryDetail({
  entry,
  emptyMessage = "Search or select an entry to inspect it.",
  actions,
}: CompendiumEntryDetailProps) {
  if (!entry) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const payloadSections = Object.entries(entry.payload).filter(
    ([key, value]) => LONG_FORM_DETAIL_KEYS.has(key) && hasDetailValue(value),
  );
  const hasLongFormSections = payloadSections.length > 0;
  const payloadDetails = Object.entries(entry.payload).filter(
    ([key, value]) =>
      !LONG_FORM_DETAIL_KEYS.has(key) &&
      !(hasLongFormSections && SUPPRESSED_LONG_FORM_DETAIL_KEYS.has(key)) &&
      formatDetailValue(value),
  );

  return (
    <div className="stack-md">
      {hasLongFormSections ? null : <p>{entry.summary}</p>}
      {actions ? <div className="action-row">{actions}</div> : null}
      {payloadSections.map(([key, value]) => (
        <section key={key} className="stack-sm">
          <span className="detail-label">{formatDetailLabel(key)}</span>
          {renderLongFormValue(key, value)}
        </section>
      ))}
      <div className="detail-grid">
        <div>
          <span className="detail-label">Ruleset</span>
          <strong>{entry.ruleset}</strong>
        </div>
        <div>
          <span className="detail-label">Source</span>
          <strong>{entry.source}</strong>
        </div>
        <div>
          <span className="detail-label">License</span>
          <strong>{entry.license}</strong>
        </div>
        <div>
          <span className="detail-label">Attribution</span>
          <strong>{entry.attribution}</strong>
        </div>
        {payloadDetails.map(([key, value]) => (
          <div key={key}>
            <span className="detail-label">{formatDetailLabel(key)}</span>
            <strong className="detail-value">{formatDetailValue(value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
