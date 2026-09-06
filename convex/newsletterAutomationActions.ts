"use node";
import { v } from "convex/values";
import { AgentMailClient } from "agentmail";
import { resolveVendorKeys } from "./lib/vendorKeyResolver";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Provider exceptions may contain addresses or credentials; keep status safe.
const FAILURE_MESSAGE =
  "Delivery failed or its result is uncertain. Check AgentMail before retrying manually.";

type DeliveryResult = {
  deliveryId: Id<"newsletterDeliveries">;
  error?: string;
};

// Sends one page of claimed deliveries: one claim write, N provider calls,
// one finish write. Config is resolved once for the whole page.
export const deliverBatch = internalAction({
  args: { deliveryIds: v.array(v.id("newsletterDeliveries")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const claimed = await ctx.runMutation(
      internal.newsletterAutomation.claimDeliveries,
      args,
    );
    if (!claimed.length) return null;

    // Dashboard BYOK overrides first, then env vars
    const { AGENTMAIL_API_KEY: apiKey, AGENTMAIL_INBOX: inbox } =
      await resolveVendorKeys(ctx, ["AGENTMAIL_API_KEY", "AGENTMAIL_INBOX"]);
    const siteUrl = process.env.SITE_URL;
    let origin: URL | null = null;
    try {
      origin = siteUrl ? new URL(siteUrl) : null;
      if (origin && origin.protocol !== "https:") origin = null;
    } catch {
      origin = null;
    }

    const results: Array<DeliveryResult> = [];
    const client = apiKey ? new AgentMailClient({ apiKey }) : null;
    for (const delivery of claimed) {
      // Missing provider config fails the whole page without a network call
      if (!client || !inbox || !origin) {
        results.push({ deliveryId: delivery.deliveryId, error: FAILURE_MESSAGE });
        continue;
      }
      try {
        const unsubscribe = new URL("/unsubscribe", origin);
        unsubscribe.searchParams.set("email", delivery.email);
        unsubscribe.searchParams.set("token", delivery.token);
        const articles = delivery.posts.map((post) => ({
          ...post,
          url: new URL(`/${encodeURIComponent(post.slug)}`, origin).href,
        }));
        const html = `<div style="font-family: sans-serif; max-width: 600px; margin: auto; line-height: 1.6"><p>${escape(delivery.introduction).replace(/\n/g, "<br />")}</p>${articles.map((post) => `<h2><a href="${escape(post.url)}">${escape(post.title)}</a></h2><p>${escape(post.description)}</p>`).join("")}<hr /><p>You subscribed to updates from this site. <a href="${escape(unsubscribe.href)}">Unsubscribe</a></p></div>`;
        const text = `${delivery.introduction}\n\n${articles.map((post) => `${post.title}\n${post.description}\n${post.url}`).join("\n\n")}\n\nUnsubscribe: ${unsubscribe.href}`;
        await client.inboxes.messages.send(inbox, {
          to: delivery.email,
          subject: delivery.subject,
          html,
          text,
        });
        results.push({ deliveryId: delivery.deliveryId });
      } catch {
        results.push({ deliveryId: delivery.deliveryId, error: FAILURE_MESSAGE });
      }
    }
    await ctx.runMutation(internal.newsletterAutomation.finishDeliveries, {
      results,
    });
    return null;
  },
});
