import { useState } from "react";

// Persisted drag-and-drop ordering for a flat list of string ids.
// Order is saved to localStorage on every reorder so the last sort is
// remembered across sessions (same pattern as dashboard-sidebar-collapsed).

function loadStoredOrder(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

// Applies a saved order to the ids currently rendered. Ids missing from
// storage (new or conditional items) keep their default relative position
// after the saved block; saved ids that no longer render are ignored.
export function applyStoredOrder(ids: string[], stored: string[]): string[] {
  if (stored.length === 0) {
    return ids;
  }
  const storedIndex = new Map<string, number>();
  stored.forEach((id, index) => storedIndex.set(id, index));
  return [...ids].sort((a, b) => {
    const rankA = storedIndex.get(a) ?? stored.length + ids.indexOf(a);
    const rankB = storedIndex.get(b) ?? stored.length + ids.indexOf(b);
    return rankA - rankB;
  });
}

export interface DragSort {
  sortedIds: string[];
  draggingId: string | null;
  onDragStart: (id: string) => (event: React.DragEvent<HTMLElement>) => void;
  onDragOver: (id: string) => (event: React.DragEvent<HTMLElement>) => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

export function useDragSort(storageKey: string, ids: string[]): DragSort {
  const [storedOrder, setStoredOrder] = useState<string[]>(() => loadStoredOrder(storageKey));
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sortedIds = applyStoredOrder(ids, storedOrder);

  const onDragStart = (id: string) => (event: React.DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  };

  // Reorders live while hovering so the drop position is always visible.
  const onDragOver = (id: string) => (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (draggingId === null || draggingId === id) {
      return;
    }
    const next = [...sortedIds];
    const from = next.indexOf(draggingId);
    const to = next.indexOf(id);
    if (from === -1 || to === -1 || from === to) {
      return;
    }
    next.splice(from, 1);
    next.splice(to, 0, draggingId);
    setStoredOrder(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Persistence is best-effort; reordering still works for the session.
    }
  };

  const onDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDraggingId(null);
  };

  const onDragEnd = () => {
    setDraggingId(null);
  };

  return { sortedIds, draggingId, onDragStart, onDragOver, onDrop, onDragEnd };
}

export default useDragSort;
