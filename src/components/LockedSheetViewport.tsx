import { useEffect, useRef, useState, type CSSProperties, type PropsWithChildren } from "react";
import {
  clampLockedSheetFitScale,
  LOCKED_SHEET_VIEWPORT_SCALES,
  useLockedSheetViewportScale,
} from "../lib/lockedSheetViewport";

const SCROLL_EDGE_TOLERANCE = 6;

interface LockedSheetViewportProps extends PropsWithChildren {
  minWidth: number;
}

export function LockedSheetViewport({ children, minWidth }: LockedSheetViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { scaleMode, setScaleMode } = useLockedSheetViewportScale();
  const [fitScale, setFitScale] = useState(1);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    const updateScale = () => {
      const nextScale = clampLockedSheetFitScale(viewportElement.clientWidth / minWidth);
      setFitScale((currentScale) => Math.abs(currentScale - nextScale) < 0.005 ? currentScale : nextScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(viewportElement);

    return () => {
      observer.disconnect();
    };
  }, [minWidth]);

  const appliedScale = scaleMode === "fit" ? fitScale : scaleMode;
  useEffect(() => {
    const viewportElement = viewportRef.current;
    const canvasElement = canvasRef.current;

    if (!viewportElement) {
      return;
    }

    let frameId = 0;

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, viewportElement.scrollWidth - viewportElement.clientWidth);
      const nextScrollState = {
        canScrollLeft: viewportElement.scrollLeft > SCROLL_EDGE_TOLERANCE,
        canScrollRight:
          maxScrollLeft > SCROLL_EDGE_TOLERANCE &&
          viewportElement.scrollLeft < maxScrollLeft - SCROLL_EDGE_TOLERANCE,
      };

      setScrollState((currentState) =>
        currentState.canScrollLeft === nextScrollState.canScrollLeft &&
        currentState.canScrollRight === nextScrollState.canScrollRight
          ? currentState
          : nextScrollState,
      );
    };

    const scheduleScrollStateUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateScrollState();
      });
    };

    scheduleScrollStateUpdate();

    const observer = new ResizeObserver(scheduleScrollStateUpdate);
    observer.observe(viewportElement);

    if (canvasElement) {
      observer.observe(canvasElement);
    }

    viewportElement.addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      observer.disconnect();
      viewportElement.removeEventListener("scroll", scheduleScrollStateUpdate);
    };
  }, [appliedScale]);

  const scrollHint =
    scrollState.canScrollLeft && scrollState.canScrollRight
      ? "Scroll sideways to inspect the full sheet."
      : scrollState.canScrollRight
        ? "Scroll right to inspect the remaining columns."
        : scrollState.canScrollLeft
          ? "Scroll left to revisit earlier columns."
          : "No horizontal scrolling is needed at this zoom.";
  const statusCopy =
    scaleMode === "fit"
      ? `Fit mode is active at ${Math.round(appliedScale * 100)}% for this window. ${scrollHint}`
      : `Manual zoom is active at ${Math.round(appliedScale * 100)}%. ${scrollHint}`;
  const canvasStyle = {
    "--sheet-layout-lock-scale": String(appliedScale),
  } as CSSProperties;
  const frameClassName = [
    "sheet-layout-lock__frame",
    scrollState.canScrollLeft ? "sheet-layout-lock__frame--left" : "",
    scrollState.canScrollRight ? "sheet-layout-lock__frame--right" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="sheet-layout-lock-shell">
      <div className="sheet-layout-lock__toolbar">
        <div className="sheet-layout-lock__copy">
          <span>Desktop Layout Locked</span>
          <small aria-live="polite">{statusCopy}</small>
        </div>
        <div
          aria-label="Sheet zoom"
          className="sheet-layout-lock__controls"
          role="group"
        >
          {LOCKED_SHEET_VIEWPORT_SCALES.map((option) => (
            <button
              key={option.value}
              aria-pressed={scaleMode === option.value}
              className={`sheet-layout-lock__button ${scaleMode === option.value ? "sheet-layout-lock__button--active" : ""}`.trim()}
              onClick={() => setScaleMode(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={frameClassName}>
        <div aria-hidden="true" className="sheet-layout-lock__edge sheet-layout-lock__edge--left" />
        <div className="sheet-layout-lock" ref={viewportRef}>
          <div className="sheet-layout-lock__canvas" ref={canvasRef} style={canvasStyle}>{children}</div>
        </div>
        <div aria-hidden="true" className="sheet-layout-lock__edge sheet-layout-lock__edge--right" />
      </div>
    </div>
  );
}
