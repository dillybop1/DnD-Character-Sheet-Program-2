import { useEffect, useState } from "react";
import type { AppInfo } from "../../shared/types";
import { dndApi } from "./api";

const builtAtFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function useAppInfo() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    dndApi.app.getInfo().then(
      (nextInfo) => {
        if (!cancelled) {
          setAppInfo(nextInfo);
        }
      },
      () => {
        if (!cancelled) {
          setAppInfo(null);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return appInfo;
}

export function formatBuiltAt(builtAt: string | null | undefined) {
  if (!builtAt) {
    return "Live dev session";
  }

  const parsed = new Date(builtAt);

  if (Number.isNaN(parsed.valueOf())) {
    return builtAt;
  }

  return builtAtFormatter.format(parsed);
}

export function getRuntimeLabel(appInfo: AppInfo | null) {
  if (!appInfo) {
    return "Runtime details";
  }

  if (appInfo.runtime === "browser-dev") {
    return "Browser dev";
  }

  return appInfo.isPackaged ? "Packaged Electron" : "Electron dev";
}

export function getLaunchSummary(launchPath: string | null | undefined) {
  if (!launchPath) {
    return "Launch path unavailable";
  }

  if (launchPath.startsWith("http://") || launchPath.startsWith("https://")) {
    return "Live dev server session";
  }

  const normalizedPath = launchPath.replace(/\\/g, "/");

  if (normalizedPath.startsWith("/Applications/")) {
    return "Launched from Applications";
  }

  if (normalizedPath.startsWith("/Volumes/")) {
    return "Running from a mounted DMG";
  }

  if (normalizedPath.includes("/release/")) {
    return "Launched from the local release folder";
  }

  return "Launched from a custom path";
}
