import { useRef, useState } from "react";
import { CaretDown, CaretRight, X } from "@phosphor-icons/react";

// Frontmatter form for dashboard write and edit flows.
// Styles live in src/styles/dashboard-forms.css (imported by Dashboard.tsx).

export type FrontmatterKind = "post" | "page";

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
  order?: number;
  showInNav: boolean;
  excerpt: string;
  image: string;
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
    order: undefined,
    showInNav: false,
    excerpt: "",
    image: "",
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
  if (values.excerpt.trim() !== "") {
    lines.push(`excerpt: ${yamlQuote(values.excerpt)}`);
  }
  if (values.image.trim() !== "") {
    lines.push(`image: ${yamlQuote(values.image)}`);
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
  "readTime",
  "authorName",
  "authorImage",
] as const;

const BOOLEAN_KEYS = ["published", "featured", "showInNav"] as const;

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

// Toggle switch styled via dashboard-forms.css
function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="fmf-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="fmf-switch-track" aria-hidden="true">
        <span className="fmf-switch-thumb" />
      </span>
      <span className="fmf-switch-label">{label}</span>
    </label>
  );
}

export function FrontmatterForm({
  kind,
  value,
  onChange,
  hiddenFields,
}: {
  kind: FrontmatterKind;
  value: FrontmatterValues;
  onChange: (next: FrontmatterValues) => void;
  hiddenFields?: ReadonlyArray<keyof FrontmatterValues>;
}) {
  const [tagDraft, setTagDraft] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
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

  return (
    <div className="fmf">
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

      {kind === "post" && (
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
      )}

      {kind === "post" && (
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
      )}

      <div className="fmf-row">
        <ToggleSwitch
          label="Published"
          checked={value.published}
          onChange={(checked) => patch({ published: checked })}
        />
        {!isHidden("featured") && (
          <ToggleSwitch
            label="Featured"
            checked={value.featured}
            onChange={(checked) =>
              patch({
                featured: checked,
                featuredOrder: checked ? value.featuredOrder : undefined,
              })
            }
          />
        )}
      </div>

      {value.featured && !isHidden("featuredOrder") && (
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
      )}

      {kind === "post" && (
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
      )}

      <div className="fmf-section">
        <button
          type="button"
          className="fmf-section-toggle"
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-expanded={moreOpen}>
          {moreOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
          <span>More options</span>
        </button>
        {moreOpen && (
          <div className="fmf-section-body">
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

            <div className="fmf-field">
              <label className="fmf-label" htmlFor={`fmf-image-${kind}`}>
                Image URL
              </label>
              <input
                id={`fmf-image-${kind}`}
                type="text"
                className="fmf-input"
                value={value.image}
                onChange={(e) => patch({ image: e.target.value })}
                placeholder="/images/my-image.png"
              />
            </div>

            {kind === "post" && !isHidden("readTime") && (
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
            )}

            {kind === "page" && !isHidden("order") && (
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
            )}

            {kind === "page" && !isHidden("showInNav") && (
              <ToggleSwitch
                label="Show in nav"
                checked={value.showInNav}
                onChange={(checked) => patch({ showInNav: checked })}
              />
            )}

            {!isHidden("authorName") && (
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
            )}

            {!isHidden("authorImage") && (
              <div className="fmf-field">
                <label className="fmf-label" htmlFor={`fmf-author-image-${kind}`}>
                  Author image URL
                </label>
                <input
                  id={`fmf-author-image-${kind}`}
                  type="text"
                  className="fmf-input"
                  value={value.authorImage}
                  onChange={(e) => patch({ authorImage: e.target.value })}
                  placeholder="/images/authors/jane.png"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fmf-section">
        <button
          type="button"
          className="fmf-section-toggle"
          onClick={() => setRawOpen((prev) => !prev)}
          aria-expanded={rawOpen}>
          {rawOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
          <span>View raw frontmatter</span>
        </button>
        {rawOpen && <pre className="fmf-raw">{serializeFrontmatter(kind, value)}</pre>}
      </div>
    </div>
  );
}

export default FrontmatterForm;
