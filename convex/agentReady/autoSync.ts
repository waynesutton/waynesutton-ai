import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { v } from "convex/values";
import {
  buildPhotosMarkdownForSite,
  buildProjectsMarkdown,
  buildSkillsMarkdown,
  getPublishedSkillDirectory,
} from "../virtualFs";

/**
 * Auto discovery sync: when the dashboard toggle is on, publishing a public
 * post or page upserts it into the agent-ready pages table and regenerates the
 * cached llms.txt / agents.md / llms-full.txt served at the site root.
 * Unpublishing, unlisting, renaming, or deleting archives the old path so
 * discovery files never advertise a dead URL. Project changes refresh a single
 * /projects entry whose full content mirrors the VFS /projects.md file, and
 * skill changes do the same for /skills.
 * The CLI sync mutations batch all their changes into one event per run.
 */

export type DiscoveryPublishEntry = {
  title: string;
  path: string;
  description: string;
  section?: string;
};

type DiscoverySyncEvent = {
  publish?: Array<DiscoveryPublishEntry>;
  removePaths?: Array<string>;
  refreshProjects?: boolean;
  refreshSkills?: boolean;
  refreshPhotos?: boolean;
};

/** Post entry shape shared by dashboard, drafts, and CLI sync callers. */
export function postDiscoveryEntry(post: {
  title: string;
  slug: string;
  description: string;
}): DiscoveryPublishEntry {
  return {
    title: post.title,
    path: `/${post.slug}`,
    description: post.description,
    section: "Posts",
  };
}

/** Page entry shape; pages have no description field so excerpt or title fills in. */
export function pageDiscoveryEntry(page: {
  title: string;
  slug: string;
  excerpt?: string;
}): DiscoveryPublishEntry {
  return {
    title: page.title,
    path: `/${page.slug}`,
    description: page.excerpt ?? page.title,
    section: "Pages",
  };
}

/**
 * Reads the toggle and schedules the discovery refresh when enabled.
 * Called from publish mutations; scheduling keeps the mutation fast and the
 * component handles concurrent generation itself.
 */
export async function scheduleDiscoverySyncIfEnabled(
  ctx: MutationCtx,
  event: DiscoverySyncEvent,
): Promise<void> {
  const hasWork =
    (event.publish?.length ?? 0) > 0 ||
    (event.removePaths?.length ?? 0) > 0 ||
    event.refreshProjects === true ||
    event.refreshSkills === true ||
    event.refreshPhotos === true;
  if (!hasWork) return;
  const settings = await ctx.db
    .query("agentReadySettings")
    .withIndex("by_key", (q) => q.eq("key", "widget"))
    .unique();
  if (settings?.autoSyncOnPublish !== true) return;
  await ctx.scheduler.runAfter(
    0,
    internal.agentReady.autoSync.syncDiscovery,
    event,
  );
}

const PROJECTS_QUERY_LIMIT = 500;

// Published projects rendered as the same markdown the VFS serves at /projects.md,
// read fresh at action time so the entry always matches the database.
export const projectsForDiscovery = internalQuery({
  args: {},
  returns: v.object({ count: v.number(), markdown: v.string() }),
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(PROJECTS_QUERY_LIMIT);
    return {
      count: projects.length,
      markdown: buildProjectsMarkdown(projects),
    };
  },
});

export const syncDiscovery = internalAction({
  args: {
    publish: v.optional(
      v.array(
        v.object({
          title: v.string(),
          path: v.string(),
          description: v.string(),
          section: v.optional(v.string()),
        }),
      ),
    ),
    removePaths: v.optional(v.array(v.string())),
    refreshProjects: v.optional(v.boolean()),
    refreshSkills: v.optional(v.boolean()),
    refreshPhotos: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Each batch resolves current content and mirrors it transactionally. Old
    // jobs cannot restore hidden content; CLI syncs do not create giant writes.
    const paths = [
      ...new Set([
        ...(args.removePaths ?? []),
        ...(args.publish ?? []).map((entry) => entry.path),
      ]),
    ];
    for (let offset = 0; offset < paths.length; offset += 25) {
      await ctx.runMutation(internal.agentReady.autoSync.reconcilePaths, {
        paths: paths.slice(offset, offset + 25),
      });
    }
    if (args.refreshProjects) {
      await ctx.runMutation(internal.agentReady.autoSync.reconcileProjects, {});
    }
    if (args.refreshSkills) {
      await ctx.runMutation(internal.agentReady.autoSync.reconcileSkills, {});
    }
    if (args.refreshPhotos) {
      await ctx.runMutation(internal.agentReady.autoSync.reconcilePhotos, {});
    }
    await ctx.runAction(components.agentReady.content.regenerateAll, {});
    return null;
  },
});

// The component limits page bodies to 50,000 characters. Keep the complete
// source discoverable when a long article needs a bounded preview.
export function discoveryBody(content: string, slug: string): string {
  const suffix = `\n\n[Read the complete markdown](/raw/${slug}.md)`;
  return content.length <= 50_000
    ? content
    : content.slice(0, 50_000 - suffix.length) + suffix;
}

export const reconcilePaths = internalMutation({
  args: { paths: v.array(v.string()) },
  returns: v.null(),
  handler: async (ctx, { paths }) => {
    for (const path of new Set(paths)) {
      const slug = path.replace(/^\//, "");
      const [post, page] = await Promise.all([
        ctx.db
          .query("posts")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique(),
        ctx.db
          .query("pages")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique(),
      ]);
      // Match the public route: a published page takes precedence over a post,
      // even when that page is unlisted and must stay out of discovery.
      const document = page?.published ? page : post?.published ? post : null;
      if (document && !document.unlisted && !document.demo) {
        const entry = page?.published
          ? pageDiscoveryEntry(page)
          : postDiscoveryEntry(post!);
        await ctx.runMutation(components.agentReady.content.upsertPage, {
          ...entry,
          fullContent: discoveryBody(document.content, slug),
          status: "published",
        });
      } else {
        await ctx.runMutation(components.agentReady.content.archivePage, {
          path,
        });
      }
    }
    return null;
  },
});

export const reconcileProjects = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(PROJECTS_QUERY_LIMIT);
    if (projects.length > 0) {
      const markdown = buildProjectsMarkdown(projects);
      const suffix =
        '\n\nRead the complete index using POST /vfs/exec with {"command":"cat /projects.md"}.';
      await ctx.runMutation(components.agentReady.content.upsertPage, {
        title: "Projects",
        path: "/projects",
        section: "Projects",
        description: `Index of ${projects.length} shipped projects with descriptions and links`,
        fullContent:
          markdown.length <= 50_000
            ? markdown
            : markdown.slice(0, 50_000 - suffix.length) + suffix,
        status: "published",
      });
    } else {
      await ctx.runMutation(components.agentReady.content.archivePage, {
        path: "/projects",
      });
    }
    return null;
  },
});

// Same shape as projects: one /skills entry carrying the full VFS /skills.md
// markdown, archived when nothing is published.
export const reconcileSkills = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { sections, skills } = await getPublishedSkillDirectory(ctx);
    if (skills.length > 0) {
      const markdown = buildSkillsMarkdown(sections, skills);
      const suffix =
        '\n\nRead the complete directory using POST /vfs/exec with {"command":"cat /skills.md"}.';
      await ctx.runMutation(components.agentReady.content.upsertPage, {
        title: "Skills",
        path: "/skills",
        section: "Skills",
        description: `Directory of ${skills.length} agent skills with install commands and links`,
        fullContent:
          markdown.length <= 50_000
            ? markdown
            : markdown.slice(0, 50_000 - suffix.length) + suffix,
        status: "published",
      });
    } else {
      await ctx.runMutation(components.agentReady.content.archivePage, {
        path: "/skills",
      });
    }
    return null;
  },
});

// One /photos entry carrying the full VFS /photos.md markdown, archived when
// nothing is published. Image URLs are absolute so agents can fetch them.
export const reconcilePhotos = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(PROJECTS_QUERY_LIMIT);
    if (photos.length > 0) {
      const markdown = buildPhotosMarkdownForSite(photos);
      const suffix =
        '\n\nRead the complete gallery using POST /vfs/exec with {"command":"cat /photos.md"}.';
      await ctx.runMutation(components.agentReady.content.upsertPage, {
        title: "Photos",
        path: "/photos",
        section: "Photos",
        description: `Photo gallery with ${photos.length} ${photos.length === 1 ? "photo" : "photos"}, each with its own /photos/<slug> page`,
        fullContent:
          markdown.length <= 50_000
            ? markdown
            : markdown.slice(0, 50_000 - suffix.length) + suffix,
        status: "published",
      });
    } else {
      await ctx.runMutation(components.agentReady.content.archivePage, {
        path: "/photos",
      });
    }
    return null;
  },
});
