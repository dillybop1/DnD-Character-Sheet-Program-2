import { useEffect, useState } from "react";

const VIEWPORT_SCALE_STORAGE_KEY = "dnd-character-sheet:locked-sheet-scale";
const VIEWPORT_SCALE_EVENT = "dnd-character-sheet:locked-sheet-scale-change";

export const MIN_LOCKED_SHEET_FIT_SCALE = 0.58;
export const LOCKED_SHEET_VIEWPORT_SCALES = [
  { value: "fit", label: "Fit" },
  { value: 1, label: "100%" },
  { value: 0.9, label: "90%" },
  { value: 0.8, label: "80%" },
] as const;

export type LockedSheetViewportScaleMode = (typeof LOCKED_SHEET_VIEWPORT_SCALES)[number]["value"];

export function isLockedSheetViewportScale(value: number | string): value is LockedSheetViewportScaleMode {
  return LOCKED_SHEET_VIEWPORT_SCALES.some((scale) => scale.value === value);
}

function parseStoredViewportScale(rawValue: string | null) {
  if (!rawValue || rawValue === "fit") {
    return "fit" as const;
  }

  const parsedValue = Number.parseFloat(rawValue);
  return isLockedSheetViewportScale(parsedValue) ? parsedValue : ("fit" as const);
}

export function readLockedSheetViewportScale() {
  if (typeof window === "undefined") {
    return "fit" as const;
  }

  return parseStoredViewportScale(window.localStorage.getItem(VIEWPORT_SCALE_STORAGE_KEY));
}

export function writeLockedSheetViewportScale(scaleMode: LockedSheetViewportScaleMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(VIEWPORT_SCALE_STORAGE_KEY, String(scaleMode));
  window.dispatchEvent(new CustomEvent<LockedSheetViewportScaleMode>(VIEWPORT_SCALE_EVENT, { detail: scaleMode }));
}

export function clampLockedSheetFitScale(nextScale: number) {
  if (!Number.isFinite(nextScale)) {
    return 1;
  }

  return Math.min(1, Math.max(MIN_LOCKED_SHEET_FIT_SCALE, nextScale));
}

export function getLockedSheetViewportScaleLabel(scaleMode: LockedSheetViewportScaleMode) {
  return LOCKED_SHEET_VIEWPORT_SCALES.find((option) => option.value === scaleMode)?.label ?? "Fit";
}

export function useLockedSheetViewportScale() {
  const [scaleMode, setScaleMode] = useState<LockedSheetViewportScaleMode>(() => readLockedSheetViewportScale());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScaleEvent = (event: Event) => {
      const detail = (event as CustomEvent<LockedSheetViewportScaleMode>).detail;

      if (isLockedSheetViewportScale(detail)) {
        setScaleMode(detail);
        return;
      }

      setScaleMode(readLockedSheetViewportScale());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== VIEWPORT_SCALE_STORAGE_KEY) {
        return;
      }

      setScaleMode(parseStoredViewportScale(event.newValue));
    };

    window.addEventListener(VIEWPORT_SCALE_EVENT, handleScaleEvent as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(VIEWPORT_SCALE_EVENT, handleScaleEvent as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateScaleMode = (nextScaleMode: LockedSheetViewportScaleMode) => {
    setScaleMode(nextScaleMode);
    writeLockedSheetViewportScale(nextScaleMode);
  };

  return { scaleMode, setScaleMode: updateScaleMode };
}
