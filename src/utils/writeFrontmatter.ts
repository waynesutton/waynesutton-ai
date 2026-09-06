import {
  createDefaultFrontmatter,
  parseFrontmatterDocument,
  type FrontmatterKind,
  type FrontmatterValues,
  serializeFrontmatter,
} from "../components/FrontmatterForm";

const DOCUMENT = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))([\s\S]*)$/;
const FIELD = /^([A-Za-z][A-Za-z0-9_]*|"[A-Za-z][A-Za-z0-9_]*"|'[A-Za-z][A-Za-z0-9_]*'):\s*(.*)$/;
const fieldName = (key: string) => key.replace(/^["']|["']$/g, "");

// Normalize only for the shared form parser. The user's original YAML stays
// canonical; unsupported YAML remains editable in the markdown editor.
export function parseWriteFrontmatter(document: string, kind: FrontmatterKind) {
  const match = document.match(DOCUMENT);
  if (!match) {
    return {
      ...parseFrontmatterDocument(document, kind),
      formIssue: /^---(?:\r?\n|$)/.test(document)
        ? "Finish the YAML block with a closing --- line to edit settings here."
        : null,
    };
  }
  const known = new Set(Object.keys(createDefaultFrontmatter(kind)));
  const seen = new Set<string>();
  const normalized: string[] = [];
  let activeKey = "";
  let issue: string | null = null;
  for (const line of match[2].split(/\r?\n/)) {
    if (/^\s*(?:#.*)?$/.test(line)) continue;
    const field = line.match(FIELD);
    if (field) {
      activeKey = fieldName(field[1]);
      if (known.has(activeKey)) {
        if (seen.has(activeKey)) issue = "Duplicate fields need to be resolved in the YAML before using these settings.";
        seen.add(activeKey);
        if (/^[|>&*!{]/.test(field[2]) || /\s+#/.test(field[2])) {
          issue = "This draft uses advanced YAML values. Edit its frontmatter directly in the markdown editor to preserve them.";
        }
      }
      normalized.push(`${activeKey}: ${field[2]}`);
    } else if (/^\s*-\s/.test(line) && activeKey === "tags") {
      normalized.push(`  ${line.trimStart()}`);
    } else if (!/^\s/.test(line)) {
      issue = "This draft uses advanced YAML keys. Edit its frontmatter directly in the markdown editor to preserve them.";
    } else if (known.has(activeKey)) {
      issue = "This draft uses multiline YAML values. Edit its frontmatter directly in the markdown editor to preserve them.";
    }
  }
  return {
    ...parseFrontmatterDocument(`---\n${normalized.join("\n")}\n---\n${match[4]}`, kind),
    formIssue: issue,
  };
}

// Replace changed field blocks only, keeping unknown fields, comments, spacing,
// line endings, and the markdown body. Never partially rewrite unsupported YAML.
export function patchWriteFrontmatter(
  document: string,
  kind: FrontmatterKind,
  previous: FrontmatterValues,
  next: FrontmatterValues,
): string {
  const changed = (Object.keys(next) as Array<keyof FrontmatterValues>).filter(
    (key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]),
  );
  if (!changed.length || parseWriteFrontmatter(document, kind).formIssue) return document;
  const match = document.match(DOCUMENT);
  if (!match) return serializeFrontmatter(kind, next) + "\n" + document;
  const newline = match[1].includes("\r\n") ? "\r\n" : "\n";
  const lines = match[2].split(/\r?\n/);
  const serialized = serializeFrontmatter(kind, next).split("\n");
  for (const key of changed) {
    const replacement = serialized.find((line) => line.startsWith(`${key}:`));
    const start = lines.findIndex((line) => {
      const field = line.match(FIELD);
      return field && fieldName(field[1]) === key;
    });
    if (start < 0) {
      if (replacement) lines.push(replacement);
      continue;
    }
    let end = start + 1;
    while (end < lines.length && !FIELD.test(lines[end])) end++;
    const commentsAndSpacing = lines.slice(start + 1, end).filter((line) => /^\s*(?:#.*)?$/.test(line));
    // Keep the original spelling of quoted keys; only the value changes.
    const originalKey = lines[start].match(FIELD)![1];
    const changedLine = replacement ? originalKey + replacement.slice(key.length) : null;
    lines.splice(start, end - start, ...(changedLine ? [changedLine] : []), ...commentsAndSpacing);
  }
  return match[1] + lines.join(newline) + match[3] + match[4];
}
