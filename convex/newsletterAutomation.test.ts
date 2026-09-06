/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import {
  automationDefaults,
  newsletterDue,
  newsletterSubject,
  queueNewsletterPublication,
} from "./lib/newsletterAutomation";

const modules = import.meta.glob("./**/*.ts");
const send = vi.hoisted(() =>
  vi.fn(
    async (
      _inbox: string,
      _payload: { html: string; text: string; subject: string; to: string },
    ) => ({}),
  ),
);
vi.mock("agentmail", () => ({
  AgentMailClient: class {
    inboxes = { messages: { send } };
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T09:00:00Z"));
  send.mockClear();
  vi.stubEnv("AGENTMAIL_API_KEY", "test-only");
  vi.stubEnv("AGENTMAIL_INBOX", "test-only");
  vi.stubEnv("SITE_URL", "https://example.test");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

async function setup(enabled = true) {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    await ctx.db.insert("siteConfig", {
      key: "newsletterAutomation",
      value: { ...automationDefaults, enabled },
    });
    const postId = await ctx.db.insert("posts", {
      slug: "hello",
      title: "Hello",
      description: "A post",
      content: "Body",
      date: "2026-09-06",
      published: true,
      tags: [],
      readTime: "1 min",
      lastSyncedAt: Date.now(),
    });
    const subscriberId = await ctx.db.insert("newsletterSubscribers", {
      email: "reader@example.test",
      subscribed: true,
      subscribedAt: Date.now() - 1000,
      source: "home",
      unsubscribeToken: "test-token",
    });
    return { postId, subscriberId };
  });
  return { t, ...ids };
}

test("automation settings are admin only and default off", async () => {
  const t = convexTest(schema, modules);
  await expect(
    t.query(api.newsletterAutomation.getSettings, {}),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.newsletterAutomation.saveSettings, {
      settings: automationDefaults,
    }),
  ).rejects.toThrow();
  expect(newsletterDue(automationDefaults, Date.now())).toBe(false);
});

test("publication enqueue is disabled by default and idempotent", async () => {
  const disabled = await setup(false);
  await disabled.t.run((ctx) =>
    queueNewsletterPublication(ctx, disabled.postId),
  );
  expect(
    await disabled.t.run((ctx) =>
      ctx.db.query("newsletterPublications").collect(),
    ),
  ).toHaveLength(0);
  const { t, postId } = await setup();
  await t.run(async (ctx) => {
    await queueNewsletterPublication(ctx, postId);
    await queueNewsletterPublication(ctx, postId);
  });
  expect(
    await t.run((ctx) => ctx.db.query("newsletterPublications").collect()),
  ).toHaveLength(1);
});

test("UTC schedules and subject substitution handle boundaries and literal dollars", () => {
  const settings = {
    ...automationDefaults,
    enabled: true,
    mode: "weekly" as const,
  };
  expect(newsletterDue(settings, Date.now())).toBe(true);
  expect(newsletterDue(settings, Date.now() + 3600000)).toBe(false);
  expect(newsletterDue(settings, Date.now() + 86400000)).toBe(false);
  expect(
    newsletterDue({ ...settings, mode: "daily" }, Date.now() + 86400000),
  ).toBe(true);
  expect(
    newsletterSubject("{{siteName}}: {{title}} ({{count}})", "$&", ["A", "B"]),
  ).toBe("$&: 2 new posts (2)");
});

test("overlapping cron runs send one email with unsubscribe and no duplicate on edits", async () => {
  const { t, postId } = await setup();
  await t.run((ctx) => queueNewsletterPublication(ctx, postId));
  await t.mutation(internal.newsletterAutomation.tick, {});
  await t.mutation(internal.newsletterAutomation.tick, {});
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][1].html).toContain("Unsubscribe");
  expect(send.mock.calls[0][1].text).toContain("token=test-token");
  const deliveries = await t.run((ctx) =>
    ctx.db.query("newsletterDeliveries").collect(),
  );
  expect(deliveries[0].status).toBe("sent");
  await t.action(internal.newsletterAutomationActions.deliverBatch, {
    deliveryIds: [deliveries[0]._id],
  });
  expect(send).toHaveBeenCalledTimes(1);
});

test("unpublished and unlisted posts never produce campaigns", async () => {
  const { t, postId } = await setup();
  await t.run(async (ctx) => {
    await queueNewsletterPublication(ctx, postId);
    await ctx.db.patch(postId, { unlisted: true });
  });
  await t.mutation(internal.newsletterAutomation.tick, {});
  expect(
    await t.run((ctx) => ctx.db.query("newsletterCampaigns").collect()),
  ).toHaveLength(0);
  expect(send).not.toHaveBeenCalled();
});

test("unsubscribe or disabling automation before delivery prevents email", async () => {
  const { t, postId, subscriberId } = await setup();
  const deliveryId = await t.run(async (ctx) => {
    const campaignId = await ctx.db.insert("newsletterCampaigns", {
      key: "test",
      postIds: [postId],
      subject: "Hello",
      introduction: "Hi",
      createdAt: Date.now(),
      status: "sending",
    });
    const id = await ctx.db.insert("newsletterDeliveries", {
      campaignId,
      subscriberId,
      status: "sending",
      attemptedAt: Date.now(),
    });
    await ctx.db.patch(subscriberId, { subscribed: false });
    return id;
  });
  await t.action(internal.newsletterAutomationActions.deliverBatch, {
    deliveryIds: [deliveryId],
  });
  expect(send).not.toHaveBeenCalled();
  expect((await t.run((ctx) => ctx.db.get(deliveryId)))?.status).toBe(
    "skipped",
  );
});

test("provider failure is recorded and never automatically retried", async () => {
  send.mockRejectedValueOnce(new Error("provider unavailable"));
  const { t, postId } = await setup();
  await t.run((ctx) => queueNewsletterPublication(ctx, postId));
  await t.mutation(internal.newsletterAutomation.tick, {});
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  const deliveries = await t.run((ctx) =>
    ctx.db.query("newsletterDeliveries").collect(),
  );
  expect(deliveries[0].status).toBe("failed");
  await t.action(internal.newsletterAutomationActions.deliverBatch, {
    deliveryIds: [deliveries[0]._id],
  });
  expect(send).toHaveBeenCalledTimes(1);
});

test("daily mode waits for its hour and batches multiple publications once", async () => {
  const { t, postId } = await setup();
  await t.run(async (ctx) => {
    const row = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "newsletterAutomation"))
      .unique();
    await ctx.db.patch(row!._id, {
      value: {
        ...automationDefaults,
        enabled: true,
        mode: "daily",
        hourUtc: 10,
      },
    });
    await queueNewsletterPublication(ctx, postId);
    const second = await ctx.db.insert("posts", {
      slug: "second",
      title: "Second",
      description: "Another",
      content: "Body",
      published: true,
      date: "2026-09-06",
      tags: [],
      readTime: "1 min",
      lastSyncedAt: Date.now(),
    });
    await queueNewsletterPublication(ctx, second);
  });
  await t.mutation(internal.newsletterAutomation.tick, {});
  expect(
    await t.run((ctx) => ctx.db.query("newsletterCampaigns").collect()),
  ).toHaveLength(0);
  vi.setSystemTime(new Date("2026-09-06T10:00:00Z"));
  await t.mutation(internal.newsletterAutomation.tick, {});
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  const campaigns = await t.run((ctx) =>
    ctx.db.query("newsletterCampaigns").collect(),
  );
  expect(campaigns).toHaveLength(1);
  expect(campaigns[0].postIds).toHaveLength(2);
  expect(send).toHaveBeenCalledTimes(1);
});

test("switching automation off after queueing prevents delivery", async () => {
  const { t, postId } = await setup();
  await t.run((ctx) => queueNewsletterPublication(ctx, postId));
  await t.mutation(internal.newsletterAutomation.tick, {});
  await t.run(async (ctx) => {
    const settings = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "newsletterAutomation"))
      .unique();
    await ctx.db.patch(settings!._id, {
      value: { ...automationDefaults, enabled: false },
    });
  });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(send).not.toHaveBeenCalled();
});
