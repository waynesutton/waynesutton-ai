import { query, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import { scheduleDiscoverySyncIfEnabled } from "./agentReady/autoSync";
import { getPublishedSkillDirectory } from "./virtualFs";
import {
  buildSkillsMarkdown,
  compareSkillSections,
  compareSkills,
  MAX_SKILL_INSTALL_COMMANDS,
} from "./lib/skillsDirectory";

const ADMIN_QUERY_LIMIT = 500;
const MAX_INSTALL_COMMANDS = MAX_SKILL_INSTALL_COMMANDS;

// --- Validators ---

const installCommandValidator = v.object({
  label: v.string(),
  command: v.string(),
});

const sectionFields = {
  slug: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  installCommand: v.optional(v.string()),
  order: v.optional(v.number()),
  published: v.boolean(),
};

const skillFields = {
  slug: v.string(),
  title: v.string(),
  command: v.optional(v.string()),
  description: v.string(),
  details: v.optional(v.string()),
  sectionId: v.optional(v.id("skillSections")),
  authorName: v.optional(v.string()),
  authorUrl: v.optional(v.string()),
  installCommands: v.optional(v.array(installCommandValidator)),
  repoUrl: v.optional(v.string()),
  skillsShUrl: v.optional(v.string()),
  docsUrl: v.optional(v.string()),
  xUrl: v.optional(v.string()),
  published: v.boolean(),
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
};

// Convex drops undefined inside nested mutation arguments, so a field the form
// emptied has to be named for the patch to remove it.
const clearableSectionField = v.union(
  v.literal("description"),
  v.literal("installCommand"),
  v.literal("order"),
);

const clearableSkillField = v.union(
  v.literal("command"),
  v.literal("details"),
  v.literal("sectionId"),
  v.literal("authorName"),
  v.literal("authorUrl"),
  v.literal("installCommands"),
  v.literal("repoUrl"),
  v.literal("skillsShUrl"),
  v.literal("docsUrl"),
  v.literal("xUrl"),
  v.literal("order"),
  v.literal("featured"),
);

const publicSectionValidator = v.object({
  _id: v.id("skillSections"),
  slug: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  installCommand: v.optional(v.string()),
  order: v.optional(v.number()),
});

const publicSkillValidator = v.object({
  _id: v.id("skills"),
  slug: v.string(),
  title: v.string(),
  command: v.optional(v.string()),
  description: v.string(),
  details: v.optional(v.string()),
  sectionId: v.optional(v.id("skillSections")),
  authorName: v.optional(v.string()),
  authorUrl: v.optional(v.string()),
  installCommands: v.optional(v.array(installCommandValidator)),
  repoUrl: v.optional(v.string()),
  skillsShUrl: v.optional(v.string()),
  docsUrl: v.optional(v.string()),
  xUrl: v.optional(v.string()),
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
});

const adminSectionValidator = v.object({
  _id: v.id("skillSections"),
  _creationTime: v.number(),
  ...sectionFields,
});

const adminSkillValidator = v.object({
  _id: v.id("skills"),
  _creationTime: v.number(),
  ...skillFields,
});

// --- Helpers ---

function assertInstallCommands(
  installCommands: Array<{ label: string; command: string }> | undefined,
): void {
  if (!installCommands) return;
  if (installCommands.length > MAX_INSTALL_COMMANDS) {
    throw new ConvexError(
      `A skill can list at most ${MAX_INSTALL_COMMANDS} install commands`,
    );
  }
  for (const entry of installCommands) {
    if (!entry.label.trim() || !entry.command.trim()) {
      throw new ConvexError("Install commands need both a label and a command");
    }
  }
}

async function assertSkillSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  selfId?: string,
): Promise<void> {
  const conflict = await ctx.db
    .query("skills")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (conflict && conflict._id !== selfId) {
    throw new ConvexError(`Skill with slug "${slug}" already exists`);
  }
}

async function assertSectionSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  selfId?: string,
): Promise<void> {
  const conflict = await ctx.db
    .query("skillSections")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (conflict && conflict._id !== selfId) {
    throw new ConvexError(`Section with slug "${slug}" already exists`);
  }
}

// --- Public queries ---

// Everything the /skills page needs in one round trip. Grouping happens on the
// client with the shared groupSkills helper so the page and markdown agree.
export const listDirectory = query({
  args: {},
  returns: v.object({
    sections: v.array(publicSectionValidator),
    skills: v.array(publicSkillValidator),
  }),
  handler: async (ctx) => {
    await ctx.auth.getUserIdentity();

    const [sections, skills] = await Promise.all([
      ctx.db
        .query("skillSections")
        .withIndex("by_published", (q) => q.eq("published", true))
        .take(ADMIN_QUERY_LIMIT),
      ctx.db
        .query("skills")
        .withIndex("by_published", (q) => q.eq("published", true))
        .take(ADMIN_QUERY_LIMIT),
    ]);

    return {
      sections: sections.sort(compareSkillSections).map((section) => ({
        _id: section._id,
        slug: section.slug,
        title: section.title,
        description: section.description,
        installCommand: section.installCommand,
        order: section.order,
      })),
      skills: skills.sort(compareSkills).map((skill) => ({
        _id: skill._id,
        slug: skill.slug,
        title: skill.title,
        command: skill.command,
        description: skill.description,
        details: skill.details,
        sectionId: skill.sectionId,
        authorName: skill.authorName,
        authorUrl: skill.authorUrl,
        installCommands: skill.installCommands,
        repoUrl: skill.repoUrl,
        skillsShUrl: skill.skillsShUrl,
        docsUrl: skill.docsUrl,
        xUrl: skill.xUrl,
        order: skill.order,
        featured: skill.featured,
      })),
    };
  },
});

// The same markdown the VFS serves at /skills.md, for the page's copy button
export const getMarkdown = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await ctx.auth.getUserIdentity();
    const { sections, skills } = await getPublishedSkillDirectory(ctx);
    if (skills.length === 0) return "# Skills\n";
    return buildSkillsMarkdown(sections, skills);
  },
});

// --- Admin queries ---

export const listAllSections = query({
  args: {},
  returns: v.array(adminSectionValidator),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const sections = await ctx.db.query("skillSections").take(ADMIN_QUERY_LIMIT);
    return sections.sort(compareSkillSections).map((section) => ({
      _id: section._id,
      _creationTime: section._creationTime,
      slug: section.slug,
      title: section.title,
      description: section.description,
      installCommand: section.installCommand,
      order: section.order,
      published: section.published,
    }));
  },
});

export const listAllSkills = query({
  args: {},
  returns: v.array(adminSkillValidator),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const skills = await ctx.db.query("skills").take(ADMIN_QUERY_LIMIT);
    return skills.sort(compareSkills).map((skill) => ({
      _id: skill._id,
      _creationTime: skill._creationTime,
      slug: skill.slug,
      title: skill.title,
      command: skill.command,
      description: skill.description,
      details: skill.details,
      sectionId: skill.sectionId,
      authorName: skill.authorName,
      authorUrl: skill.authorUrl,
      installCommands: skill.installCommands,
      repoUrl: skill.repoUrl,
      skillsShUrl: skill.skillsShUrl,
      docsUrl: skill.docsUrl,
      xUrl: skill.xUrl,
      published: skill.published,
      order: skill.order,
      featured: skill.featured,
    }));
  },
});

// --- Section mutations ---

export const createSection = mutation({
  args: { section: v.object(sectionFields) },
  returns: v.id("skillSections"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await assertSectionSlugAvailable(ctx, args.section.slug);
    const sectionId = await ctx.db.insert("skillSections", args.section);
    // Auto discovery sync: section titles appear in /skills.md headings
    if (args.section.published) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true });
    }
    return sectionId;
  },
});

export const updateSection = mutation({
  args: {
    id: v.id("skillSections"),
    section: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      installCommand: v.optional(v.string()),
      order: v.optional(v.number()),
      published: v.optional(v.boolean()),
    }),
    clearFields: v.optional(v.array(clearableSectionField)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    if (args.section.slug !== undefined) {
      await assertSectionSlugAvailable(ctx, args.section.slug, args.id);
    }
    const patch: Record<string, unknown> = { ...args.section };
    for (const field of args.clearFields ?? []) {
      patch[field] = undefined;
    }
    await ctx.db.patch(args.id, patch);
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true });
    return null;
  },
});

// Deleting a section keeps its skills; they fall back to the default group.
export const removeSection = mutation({
  args: { id: v.id("skillSections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const assigned = await ctx.db
      .query("skills")
      .withIndex("by_sectionid", (q) => q.eq("sectionId", args.id))
      .take(ADMIN_QUERY_LIMIT);
    await Promise.all(
      assigned.map((skill) => ctx.db.patch(skill._id, { sectionId: undefined })),
    );
    await ctx.db.delete(args.id);
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true });
    return null;
  },
});

// --- Skill mutations ---

export const createSkill = mutation({
  args: { skill: v.object(skillFields) },
  returns: v.id("skills"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await assertSkillSlugAvailable(ctx, args.skill.slug);
    assertInstallCommands(args.skill.installCommands);
    const skillId = await ctx.db.insert("skills", args.skill);
    // Auto discovery sync: published skills refresh the /skills entry in llms.txt
    if (args.skill.published) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true });
    }
    return skillId;
  },
});

export const updateSkill = mutation({
  args: {
    id: v.id("skills"),
    skill: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      command: v.optional(v.string()),
      description: v.optional(v.string()),
      details: v.optional(v.string()),
      sectionId: v.optional(v.id("skillSections")),
      authorName: v.optional(v.string()),
      authorUrl: v.optional(v.string()),
      installCommands: v.optional(v.array(installCommandValidator)),
      repoUrl: v.optional(v.string()),
      skillsShUrl: v.optional(v.string()),
      docsUrl: v.optional(v.string()),
      xUrl: v.optional(v.string()),
      published: v.optional(v.boolean()),
      order: v.optional(v.number()),
      featured: v.optional(v.boolean()),
    }),
    clearFields: v.optional(v.array(clearableSkillField)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    if (args.skill.slug !== undefined) {
      await assertSkillSlugAvailable(ctx, args.skill.slug, args.id);
    }
    assertInstallCommands(args.skill.installCommands);
    const patch: Record<string, unknown> = { ...args.skill };
    for (const field of args.clearFields ?? []) {
      patch[field] = undefined;
    }
    await ctx.db.patch(args.id, patch);
    // The scheduled action re-reads published skills, so firing on every
    // edit stays correct and idempotent.
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true });
    return null;
  },
});

export const removeSkill = mutation({
  args: { id: v.id("skills") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await ctx.db.delete(args.id);
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true });
    return null;
  },
});
