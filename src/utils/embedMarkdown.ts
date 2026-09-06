/**
 * Turns pasted X and YouTube links into iframe markup that survives the
 * markdown sanitizer. BlogPost.tsx allows iframes from platform.twitter.com,
 * platform.x.com, and youtube.com, so these are the only two embed kinds.
 */

export type EmbedKind = "x" | "youtube";

export interface ParsedEmbed {
  kind: EmbedKind;
  /** Tweet id or YouTube video id */
  id: string;
  /** Normalized source URL for display */
  url: string;
}

const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"]);

/**
 * Accepts a full X status URL, a YouTube watch/short/embed URL, or a bare
 * numeric tweet id. Returns null for anything else.
 */
export function parseEmbedInput(raw: string): ParsedEmbed | null {
  const input = raw.trim();
  if (!input) return null;

  // Bare tweet id pasted straight from the X share sheet
  if (/^\d{8,25}$/.test(input)) {
    return { kind: "x", id: input, url: `https://x.com/i/status/${input}` };
  }

  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();

  if (X_HOSTS.has(host)) {
    // /<user>/status/<id> or /i/status/<id> or /i/web/status/<id>
    const match = url.pathname.match(/\/status(?:es)?\/(\d{8,25})/);
    if (!match) return null;
    return { kind: "x", id: match[1], url: `https://x.com/i/status/${match[1]}` };
  }

  if (YT_HOSTS.has(host)) {
    let id: string | null = null;
    if (host.endsWith("youtu.be")) {
      id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (url.pathname.startsWith("/watch")) {
      id = url.searchParams.get("v");
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{6,})/);
      id = match ? match[1] : null;
    }
    if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return { kind: "youtube", id, url: `https://www.youtube.com/watch?v=${id}` };
  }

  return null;
}

export interface EmbedOptions {
  /** X only: match the site theme. Defaults to light. */
  theme?: "light" | "dark";
}

/**
 * Builds the markdown (raw HTML) snippet to insert into a post body. The
 * X iframe uses platform.twitter.com/embed which renders without widgets.js.
 */
export function buildEmbedMarkdown(embed: ParsedEmbed, options: EmbedOptions = {}): string {
  if (embed.kind === "x") {
    const theme = options.theme ?? "light";
    const src = `https://platform.twitter.com/embed/Tweet.html?id=${embed.id}&theme=${theme}&dnt=true`;
    // The site renderer adds lazy loading and a sandbox itself, so keep this
    // to attributes the sanitizer allows: src, width, height, style, title.
    return `<iframe src="${src}" width="550" height="600" style="border:0;max-width:100%;" title="X post"></iframe>`;
  }
  const src = `https://www.youtube.com/embed/${embed.id}`;
  return `<iframe src="${src}" width="560" height="315" style="border:0;max-width:100%;aspect-ratio:16/9;height:auto;" title="YouTube video" allowfullscreen></iframe>`;
}

/** Short human label for the dialog preview line */
export function describeEmbed(embed: ParsedEmbed): string {
  return embed.kind === "x" ? `X post ${embed.id}` : `YouTube video ${embed.id}`;
}
