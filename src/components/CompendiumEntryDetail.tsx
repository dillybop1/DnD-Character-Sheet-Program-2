import type { ReactNode } from "react";
import type { CompendiumEntry } from "../../shared/types";

interface CompendiumEntryDetailProps {
  entry: CompendiumEntry | null;
  emptyMessage?: string;
  actions?: ReactNode;
}

export function CompendiumEntryDetail({
  entry,
  emptyMessage = "Search or select an entry to inspect it.",
  actions,
}: CompendiumEntryDetailProps) {
  if (!entry) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

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
      </div>
      <pre className="payload-view">{JSON.stringify(entry.payload, null, 2)}</pre>
    </div>
  );
}
