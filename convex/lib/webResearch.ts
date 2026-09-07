/**
 * Web research providers: Firecrawl, Exa, and Context.dev behind one
 * scrape call with ordered fallback.
 *
 * Registration-free and dependency-free (global fetch only) so "use node"
 * actions, V8 actions, and the CLI import script can all share it. Keys are
 * resolved by the caller (dashboard override first, then env var) so no key
 * is ever required at deploy time.
 */

export type WebResearchProvider = "firecrawl" | "exa" | "contextdev";

/** Catalog order doubles as the default ("auto") fallback order. */
export const WEB_RESEARCH_PROVIDERS: ReadonlyArray<WebResearchProvider> = [
  "firecrawl",
  "exa",
  "contextdev",
];

export const WEB_RESEARCH_PROVIDER_META: Record<
  WebResearchProvider,
  { label: string; envVar: string; docsUrl: string }
> = {
  firecrawl: {
    label: "Firecrawl",
    envVar: "FIRECRAWL_API_KEY",
    docsUrl: "https://docs.firecrawl.dev/api-reference/endpoint/scrape",
  },
  exa: {
    label: "Exa",
    envVar: "EXA_API_KEY",
    docsUrl: "https://docs.exa.ai/reference/get-contents",
  },
  contextdev: {
    label: "Context.dev",
    envVar: "CONTEXT_DEV_API_KEY",
    docsUrl: "https://context.dev/docs",
  },
};

/** Env var names in catalog order, for one batched key lookup. */
export const WEB_RESEARCH_ENV_VARS = WEB_RESEARCH_PROVIDERS.map(
  (provider) => WEB_RESEARCH_PROVIDER_META[provider].envVar,
);

export type WebResearchPreference = WebResearchProvider | "auto";

export function isWebResearchProvider(
  value: string,
): value is WebResearchProvider {
  return (WEB_RESEARCH_PROVIDERS as ReadonlyArray<string>).includes(value);
}

export type ScrapeResult = {
  content: string;
  title?: string;
  description?: string;
  provider: WebResearchProvider;
};

export type ProviderChainEntry = {
  provider: WebResearchProvider;
  apiKey: string;
};

export type ScrapeOutcome =
  | { ok: true; result: ScrapeResult }
  | {
      ok: false;
      reason: "no_provider" | "all_failed";
      errors: Array<{ provider: WebResearchProvider; message: string }>;
    };

/**
 * Preferred provider first, then the rest in catalog order. Providers
 * without a key are dropped, so a stale preference never blocks the chain.
 */
export function orderProviders(
  preferred: WebResearchPreference,
  keys: Partial<Record<WebResearchProvider, string | null>>,
): Array<ProviderChainEntry> {
  const ordered: Array<WebResearchProvider> =
    preferred === "auto"
      ? [...WEB_RESEARCH_PROVIDERS]
      : [
          preferred,
          ...WEB_RESEARCH_PROVIDERS.filter((provider) => provider !== preferred),
        ];
  const chain: Array<ProviderChainEntry> = [];
  for (const provider of ordered) {
    const apiKey = keys[provider];
    if (apiKey && apiKey.trim().length > 0) {
      chain.push({ provider, apiKey: apiKey.trim() });
    }
  }
  return chain;
}

/** Human readable message for the "nothing configured" case. */
export const NO_PROVIDER_MESSAGE =
  "No web research provider configured. Add FIRECRAWL_API_KEY, EXA_API_KEY, or CONTEXT_DEV_API_KEY in Dashboard > API Keys, or with npx convex env set.";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value: unknown): string | undefined {
  return nonEmpty(value) ? value.trim() : undefined;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Non-JSON response (${response.status})`);
  }
}

function errorMessage(payload: unknown, response: Response): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (nonEmpty(record.error)) return record.error;
    if (nonEmpty(record.message)) return record.message;
  }
  return `${response.status} ${response.statusText}`.trim();
}

/** Firecrawl v2 scrape: markdown plus page metadata. */
async function scrapeWithFirecrawl(
  url: string,
  apiKey: string,
): Promise<ScrapeResult> {
  const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, response));
  }
  const data =
    payload && typeof payload === "object"
      ? ((payload as Record<string, unknown>).data as
          | Record<string, unknown>
          | undefined)
      : undefined;
  const markdown = data?.markdown;
  if (!nonEmpty(markdown)) {
    throw new Error("No content returned");
  }
  const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
  return {
    content: markdown,
    title: optionalString(metadata.title),
    description: optionalString(metadata.description),
    provider: "firecrawl",
  };
}

/** Exa contents: full page text for a known URL. */
async function scrapeWithExa(
  url: string,
  apiKey: string,
): Promise<ScrapeResult> {
  const response = await fetch("https://api.exa.ai/contents", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls: [url], text: true }),
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, response));
  }
  const results =
    payload && typeof payload === "object"
      ? ((payload as Record<string, unknown>).results as
          | Array<Record<string, unknown>>
          | undefined)
      : undefined;
  const first = Array.isArray(results) ? results[0] : undefined;
  if (!first || !nonEmpty(first.text)) {
    throw new Error("No content returned");
  }
  return {
    content: first.text,
    title: optionalString(first.title),
    description: optionalString(first.summary),
    provider: "exa",
  };
}

/** Context.dev scrape: markdown plus page metadata. */
async function scrapeWithContextDev(
  url: string,
  apiKey: string,
): Promise<ScrapeResult> {
  const endpoint = new URL("https://api.context.dev/v1/web/scrape/markdown");
  endpoint.searchParams.set("url", url);
  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(payload, response));
  }
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  if (!nonEmpty(record.markdown)) {
    throw new Error("No content returned");
  }
  const metadata = (record.metadata ?? {}) as Record<string, unknown>;
  return {
    content: record.markdown,
    title: optionalString(metadata.title),
    description: optionalString(metadata.description),
    provider: "contextdev",
  };
}

const SCRAPERS: Record<
  WebResearchProvider,
  (url: string, apiKey: string) => Promise<ScrapeResult>
> = {
  firecrawl: scrapeWithFirecrawl,
  exa: scrapeWithExa,
  contextdev: scrapeWithContextDev,
};

/** Scrape one URL with a single provider. Throws on any failure. */
export async function scrapeWithProvider(
  provider: WebResearchProvider,
  url: string,
  apiKey: string,
): Promise<ScrapeResult> {
  return await SCRAPERS[provider](url, apiKey);
}

/**
 * Walk the chain until one provider returns content. Failures are collected
 * so callers can surface which vendors were tried.
 */
export async function scrapeUrlWithFallback(
  chain: ReadonlyArray<ProviderChainEntry>,
  url: string,
): Promise<ScrapeOutcome> {
  if (chain.length === 0) {
    return { ok: false, reason: "no_provider", errors: [] };
  }
  const errors: Array<{ provider: WebResearchProvider; message: string }> = [];
  for (const entry of chain) {
    try {
      const result = await scrapeWithProvider(entry.provider, url, entry.apiKey);
      return { ok: true, result };
    } catch (error) {
      errors.push({
        provider: entry.provider,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { ok: false, reason: "all_failed", errors };
}

/** One line summary for job errors: "Firecrawl: 402 Payment Required; Exa: ...". */
export function describeScrapeFailure(outcome: ScrapeOutcome): string {
  if (outcome.ok) {
    return "";
  }
  if (outcome.reason === "no_provider") {
    return NO_PROVIDER_MESSAGE;
  }
  const detail = outcome.errors
    .map(
      (entry) =>
        `${WEB_RESEARCH_PROVIDER_META[entry.provider].label}: ${entry.message}`,
    )
    .join("; ");
  return `Every configured web research provider failed. ${detail}`;
}
