import { useState } from "react";
import { listContentSources } from "../../shared/data/contentSources";
import { SectionCard } from "../components/SectionCard";
import { formatBuiltAt, getLaunchSummary, useAppInfo } from "../lib/appInfo";
import { dndApi } from "../lib/api";
import {
  getLockedSheetViewportScaleLabel,
  LOCKED_SHEET_VIEWPORT_SCALES,
  useLockedSheetViewportScale,
} from "../lib/lockedSheetViewport";

export function SettingsPage() {
  const appInfo = useAppInfo();
  const { scaleMode, setScaleMode } = useLockedSheetViewportScale();
  const [revealStatus, setRevealStatus] = useState(
    "Use these details when validating packaged installs, export paths, and local persistence.",
  );
  const [layoutStatus, setLayoutStatus] = useState(
    "Locked sheet previews use your preferred zoom on both the builder preview and saved-sheet route.",
  );
  const contentSources = listContentSources();

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
              <span className="detail-label">Built At</span>
              <strong>{appInfo ? formatBuiltAt(appInfo.builtAt) : "Unavailable"}</strong>
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
              <span className="detail-label">Launch Source</span>
              <strong>{appInfo ? getLaunchSummary(appInfo.launchPath) : "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Running From</span>
              <strong className="detail-value">{appInfo?.launchPath ?? "Unavailable"}</strong>
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
              <strong className="detail-value">{appInfo?.userDataPath ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Database Path</span>
              <strong className="detail-value">{appInfo?.databasePath ?? "Unavailable"}</strong>
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
          <p className="muted-copy">
            If the packaged UI looks stale, compare `Built At` and `Running From` against the artifact you expected to
            launch.
          </p>
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
        title="Sheet Layout"
        subtitle="Locked desktop viewport"
      >
        <div className="stack-md">
          <div className="detail-grid">
            <div>
              <span className="detail-label">Preferred Zoom</span>
              <strong>{getLockedSheetViewportScaleLabel(scaleMode)}</strong>
            </div>
            <div>
              <span className="detail-label">Small Window Behavior</span>
              <strong>Scale first, then horizontal scroll</strong>
            </div>
          </div>
          <div className="action-row">
            {LOCKED_SHEET_VIEWPORT_SCALES.map((option) => (
              <button
                key={option.value}
                className={`action-button ${scaleMode === option.value ? "action-button--secondary" : ""}`.trim()}
                onClick={() => {
                  setScaleMode(option.value);
                  setLayoutStatus(`Preferred locked-sheet zoom set to ${option.label}.`);
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="muted-copy">{layoutStatus}</p>
          <p className="muted-copy">
            Changes apply immediately to the builder preview and saved-sheet pages, and they stay in effect for future
            launches.
          </p>
        </div>
      </SectionCard>
      <SectionCard
        title="Validation Workflow"
        subtitle="Installer + export checks"
      >
        <ol className="instruction-list">
          <li>
            Open a packaged build and confirm `Runtime` is `electron`, `Packaged` is `Yes`, and `Built At` matches
            your latest packaging run.
          </li>
          <li>Create or import a character, save it, and reopen it from the roster route.</li>
          <li>Open the saved sheet, jump into edit, return, and confirm JSON plus PDF export still work.</li>
          <li>
            Use `Running From` plus `Reveal Database File` to verify which installed copy you launched and where it is
            writing local data.
          </li>
        </ol>
      </SectionCard>
    </div>
  );
}
