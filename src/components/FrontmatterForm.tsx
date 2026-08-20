import { useRef, useState, type ReactNode } from "react";
import { CaretDown, DotsSixVertical, UploadSimple, X } from "@phosphor-icons/react";
import { useDragSort } from "../hooks/useDragSort";
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
            <span
              className="fmf-drag-handle"
              title="Drag to reorder"
              aria-hidden="true"
              onMouseDown={() => setArmedId(id)}
              onMouseUp={() => setArmedId(null)}>
              <DotsSixVertical size={14} weight="bold" />
            </span>
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
    <label className="fmf-switch-row">
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
  node: ReactNode;
}

// Group open state persists per kind so a writer's preferred sections stay
// expanded across reloads, the same way the sidebar width does.
function useGroupOpen(storageKey: string, defaultOpen: boolean) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? defaultOpen : raw === "1";
    } catch {
      return defaultOpen;
    }
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // Persistence is best-effort; the toggle still works this session.
      }
      return next;
    });
  };

  return [open, toggle] as const;
}

// Collapsible card holding one logical set of frontmatter fields. Collapsed
// headers list the YAML keys inside so nothing is hidden without a trace.
function FieldGroup({
  title,
  blocks,
  defaultOpen,
  stateKey,
  orderKey,
}: {
  title: string;
  blocks: FieldBlock[];
  defaultOpen: boolean;
  stateKey: string;
  orderKey: string;
}) {
  const [open, toggle] = useGroupOpen(stateKey, defaultOpen);
  const filled = blocks.filter((block) => block.filled).length;

  return (
    <section className={`fmf-group ${open ? "open" : ""}`}>
      <button type="button" className="fmf-group-head" aria-expanded={open} onClick={toggle}>
        <CaretDown size={13} weight="bold" className="fmf-group-caret" />
        <span className="fmf-group-title">{title}</span>
        <span className="fmf-group-count">
          {filled}
          <span className="fmf-group-count-total">/{blocks.length}</span>
        </span>
      </button>
      {open ? (
        <div className="fmf-group-body">
          <SortableFields storageKey={orderKey} blocks={blocks} />
        </div>
      ) : (
        <p className="fmf-group-keys">{blocks.map((block) => block.yamlKey).join("  ")}</p>
      )}
    </section>
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
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  hint: string;
  disabled?: boolean;
  onChange: (next: string) => void;
  onRequestUpload?: () => void;
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
              disabled={disabled}>
              <UploadSimple size={14} />
              Upload
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
  onRequestImage,
}: {
  kind: FrontmatterKind;
  value: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
  hiddenFields?: ReadonlyArray<keyof FrontmatterValues>;
  // When provided, renders Upload next to image URL fields.
  // The dashboard opens the image picker and patches the field with the URL.
  onRequestImage?: (field: FrontmatterImageField) => void;
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

  if (kind === "post" && !isHidden("audio")) {
    visibility.push({
      id: "audio",
      yamlKey: "audio",
      filled: value.audio !== undefined,
      node: (
        <SelectRow
          label="Listen audio"
          hint="Site default is on. Off hides the player. On forces it."
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
        <div className="fmf-field">
          <label className="fmf-label" htmlFor={`fmf-author-name-${kind}`}>
            Author name
          </label>
          <input
            id={`fmf-author-name-${kind}`}
            type="text"
            className="fmf-input"
            value={value.authorName}
            onChange={(e) => patch({ authorName: e.target.value })}
            placeholder="Jane Doe"
          />
        </div>
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
          hint="Round avatar next to the author name. Upload or paste a URL."
          onChange={(next) => patch({ authorImage: next })}
          onRequestUpload={onRequestImage ? () => onRequestImage("authorImage") : undefined}
        />
      ),
    });
  }

  // Groups render in importance order. Taxonomy opens on posts because tags
  // drive the archive; Media, Author, and Advanced start closed so the
  // required fields stay above the fold on a phone.
  const groups: Array<{ id: string; title: string; blocks: FieldBlock[]; defaultOpen: boolean }> = [
    { id: "essentials", title: "Essentials", blocks: essentials, defaultOpen: true },
    { id: "visibility", title: "Visibility", blocks: visibility, defaultOpen: true },
    { id: "taxonomy", title: "Taxonomy", blocks: taxonomy, defaultOpen: true },
    { id: "media", title: "Media", blocks: media, defaultOpen: false },
    { id: "author", title: "Author", blocks: author, defaultOpen: false },
    { id: "advanced", title: "Advanced", blocks: advanced, defaultOpen: false },
  ];

  return (
    <div className="fmf">
      {groups
        .filter((group) => group.blocks.length > 0)
        .map((group) => (
          <FieldGroup
            key={group.id}
            title={group.title}
            blocks={group.blocks}
            defaultOpen={group.defaultOpen}
            stateKey={`fmf-group:${kind}:${group.id}`}
            orderKey={`fmf-order:${kind}:${group.id}`}
          />
        ))}

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
