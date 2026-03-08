import { useEffect, useState } from "react";
import { listContentSources } from "../../shared/data/contentSources";
import type { AppInfo } from "../../shared/types";
import { SectionCard } from "../components/SectionCard";
import { dndApi } from "../lib/api";

export function SettingsPage() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [revealStatus, setRevealStatus] = useState(
    "Use these details when validating packaged installs, export paths, and local persistence.",
  );
  const contentSources = listContentSources();

  useEffect(() => {
    dndApi.app.getInfo().then(setAppInfo).catch(() => {
      setAppInfo(null);
    });
  }, []);

  async function handleRevealDatabaseFile() {
    try {
      const revealed = await dndApi.app.revealDatabaseFile();
      setRevealStatus(
        revealed
          ? "Opened the database location in the host file manager."
          : "Database reveal is only available from the Electron app.",
      );
    } catch (error) {
      setRevealStatus(error instanceof Error ? error.message : "Unable to reveal the database location.");
    }
  }

  return (
    <div className="workspace workspace--two-up">
      <SectionCard
        title="Application Info"
        subtitle="Local runtime + storage"
      >
        <div className="stack-md">
          <div className="detail-grid">
            <div>
              <span className="detail-label">Version</span>
              <strong>{appInfo?.appVersion ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Runtime</span>
              <strong>{appInfo?.runtime ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Packaged</span>
              <strong>{appInfo ? (appInfo.isPackaged ? "Yes" : "No") : "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Platform</span>
              <strong>{appInfo?.platform ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Storage</span>
              <strong>{appInfo?.storageKind ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">User Data Path</span>
              <strong>{appInfo?.userDataPath ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Database Path</span>
              <strong>{appInfo?.databasePath ?? "Unavailable"}</strong>
            </div>
          </div>
          <div className="action-row">
            <button
              className="action-button action-button--secondary"
              disabled={appInfo?.runtime !== "electron"}
              onClick={() => void handleRevealDatabaseFile()}
              type="button"
            >
              Reveal Database File
            </button>
          </div>
          <p className="muted-copy">{revealStatus}</p>
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
        title="Validation Workflow"
        subtitle="Installer + export checks"
      >
        <ol className="instruction-list">
          <li>Open a packaged build and confirm `Runtime` is `electron` plus `Packaged` is `Yes`.</li>
          <li>Create or import a character, save it, and reopen it from the roster route.</li>
          <li>Open the saved sheet, jump into edit, return, and confirm JSON plus PDF export still work.</li>
          <li>Use `Reveal Database File` to verify the installed app is writing to the expected user-data location.</li>
        </ol>
      </SectionCard>
    </div>
  );
}
