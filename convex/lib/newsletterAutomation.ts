import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const automationSettingsValidator = v.object({
  enabled: v.boolean(),
  mode: v.union(v.literal("new-post"), v.literal("daily"), v.literal("weekly")),
  hourUtc: v.number(),
  weekdayUtc: v.number(),
  subject: v.string(),
  introduction: v.string(),
});
export const automationDefaults = {
  enabled: false,
  mode: "new-post" as const,
  hourUtc: 9,
  weekdayUtc: 0,
  subject: "{{siteName}}: {{title}}",
  introduction: "Here's what's new. Thanks for reading!",
};
export type AutomationSettings = Omit<typeof automationDefaults, "mode"> & {
  mode: "new-post" | "daily" | "weekly";
};

export async function readAutomationSettings(
  ctx: QueryCtx | MutationCtx,
): Promise<AutomationSettings> {
  const row = await ctx.db
    .query("siteConfig")
    .withIndex("by_key", (q) => q.eq("key", "newsletterAutomation"))
    .unique();
  return row ? (row.value as AutomationSettings) : automationDefaults;
}

// Called only on a transition into public visibility, from every publication door.
export async function queueNewsletterPublication(
  ctx: MutationCtx,
  postId: Id<"posts">,
) {
  const settings = await readAutomationSettings(ctx);
  if (!settings.enabled) return;
  const existing = await ctx.db
    .query("newsletterPublications")
    .withIndex("by_postid", (q) => q.eq("postId", postId))
    .unique();
  if (existing) return;
  await ctx.db.insert("newsletterPublications", {
    postId,
    publishedAt: Date.now(),
    status: "pending",
  });
}

export function newsletterDue(
  settings: AutomationSettings,
  now: number,
): boolean {
  if (!settings.enabled) return false;
  if (settings.mode === "new-post") return true;
  const date = new Date(now);
  return (
    date.getUTCHours() === settings.hourUtc &&
    (settings.mode === "daily" || date.getUTCDay() === settings.weekdayUtc)
  );
}

export function newsletterSubject(
  template: string,
  siteName: string,
  titles: string[],
): string {
  return template
    .replace(/\{\{siteName\}\}/g, () => siteName)
    .replace(/\{\{title\}\}/g, () =>
      titles.length === 1 ? titles[0] : `${titles.length} new posts`,
    )
    .replace(/\{\{count\}\}/g, String(titles.length))
    .replace(/[\r\n]/g, " ")
    .slice(0, 200);
}
