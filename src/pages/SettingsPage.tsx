import { useEffect, useState } from "react";
import type { AppInfo } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

export function SettingsPage() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

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
