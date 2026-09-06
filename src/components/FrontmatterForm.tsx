import { AuthorNameField } from "./AuthorNameField";
import type { AuthorSuggestion } from "../utils/authorSuggestions";
import { useRef, useState, type ReactNode } from "react";
import {
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  CaretDown,
  DotsSixVertical,
  MapTrifold,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useDragSort } from "../hooks/useDragSort";
import { Tip } from "./ui/Tooltip";
import siteConfig from "../config/siteConfig";

// Frontmatter form for dashboard write and edit flows.
// Styles live in src/styles/dashboard-forms.css (imported by Dashboard.tsx).

export type FrontmatterKind = "post" | "page";

export type FrontmatterImageField = "image" | "ogImage" | "authorImage";

// Flat value object covering both posts and pages. The kind prop decides
// which fields render and which get serialized to YAML.
export interface FrontmatterValues {
  title: string;
  slug: string;
  description: string;
  date: string;
  published: boolean;
  tags: string[];
  featured: boolean;
  featuredOrder?: number;
  blogFeatured: boolean;
  unlisted: boolean;
  order?: number;
  showInNav: boolean;
  excerpt: string;
  image: string;
  ogImage: string;
  noOgImage: boolean;
  aiWritten: boolean;
  minimap: boolean;
  hideNav: boolean;
  audio?: boolean;
  audioVoice?: "male" | "female";
  readTime: string;
  authorName: string;
  authorImage: string;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createDefaultFrontmatter(kind: FrontmatterKind): FrontmatterValues {
  return {
    title: "",
    slug: "",
    description: "",
    date: kind === "post" ? new Date().toISOString().split("T")[0] : "",
    published: true,
    tags: [],
    featured: false,
    featuredOrder: undefined,
    blogFeatured: false,
    unlisted: false,
    order: undefined,
    showInNav: false,
    excerpt: "",
    image: "",
    ogImage: "",
    noOgImage: false,
    aiWritten: false,
    minimap: false,
    hideNav: false,
    audio: undefined,
    audioVoice: undefined,
    readTime: "",
    authorName: "",
    authorImage: "",
  };
}

// Quote a string for a single-line YAML value. Newlines collapse to spaces
// so textarea input can never break the frontmatter block.
function yamlQuote(value: string): string {
  const flattened = value.replace(/\r?\n/g, " ");
  return `"${flattened.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Serialize form state into a gray-matter compatible YAML frontmatter block
// (including both --- fences, ending with a trailing newline).
export function serializeFrontmatter(kind: FrontmatterKind, values: FrontmatterValues): string {
  const lines: string[] = ["---"];
  lines.push(`title: ${yamlQuote(values.title)}`);
  if (kind === "post") {
    lines.push(`description: ${yamlQuote(values.description)}`);
    lines.push(`date: ${yamlQuote(values.date)}`);
  }
  lines.push(`slug: ${yamlQuote(values.slug)}`);
  lines.push(`published: ${values.published}`);
  if (kind === "post") {
    lines.push(`tags: [${values.tags.map(yamlQuote).join(", ")}]`);
  }
  if (kind === "page") {
    if (values.order !== undefined) {
      lines.push(`order: ${values.order}`);
    }
    if (values.showInNav) {
      lines.push("showInNav: true");
    }
  }
  if (values.featured) {
    lines.push("featured: true");
  }
  if (values.featuredOrder !== undefined) {
    lines.push(`featuredOrder: ${values.featuredOrder}`);
  }
  if (kind === "post" && values.blogFeatured) {
    lines.push("blogFeatured: true");
  }
  if (values.unlisted) {
    lines.push("unlisted: true");
  }
  if (values.excerpt.trim() !== "") {
    lines.push(`excerpt: ${yamlQuote(values.excerpt)}`);
  }
  if (values.image.trim() !== "") {
    lines.push(`image: ${yamlQuote(values.image)}`);
  }
  if (values.ogImage.trim() !== "") {
    lines.push(`ogImage: ${yamlQuote(values.ogImage)}`);
  }
  if (values.noOgImage) {
    lines.push("noOgImage: true");
  }
  if (kind === "post" && values.aiWritten) {
    lines.push("aiWritten: true");
  }
  if (kind === "post" && values.minimap) {
    lines.push("minimap: true");
  }
  if (kind === "post" && values.hideNav) {
    lines.push("hideNav: true");
  }
  if (kind === "post" && values.audio === true) {
    lines.push("audio: true");
  }
  if (kind === "post" && values.audio === false) {
    lines.push("audio: false");
  }
  if (kind === "post" && values.audioVoice) {
    lines.push(`audioVoice: ${values.audioVoice}`);
  }
  if (kind === "post" && values.readTime.trim() !== "") {
    lines.push(`readTime: ${yamlQuote(values.readTime)}`);
  }
  if (values.authorName.trim() !== "") {
    lines.push(`authorName: ${yamlQuote(values.authorName)}`);
  }
  if (values.authorImage.trim() !== "") {
    lines.push(`authorImage: ${yamlQuote(values.authorImage)}`);
  }
  lines.push("---");
  return lines.join("\n") + "\n";
}

function unquote(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

// Split an inline YAML list on commas, respecting quoted items so tags
// containing commas survive the round trip
function parseInlineList(raw: string): string[] {
  const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (inner.trim() === "") {
    return [];
  }
  const parts: string[] = [];
  let current = "";
  let quoteChar: '"' | "'" | null = null;
  let escaped = false;
  for (const char of inner) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (quoteChar === '"' && char === "\\") {
      current += char;
      escaped = true;
      continue;
    }
    if (quoteChar !== null) {
      if (char === quoteChar) {
        quoteChar = null;
      }
      current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quoteChar = char;
      current += char;
      continue;
    }
    if (char === ",") {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((part) => unquote(part)).filter((part) => part.length > 0);
}

const STRING_KEYS = [
  "title",
  "slug",
  "description",
  "date",
  "excerpt",
  "image",
  "ogImage",
  "readTime",
  "authorName",
  "authorImage",
] as const;

const BOOLEAN_KEYS = [
  "published",
  "featured",
  "blogFeatured",
  "unlisted",
  "showInNav",
  "noOgImage",
  "aiWritten",
  "minimap",
  "hideNav",
] as const;

const NUMBER_KEYS = ["featuredOrder", "order"] as const;

type StringKey = (typeof STRING_KEYS)[number];
type BooleanKey = (typeof BOOLEAN_KEYS)[number];
type NumberKey = (typeof NUMBER_KEYS)[number];

// Minimal client-safe frontmatter parser for the known fields. Handles quoted
// and unquoted scalars, inline tag arrays, and block-style tag lists. Used to
// restore localStorage drafts that still contain a raw YAML block.
export function parseFrontmatterDocument(
  raw: string,
  kind: FrontmatterKind
): { values: FrontmatterValues; body: string; hasFrontmatter: boolean } {
  const values = createDefaultFrontmatter(kind);
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { values, body: raw, hasFrontmatter: false };
  }

  const yamlLines = match[1].split(/\r?\n/);
  const body = match[2].replace(/^\r?\n/, "");

  let index = 0;
  while (index < yamlLines.length) {
    const line = yamlLines[index];
    const keyValue = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (!keyValue) {
      index += 1;
      continue;
    }
    const key = keyValue[1];
    const rawValue = keyValue[2].trim();

    // Block-style list (tags written across multiple "- item" lines)
    if (rawValue === "") {
      const listItems: string[] = [];
      let lookahead = index + 1;
      while (lookahead < yamlLines.length) {
        const itemMatch = yamlLines[lookahead].match(/^\s+-\s*(.*)$/);
        if (!itemMatch) {
          break;
        }
        listItems.push(unquote(itemMatch[1]));
        lookahead += 1;
      }
      if (listItems.length > 0) {
        if (key === "tags") {
          values.tags = listItems;
        }
        index = lookahead;
        continue;
      }
      index += 1;
      continue;
    }

    if (key === "tags") {
      if (rawValue.startsWith("[")) {
        values.tags = parseInlineList(rawValue);
      }
    } else if (key === "audio") {
      if (rawValue === "true" || rawValue === "false") {
        values.audio = rawValue === "true";
      }
    } else if (key === "audioVoice") {
      const voice = unquote(rawValue);
      if (voice === "male" || voice === "female") {
        values.audioVoice = voice;
      }
    } else if ((BOOLEAN_KEYS as readonly string[]).includes(key)) {
      values[key as BooleanKey] = rawValue === "true";
    } else if ((NUMBER_KEYS as readonly string[]).includes(key)) {
      const parsed = Number(rawValue);
      if (Number.isFinite(parsed)) {
        values[key as NumberKey] = parsed;
      }
    } else if ((STRING_KEYS as readonly string[]).includes(key)) {
      values[key as StringKey] = unquote(rawValue);
    }
    index += 1;
  }

  return { values, body, hasFrontmatter: true };
}

// A group of frontmatter field blocks with drag-and-drop ordering.
// The wrapper only becomes draggable while the grab handle is held so text
// selection inside inputs keeps working. Last sort persists per storageKey.
function SortableFields({
  storageKey,
  blocks,
}: {
  storageKey: string;
  blocks: Array<{ id: string; node: ReactNode }>;
}) {
  const drag = useDragSort(
    storageKey,
    blocks.map((block) => block.id)
  );
  const [armedId, setArmedId] = useState<string | null>(null);
  const blocksById = new Map(blocks.map((block) => [block.id, block]));

  return (
    <>
      {drag.sortedIds.map((id) => {
        const block = blocksById.get(id);
        if (!block) {
          return null;
        }
        return (
          <div
            key={id}
            className={`fmf-sortable ${drag.draggingId === id ? "dragging" : ""}`}
            draggable={armedId === id}
            onDragStart={drag.onDragStart(id)}
            onDragOver={drag.onDragOver(id)}
            onDrop={(event) => {
              drag.onDrop(event);
              setArmedId(null);
            }}
            onDragEnd={() => {
              drag.onDragEnd();
              setArmedId(null);
            }}>
            <Tip content="Drag to reorder this field" side="left" delay={600}>
              <span
                className="fmf-drag-handle"
                aria-hidden="true"
                onMouseDown={() => setArmedId(id)}
                onMouseUp={() => setArmedId(null)}>
                <DotsSixVertical size={14} weight="bold" />
              </span>
            </Tip>
            {block.node}
          </div>
        );
      })}
    </>
  );
}

// Full-width settings row: label and hint lead, switch trails, whole row taps.
// Reads as a settings list instead of a checkbox pile on narrow screens.
function SelectRow({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="fmf-switch-row fmf-select-row">
      <span className="fmf-switch-row-text">
        <span className="fmf-switch-row-label">{label}</span>
        {hint !== undefined && <span className="fmf-switch-row-hint">{hint}</span>}
      </span>
      <select
        className="fmf-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`fmf-switch-row ${disabled ? "disabled" : ""}`}>
      <span className="fmf-switch-row-text">
        <span className="fmf-switch-row-label">{label}</span>
        {hint !== undefined && <span className="fmf-switch-row-hint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="fmf-switch-track" aria-hidden="true">
        <span className="fmf-switch-thumb" />
      </span>
    </label>
  );
}

// One frontmatter field plus the metadata the group header summarizes.
interface FieldBlock {
  id: string;
  // YAML key this block writes, listed in the collapsed group header
  yamlKey: string;
  // Whether the field carries a value, for the "filled of total" count
  filled: boolean;
  // Human label for the required readout ("Missing: Title, Date")
  label?: string;
  // Required fields block Save until filled
  required?: boolean;
  node: ReactNode;
}

interface GroupDef {
  id: string;
  title: string;
  blocks: FieldBlock[];
  defaultOpen: boolean;
}

// Small persisted boolean with the same try/catch shape as useDragSort so a
// blocked localStorage never breaks the form.
function readStoredFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch {
    return fallback;
  }
}

function writeStoredFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // Persistence is best-effort; the toggle still works this session.
  }
}

// Open state for every group lives in the form so the minimap and the
// expand/collapse buttons can drive it. Keys are unchanged from the old
// per-group hook, so saved preferences carry over.
function useGroupsOpen(kind: FrontmatterKind, groups: GroupDef[]) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) {
      initial[group.id] = readStoredFlag(`fmf-group:${kind}:${group.id}`, group.defaultOpen);
    }
    return initial;
  });

  const set = (id: string, next: boolean) => {
    writeStoredFlag(`fmf-group:${kind}:${id}`, next);
    setOpen((prev) => (prev[id] === next ? prev : { ...prev, [id]: next }));
  };

  const setAll = (next: boolean) => {
    const record: Record<string, boolean> = {};
    for (const group of groups) {
      record[group.id] = next;
      writeStoredFlag(`fmf-group:${kind}:${group.id}`, next);
    }
    setOpen(record);
  };

  const isOpen = (id: string, fallback: boolean) => open[id] ?? fallback;

  return { isOpen, set, setAll };
}

// Collapsible card holding one logical set of frontmatter fields. Collapsed
// headers list the YAML keys inside so nothing is hidden without a trace.
// The header's grab handle arms dragging so the click target still toggles.
function FieldGroup({
  group,
  open,
  onToggle,
  orderKey,
  drag,
  sectionRef,
}: {
  group: GroupDef;
  open: boolean;
  onToggle: () => void;
  orderKey: string;
  drag: ReturnType<typeof useDragSort>;
  sectionRef: (node: HTMLElement | null) => void;
}) {
  const [armed, setArmed] = useState(false);
  const filled = group.blocks.filter((block) => block.filled).length;
  const missing = group.blocks.filter((block) => block.required && !block.filled).length;

  return (
    <section
      ref={sectionRef}
      id={`fmf-group-${group.id}`}
      className={`fmf-group ${open ? "open" : ""} ${drag.draggingId === group.id ? "dragging" : ""}`}
      draggable={armed}
      onDragStart={drag.onDragStart(group.id)}
      onDragOver={drag.onDragOver(group.id)}
      onDrop={(event) => {
        drag.onDrop(event);
        setArmed(false);
      }}
      onDragEnd={() => {
        drag.onDragEnd();
        setArmed(false);
      }}>
      <div className="fmf-group-bar">
        <button type="button" className="fmf-group-head" aria-expanded={open} onClick={onToggle}>
          <CaretDown size={13} weight="bold" className="fmf-group-caret" />
          <span className="fmf-group-title">{group.title}</span>
          {missing > 0 && (
            <span className="fmf-group-missing" aria-label={`${missing} required`}>
              {missing} required
            </span>
          )}
          <span className="fmf-group-count">
            {filled}
            <span className="fmf-group-count-total">/{group.blocks.length}</span>
          </span>
        </button>
        <Tip content="Drag to reorder this section" side="left" delay={600}>
          <span
            className="fmf-group-handle"
            aria-hidden="true"
            onMouseDown={() => setArmed(true)}
            onMouseUp={() => setArmed(false)}>
            <DotsSixVertical size={14} weight="bold" />
          </span>
        </Tip>
      </div>
      {open ? (
        <div className="fmf-group-body">
          <SortableFields storageKey={orderKey} blocks={group.blocks} />
        </div>
      ) : (
        <p className="fmf-group-keys">{group.blocks.map((block) => block.yamlKey).join("  ")}</p>
      )}
    </section>
  );
}

// Compact outline of every group: name, filled count, and a marker when a
// required field is still empty. Clicking opens the group and scrolls to it,
// which is the whole point on a long form or a short phone screen.
function FrontmatterMinimap({
  groups,
  isOpen,
  onJump,
}: {
  groups: GroupDef[];
  isOpen: (id: string, fallback: boolean) => boolean;
  onJump: (id: string) => void;
}) {
  return (
    <nav className="fmf-minimap" aria-label="Frontmatter sections">
      {groups.map((group) => {
        const filled = group.blocks.filter((block) => block.filled).length;
        const missing = group.blocks.some((block) => block.required && !block.filled);
        const open = isOpen(group.id, group.defaultOpen);
        return (
          <Tip
            key={group.id}
            content={
              missing
                ? `${group.title}: a required field is empty. Click to open.`
                : `${group.title}: ${filled} of ${group.blocks.length} set. Click to open.`
            }
            side="bottom">
            <button
              type="button"
              className={`fmf-minimap-chip ${open ? "open" : ""} ${missing ? "missing" : ""} ${
                filled === group.blocks.length ? "complete" : ""
              }`}
              onClick={() => onJump(group.id)}
              aria-current={open ? "true" : undefined}>
              <span className="fmf-minimap-dot" aria-hidden="true" />
              <span className="fmf-minimap-label">{group.title}</span>
              <span className="fmf-minimap-count">
                {filled}/{group.blocks.length}
              </span>
            </button>
          </Tip>
        );
      })}
    </nav>
  );
}

// URL field with optional Upload and a Clear button when a value is set.
function ImageUrlField({
  id,
  label,
  value,
  placeholder,
  hint,
  disabled,
  onChange,
  onRequestUpload,
  onRequestGallery,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  hint: string;
  disabled?: boolean;
  onChange: (next: string) => void;
  onRequestUpload?: () => void;
  onRequestGallery?: () => void;
}) {
  const hasValue = value.trim() !== "";
  const showActions = onRequestUpload !== undefined || hasValue;

  return (
    <div className="fmf-field">
      <label className="fmf-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="fmf-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {showActions && (
        <div className="fmf-input-row">
          {onRequestUpload && (
            <button
              type="button"
              className="fmf-upload-button"
              onClick={onRequestUpload}
              aria-label={`Upload ${label}`}
              disabled={disabled}>
              <UploadSimple size={14} />
              Upload
            </button>
          )}
          {onRequestGallery && (
            <button type="button" className="fmf-upload-button" aria-label={`Choose ${label} from media gallery`} onClick={onRequestGallery} disabled={disabled}>
              Media gallery
            </button>
          )}
          {hasValue && (
            <button
              type="button"
              className="fmf-clear-button"
              onClick={() => onChange("")}
              disabled={disabled}
              aria-label={`Clear ${label}`}>
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      )}
      <span className="fmf-hint">{hint}</span>
    </div>
  );
}

export function FrontmatterForm({
  kind,
  value,
  onChange,
  hiddenFields,
  authorSuggestions = [],
  onRequestImage,
}: {
  kind: FrontmatterKind;
  value: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
  hiddenFields?: ReadonlyArray<keyof FrontmatterValues>;
  // When provided, renders Upload next to image URL fields.
  // The dashboard opens the image picker and patches the field with the URL.
  authorSuggestions?: readonly AuthorSuggestion[];
  onRequestImage?: (field: FrontmatterImageField, initialTab?: "upload" | "library") => void;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const [rawOpen, setRawOpen] = useState(false);
  // Auto-slugify from title only while the slug is empty or was generated here
  const autoSlugRef = useRef(value.slug === "");

  const isHidden = (key: keyof FrontmatterValues): boolean =>
    hiddenFields !== undefined && hiddenFields.includes(key);

  const patch = (partial: Partial<FrontmatterValues>) => {
    onChange({ ...value, ...partial });
  };

  const handleTitleChange = (title: string) => {
    if (autoSlugRef.current) {
      patch({ title, slug: slugify(title) });
    } else {
      patch({ title });
    }
  };

  const handleSlugChange = (slug: string) => {
    autoSlugRef.current = slug === "";
    patch({ slug: slug.toLowerCase() });
  };

  const commitTag = () => {
    const tag = tagDraft.trim().replace(/,+$/, "").trim();
    if (tag !== "" && !value.tags.includes(tag)) {
      patch({ tags: [...value.tags, tag] });
    }
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    patch({ tags: value.tags.filter((t) => t !== tag) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Backspace" && tagDraft === "" && value.tags.length > 0) {
      removeTag(value.tags[value.tags.length - 1]);
    }
  };

  const slugInvalid = value.slug !== "" && !SLUG_PATTERN.test(value.slug);

  const parseOptionalNumber = (raw: string): number | undefined => {
    if (raw.trim() === "") {
      return undefined;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const filledText = (raw: string): boolean => raw.trim() !== "";

  // The homepage section title is configurable, so the Featured hint names it
  // rather than saying "featured section" and leaving you to guess which one.
  const homeSectionLabel =
    siteConfig.featuredTitle.replace(/:\s*$/, "").trim() || "featured";

  // Field blocks per group. Conditional blocks are filtered out before
  // sorting; useDragSort tolerates ids missing from the saved order.
  const essentials: FieldBlock[] = [];
  const visibility: FieldBlock[] = [];
  const taxonomy: FieldBlock[] = [];
  const media: FieldBlock[] = [];
  const author: FieldBlock[] = [];
  const advanced: FieldBlock[] = [];

  essentials.push({
    id: "title",
    yamlKey: "title",
    label: "Title",
    required: true,
    filled: filledText(value.title),
    node: (
      <div className="fmf-field">
        <label className="fmf-label" htmlFor={`fmf-title-${kind}`}>
          Title <span className="fmf-required">*</span>
        </label>
        <input
          id={`fmf-title-${kind}`}
          type="text"
          className="fmf-input"
          value={value.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={kind === "post" ? "Post title" : "Page title"}
        />
      </div>
    ),
  });

  essentials.push({
    id: "slug",
    yamlKey: "slug",
    label: "Slug",
    required: true,
    filled: filledText(value.slug) && !slugInvalid,
    node: (
      <div className="fmf-field">
        <label className="fmf-label" htmlFor={`fmf-slug-${kind}`}>
          Slug <span className="fmf-required">*</span>
        </label>
        <input
          id={`fmf-slug-${kind}`}
          type="text"
          className={`fmf-input fmf-mono ${slugInvalid ? "fmf-input-error" : ""}`}
          value={value.slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="url-friendly-slug"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {slugInvalid ? (
          <span className="fmf-error">Use lowercase letters, digits, and hyphens only</span>
        ) : (
          <span className="fmf-hint">Auto-generated from the title until you edit it</span>
        )}
      </div>
    ),
  });

  if (kind === "post") {
    essentials.push({
      id: "description",
      yamlKey: "description",
      label: "Description",
      required: true,
      filled: filledText(value.description),
      node: (
        <div className="fmf-field">
          <label className="fmf-label" htmlFor="fmf-description">
            Description <span className="fmf-required">*</span>
          </label>
          <textarea
            id="fmf-description"
            className="fmf-textarea"
            value={value.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="Brief description for SEO and social sharing"
            rows={2}
          />
        </div>
      ),
    });

    essentials.push({
      id: "date",
      yamlKey: "date",
      label: "Date",
      required: true,
      filled: filledText(value.date),
      node: (
        <div className="fmf-field">
          <label className="fmf-label" htmlFor="fmf-date">
            Date <span className="fmf-required">*</span>
          </label>
          <input
            id="fmf-date"
            type="date"
            className="fmf-input"
            value={value.date}
            onChange={(e) => patch({ date: e.target.value })}
          />
        </div>
      ),
    });
  }

  visibility.push({
    id: "published",
    yamlKey: "published",
    filled: value.published,
    node: (
      <SwitchRow
        label="Published"
        hint={value.published ? "Live on the site" : "Hidden from the site"}
        checked={value.published}
        onChange={(checked) => patch({ published: checked })}
      />
    ),
  });

  if (!isHidden("featured")) {
    visibility.push({
      id: "featured",
      yamlKey: "featured",
      filled: value.featured,
      node: (
        <SwitchRow
          label="Featured"
          hint={`Shows this in the ${homeSectionLabel} section on the homepage`}
          checked={value.featured}
          onChange={(checked) =>
            patch({
              featured: checked,
              featuredOrder: checked ? value.featuredOrder : undefined,
            })
          }
        />
      ),
    });
  }

  if (value.featured && !isHidden("featuredOrder")) {
    visibility.push({
      id: "featured-order",
      yamlKey: "featuredOrder",
      filled: value.featuredOrder !== undefined,
      node: (
        <div className="fmf-field">
          <label className="fmf-label" htmlFor={`fmf-featured-order-${kind}`}>
            Featured order
          </label>
          <input
            id={`fmf-featured-order-${kind}`}
            type="number"
            className="fmf-input"
            value={value.featuredOrder ?? ""}
            onChange={(e) => patch({ featuredOrder: parseOptionalNumber(e.target.value) })}
            placeholder="1"
            min={0}
          />
        </div>
      ),
    });
  }

  if (kind === "post" && !isHidden("blogFeatured")) {
    visibility.push({
      id: "blog-featured",
      yamlKey: "blogFeatured",
      filled: value.blogFeatured,
      node: (
        <SwitchRow
          label="Blog featured"
          hint="Pins this as the hero post on the blog page"
          checked={value.blogFeatured}
          onChange={(checked) => patch({ blogFeatured: checked })}
        />
      ),
    });
  }

  if (!isHidden("unlisted")) {
    visibility.push({
      id: "unlisted",
      yamlKey: "unlisted",
      filled: value.unlisted,
      node: (
        <SwitchRow
          label="Unlisted"
          hint="Reachable at its URL but kept out of lists, search, RSS, and the sitemap"
          checked={value.unlisted}
          onChange={(checked) => patch({ unlisted: checked })}
        />
      ),
    });
  }

  if (kind === "post" && !isHidden("aiWritten")) {
    visibility.push({
      id: "ai-written",
      yamlKey: "aiWritten",
      filled: value.aiWritten,
      node: (
        <SwitchRow
          label="Written with AI"
          hint="Shows a note under the title. Overrides the Drafts Inbox default."
          checked={value.aiWritten}
          onChange={(checked) => patch({ aiWritten: checked })}
        />
      ),
    });
  }

  // Public heading outline on the right of the post (h1-h6, tracks scroll).
  if (kind === "post" && !isHidden("minimap")) {
    visibility.push({
      id: "minimap",
      yamlKey: "minimap",
      filled: value.minimap,
      node: (
        <SwitchRow
          label="Minimap"
          hint="Heading outline on the right of the post that follows scroll. Needs at least one heading."
          checked={value.minimap}
          onChange={(checked) => patch({ minimap: checked })}
        />
      ),
    });
  }

  // Site nav scrolls away with the page on this post instead of staying pinned
  if (kind === "post" && !isHidden("hideNav")) {
    visibility.push({
      id: "hide-nav",
      yamlKey: "hideNav",
      filled: value.hideNav,
      node: (
        <SwitchRow
          label="Hide site nav"
          hint="The nav shows at the top of the post but scrolls away with the page instead of staying pinned."
          checked={value.hideNav}
          onChange={(checked) => patch({ hideNav: checked })}
        />
      ),
    });
  }

  if (kind === "post" && !isHidden("audio")) {
    visibility.push({
      id: "audio",
      yamlKey: "audio",
      filled: value.audio !== undefined,
      node: (
        <SelectRow
          label="Listen audio"
          hint="Save a published post to generate audio. Choose Site default to follow the audio setting in Site Config."
          value={
            value.audio === true ? "on" : value.audio === false ? "off" : "default"
          }
          options={[
            { value: "default", label: "Site default" },
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
          onChange={(next) =>
            patch({
              audio:
                next === "on" ? true : next === "off" ? false : undefined,
            })
          }
        />
      ),
    });
  }

  if (kind === "post" && !isHidden("audioVoice")) {
    visibility.push({
      id: "audio-voice",
      yamlKey: "audioVoice",
      filled: value.audioVoice !== undefined,
      node: (
        <SelectRow
          label="Audio voice"
          hint="Omit to use the site default voice."
          value={value.audioVoice ?? "default"}
          options={[
            { value: "default", label: "Site default" },
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
          ]}
          onChange={(next) =>
            patch({
              audioVoice:
                next === "male" || next === "female" ? next : undefined,
            })
          }
        />
      ),
    });
  }

  if (kind === "post") {
    taxonomy.push({
      id: "tags",
      yamlKey: "tags",
      filled: value.tags.length > 0,
      node: (
        <div className="fmf-field">
          <label className="fmf-label" htmlFor="fmf-tag-input">
            Tags
          </label>
          <div className="fmf-tags">
            {value.tags.map((tag) => (
              <span key={tag} className="fmf-tag">
                {tag}
                <button
                  type="button"
                  className="fmf-tag-remove"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}>
                  <X size={12} weight="bold" />
                </button>
              </span>
            ))}
            <input
              id="fmf-tag-input"
              type="text"
              className="fmf-tag-input"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (tagDraft.trim() !== "") {
                  commitTag();
                }
              }}
              placeholder={value.tags.length === 0 ? "Type a tag, press Enter" : "Add tag"}
            />
          </div>
        </div>
      ),
    });
  }

  advanced.push({
    id: "excerpt",
    yamlKey: "excerpt",
    filled: filledText(value.excerpt),
    node: (
      <div className="fmf-field">
        <label className="fmf-label" htmlFor={`fmf-excerpt-${kind}`}>
          Excerpt
        </label>
        <textarea
          id={`fmf-excerpt-${kind}`}
          className="fmf-textarea"
          value={value.excerpt}
          onChange={(e) => patch({ excerpt: e.target.value })}
          placeholder="Short text for card views"
          rows={2}
        />
      </div>
    ),
  });

  media.push({
    id: "image",
    yamlKey: "image",
    filled: filledText(value.image),
    node: (
      <ImageUrlField
        id={`fmf-image-${kind}`}
        label="Featured image URL"
        value={value.image}
        placeholder="Paste an image path or URL"
        hint="Used for cards, headers, and as the default share image"
        onChange={(next) => patch({ image: next })}
        onRequestUpload={onRequestImage ? () => onRequestImage("image") : undefined}
          onRequestGallery={onRequestImage ? () => onRequestImage("image", "library") : undefined}
      />
    ),
  });

  if (!isHidden("ogImage")) {
    media.push({
      id: "og-image",
      yamlKey: "ogImage",
      filled: filledText(value.ogImage),
      node: (
        <ImageUrlField
          id={`fmf-og-image-${kind}`}
          label="Social share image (OG)"
          value={value.ogImage}
          placeholder="Paste a share image path or URL"
          hint="Overrides the featured image for social previews only"
          disabled={value.noOgImage}
          onChange={(next) => patch({ ogImage: next })}
          onRequestUpload={onRequestImage ? () => onRequestImage("ogImage") : undefined}
          onRequestGallery={onRequestImage ? () => onRequestImage("ogImage", "library") : undefined}
        />
      ),
    });
  }

  if (!isHidden("noOgImage")) {
    media.push({
      id: "no-og-image",
      yamlKey: "noOgImage",
      filled: value.noOgImage,
      node: (
        <SwitchRow
          label="No share image"
          hint="Social previews show only the title and description"
          checked={value.noOgImage}
          onChange={(checked) => patch({ noOgImage: checked })}
        />
      ),
    });
  }

  if (kind === "post" && !isHidden("readTime")) {
    advanced.push({
      id: "read-time",
      yamlKey: "readTime",
      filled: filledText(value.readTime),
      node: (
        <div className="fmf-field">
          <label className="fmf-label" htmlFor="fmf-read-time">
            Read time
          </label>
          <input
            id="fmf-read-time"
            type="text"
            className="fmf-input"
            value={value.readTime}
            onChange={(e) => patch({ readTime: e.target.value })}
            placeholder="5 min read"
          />
        </div>
      ),
    });
  }

  if (kind === "page" && !isHidden("order")) {
    visibility.push({
      id: "nav-order",
      yamlKey: "order",
      filled: value.order !== undefined,
      node: (
        <div className="fmf-field">
          <label className="fmf-label" htmlFor="fmf-order">
            Nav order
          </label>
          <input
            id="fmf-order"
            type="number"
            className="fmf-input"
            value={value.order ?? ""}
            onChange={(e) => patch({ order: parseOptionalNumber(e.target.value) })}
            placeholder="1"
            min={0}
          />
        </div>
      ),
    });
  }

  if (kind === "page" && !isHidden("showInNav")) {
    visibility.push({
      id: "show-in-nav",
      yamlKey: "showInNav",
      filled: value.showInNav,
      node: (
        <SwitchRow
          label="Show in nav"
          hint="Lists this page in the site navigation"
          checked={value.showInNav}
          onChange={(checked) => patch({ showInNav: checked })}
        />
      ),
    });
  }

  if (!isHidden("authorName")) {
    author.push({
      id: "author-name",
      yamlKey: "authorName",
      filled: filledText(value.authorName),
      node: (
        <AuthorNameField
          value={value.authorName}
          authors={authorSuggestions}
          onChange={(authorName) => patch({ authorName })}
          onSelect={(author) => patch({
            authorName: author.name,
            authorImage: value.authorImage.trim() ? value.authorImage : (author.image ?? ""),
          })}
        />
      ),
    });
  }

  if (!isHidden("authorImage")) {
    author.push({
      id: "author-image",
      yamlKey: "authorImage",
      filled: filledText(value.authorImage),
      node: (
        <ImageUrlField
          id={`fmf-author-image-${kind}`}
          label="Author image URL"
          value={value.authorImage}
          placeholder="Paste an avatar path or URL"
          hint="Round avatar next to the author name. Choose from the gallery, upload, or paste a URL."
          onChange={(next) => patch({ authorImage: next })}
          onRequestUpload={onRequestImage ? () => onRequestImage("authorImage") : undefined}
          onRequestGallery={onRequestImage ? () => onRequestImage("authorImage", "library") : undefined}
        />
      ),
    });
  }

  // Groups render in importance order. Taxonomy opens on posts because tags
  // drive the archive; Media, Author, and Advanced start closed so the
  // required fields stay above the fold on a phone.
  const groups: GroupDef[] = [
    { id: "essentials", title: "Essentials", blocks: essentials, defaultOpen: true },
    { id: "visibility", title: "Visibility", blocks: visibility, defaultOpen: true },
    { id: "taxonomy", title: "Taxonomy", blocks: taxonomy, defaultOpen: true },
    { id: "media", title: "Media", blocks: media, defaultOpen: false },
    { id: "author", title: "Author", blocks: author, defaultOpen: false },
    { id: "advanced", title: "Advanced", blocks: advanced, defaultOpen: false },
  ].filter((group) => group.blocks.length > 0);

  const groupsOpen = useGroupsOpen(kind, groups);
  const groupDrag = useDragSort(
    `fmf-group-order:${kind}`,
    groups.map((group) => group.id)
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  // Minimap preference persists per kind, like group open state
  const [minimapOn, setMinimapOn] = useState(() => readStoredFlag(`fmf-minimap:${kind}`, false));
  const toggleMinimap = () => {
    setMinimapOn((prev) => {
      writeStoredFlag(`fmf-minimap:${kind}`, !prev);
      return !prev;
    });
  };

  const allOpen = groups.every((group) => groupsOpen.isOpen(group.id, group.defaultOpen));

  // Open the group, then scroll its card into view once it has rendered
  const jumpToGroup = (id: string) => {
    groupsOpen.set(id, true);
    requestAnimationFrame(() => {
      sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const missingRequired = groups
    .flatMap((group) => group.blocks)
    .filter((block) => block.required && !block.filled)
    .map((block) => block.label ?? block.yamlKey);

  return (
    <div className="fmf">
      {/* Toolbar: required readout on the left, view controls on the right */}
      <div className="fmf-toolbar">
        <span
          className={`fmf-required-readout ${missingRequired.length === 0 ? "ok" : ""}`}
          role="status">
          {missingRequired.length === 0
            ? "Required fields set"
            : `Missing: ${missingRequired.join(", ")}`}
        </span>
        <div className="fmf-toolbar-actions">
          <Tip
            content={
              minimapOn
                ? "Hide the section outline"
                : "Show a compact outline of every section. Click a chip to jump to it."
            }>
            <button
              type="button"
              className={`fmf-tool-btn ${minimapOn ? "active" : ""}`}
              onClick={toggleMinimap}
              aria-pressed={minimapOn}>
              <MapTrifold size={14} weight={minimapOn ? "fill" : "regular"} />
              <span>Minimap</span>
            </button>
          </Tip>
          <Tip content={allOpen ? "Collapse every section" : "Expand every section"}>
            <button
              type="button"
              className="fmf-tool-btn"
              onClick={() => groupsOpen.setAll(!allOpen)}>
              {allOpen ? (
                <ArrowsInLineVertical size={14} />
              ) : (
                <ArrowsOutLineVertical size={14} />
              )}
              <span>{allOpen ? "Collapse all" : "Expand all"}</span>
            </button>
          </Tip>
        </div>
      </div>

      {minimapOn && (
        <FrontmatterMinimap groups={groups} isOpen={groupsOpen.isOpen} onJump={jumpToGroup} />
      )}

      {groupDrag.sortedIds.map((id) => {
        const group = groupsById.get(id);
        if (!group) {
          return null;
        }
        const open = groupsOpen.isOpen(group.id, group.defaultOpen);
        return (
          <FieldGroup
            key={group.id}
            group={group}
            open={open}
            onToggle={() => groupsOpen.set(group.id, !open)}
            orderKey={`fmf-order:${kind}:${group.id}`}
            drag={groupDrag}
            sectionRef={(node) => {
              if (node) {
                sectionRefs.current.set(group.id, node);
              } else {
                sectionRefs.current.delete(group.id);
              }
            }}
          />
        );
      })}

      <section className={`fmf-group ${rawOpen ? "open" : ""}`}>
        <button
          type="button"
          className="fmf-group-head"
          onClick={() => setRawOpen((prev) => !prev)}
          aria-expanded={rawOpen}>
          <CaretDown size={13} weight="bold" className="fmf-group-caret" />
          <span className="fmf-group-title">Raw frontmatter</span>
        </button>
        {rawOpen && <pre className="fmf-raw">{serializeFrontmatter(kind, value)}</pre>}
      </section>
    </div>
  );
}

export default FrontmatterForm;
