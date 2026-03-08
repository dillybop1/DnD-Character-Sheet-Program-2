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
import {
  checkForAppUpdate,
  formatUpdateTimestamp,
  RELEASES_PAGE_URL,
  type UpdateCheckResult,
} from "../lib/updateCheck";

export function SettingsPage() {
  const appInfo = useAppInfo();
  const { scaleMode, setScaleMode } = useLockedSheetViewportScale();
  const [revealStatus, setRevealStatus] = useState(
    "Use these details when validating packaged installs, export paths, and local persistence.",
  );
  const [layoutStatus, setLayoutStatus] = useState(
    "Locked sheet previews use your preferred zoom on both the builder preview and saved-sheet route.",
  );
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [updateStatus, setUpdateStatus] = useState(
    "Manual update checks compare your installed version against the published GitHub releases.",
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

  async function handleOpenExternalUrl(url: string, successMessage: string) {
    try {
      const opened = await dndApi.app.openExternalUrl(url);
      setUpdateStatus(opened ? successMessage : "Unable to open the update page from this runtime.");
    } catch (error) {
      setUpdateStatus(error instanceof Error ? error.message : "Unable to open the update page.");
    }
  }

  async function handleCheckForUpdates() {
    if (!appInfo?.appVersion) {
      setUpdateStatus("Application version details are unavailable, so update checks cannot run yet.");
      return;
    }

    setIsCheckingUpdates(true);
    setUpdateStatus("Checking published GitHub releases...");

    try {
      const result = await checkForAppUpdate(appInfo.appVersion, appInfo.platform);
      setUpdateResult(result);

      if (result.status === "update-available") {
        setUpdateStatus(`Version ${result.latestVersion} is available. Use Download Update to open the release page.`);
        return;
      }

      if (result.status === "up-to-date") {
        setUpdateStatus(`You are already on the latest published version${result.latestVersion ? ` (${result.latestVersion})` : ""}.`);
        return;
      }

      setUpdateStatus(result.message);
    } finally {
      setIsCheckingUpdates(false);
    }
  }

  const updateStateLabel =
    updateResult?.status === "update-available"
      ? "Update Available"
      : updateResult?.status === "up-to-date"
        ? "Current"
        : updateResult?.status === "unavailable"
          ? "Unavailable"
          : "Not Checked";
  const latestPublishedLabel = updateResult?.status === "unavailable" ? "Unavailable" : (updateResult?.latestVersion ?? "Not checked");
  const updateActionUrl = updateResult?.status === "update-available" ? updateResult.downloadUrl : (updateResult?.releaseUrl ?? RELEASES_PAGE_URL);

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
        title="Updates"
        subtitle="Published release checks"
      >
        <div className="stack-md">
          <div className="detail-grid">
            <div>
              <span className="detail-label">Installed Version</span>
              <strong>{appInfo?.appVersion ?? "Unavailable"}</strong>
            </div>
            <div>
              <span className="detail-label">Latest Published</span>
              <strong>{latestPublishedLabel}</strong>
            </div>
            <div>
              <span className="detail-label">Status</span>
              <strong>{updateStateLabel}</strong>
            </div>
            <div>
              <span className="detail-label">Last Checked</span>
              <strong>{updateResult ? formatUpdateTimestamp(updateResult.checkedAt) : "Not checked"}</strong>
            </div>
            <div>
              <span className="detail-label">Release Source</span>
              <strong>GitHub Releases</strong>
            </div>
            <div>
              <span className="detail-label">Published At</span>
              <strong>
                {updateResult?.status === "update-available" ? formatUpdateTimestamp(updateResult.publishedAt) : "Unavailable"}
              </strong>
            </div>
          </div>
          <div className="action-row">
            <button
              className="action-button action-button--secondary"
              disabled={!appInfo || isCheckingUpdates}
              onClick={() => void handleCheckForUpdates()}
              type="button"
            >
              {isCheckingUpdates ? "Checking..." : "Check for Updates"}
            </button>
            <button
              className="action-button"
              onClick={() =>
                void handleOpenExternalUrl(
                  updateActionUrl,
                  updateResult?.status === "update-available"
                    ? "Opened the latest release download in your browser."
                    : "Opened the release page in your browser.",
                )}
              type="button"
            >
              {updateResult?.status === "update-available" ? "Download Update" : "View Releases"}
            </button>
          </div>
          <p className="muted-copy">{updateStatus}</p>
          {updateResult?.status === "update-available" && updateResult.summary ? (
            <p className="muted-copy">{updateResult.summary}</p>
          ) : null}
          <p className="muted-copy">
            This is a manual release check. It opens the installer or release page in your browser instead of patching
            the app in place.
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
            <div>
              <span className="detail-label">Mouse Drag</span>
              <strong>Drag blank sheet space to pan horizontally</strong>
            </div>
            <div>
              <span className="detail-label">Navigator Bar</span>
              <strong>Use the thumb below the sheet to jump across wide layouts</strong>
            </div>
            <div>
              <span className="detail-label">Keyboard Controls</span>
              <strong>Click the sheet, then Left/Right pan, +/- zoom, 0 = Fit</strong>
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
