import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type PropsWithChildren,
} from "react";
import {
  clampLockedSheetFitScale,
  getNextLockedSheetViewportScale,
  getPreviousLockedSheetViewportScale,
  LOCKED_SHEET_VIEWPORT_SCALES,
  useLockedSheetViewportScale,
} from "../lib/lockedSheetViewport";

const SCROLL_EDGE_TOLERANCE = 6;
const DRAG_START_THRESHOLD = 8;
const NAVIGATOR_MIN_THUMB_WIDTH = 48;
const VIEWPORT_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='textbox']",
].join(", ");

interface LockedSheetViewportProps extends PropsWithChildren {
  minWidth: number;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(VIEWPORT_INTERACTIVE_SELECTOR));
}

export function LockedSheetViewport({ children, minWidth }: LockedSheetViewportProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const navigatorTrackRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startScrollLeft: number;
    hasDragged: boolean;
  } | null>(null);
  const navigatorDragRef = useRef<{
    pointerId: number;
    thumbOffset: number;
  } | null>(null);
  const { scaleMode, setScaleMode } = useLockedSheetViewportScale();
  const [fitScale, setFitScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isNavigatorDragging, setIsNavigatorDragging] = useState(false);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    clientWidth: 0,
    scrollLeft: 0,
    scrollWidth: 0,
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

    if (typeof ResizeObserver === "undefined") {
      return;
    }

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
        clientWidth: viewportElement.clientWidth,
        scrollLeft: viewportElement.scrollLeft,
        scrollWidth: viewportElement.scrollWidth,
      };

      setScrollState((currentState) =>
        currentState.canScrollLeft === nextScrollState.canScrollLeft &&
        currentState.canScrollRight === nextScrollState.canScrollRight &&
        Math.abs(currentState.scrollLeft - nextScrollState.scrollLeft) < 1 &&
        currentState.clientWidth === nextScrollState.clientWidth &&
        currentState.scrollWidth === nextScrollState.scrollWidth
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

    if (typeof ResizeObserver === "undefined") {
      viewportElement.addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });

      return () => {
        if (frameId) {
          window.cancelAnimationFrame(frameId);
        }

        viewportElement.removeEventListener("scroll", scheduleScrollStateUpdate);
      };
    }

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
  const interactionHint = "Drag blank sheet space to pan, or click the sheet and use Left and Right, Plus or Minus, and 0.";
  const maxScrollLeft = Math.max(0, scrollState.scrollWidth - scrollState.clientWidth);
  const showsNavigator = maxScrollLeft > SCROLL_EDGE_TOLERANCE;
  const navigatorProgress = maxScrollLeft > 0 ? scrollState.scrollLeft / maxScrollLeft : 0;
  const visibleRatio = scrollState.scrollWidth > 0 ? scrollState.clientWidth / scrollState.scrollWidth : 1;
  const minThumbWidthPercent = scrollState.clientWidth > 0 ? (NAVIGATOR_MIN_THUMB_WIDTH / scrollState.clientWidth) * 100 : 0;
  const navigatorThumbWidthPercent = Math.min(100, Math.max(minThumbWidthPercent, visibleRatio * 100));
  const navigatorThumbOffsetPercent = navigatorProgress * (100 - navigatorThumbWidthPercent);
  const navigatorValue = Math.round(navigatorProgress * 100);
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
  const viewportClassName = [
    "sheet-layout-lock",
    isDragging ? "sheet-layout-lock--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const navigatorClassName = [
    "sheet-layout-lock__navigator",
    isNavigatorDragging ? "sheet-layout-lock__navigator--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const navigatorThumbStyle = {
    left: `${navigatorThumbOffsetPercent}%`,
    width: `${navigatorThumbWidthPercent}%`,
  } as CSSProperties;
  const navigatorValueText = showsNavigator
    ? `${navigatorValue}% across the locked sheet`
    : "The full sheet is visible at this zoom.";

  const stopDragging = (pointerId?: number) => {
    const viewportElement = viewportRef.current;
    const dragState = dragStateRef.current;

    if (!dragState || (pointerId !== undefined && dragState.pointerId !== pointerId)) {
      return;
    }

    if (viewportElement?.hasPointerCapture(dragState.pointerId)) {
      viewportElement.releasePointerCapture(dragState.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  };

  const updateViewportScrollFromNavigator = (clientX: number, thumbOffset?: number) => {
    const viewportElement = viewportRef.current;
    const trackElement = navigatorTrackRef.current;

    if (!viewportElement || !trackElement) {
      return;
    }

    const trackRect = trackElement.getBoundingClientRect();
    const nextMaxScrollLeft = Math.max(0, viewportElement.scrollWidth - viewportElement.clientWidth);

    if (trackRect.width <= 0 || nextMaxScrollLeft <= 0) {
      return;
    }

    const nextVisibleRatio = viewportElement.scrollWidth > 0 ? viewportElement.clientWidth / viewportElement.scrollWidth : 1;
    const thumbWidth = Math.min(
      trackRect.width,
      Math.max(NAVIGATOR_MIN_THUMB_WIDTH, trackRect.width * nextVisibleRatio),
    );
    const maxThumbOffset = Math.max(0, trackRect.width - thumbWidth);
    const desiredThumbOffset =
      thumbOffset === undefined
        ? clientX - trackRect.left - thumbWidth / 2
        : clientX - trackRect.left - thumbOffset;
    const clampedThumbOffset = Math.min(maxThumbOffset, Math.max(0, desiredThumbOffset));
    const nextProgress = maxThumbOffset > 0 ? clampedThumbOffset / maxThumbOffset : 0;

    viewportElement.scrollLeft = nextProgress * nextMaxScrollLeft;
  };

  const handleViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || isInteractiveTarget(event.target)) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    viewportElement.focus();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: viewportElement.scrollLeft,
      hasDragged: false,
    };
    viewportElement.setPointerCapture(event.pointerId);
  };

  const handleViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewportElement = viewportRef.current;
    const dragState = dragStateRef.current;

    if (!viewportElement || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startClientX;

    if (!dragState.hasDragged && Math.abs(deltaX) >= DRAG_START_THRESHOLD) {
      dragState.hasDragged = true;
      setIsDragging(true);
      window.getSelection()?.removeAllRanges();
    }

    if (!dragState.hasDragged) {
      return;
    }

    event.preventDefault();
    viewportElement.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const handleViewportPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopDragging(event.pointerId);
  };

  const handleViewportPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopDragging(event.pointerId);
  };

  const handleViewportLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleViewportKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.currentTarget !== event.target && isInteractiveTarget(event.target)) {
      return;
    }

    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    const panStep = Math.max(140, Math.min(360, viewportElement.clientWidth * (event.shiftKey ? 0.82 : 0.58)));

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        viewportElement.scrollBy({ left: -panStep, behavior: "smooth" });
        return;
      case "ArrowRight":
        event.preventDefault();
        viewportElement.scrollBy({ left: panStep, behavior: "smooth" });
        return;
      case "Home":
        event.preventDefault();
        viewportElement.scrollTo({ left: 0, behavior: "smooth" });
        return;
      case "End":
        event.preventDefault();
        viewportElement.scrollTo({ left: viewportElement.scrollWidth, behavior: "smooth" });
        return;
      case "=":
      case "+":
        event.preventDefault();
        setScaleMode(getNextLockedSheetViewportScale(scaleMode));
        return;
      case "-":
      case "_":
        event.preventDefault();
        setScaleMode(getPreviousLockedSheetViewportScale(scaleMode));
        return;
      case "0":
        event.preventDefault();
        setScaleMode("fit");
        return;
      case "Escape":
        if (event.currentTarget === document.activeElement) {
          event.preventDefault();
          event.currentTarget.blur();
        }
        return;
      default:
        return;
    }
  };

  const handleNavigatorKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    const panStep = Math.max(140, Math.min(360, viewportElement.clientWidth * (event.shiftKey ? 0.82 : 0.58)));

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        viewportElement.scrollBy({ left: -panStep, behavior: "smooth" });
        return;
      case "ArrowRight":
        event.preventDefault();
        viewportElement.scrollBy({ left: panStep, behavior: "smooth" });
        return;
      case "Home":
        event.preventDefault();
        viewportElement.scrollTo({ left: 0, behavior: "smooth" });
        return;
      case "End":
        event.preventDefault();
        viewportElement.scrollTo({ left: viewportElement.scrollWidth, behavior: "smooth" });
        return;
      default:
        return;
    }
  };

  const handleNavigatorTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest(".sheet-layout-lock__navigator-thumb")) {
      return;
    }

    navigatorTrackRef.current?.focus();
    updateViewportScrollFromNavigator(event.clientX);
  };

  const handleNavigatorThumbPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.stopPropagation();
    navigatorTrackRef.current?.focus();
    navigatorDragRef.current = {
      pointerId: event.pointerId,
      thumbOffset: event.clientX - event.currentTarget.getBoundingClientRect().left,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsNavigatorDragging(true);
  };

  const handleNavigatorThumbPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const navigatorDragState = navigatorDragRef.current;

    if (!navigatorDragState || navigatorDragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateViewportScrollFromNavigator(event.clientX, navigatorDragState.thumbOffset);
  };

  const stopNavigatorDragging = (pointerId: number) => {
    if (navigatorDragRef.current?.pointerId !== pointerId) {
      return;
    }

    navigatorDragRef.current = null;
    setIsNavigatorDragging(false);
  };

  return (
    <div className="sheet-layout-lock-shell">
      <div className="sheet-layout-lock__toolbar">
        <div className="sheet-layout-lock__copy">
          <span>Desktop Layout Locked</span>
          <small aria-live="polite">{statusCopy}</small>
          <small className="sheet-layout-lock__shortcut-copy">{interactionHint}</small>
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
        <div
          aria-keyshortcuts="ArrowLeft ArrowRight Home End Plus Minus 0 Escape"
          aria-label="Locked sheet viewport"
          className={viewportClassName}
          onKeyDown={handleViewportKeyDown}
          onLostPointerCapture={handleViewportLostPointerCapture}
          onPointerCancel={handleViewportPointerCancel}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          ref={viewportRef}
          role="region"
          tabIndex={0}
        >
          <div className="sheet-layout-lock__canvas" ref={canvasRef} style={canvasStyle}>{children}</div>
        </div>
        <div aria-hidden="true" className="sheet-layout-lock__edge sheet-layout-lock__edge--right" />
      </div>

      {showsNavigator ? (
        <div className="sheet-layout-lock__navigator-shell">
          <div className="sheet-layout-lock__navigator-copy">
            <span>Sheet Navigator</span>
            <small>{navigatorValueText}</small>
          </div>
          <div
            aria-label="Sheet position navigator"
            aria-orientation="horizontal"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={navigatorValue}
            aria-valuetext={navigatorValueText}
            className={navigatorClassName}
            onKeyDown={handleNavigatorKeyDown}
            onPointerDown={handleNavigatorTrackPointerDown}
            ref={navigatorTrackRef}
            role="slider"
            tabIndex={0}
          >
            <div
              aria-hidden="true"
              className="sheet-layout-lock__navigator-thumb"
              onLostPointerCapture={(event) => stopNavigatorDragging(event.pointerId)}
              onPointerCancel={(event) => stopNavigatorDragging(event.pointerId)}
              onPointerDown={handleNavigatorThumbPointerDown}
              onPointerMove={handleNavigatorThumbPointerMove}
              onPointerUp={(event) => stopNavigatorDragging(event.pointerId)}
              style={navigatorThumbStyle}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
