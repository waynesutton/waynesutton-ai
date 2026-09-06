/**
 * Prefill a dashboard skill from its SKILL.md on GitHub.
 *
 * Runs entirely in the browser. raw.githubusercontent.com sends
 * Access-Control-Allow-Origin: * so the fetch needs no backend, no Node
 * action, and no job table. The parser reads the two frontmatter keys every
 * SKILL.md carries (name, description) plus a first heading fallback.
 */

export type SkillMdSource = {
  /** raw.githubusercontent.com URL to fetch */
  rawUrl: string;
  /** github.com URL to the skill folder, used as the repo link */
  repoUrl: string;
  /** owner/repo when the URL is on GitHub */
  repoSlug: string;
  /** Skill folder name inside the repo, when the path has one */
  folderName: string | null;
};

export type SkillPrefill = {
  title: string;
  slug: string;
  command: string;
  description: string;
  repoUrl: string;
  installCommands: Array<{ label: string; command: string }>;
};

const SKILL_FILE = "SKILL.md";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Accepts a github.com blob, tree, or repo URL, or a raw.githubusercontent.com
 * URL, and resolves both the raw file to fetch and the folder to link to.
 * Returns null for anything that is not GitHub.
 */
export function resolveSkillMdSource(input: string): SkillMdSource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const segments = stripTrailingSlash(url.pathname)
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  if (url.hostname === "raw.githubusercontent.com") {
    // /owner/repo/branch/path/to/SKILL.md  or  /owner/repo/refs/heads/branch/...
    if (segments.length < 3) return null;
    const [owner, repo, ...rest] = segments;
    let branchParts: Array<string>;
    let pathParts: Array<string>;
    if (rest[0] === "refs" && rest[1] === "heads" && rest.length >= 3) {
      branchParts = rest.slice(0, 3);
      pathParts = rest.slice(3);
    } else {
      branchParts = rest.slice(0, 1);
      pathParts = rest.slice(1);
    }
    const branch = branchParts[branchParts.length - 1] ?? "HEAD";
    const filePath = pathParts.length > 0 ? pathParts : [SKILL_FILE];
    const withFile =
      filePath[filePath.length - 1]?.toLowerCase() === SKILL_FILE.toLowerCase()
        ? filePath
        : [...filePath, SKILL_FILE];
    const folder = withFile.slice(0, -1);
    return {
      rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${withFile.join("/")}`,
      repoUrl:
        folder.length > 0
          ? `https://github.com/${owner}/${repo}/tree/${branch}/${folder.join("/")}`
          : `https://github.com/${owner}/${repo}`,
      repoSlug: `${owner}/${repo}`,
      folderName: folder[folder.length - 1] ?? null,
    };
  }

  if (url.hostname === "github.com" || url.hostname === "www.github.com") {
    if (segments.length < 2) return null;
    const [owner, repo, kind, branch, ...rest] = segments;

    // Bare repo: SKILL.md at the root of the default branch
    if (!kind || (kind !== "blob" && kind !== "tree")) {
      return {
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${SKILL_FILE}`,
        repoUrl: `https://github.com/${owner}/${repo}`,
        repoSlug: `${owner}/${repo}`,
        folderName: null,
      };
    }
    if (!branch) return null;

    const withFile =
      kind === "blob"
        ? rest
        : rest[rest.length - 1]?.toLowerCase() === SKILL_FILE.toLowerCase()
          ? rest
          : [...rest, SKILL_FILE];
    if (withFile.length === 0) return null;
    const folder = withFile.slice(0, -1);
    return {
      rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${withFile.join("/")}`,
      repoUrl:
        folder.length > 0
          ? `https://github.com/${owner}/${repo}/tree/${branch}/${folder.join("/")}`
          : `https://github.com/${owner}/${repo}`,
      repoSlug: `${owner}/${repo}`,
      folderName: folder[folder.length - 1] ?? null,
    };
  }

  return null;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return trimmed;
}

/**
 * Minimal YAML reader for SKILL.md frontmatter. Handles `key: value`, quoted
 * values, and `>` / `|` block scalars that continue on indented lines. Nested
 * mappings are skipped rather than parsed.
 */
export function parseSkillFrontmatter(markdown: string): Record<string, string> {
  const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return {};

  const result: Record<string, string> = {};
  const lines = match[1].split("\n");
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (!keyMatch) {
      index += 1;
      continue;
    }
    const key = keyMatch[1];
    const rest = keyMatch[2].trim();

    if (rest === ">" || rest === "|" || rest === ">-" || rest === "|-") {
      // Block scalar: collect indented continuation lines
      const collected: Array<string> = [];
      index += 1;
      while (index < lines.length && /^\s+\S/.test(lines[index])) {
        collected.push(lines[index].trim());
        index += 1;
      }
      result[key] = rest.startsWith(">")
        ? collected.join(" ").trim()
        : collected.join("\n").trim();
      continue;
    }

    if (rest === "") {
      // Either a nested mapping (skip) or an empty value
      index += 1;
      while (index < lines.length && /^\s+\S/.test(lines[index])) {
        index += 1;
      }
      result[key] = "";
      continue;
    }

    // Plain or quoted scalar; a quoted value may wrap onto following lines
    let value = rest;
    const opensQuote = /^["']/.test(value);
    const quote = opensQuote ? value[0] : null;
    index += 1;
    if (quote) {
      while (
        !(value.length > 1 && value.endsWith(quote) && !value.endsWith(`\\${quote}`)) &&
        index < lines.length
      ) {
        value += ` ${lines[index].trim()}`;
        index += 1;
      }
    }
    result[key] = unquote(value);
  }
  return result;
}

function firstHeading(markdown: string): string | null {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "");
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

export function slugifySkillName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function humanize(name: string): string {
  const spaced = name.replace(/[-_]+/g, " ").trim();
  if (!spaced) return "";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Turns fetched SKILL.md text plus its source into form values. */
export function buildSkillPrefill(
  source: SkillMdSource,
  markdown: string,
): SkillPrefill {
  const frontmatter = parseSkillFrontmatter(markdown);
  const rawName = (frontmatter.name ?? "").trim();
  const heading = firstHeading(markdown);
  const name = rawName || source.folderName || (heading ? slugifySkillName(heading) : "");
  const slug = slugifySkillName(name);

  const installCommands: Array<{ label: string; command: string }> = [];
  if (slug) {
    installCommands.push({
      label: "Skills CLI",
      command: `npx skills add ${source.repoSlug} --skill ${slug}`,
    });
  }

  return {
    title: heading && !rawName ? heading : humanize(name),
    slug,
    command: slug ? `/${slug}` : "",
    description: (frontmatter.description ?? "").replace(/\s+/g, " ").trim(),
    repoUrl: source.repoUrl,
    installCommands,
  };
}

/** Fetches SKILL.md from GitHub and returns prefilled form values. */
export async function prefillFromSkillMdUrl(input: string): Promise<SkillPrefill> {
  const source = resolveSkillMdSource(input);
  if (!source) {
    throw new Error("Paste a GitHub link to a SKILL.md file or the folder that holds it");
  }
  const response = await fetch(source.rawUrl);
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "No SKILL.md found at that location"
        : `GitHub returned ${response.status}`,
    );
  }
  const markdown = await response.text();
  return buildSkillPrefill(source, markdown);
}
