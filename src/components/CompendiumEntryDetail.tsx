import type { ReactNode } from "react";
import type { CompendiumEntry } from "../../shared/types";

interface CompendiumEntryDetailProps {
  entry: CompendiumEntry | null;
  emptyMessage?: string;
  actions?: ReactNode;
}

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

export function CompendiumEntryDetail({
  entry,
  emptyMessage = "Search or select an entry to inspect it.",
  actions,
}: CompendiumEntryDetailProps) {
  if (!entry) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  const payloadDetails = Object.entries(entry.payload).filter(([, value]) => formatDetailValue(value));

  return (
    <div className="stack-md">
      <p>{entry.summary}</p>
      {actions ? <div className="action-row">{actions}</div> : null}
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
