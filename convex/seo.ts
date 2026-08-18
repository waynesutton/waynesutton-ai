import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

// One-transaction lookup used by the static hosting catch-all in http.ts to
// server-render per-content meta tags. Checks posts first, then pages.
// Unlisted content is included (it is published) but flagged so the caller
// can emit a noindex robots tag.
export const getContentMetaBySlug = internalQuery({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      type: v.union(v.literal("post"), v.literal("page")),
      slug: v.string(),
      title: v.string(),
      description: v.string(),
      date: v.optional(v.string()),
      image: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noOgImage: v.optional(v.boolean()),
      unlisted: v.optional(v.boolean()),
      authorName: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (post && post.published) {
      return {
        type: "post" as const,
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        image: post.image,
        ogImage: post.ogImage,
        noOgImage: post.noOgImage,
        unlisted: post.unlisted,
        authorName: post.authorName,
      };
    }

    const page = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (page && page.published) {
      return {
        type: "page" as const,
        slug: page.slug,
        title: page.title,
        description: page.excerpt || page.title,
        date: undefined,
        image: page.image,
        ogImage: page.ogImage,
        noOgImage: page.noOgImage,
        unlisted: page.unlisted,
        authorName: undefined,
      };
    }

    return null;
  },
});
