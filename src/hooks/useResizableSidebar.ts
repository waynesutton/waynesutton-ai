import { useCallback, useEffect, useRef, useState } from "react";

// Drag-to-resize for a right-hand sidebar. Used by the dashboard Edit and
// Write flows so the frontmatter panel keeps one shared width. Width persists
// to localStorage under storageKey; a saved value outside the clamp is pulled
// back inside on load. The handle also resizes from the keyboard.

export const SIDEBAR_MIN_WIDTH = 240;
export const SIDEBAR_MAX_WIDTH = 600;
export const SIDEBAR_DEFAULT_WIDTH = 300;
// One localStorage key so Edit, dashboard Write, and /write keep the same width
export const FRONTMATTER_SIDEBAR_WIDTH_KEY = "dashboard-sidebar-width";
const KEYBOARD_STEP = 16;

export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) {
    return SIDEBAR_DEFAULT_WIDTH;
  }
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.round(width)));
}

function loadWidth(storageKey: string): number {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw === null ? SIDEBAR_DEFAULT_WIDTH : clampSidebarWidth(Number(raw));
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

function saveWidth(storageKey: string, width: number): void {
  try {
    localStorage.setItem(storageKey, String(width));
  } catch {
    // Persistence is best-effort; the width still applies this session.
  }
}

export interface ResizableSidebar {
  width: number;
  isResizing: boolean;
  // Spread onto the handle element. It becomes a focusable separator that
  // drags with the pointer and steps with Left/Right, Home, and End.
  handleProps: {
    role: "separator";
    tabIndex: 0;
    "aria-orientation": "vertical";
    "aria-valuenow": number;
    "aria-valuemin": number;
    "aria-valuemax": number;
    "aria-label": string;
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    onDoubleClick: () => void;
  };
}

export function useResizableSidebar(
  storageKey: string,
  label = "Resize frontmatter panel"
): ResizableSidebar {
  const [width, setWidth] = useState<number>(() => loadWidth(storageKey));
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const widthRef = useRef(width);
  widthRef.current = width;

  const commit = useCallback(
    (next: number) => {
      const clamped = clampSidebarWidth(next);
      setWidth(clamped);
      saveWidth(storageKey, clamped);
    },
    [storageKey]
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    startWidthRef.current = widthRef.current;
    setIsResizing(true);
  }, []);

  // The handle sits on the sidebar's left edge, so moving left widens it.
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (event: PointerEvent) => {
      const delta = startXRef.current - event.clientX;
      setWidth(clampSidebarWidth(startWidthRef.current + delta));
    };
    const onUp = () => {
      setIsResizing(false);
      saveWidth(storageKey, widthRef.current);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, storageKey]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      // Left arrow widens because the panel grows toward the left edge.
      const step = event.shiftKey ? KEYBOARD_STEP * 4 : KEYBOARD_STEP;
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          commit(widthRef.current + step);
          break;
        case "ArrowRight":
          event.preventDefault();
          commit(widthRef.current - step);
          break;
        case "Home":
          event.preventDefault();
          commit(SIDEBAR_MIN_WIDTH);
          break;
        case "End":
          event.preventDefault();
          commit(SIDEBAR_MAX_WIDTH);
          break;
        default:
          break;
      }
    },
    [commit]
  );

  const onDoubleClick = useCallback(() => {
    commit(SIDEBAR_DEFAULT_WIDTH);
  }, [commit]);

  return {
    width,
    isResizing,
    handleProps: {
      role: "separator",
      tabIndex: 0,
      "aria-orientation": "vertical",
      "aria-valuenow": width,
      "aria-valuemin": SIDEBAR_MIN_WIDTH,
      "aria-valuemax": SIDEBAR_MAX_WIDTH,
      "aria-label": label,
      onPointerDown,
      onKeyDown,
      onDoubleClick,
    },
  };
}

export default useResizableSidebar;
