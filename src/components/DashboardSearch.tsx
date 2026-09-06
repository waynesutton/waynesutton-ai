import { useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlass,
  SquaresFour,
  Sparkle,
  BookOpen,
  Lightning,
  Article,
  File,
  Stack,
  SlidersHorizontal,
  ArrowElbowDownLeft,
} from "@phosphor-icons/react";
import {
  searchDashboard,
  type DashboardSearchEntry,
  type SearchResultKind,
} from "../utils/dashboardSearch";

export interface ContentHit {
  id: string;
  kind: "post" | "page" | "project";
  title: string;
  description: string;
}

interface DashboardSearchProps {
  /** Controlled query so the Posts, Pages, and Projects lists can keep filtering */
  value: string;
  onChange: (next: string) => void;
  index: ReadonlyArray<DashboardSearchEntry>;
  /** Matching posts, pages, and projects, already filtered by the parent */
  contentHits: ReadonlyArray<ContentHit>;
  onSelectEntry: (entry: DashboardSearchEntry) => void;
  onSelectContent: (hit: ContentHit) => void;
  /** Mac shows Cmd, everything else shows Ctrl */
  isMac: boolean;
}

const KIND_LABEL: Record<SearchResultKind, string> = {
  section: "Section",
  feature: "Feature",
  setting: "Setting",
  action: "Action",
  doc: "Docs",
};

function KindIcon({ kind }: { kind: SearchResultKind }) {
  const size = 15;
  switch (kind) {
    case "section":
      return <SquaresFour size={size} />;
    case "feature":
      return <Sparkle size={size} />;
    case "setting":
      return <SlidersHorizontal size={size} />;
    case "action":
      return <Lightning size={size} />;
    case "doc":
      return <BookOpen size={size} />;
  }
}

function ContentIcon({ kind }: { kind: ContentHit["kind"] }) {
  const size = 15;
  if (kind === "post") return <Article size={size} />;
  if (kind === "page") return <File size={size} />;
  return <Stack size={size} />;
}

type Row =
  | { type: "entry"; entry: DashboardSearchEntry }
  | { type: "content"; hit: ContentHit };

/**
 * Header search that doubles as a command palette. Typing filters the
 * content lists as before and also surfaces dashboard sections, features,
 * quick actions, and docs topics in a dropdown. Cmd/Ctrl+K focuses it.
 */
export function DashboardSearch({
  value,
  onChange,
  index,
  contentHits,
  onSelectEntry,
  onSelectContent,
  isMac,
}: DashboardSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const entryResults = useMemo(
    () => searchDashboard(index, value, 8),
    [index, value],
  );

  // Content first when there are hits (that was the old behavior), then the rest
  const rows = useMemo<Array<Row>>(() => {
    const content: Array<Row> = contentHits
      .slice(0, 6)
      .map((hit) => ({ type: "content", hit }));
    const entries: Array<Row> = entryResults.map((r) => ({
      type: "entry",
      entry: r.entry,
    }));
    return [...content, ...entries];
  }, [contentHits, entryResults]);

  const hasQuery = value.trim().length > 0;
  const showList = open && hasQuery;

  // Global shortcut: Cmd/Ctrl+K focuses the search, Escape clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Reset the highlighted row whenever the result set changes
  useEffect(() => {
    setCursor(0);
  }, [value, rows.length]);

  // Keep the highlighted row in view when arrowing through a long list
  useEffect(() => {
    if (!showList) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${cursor}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor, showList]);

  const activate = (row: Row) => {
    if (row.type === "entry") {
      onSelectEntry(row.entry);
      onChange("");
    } else {
      onSelectContent(row.hit);
    }
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (value) onChange("");
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!showList || rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(rows[cursor]);
    }
  };

  return (
    <div className={`dashboard-search ${showList ? "open" : ""}`}>
      <MagnifyingGlass size={16} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search posts, pages, features, docs..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a result lands before the list unmounts
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        className="dashboard-search-input"
        role="combobox"
        aria-expanded={showList}
        aria-controls="dashboard-search-results"
        aria-autocomplete="list"
        aria-activedescendant={
          showList && rows[cursor] ? rowId(rows[cursor]) : undefined
        }
      />
      {!hasQuery && (
        <kbd className="dashboard-search-kbd" aria-hidden="true">
          {isMac ? "\u2318" : "Ctrl"} K
        </kbd>
      )}

      {showList && (
        <div
          id="dashboard-search-results"
          ref={listRef}
          className="dashboard-search-results"
          role="listbox"
        >
          {rows.length === 0 ? (
            <div className="dashboard-search-empty">
              Nothing matches. Try a section name like "sync" or a feature like
              "unlisted".
            </div>
          ) : (
            rows.map((row, i) => {
              const active = i === cursor;
              if (row.type === "content") {
                return (
                  <button
                    key={`c-${row.hit.kind}-${row.hit.id}`}
                    id={rowId(row)}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-index={i}
                    className={`dashboard-search-row ${active ? "active" : ""}`}
                    onMouseEnter={() => setCursor(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => activate(row)}
                  >
                    <span className="dashboard-search-row-icon">
                      <ContentIcon kind={row.hit.kind} />
                    </span>
                    <span className="dashboard-search-row-text">
                      <span className="dashboard-search-row-title">
                        {row.hit.title}
                      </span>
                      {row.hit.description && (
                        <span className="dashboard-search-row-desc">
                          {row.hit.description}
                        </span>
                      )}
                    </span>
                    <span className="dashboard-search-row-kind">
                      {row.hit.kind === "post"
                        ? "Post"
                        : row.hit.kind === "page"
                          ? "Page"
                          : "Project"}
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={row.entry.id}
                  id={rowId(row)}
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-index={i}
                  className={`dashboard-search-row ${active ? "active" : ""}`}
                  onMouseEnter={() => setCursor(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => activate(row)}
                >
                  <span className="dashboard-search-row-icon">
                    <KindIcon kind={row.entry.kind} />
                  </span>
                  <span className="dashboard-search-row-text">
                    <span className="dashboard-search-row-title">
                      {row.entry.title}
                    </span>
                    <span className="dashboard-search-row-desc">
                      {row.entry.description}
                    </span>
                  </span>
                  <span className="dashboard-search-row-kind">
                    {KIND_LABEL[row.entry.kind]}
                  </span>
                </button>
              );
            })
          )}
          {rows.length > 0 && (
            <div className="dashboard-search-footer">
              <span>
                <ArrowElbowDownLeft size={12} /> open
              </span>
              <span>Up and down to move</span>
              <span>Esc to clear</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function rowId(row: Row): string {
  return row.type === "entry"
    ? `dsr-${row.entry.id}`
    : `dsr-c-${row.hit.kind}-${row.hit.id}`;
}
