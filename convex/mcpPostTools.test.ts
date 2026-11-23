/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import schema from "./schema";
import componentSchema from "../node_modules/@waynesutton/agent-ready/src/component/schema";

const modules = import.meta.glob("./**/*.ts");
const componentModules = import.meta.glob(
  "../node_modules/@waynesutton/agent-ready/src/component/**/*.ts",
);

const MANAGE_KEY = "wsa_test_manage";
const DRAFT_KEY = "wsa_test_draft";

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function setup() {
  const t = convexTest(schema, modules);
  t.registerComponent("agentReady", componentSchema, componentModules);
  rateLimiterTest.register(t);
  const manageHash = await sha256Hex(MANAGE_KEY);
  const draftHash = await sha256Hex(DRAFT_KEY);
  await t.run(async (ctx) => {
    await ctx.db.insert("apiKeys", {
      keyHash: manageHash,
      label: "publish",
      autoPublish: true,
      createdAt: 1,
    });
    await ctx.db.insert("apiKeys", {
      keyHash: draftHash,
      label: "drafts",
      autoPublish: false,
      createdAt: 1,
    });
    for (const [slug, published, unlisted, date] of [
      ["live-post", true, false, "2026-11-01"],
      ["hidden-post", true, true, "2026-10-01"],
      ["draft-post", false, false, "2026-09-01"],
    ] as const) {
      await ctx.db.insert("posts", {
        slug,
        title: slug,
        description: `About ${slug}`,
        content: `Body of ${slug}`,
        date,
        published,
        unlisted,
        tags: ["test"],
        lastSyncedAt: 1,
      });
    }
  });
  return t;
}

type Rpc = { result?: { content?: Array<{ text: string }>; tools?: Array<{ name: string }> }; error?: { message: string } };

async function rpc(
  t: Awaited<ReturnType<typeof setup>>,
  method: string,
  params: Record<string, unknown>,
  key?: string,
): Promise<Rpc> {
  const res = await t.fetch("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "x-api-key": key } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return (await res.json()) as Rpc;
}

function payload(r: Rpc): Record<string, unknown> {
  return JSON.parse(r.result?.content?.[0]?.text ?? "null");
}

const callTool = (
  t: Awaited<ReturnType<typeof setup>>,
  name: string,
  args: Record<string, unknown>,
  key?: string,
) => rpc(t, "tools/call", { name, arguments: args }, key);

test("anonymous callers never see the post management tools", async () => {
  const t = await setup();
  const anon = await rpc(t, "tools/list", {});
  const names = anon.result?.tools?.map((tool) => tool.name) ?? [];
  expect(names).not.toContain("list_all_posts");
  expect(names).not.toContain("delete_post");
  const keyed = await rpc(t, "tools/list", {}, MANAGE_KEY);
  expect(keyed.result?.tools?.map((tool) => tool.name)).toContain("set_post_published");
});

test("list_all_posts returns every post with its status", async () => {
  const t = await setup();
  const r = await callTool(t, "list_all_posts", {}, DRAFT_KEY);
  const posts = payload(r).posts as Array<{ slug: string; status: string }>;
  expect(posts.map((p) => [p.slug, p.status])).toEqual([
    ["live-post", "published"],
    ["hidden-post", "unlisted"],
    ["draft-post", "draft"],
  ]);
  const anon = await callTool(t, "list_all_posts", {});
  expect(anon.error?.message).toMatch(/Missing pipeline API key/);
});

test("set_post_published needs an auto publish key and is idempotent", async () => {
  const t = await setup();
  const denied = await callTool(t, "set_post_published", { slug: "live-post", published: false }, DRAFT_KEY);
  expect(denied.error?.message).toMatch(/cannot change posts/);

  const first = payload(
    await callTool(t, "set_post_published", { slug: "live-post", published: false }, MANAGE_KEY),
  );
  expect(first).toMatchObject({ published: false, changed: true, status: "draft" });
  const again = payload(
    await callTool(t, "set_post_published", { slug: "live-post", published: false }, MANAGE_KEY),
  );
  expect(again).toMatchObject({ changed: false });

  const back = payload(
    await callTool(t, "set_post_published", { slug: "live-post", published: true }, MANAGE_KEY),
  );
  expect(back).toMatchObject({ published: true, changed: true });

  const missing = await callTool(t, "set_post_published", { slug: "nope", published: true }, MANAGE_KEY);
  expect(missing.error?.message).toMatch(/Post not found/);
});

test("delete_post removes the post and returns a backup", async () => {
  const t = await setup();
  const denied = await callTool(t, "delete_post", { slug: "draft-post" }, DRAFT_KEY);
  expect(denied.error?.message).toMatch(/cannot change posts/);

  const result = payload(await callTool(t, "delete_post", { slug: "draft-post" }, MANAGE_KEY));
  expect(result).toMatchObject({ deleted: true, backup: { content: "Body of draft-post" } });
  const gone = await t.run((ctx) =>
    ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", "draft-post")).unique(),
  );
  expect(gone).toBeNull();

  const again = payload(await callTool(t, "delete_post", { slug: "draft-post" }, MANAGE_KEY));
  expect(again).toMatchObject({ deleted: false, backup: null });
});
