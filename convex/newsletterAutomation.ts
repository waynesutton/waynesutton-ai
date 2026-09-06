import { v, ConvexError } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { requireDashboardAdmin } from "./dashboardAuth";
import { resolveConfigValue } from "./pipelineKeys";
import {
  automationSettingsValidator,
  readAutomationSettings,
  newsletterDue,
  newsletterSubject,
} from "./lib/newsletterAutomation";

export const getSettings = query({
  args: {},
  returns: automationSettingsValidator,
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return readAutomationSettings(ctx);
  },
});

export const saveSettings = mutation({
  args: { settings: automationSettingsValidator },
  returns: v.null(),
  handler: async (ctx, { settings }) => {
    await requireDashboardAdmin(ctx);
    if (
      !Number.isInteger(settings.hourUtc) ||
      settings.hourUtc < 0 ||
      settings.hourUtc > 23 ||
      !Number.isInteger(settings.weekdayUtc) ||
      settings.weekdayUtc < 0 ||
      settings.weekdayUtc > 6
    )
      throw new ConvexError("Choose a valid UTC hour and weekday.");
    if (
      !settings.subject.trim() ||
      settings.subject.length > 200 ||
      settings.introduction.length > 10000
    )
      throw new ConvexError(
        "Provide a subject up to 200 characters and an introduction up to 10,000 characters.",
      );
    // Dashboard BYOK overrides count as configured
    const [agentMailKey, agentMailInbox] = settings.enabled
      ? await Promise.all([
          resolveConfigValue(ctx, "AGENTMAIL_API_KEY"),
          resolveConfigValue(ctx, "AGENTMAIL_INBOX"),
        ])
      : [null, null];
    if (
      settings.enabled &&
      (!agentMailKey || !agentMailInbox || !process.env.SITE_URL)
    )
      throw new ConvexError(
        "Configure AGENTMAIL_API_KEY, AGENTMAIL_INBOX and SITE_URL before enabling automation.",
      );
    const row = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "newsletterAutomation"))
      .unique();
    if (row) await ctx.db.patch(row._id, { value: settings });
    else
      await ctx.db.insert("siteConfig", {
        key: "newsletterAutomation",
        value: settings,
      });
    return null;
  },
});

export const getStatus = query({
  args: {},
  returns: v.object({
    pending: v.number(),
    failed: v.number(),
    uncertain: v.number(),
  }),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const pending = await ctx.db
      .query("newsletterPublications")
      .withIndex("by_status_and_publishedat", (q) => q.eq("status", "pending"))
      .take(100);
    const failed = await ctx.db
      .query("newsletterDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .take(100);
    const uncertain = await ctx.db
      .query("newsletterDeliveries")
      .withIndex("by_status", (q) => q.eq("status", "sending"))
      .take(100);
    return {
      pending: pending.length,
      failed: failed.length,
      uncertain: uncertain.length,
    };
  },
});

// Claims publications in one transaction. A minute cron cannot start the same
// campaign twice, and editing a post never creates another publication record.
export const tick = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const settings = await readAutomationSettings(ctx);
    const now = Date.now();
    if (!newsletterDue(settings, now)) return null;
    const pending = await ctx.db
      .query("newsletterPublications")
      .withIndex("by_status_and_publishedat", (q) => q.eq("status", "pending"))
      .take(settings.mode === "new-post" ? 1 : 50);
    if (!pending.length) return null;
    const key =
      settings.mode === "new-post"
        ? `post:${pending[0].postId}`
        : `${settings.mode}:${new Date(now).toISOString().slice(0, 10)}`;
    if (
      await ctx.db
        .query("newsletterCampaigns")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique()
    )
      return null;
    const posts = [];
    for (const publication of pending) {
      const post = await ctx.db.get(publication.postId);
      await ctx.db.patch(publication._id, { status: "queued" });
      if (
        post?.published &&
        !post.unlisted &&
        post.source !== "demo" &&
        !post.demo
      )
        posts.push(post);
    }
    if (!posts.length) return null;
    const overrides = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", "runtimeOverrides"))
      .unique();
    const siteName =
      typeof overrides?.value?.name === "string"
        ? overrides.value.name
        : process.env.SITE_NAME || "Newsletter";
    const id = await ctx.db.insert("newsletterCampaigns", {
      key,
      postIds: posts.map((post) => post._id),
      subject: newsletterSubject(
        settings.subject,
        siteName,
        posts.map((post) => post.title),
      ),
      introduction: settings.introduction,
      createdAt: now,
      status: "sending",
    });
    await ctx.scheduler.runAfter(
      0,
      internal.newsletterAutomation.prepareBatch,
      { campaignId: id },
    );
    return null;
  },
});

export const prepareBatch = internalMutation({
  args: { campaignId: v.id("newsletterCampaigns") },
  returns: v.null(),
  handler: async (ctx, { campaignId }) => {
    const campaign = await ctx.db.get(campaignId);
    if (!campaign || campaign.status !== "sending") return null;
    if (!(await readAutomationSettings(ctx)).enabled) {
      await ctx.db.patch(campaignId, { status: "paused" });
      return null;
    }
    const page = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_subscribed", (q) => q.eq("subscribed", true))
      .paginate({ numItems: 25, cursor: campaign.cursor ?? null });
    const deliveryIds: Array<Id<"newsletterDeliveries">> = [];
    for (const subscriber of page.page) {
      // Subscribers who joined after this campaign wait for the next publication.
      if (subscriber.subscribedAt > campaign.createdAt) continue;
      const existing = await ctx.db
        .query("newsletterDeliveries")
        .withIndex("by_campaignid_and_subscriberid", (q) =>
          q.eq("campaignId", campaignId).eq("subscriberId", subscriber._id),
        )
        .unique();
      if (existing) continue;
      deliveryIds.push(
        await ctx.db.insert("newsletterDeliveries", {
          campaignId,
          subscriberId: subscriber._id,
          status: "sending",
          attemptedAt: Date.now(),
        }),
      );
    }
    // One action per page instead of one per subscriber keeps the scheduler
    // queue flat and lets the action claim and finish the page in two writes.
    if (deliveryIds.length)
      await ctx.scheduler.runAfter(
        0,
        internal.newsletterAutomationActions.deliverBatch,
        { deliveryIds },
      );
    await ctx.db.patch(campaignId, {
      cursor: page.continueCursor,
      ...(page.isDone ? { status: "complete" as const } : {}),
    });
    if (!page.isDone)
      await ctx.scheduler.runAfter(
        1000,
        internal.newsletterAutomation.prepareBatch,
        { campaignId },
      );
    return null;
  },
});

const claimedPostValidator = v.object({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
});

type ClaimedPost = {
  slug: string;
  title: string;
  description: string;
};

// Claims a page of deliveries in one transaction and returns everything the
// action needs to send them. Deliveries that are no longer eligible are marked
// skipped here so the action never has to read the database.
export const claimDeliveries = internalMutation({
  args: { deliveryIds: v.array(v.id("newsletterDeliveries")) },
  returns: v.array(
    v.object({
      deliveryId: v.id("newsletterDeliveries"),
      email: v.string(),
      token: v.string(),
      subject: v.string(),
      introduction: v.string(),
      posts: v.array(claimedPostValidator),
    }),
  ),
  handler: async (ctx, { deliveryIds }) => {
    const settings = await readAutomationSettings(ctx);
    const campaigns = new Map<
      Id<"newsletterCampaigns">,
      { campaign: Doc<"newsletterCampaigns">; posts: Array<ClaimedPost> } | null
    >();
    const claimed = [];
    for (const deliveryId of deliveryIds) {
      const delivery = await ctx.db.get(deliveryId);
      if (!delivery || delivery.status !== "sending" || delivery.error)
        continue;
      const subscriber = await ctx.db.get(delivery.subscriberId);
      // Campaign posts are resolved once per campaign, not once per recipient
      if (!campaigns.has(delivery.campaignId)) {
        const campaign = await ctx.db.get(delivery.campaignId);
        if (!campaign) {
          campaigns.set(delivery.campaignId, null);
        } else {
          const posts: Array<ClaimedPost> = [];
          for (const id of campaign.postIds) {
            const post = await ctx.db.get(id);
            if (
              post?.published &&
              !post.unlisted &&
              post.source !== "demo" &&
              !post.demo
            )
              posts.push({
                slug: post.slug,
                title: post.title,
                description: post.description,
              });
          }
          campaigns.set(delivery.campaignId, { campaign, posts });
        }
      }
      const resolved = campaigns.get(delivery.campaignId) ?? null;
      if (
        !subscriber?.subscribed ||
        !resolved ||
        !resolved.posts.length ||
        !settings.enabled
      ) {
        await ctx.db.patch(deliveryId, { status: "skipped" });
        continue;
      }
      // At-most-once external attempt. An interrupted request stays visible as
      // uncertain instead of automatically risking a duplicate subscriber email.
      await ctx.db.patch(deliveryId, {
        error: "Delivery attempt started",
        attemptedAt: Date.now(),
      });
      claimed.push({
        deliveryId,
        email: subscriber.email,
        token: subscriber.unsubscribeToken,
        subject: resolved.campaign.subject,
        introduction: resolved.campaign.introduction,
        posts: resolved.posts,
      });
    }
    return claimed;
  },
});

export const finishDeliveries = internalMutation({
  args: {
    results: v.array(
      v.object({
        deliveryId: v.id("newsletterDeliveries"),
        error: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { results }) => {
    await Promise.all(
      results.map((result) =>
        ctx.db.patch(result.deliveryId, {
          status: result.error ? "failed" : "sent",
          error: result.error?.slice(0, 500),
        }),
      ),
    );
    return null;
  },
});

// Recent delivery results are separate from manual newsletter send records.
export const recentCampaigns = query({
  args: {},
  returns: v.array(
    v.object({
      key: v.string(),
      subject: v.string(),
      createdAt: v.number(),
      status: v.string(),
      sent: v.number(),
      failed: v.number(),
      pending: v.number(),
      skipped: v.number(),
      capped: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const campaigns = await ctx.db
      .query("newsletterCampaigns")
      .withIndex("by_createdat")
      .order("desc")
      .take(5);
    const result = [];
    for (const campaign of campaigns) {
      const deliveries = await ctx.db
        .query("newsletterDeliveries")
        .withIndex("by_campaignid_and_subscriberid", (q) =>
          q.eq("campaignId", campaign._id),
        )
        .take(1000);
      result.push({
        key: campaign.key,
        subject: campaign.subject,
        createdAt: campaign.createdAt,
        status:
          campaign.status === "complete"
            ? "All recipients queued"
            : campaign.status === "paused"
              ? "Paused"
              : "Queueing recipients",
        sent: deliveries.filter((delivery) => delivery.status === "sent")
          .length,
        failed: deliveries.filter((delivery) => delivery.status === "failed")
          .length,
        pending: deliveries.filter((delivery) => delivery.status === "sending")
          .length,
        skipped: deliveries.filter((delivery) => delivery.status === "skipped")
          .length,
        capped: deliveries.length === 1000,
      });
    }
    return result;
  },
});
