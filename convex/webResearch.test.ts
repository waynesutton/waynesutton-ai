/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import {
  describeScrapeFailure,
  orderProviders,
  scrapeUrlWithFallback,
} from "./lib/webResearch";
const modules = import.meta.glob("./**/*.ts");

async function adminClient() {
  const t = convexTest(schema, modules);
  await t.run((ctx) =>
    ctx.db.insert("dashboardAdmins", { subject: "test-admin", createdAt: 1 }),
  );
  return { t, admin: t.withIdentity({ subject: "test-admin" }) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FIRECRAWL_API_KEY;
  delete process.env.EXA_API_KEY;
  delete process.env.CONTEXT_DEV_API_KEY;
});

test("auto keeps catalog order and drops providers without a key", () => {
  const chain = orderProviders("auto", {
    firecrawl: null,
    exa: " exa-key ",
    contextdev: "ctx-key",
  });
  expect(chain).toEqual([
    { provider: "exa", apiKey: "exa-key" },
    { provider: "contextdev", apiKey: "ctx-key" },
  ]);
});

test("a preferred provider moves first and the rest stay as fallbacks", () => {
  const chain = orderProviders("contextdev", {
    firecrawl: "fc",
    exa: "exa",
    contextdev: "ctx",
  });
  expect(chain.map((entry) => entry.provider)).toEqual([
    "contextdev",
    "firecrawl",
    "exa",
  ]);
});

test("a preferred provider without a key is skipped, not fatal", () => {
  const chain = orderProviders("exa", { firecrawl: "fc", exa: null });
  expect(chain.map((entry) => entry.provider)).toEqual(["firecrawl"]);
});

test("fallback moves to the next provider when the first fails", async () => {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("firecrawl")) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
      });
    }
    return new Response(
      JSON.stringify({
        results: [{ url: "https://example.com", title: "Example", text: "Body" }],
      }),
      { status: 200 },
    );
  });
  vi.stubGlobal("fetch", fetchMock);

  const outcome = await scrapeUrlWithFallback(
    [
      { provider: "firecrawl", apiKey: "fc" },
      { provider: "exa", apiKey: "exa" },
    ],
    "https://example.com",
  );
  expect(outcome.ok).toBe(true);
  if (outcome.ok) {
    expect(outcome.result.provider).toBe("exa");
    expect(outcome.result.title).toBe("Example");
    expect(outcome.result.content).toBe("Body");
  }
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("every provider failing reports each vendor by name", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 500 })),
  );
  const outcome = await scrapeUrlWithFallback(
    [
      { provider: "firecrawl", apiKey: "fc" },
      { provider: "contextdev", apiKey: "ctx" },
    ],
    "https://example.com",
  );
  expect(outcome.ok).toBe(false);
  const message = describeScrapeFailure(outcome);
  expect(message).toContain("Firecrawl:");
  expect(message).toContain("Context.dev:");
});

test("an empty chain names the three keys to add", async () => {
  const outcome = await scrapeUrlWithFallback([], "https://example.com");
  expect(outcome.ok).toBe(false);
  expect(describeScrapeFailure(outcome)).toContain("FIRECRAWL_API_KEY");
  expect(describeScrapeFailure(outcome)).toContain("CONTEXT_DEV_API_KEY");
});

test("resolveChain honors dashboard overrides and the saved preference", async () => {
  const { t, admin } = await adminClient();
  await t.run(async (ctx) => {
    await ctx.db.insert("vendorKeys", {
      name: "EXA_API_KEY",
      value: "exa-override",
      updatedAt: 1,
    });
    await ctx.db.insert("vendorKeys", {
      name: "CONTEXT_DEV_API_KEY",
      value: "ctx-override",
      updatedAt: 1,
    });
  });

  let chain = await t.query(internal.webResearch.resolveChain, {});
  expect(chain.map((entry) => entry.provider)).toEqual(["exa", "contextdev"]);

  await admin.mutation(api.webResearch.setPreferredProvider, {
    provider: "contextdev",
  });
  chain = await t.query(internal.webResearch.resolveChain, {});
  expect(chain[0]).toEqual({ provider: "contextdev", apiKey: "ctx-override" });

  const status = await admin.query(api.webResearch.providerStatus, {});
  expect(status.preferred).toBe("contextdev");
  expect(status.effectiveOrder).toEqual(["contextdev", "exa"]);
  expect(
    status.providers.find((p) => p.id === "firecrawl")?.configured,
  ).toBe(false);

  // Back to auto removes the preference without an error
  await admin.mutation(api.webResearch.setPreferredProvider, {
    provider: "auto",
  });
  chain = await t.query(internal.webResearch.resolveChain, {});
  expect(chain.map((entry) => entry.provider)).toEqual(["exa", "contextdev"]);
});

test("providerStatus requires a dashboard admin", async () => {
  const t = convexTest(schema, modules);
  await expect(t.query(api.webResearch.providerStatus, {})).rejects.toThrow();
});
