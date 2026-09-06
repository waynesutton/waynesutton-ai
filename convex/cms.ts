import { queueNewsletterPublication } from "./lib/newsletterAutomation";
import { mutation, query, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Infer } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireDashboardAdmin } from "./dashboardAuth";
import {
  scheduleDiscoverySyncIfEnabled,
  postDiscoveryEntry,
  pageDiscoveryEntry,
} from "./agentReady/autoSync";
import { schedulePostAudioIfNeeded } from "./audio";
import { audioVoiceValidator } from "./audioDefaults";
import { resolveReadTime } from "./lib/readTime";

// Shared validator for post data
const postDataValidator = v.object({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  date: v.string(),
  published: v.boolean(),
  tags: v.array(v.string()),
  readTime: v.optional(v.string()),
  image: v.optional(v.string()),
  ogImage: v.optional(v.string()),
  noOgImage: v.optional(v.boolean()),
  showImageAtTop: v.optional(v.boolean()),
  excerpt: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  featuredOrder: v.optional(v.number()),
  authorName: v.optional(v.string()),
  authorImage: v.optional(v.string()),
  layout: v.optional(v.string()),
  rightSidebar: v.optional(v.boolean()),
  showFooter: v.optional(v.boolean()),
  footer: v.optional(v.string()),
  showSocialFooter: v.optional(v.boolean()),
  aiChat: v.optional(v.boolean()),
  blogFeatured: v.optional(v.boolean()),
  newsletter: v.optional(v.boolean()),
  contactForm: v.optional(v.boolean()),
  unlisted: v.optional(v.boolean()),
  aiWritten: v.optional(v.boolean()),
  minimap: v.optional(v.boolean()),
  hideNav: v.optional(v.boolean()),
  audio: v.optional(v.boolean()),
  audioVoice: v.optional(audioVoiceValidator),
  docsSection: v.optional(v.boolean()),
  docsSectionGroup: v.optional(v.string()),
  docsSectionOrder: v.optional(v.number()),
  docsSectionGroupOrder: v.optional(v.number()),
  docsSectionGroupIcon: v.optional(v.string()),
  docsLanding: v.optional(v.boolean()),
});

// Shared validator for page data
const pageDataValidator = v.object({
  slug: v.string(),
  title: v.string(),
  content: v.string(),
  published: v.boolean(),
  order: v.optional(v.number()),
  showInNav: v.optional(v.boolean()),
  excerpt: v.optional(v.string()),
  image: v.optional(v.string()),
  ogImage: v.optional(v.string()),
  noOgImage: v.optional(v.boolean()),
  showImageAtTop: v.optional(v.boolean()),
  featured: v.optional(v.boolean()),
  featuredOrder: v.optional(v.number()),
  authorName: v.optional(v.string()),
  authorImage: v.optional(v.string()),
  layout: v.optional(v.string()),
  rightSidebar: v.optional(v.boolean()),
  showFooter: v.optional(v.boolean()),
  footer: v.optional(v.string()),
  showSocialFooter: v.optional(v.boolean()),
  aiChat: v.optional(v.boolean()),
  contactForm: v.optional(v.boolean()),
  newsletter: v.optional(v.boolean()),
  unlisted: v.optional(v.boolean()),
  textAlign: v.optional(v.string()),
  docsSection: v.optional(v.boolean()),
  docsSectionGroup: v.optional(v.string()),
  docsSectionOrder: v.optional(v.number()),
  docsSectionGroupOrder: v.optional(v.number()),
  docsSectionGroupIcon: v.optional(v.string()),
  docsLanding: v.optional(v.boolean()),
});

// The Convex client drops undefined values inside nested arguments, so a field
// the editor emptied cannot be expressed in the `post` or `page` object. These
// unions let the caller name the optional fields to delete instead. Only fields
// that posts.listAll and pages.listAll return are listed, so a save can never
// wipe a field the editor never loaded.
const clearablePostField = v.union(
  v.literal("image"),
  v.literal("ogImage"),
  v.literal("noOgImage"),
  v.literal("excerpt"),
  v.literal("readTime"),
  v.literal("featuredOrder"),
  v.literal("authorName"),
  v.literal("authorImage"),
  v.literal("audio"),
  v.literal("audioVoice"),
);

const clearablePageField = v.union(
  v.literal("image"),
  v.literal("ogImage"),
  v.literal("noOgImage"),
  v.literal("excerpt"),
  v.literal("order"),
  v.literal("featuredOrder"),
  v.literal("authorName"),
  v.literal("authorImage"),
);

type ClearablePostField = Infer<typeof clearablePostField>;
type ClearablePageField = Infer<typeof clearablePageField>;

// Convex deletes an optional field when it is patched with undefined
function buildClearPatch<Field extends string>(
  fields: Array<Field> | undefined,
): { [K in Field]?: undefined } {
  const patch: { [K in Field]?: undefined } = {};
  for (const field of fields ?? []) {
    patch[field] = undefined;
  }
  return patch;
}

function escapeFrontmatterString(value: string): string {
  return value.replace(/"/g, '\\"');
}

function createMarkdownDocument(
  frontmatter: Array<string>,
  content: string,
): string {
  return `${frontmatter.join("\n")}\n\n${content}`;
}

function buildPostFrontmatter(post: Doc<"posts">): Array<string> {
  const frontmatter: Array<string> = ["---"];
  frontmatter.push(`title: "${escapeFrontmatterString(post.title)}"`);
  frontmatter.push(
    `description: "${escapeFrontmatterString(post.description)}"`,
  );
  frontmatter.push(`date: "${post.date}"`);
  frontmatter.push(`slug: "${post.slug}"`);
  frontmatter.push(`published: ${post.published}`);
  frontmatter.push(`tags: [${post.tags.map((tag) => `"${tag}"`).join(", ")}]`);

  if (post.readTime) frontmatter.push(`readTime: "${post.readTime}"`);
  if (post.image) frontmatter.push(`image: "${post.image}"`);
  if (post.ogImage) frontmatter.push(`ogImage: "${post.ogImage}"`);
  if (post.noOgImage) frontmatter.push(`noOgImage: true`);
  if (post.showImageAtTop !== undefined)
    frontmatter.push(`showImageAtTop: ${post.showImageAtTop}`);
  if (post.excerpt)
    frontmatter.push(`excerpt: "${escapeFrontmatterString(post.excerpt)}"`);
  if (post.featured !== undefined)
    frontmatter.push(`featured: ${post.featured}`);
  if (post.featuredOrder !== undefined)
    frontmatter.push(`featuredOrder: ${post.featuredOrder}`);
  if (post.authorName) frontmatter.push(`authorName: "${post.authorName}"`);
  if (post.authorImage) frontmatter.push(`authorImage: "${post.authorImage}"`);
  if (post.layout) frontmatter.push(`layout: "${post.layout}"`);
  if (post.rightSidebar !== undefined)
    frontmatter.push(`rightSidebar: ${post.rightSidebar}`);
  if (post.showFooter !== undefined)
    frontmatter.push(`showFooter: ${post.showFooter}`);
  if (post.footer)
    frontmatter.push(`footer: "${escapeFrontmatterString(post.footer)}"`);
  if (post.showSocialFooter !== undefined)
    frontmatter.push(`showSocialFooter: ${post.showSocialFooter}`);
  if (post.aiChat !== undefined) frontmatter.push(`aiChat: ${post.aiChat}`);
  if (post.blogFeatured !== undefined)
    frontmatter.push(`blogFeatured: ${post.blogFeatured}`);
  if (post.newsletter !== undefined)
    frontmatter.push(`newsletter: ${post.newsletter}`);
  if (post.contactForm !== undefined)
    frontmatter.push(`contactForm: ${post.contactForm}`);
  if (post.unlisted !== undefined)
    frontmatter.push(`unlisted: ${post.unlisted}`);
  if (post.aiWritten !== undefined)
    frontmatter.push(`aiWritten: ${post.aiWritten}`);
  if (post.minimap !== undefined)
    frontmatter.push(`minimap: ${post.minimap}`);
  if (post.hideNav !== undefined)
    frontmatter.push(`hideNav: ${post.hideNav}`);
  if (post.audio !== undefined) frontmatter.push(`audio: ${post.audio}`);
  if (post.audioVoice) frontmatter.push(`audioVoice: ${post.audioVoice}`);
  if (post.docsSection !== undefined)
    frontmatter.push(`docsSection: ${post.docsSection}`);
  if (post.docsSectionGroup)
    frontmatter.push(`docsSectionGroup: "${post.docsSectionGroup}"`);
  if (post.docsSectionOrder !== undefined)
    frontmatter.push(`docsSectionOrder: ${post.docsSectionOrder}`);
  if (post.docsSectionGroupOrder !== undefined)
    frontmatter.push(`docsSectionGroupOrder: ${post.docsSectionGroupOrder}`);
  if (post.docsSectionGroupIcon)
    frontmatter.push(`docsSectionGroupIcon: "${post.docsSectionGroupIcon}"`);
  if (post.docsLanding !== undefined)
    frontmatter.push(`docsLanding: ${post.docsLanding}`);

  frontmatter.push("---");
  return frontmatter;
}

function buildPageFrontmatter(page: Doc<"pages">): Array<string> {
  const frontmatter: Array<string> = ["---"];
  frontmatter.push(`title: "${escapeFrontmatterString(page.title)}"`);
  frontmatter.push(`slug: "${page.slug}"`);
  frontmatter.push(`published: ${page.published}`);

  if (page.order !== undefined) frontmatter.push(`order: ${page.order}`);
  if (page.showInNav !== undefined)
    frontmatter.push(`showInNav: ${page.showInNav}`);
  if (page.excerpt)
    frontmatter.push(`excerpt: "${escapeFrontmatterString(page.excerpt)}"`);
  if (page.image) frontmatter.push(`image: "${page.image}"`);
  if (page.ogImage) frontmatter.push(`ogImage: "${page.ogImage}"`);
  if (page.noOgImage) frontmatter.push(`noOgImage: true`);
  if (page.showImageAtTop !== undefined)
    frontmatter.push(`showImageAtTop: ${page.showImageAtTop}`);
  if (page.featured !== undefined)
    frontmatter.push(`featured: ${page.featured}`);
  if (page.featuredOrder !== undefined)
    frontmatter.push(`featuredOrder: ${page.featuredOrder}`);
  if (page.authorName) frontmatter.push(`authorName: "${page.authorName}"`);
  if (page.authorImage) frontmatter.push(`authorImage: "${page.authorImage}"`);
  if (page.layout) frontmatter.push(`layout: "${page.layout}"`);
  if (page.rightSidebar !== undefined)
    frontmatter.push(`rightSidebar: ${page.rightSidebar}`);
  if (page.showFooter !== undefined)
    frontmatter.push(`showFooter: ${page.showFooter}`);
  if (page.footer)
    frontmatter.push(`footer: "${escapeFrontmatterString(page.footer)}"`);
  if (page.showSocialFooter !== undefined)
    frontmatter.push(`showSocialFooter: ${page.showSocialFooter}`);
  if (page.aiChat !== undefined) frontmatter.push(`aiChat: ${page.aiChat}`);
  if (page.contactForm !== undefined)
    frontmatter.push(`contactForm: ${page.contactForm}`);
  if (page.newsletter !== undefined)
    frontmatter.push(`newsletter: ${page.newsletter}`);
  if (page.unlisted !== undefined)
    frontmatter.push(`unlisted: ${page.unlisted}`);
  if (page.textAlign) frontmatter.push(`textAlign: "${page.textAlign}"`);
  if (page.docsSection !== undefined)
    frontmatter.push(`docsSection: ${page.docsSection}`);
  if (page.docsSectionGroup)
    frontmatter.push(`docsSectionGroup: "${page.docsSectionGroup}"`);
  if (page.docsSectionOrder !== undefined)
    frontmatter.push(`docsSectionOrder: ${page.docsSectionOrder}`);
  if (page.docsSectionGroupOrder !== undefined)
    frontmatter.push(`docsSectionGroupOrder: ${page.docsSectionGroupOrder}`);
  if (page.docsSectionGroupIcon)
    frontmatter.push(`docsSectionGroupIcon: "${page.docsSectionGroupIcon}"`);
  if (page.docsLanding !== undefined)
    frontmatter.push(`docsLanding: ${page.docsLanding}`);

  frontmatter.push("---");
  return frontmatter;
}

// Create a new post via dashboard
export const createPost = mutation({
  args: { post: postDataValidator },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    // Check if slug already exists
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.post.slug))
      .unique();

    if (existing) {
      throw new ConvexError(`Post with slug "${args.post.slug}" already exists`);
    }

    const postId = await ctx.db.insert("posts", {
      ...args.post,
      readTime: resolveReadTime(args.post.readTime, args.post.content),
      source: "dashboard",
      lastSyncedAt: Date.now(),
    });

    // Auto discovery sync: new public post goes into llms.txt/agents.md
    if (args.post.published && args.post.unlisted !== true) {
      await scheduleDiscoverySyncIfEnabled(ctx, {
        publish: [postDiscoveryEntry(args.post)],
      });
    }

    if (args.post.published && !args.post.unlisted) await queueNewsletterPublication(ctx, postId);
    if (args.post.published) {
      await schedulePostAudioIfNeeded(ctx, postId);
    }

    return postId;
  },
});

// Internal mutation for creating posts from server-side actions (e.g. import)
// Auth is handled by the calling action, not repeated here.
export const createPostInternal = internalMutation({
  args: { post: postDataValidator },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.post.slug))
      .unique();

    if (existing) {
      throw new ConvexError(`Post with slug "${args.post.slug}" already exists`);
    }

    const postId = await ctx.db.insert("posts", {
      ...args.post,
      readTime: resolveReadTime(args.post.readTime, args.post.content),
      source: "dashboard",
      lastSyncedAt: Date.now(),
    });

    // Auto discovery sync: imported public posts go into llms.txt too
    if (args.post.published && args.post.unlisted !== true) {
      await scheduleDiscoverySyncIfEnabled(ctx, {
        publish: [postDiscoveryEntry(args.post)],
      });
    }

    if (args.post.published && !args.post.unlisted) await queueNewsletterPublication(ctx, postId);
    if (args.post.published) {
      await schedulePostAudioIfNeeded(ctx, postId);
    }

    return postId;
  },
});

// Update any post (dashboard or synced)
export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    post: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      date: v.optional(v.string()),
      published: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
      readTime: v.optional(v.string()),
      image: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noOgImage: v.optional(v.boolean()),
      showImageAtTop: v.optional(v.boolean()),
      excerpt: v.optional(v.string()),
      featured: v.optional(v.boolean()),
      featuredOrder: v.optional(v.number()),
      authorName: v.optional(v.string()),
      authorImage: v.optional(v.string()),
      layout: v.optional(v.string()),
      rightSidebar: v.optional(v.boolean()),
      showFooter: v.optional(v.boolean()),
      footer: v.optional(v.string()),
      showSocialFooter: v.optional(v.boolean()),
      aiChat: v.optional(v.boolean()),
      blogFeatured: v.optional(v.boolean()),
      newsletter: v.optional(v.boolean()),
      contactForm: v.optional(v.boolean()),
      unlisted: v.optional(v.boolean()),
      aiWritten: v.optional(v.boolean()),
      minimap: v.optional(v.boolean()),
      hideNav: v.optional(v.boolean()),
      audio: v.optional(v.boolean()),
      audioVoice: v.optional(audioVoiceValidator),
      docsSection: v.optional(v.boolean()),
      docsSectionGroup: v.optional(v.string()),
      docsSectionOrder: v.optional(v.number()),
      docsSectionGroupOrder: v.optional(v.number()),
      docsSectionGroupIcon: v.optional(v.string()),
      docsLanding: v.optional(v.boolean()),
    }),
    clearFields: v.optional(v.array(clearablePostField)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Post not found");
    }

    // If slug is being changed, check for conflicts
    const newSlug = args.post.slug;
    if (newSlug && newSlug !== existing.slug) {
      const slugConflict = await ctx.db
        .query("posts")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();
      if (slugConflict) {
        throw new ConvexError(`Post with slug "${newSlug}" already exists`);
      }
    }

    // Capture version before update (async, non-blocking)
    await ctx.scheduler.runAfter(0, internal.versions.createVersion, {
      contentType: "post",
      contentId: args.id,
      slug: existing.slug,
      title: existing.title,
      content: existing.content,
      description: existing.description,
      source: "dashboard",
    });

    await ctx.db.patch(args.id, {
      ...args.post,
      ...buildClearPatch<ClearablePostField>(args.clearFields),
      readTime: resolveReadTime(
        (args.clearFields ?? []).includes("readTime")
          ? undefined
          : (args.post.readTime ?? existing.readTime),
        args.post.content ?? existing.content,
      ),
      lastSyncedAt: Date.now(),
    });

    // Auto discovery sync: publish/unpublish/unlist/rename updates llms.txt
    const next = { ...existing, ...args.post };
    const wasPublic = existing.published && existing.unlisted !== true;
    const isPublic = next.published && next.unlisted !== true;
    const slugChanged = next.slug !== existing.slug;
    await scheduleDiscoverySyncIfEnabled(ctx, {
      publish: isPublic ? [postDiscoveryEntry(next)] : undefined,
      removePaths:
        wasPublic && (slugChanged || !isPublic)
          ? [`/${existing.slug}`]
          : undefined,
    });

    if (isPublic && !wasPublic) await queueNewsletterPublication(ctx, args.id);
    if (next.published) {
      await schedulePostAudioIfNeeded(ctx, args.id);
    }

    return null;
  },
});

// Delete a post
export const deletePost = mutation({
  args: { id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Post not found");
    }

    await ctx.db.delete(args.id);

    // Auto discovery sync: drop a deleted public post from llms.txt
    if (existing.published && existing.unlisted !== true) {
      await scheduleDiscoverySyncIfEnabled(ctx, {
        removePaths: [`/${existing.slug}`],
      });
    }

    return null;
  },
});

// Create a new page via dashboard
export const createPage = mutation({
  args: { page: pageDataValidator },
  returns: v.id("pages"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    // Check if slug already exists
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", args.page.slug))
      .unique();

    if (existing) {
      throw new ConvexError(`Page with slug "${args.page.slug}" already exists`);
    }

    const pageId = await ctx.db.insert("pages", {
      ...args.page,
      source: "dashboard",
      lastSyncedAt: Date.now(),
    });

    // Auto discovery sync: new public page goes into llms.txt/agents.md
    if (args.page.published && args.page.unlisted !== true) {
      await scheduleDiscoverySyncIfEnabled(ctx, {
        publish: [pageDiscoveryEntry(args.page)],
      });
    }

    return pageId;
  },
});

// Update any page (dashboard or synced)
export const updatePage = mutation({
  args: {
    id: v.id("pages"),
    page: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      published: v.optional(v.boolean()),
      order: v.optional(v.number()),
      showInNav: v.optional(v.boolean()),
      excerpt: v.optional(v.string()),
      image: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noOgImage: v.optional(v.boolean()),
      showImageAtTop: v.optional(v.boolean()),
      featured: v.optional(v.boolean()),
      featuredOrder: v.optional(v.number()),
      authorName: v.optional(v.string()),
      authorImage: v.optional(v.string()),
      layout: v.optional(v.string()),
      rightSidebar: v.optional(v.boolean()),
      showFooter: v.optional(v.boolean()),
      footer: v.optional(v.string()),
      showSocialFooter: v.optional(v.boolean()),
      aiChat: v.optional(v.boolean()),
      contactForm: v.optional(v.boolean()),
      newsletter: v.optional(v.boolean()),
      unlisted: v.optional(v.boolean()),
      textAlign: v.optional(v.string()),
      docsSection: v.optional(v.boolean()),
      docsSectionGroup: v.optional(v.string()),
      docsSectionOrder: v.optional(v.number()),
      docsSectionGroupOrder: v.optional(v.number()),
      docsSectionGroupIcon: v.optional(v.string()),
      docsLanding: v.optional(v.boolean()),
    }),
    clearFields: v.optional(v.array(clearablePageField)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Page not found");
    }

    // If slug is being changed, check for conflicts
    const newSlug = args.page.slug;
    if (newSlug && newSlug !== existing.slug) {
      const slugConflict = await ctx.db
        .query("pages")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();
      if (slugConflict) {
        throw new ConvexError(`Page with slug "${newSlug}" already exists`);
      }
    }

    // Capture version before update (async, non-blocking)
    await ctx.scheduler.runAfter(0, internal.versions.createVersion, {
      contentType: "page",
      contentId: args.id,
      slug: existing.slug,
      title: existing.title,
      content: existing.content,
      source: "dashboard",
    });

    await ctx.db.patch(args.id, {
      ...args.page,
      ...buildClearPatch<ClearablePageField>(args.clearFields),
      lastSyncedAt: Date.now(),
    });

    // Auto discovery sync: publish/unpublish/unlist/rename updates llms.txt
    const next = { ...existing, ...args.page };
    const wasPublic = existing.published && existing.unlisted !== true;
    const isPublic = next.published && next.unlisted !== true;
    const slugChanged = next.slug !== existing.slug;
    await scheduleDiscoverySyncIfEnabled(ctx, {
      publish: isPublic ? [pageDiscoveryEntry(next)] : undefined,
      removePaths:
        wasPublic && (slugChanged || !isPublic)
          ? [`/${existing.slug}`]
          : undefined,
    });

    return null;
  },
});

// Delete a page
export const deletePage = mutation({
  args: { id: v.id("pages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Page not found");
    }

    await ctx.db.delete(args.id);

    // Auto discovery sync: drop a deleted public page from llms.txt
    if (existing.published && existing.unlisted !== true) {
      await scheduleDiscoverySyncIfEnabled(ctx, {
        removePaths: [`/${existing.slug}`],
      });
    }

    return null;
  },
});

// Export post as markdown with frontmatter
export const exportPostAsMarkdown = query({
  args: { id: v.id("posts") },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new ConvexError("Post not found");
    }

    return createMarkdownDocument(buildPostFrontmatter(post), post.content);
  },
});

// Export page as markdown with frontmatter
export const exportPageAsMarkdown = query({
  args: { id: v.id("pages") },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const page = await ctx.db.get(args.id);
    if (!page) {
      throw new ConvexError("Page not found");
    }

    return createMarkdownDocument(buildPageFrontmatter(page), page.content);
  },
});
