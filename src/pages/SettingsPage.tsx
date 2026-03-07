import { useEffect, useState } from "react";
import { listContentSources } from "../../shared/data/contentSources";
import type { AppInfo } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

export function SettingsPage() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const contentSources = listContentSources();

  useEffect(() => {
    dndApi.app.getInfo().then(setAppInfo).catch(() => {
      setAppInfo(null);
    });
  }, []);

  return (
    <div className="workspace workspace--two-up">
      <SectionCard
        title="Application Info"
        subtitle="Local environment"
      >
        <div className="detail-grid">
          <div>
            <span className="detail-label">Version</span>
            <strong>{appInfo?.appVersion ?? "Unavailable"}</strong>
          </div>
          <div>
            <span className="detail-label">Database Path</span>
            <strong>{appInfo?.databasePath ?? "Unavailable"}</strong>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title="Content Sources"
        subtitle="Installed and planned"
      >
        <div className="stack-sm">
          {contentSources.map((source) => (
            <article
              key={source.id}
              className="detail-card"
            >
              <div className="detail-card__header">
                <strong>{source.name}</strong>
                <span className={`chip ${source.availability === "installed" ? "chip--active" : ""}`}>
                  {source.availability}
                </span>
              </div>
              <p className="muted-copy">{source.summary}</p>
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Code</span>
                  <strong>{source.shortCode}</strong>
                </div>
                <div>
                  <span className="detail-label">Category</span>
                  <strong>{source.category}</strong>
                </div>
                <div>
                  <span className="detail-label">Ruleset</span>
                  <strong>{source.ruleset}</strong>
                </div>
                <div>
                  <span className="detail-label">License</span>
                  <strong>{source.licenseMode}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Handoff Workflow"
        subtitle="Repo-native continuity"
      >
        <ol className="instruction-list">
          <li>Pull latest changes and read `docs/STATUS.md` first.</li>
          <li>Confirm the single `in_progress` task in `docs/CHECKLIST.md`.</li>
          <li>Work on the recorded branch and update `STATUS` plus `CHECKLIST` before stopping.</li>
          <li>Commit the code and docs together before pushing to another machine.</li>
        </ol>
      </SectionCard>
    </div>
  );
}
