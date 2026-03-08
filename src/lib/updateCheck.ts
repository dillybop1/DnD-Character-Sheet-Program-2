const RELEASES_API_URL = "https://api.github.com/repos/dillybop1/DnD-Character-Sheet-Program-2/releases?per_page=12";
export const RELEASES_PAGE_URL = "https://github.com/dillybop1/DnD-Character-Sheet-Program-2/releases";

interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GithubReleaseRecord {
  body: string | null;
  draft: boolean;
  html_url: string;
  name: string | null;
  prerelease: boolean;
  published_at: string | null;
  tag_name: string;
  assets: GithubReleaseAsset[];
}

export type UpdateCheckResult =
  | {
      status: "update-available";
      checkedAt: string;
      currentVersion: string;
      downloadUrl: string;
      latestVersion: string;
      publishedAt: string | null;
      releaseName: string;
      releaseUrl: string;
      summary: string | null;
    }
  | {
      status: "up-to-date";
      checkedAt: string;
      currentVersion: string;
      latestVersion: string | null;
      releaseUrl: string;
    }
  | {
      status: "unavailable";
      checkedAt: string;
      currentVersion: string;
      message: string;
      releaseUrl: string;
    };

function normalizeVersion(value: string) {
  const numericPortion = value.trim().replace(/^v/i, "").split("-")[0];
  const segments = numericPortion.split(".").map((segment) => Number.parseInt(segment, 10));

  if (segments.length === 0 || segments.some((segment) => Number.isNaN(segment))) {
    return null;
  }

  return segments;
}

function compareVersions(left: string, right: string) {
  const leftSegments = normalizeVersion(left);
  const rightSegments = normalizeVersion(right);

  if (!leftSegments || !rightSegments) {
    return 0;
  }

  const maxLength = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftSegment = leftSegments[index] ?? 0;
    const rightSegment = rightSegments[index] ?? 0;

    if (leftSegment > rightSegment) {
      return 1;
    }

    if (leftSegment < rightSegment) {
      return -1;
    }
  }

  return 0;
}

function findReleaseSummary(body: string | null) {
  if (!body) {
    return null;
  }

  const firstNonEmptyLine = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("- "));

  return firstNonEmptyLine ?? null;
}

function resolvePreferredDownloadUrl(release: GithubReleaseRecord, platform?: string) {
  if (platform === "darwin") {
    return release.assets.find((asset) => asset.name.endsWith(".dmg"))?.browser_download_url ?? release.html_url;
  }

  if (platform === "win32") {
    return release.assets.find((asset) => asset.name.endsWith(".exe"))?.browser_download_url ?? release.html_url;
  }

  return release.html_url;
}

export function formatUpdateTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Unavailable";
  }

  const parsedTimestamp = new Date(timestamp);

  if (Number.isNaN(parsedTimestamp.getTime())) {
    return timestamp;
  }

  return parsedTimestamp.toLocaleString();
}

export async function checkForAppUpdate(currentVersion: string, platform?: string): Promise<UpdateCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(RELEASES_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      const message =
        response.status === 404
          ? "No public release feed is available yet for update checks."
          : response.status === 403
            ? "GitHub release checks are temporarily unavailable or rate limited."
            : `GitHub release check failed with HTTP ${response.status}.`;

      return {
        status: "unavailable",
        checkedAt,
        currentVersion,
        message,
        releaseUrl: RELEASES_PAGE_URL,
      };
    }

    const releases = (await response.json()) as GithubReleaseRecord[];
    const publishedReleases = releases
      .filter((release) => !release.draft && normalizeVersion(release.tag_name))
      .sort((left, right) => compareVersions(right.tag_name, left.tag_name));
    const latestRelease = publishedReleases[0];

    if (!latestRelease) {
      return {
        status: "unavailable",
        checkedAt,
        currentVersion,
        message: "No published releases were found in the configured GitHub feed.",
        releaseUrl: RELEASES_PAGE_URL,
      };
    }

    const latestVersion = latestRelease.tag_name.replace(/^v/i, "");

    if (compareVersions(latestVersion, currentVersion) > 0) {
      return {
        status: "update-available",
        checkedAt,
        currentVersion,
        downloadUrl: resolvePreferredDownloadUrl(latestRelease, platform),
        latestVersion,
        publishedAt: latestRelease.published_at,
        releaseName: latestRelease.name?.trim() || latestRelease.tag_name,
        releaseUrl: latestRelease.html_url,
        summary: findReleaseSummary(latestRelease.body),
      };
    }

    return {
      status: "up-to-date",
      checkedAt,
      currentVersion,
      latestVersion,
      releaseUrl: latestRelease.html_url,
    };
  } catch (error) {
    return {
      status: "unavailable",
      checkedAt,
      currentVersion,
      message: error instanceof Error ? error.message : "Unable to reach the GitHub release feed.",
      releaseUrl: RELEASES_PAGE_URL,
    };
  }
}
