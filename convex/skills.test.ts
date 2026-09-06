/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import componentSchema from "../node_modules/@waynesutton/agent-ready/src/component/schema";
import { api } from "./_generated/api";
import { buildSkillsMarkdown, groupSkills } from "./lib/skillsDirectory";

const modules = import.meta.glob("./**/*.ts");
const componentModules = import.meta.glob(
  "../node_modules/@waynesutton/agent-ready/src/component/**/*.ts",
);

function setup() {
  const t = convexTest(schema, modules);
  t.registerComponent("agentReady", componentSchema, componentModules);
  return t;
}

async function seedAdmin(t: ReturnType<typeof setup>) {
  await t.run((ctx) =>
    ctx.db.insert("dashboardAdmins", { subject: "test-admin", createdAt: 1 }),
  );
  return t.withIdentity({ subject: "test-admin" });
}

test("directory groups published skills by section order and pins featured first", async () => {
  const t = setup();
  await t.run(async (ctx) => {
    const recommended = await ctx.db.insert("skillSections", {
      slug: "recommended",
      title: "Skills I recommend",
      order: 2,
      published: true,
    });
    const mine = await ctx.db.insert("skillSections", {
      slug: "mine",
      title: "My skills",
      order: 1,
      published: true,
    });
    const draftSection = await ctx.db.insert("skillSections", {
      slug: "draft",
      title: "Draft section",
      published: false,
    });
    await ctx.db.insert("skills", {
      slug: "zeta",
      title: "Zeta",
      description: "Ordered second",
      sectionId: mine,
      order: 2,
      published: true,
    });
    await ctx.db.insert("skills", {
      slug: "alpha",
      title: "Alpha",
      description: "Ordered first",
      sectionId: mine,
      order: 1,
      published: true,
    });
    await ctx.db.insert("skills", {
      slug: "pinned",
      title: "Pinned",
      description: "Featured beats order",
      sectionId: mine,
      order: 9,
      featured: true,
      published: true,
    });
    await ctx.db.insert("skills", {
      slug: "theirs",
      title: "Theirs",
      description: "In the recommended section",
      sectionId: recommended,
      published: true,
    });
    await ctx.db.insert("skills", {
      slug: "orphan",
      title: "Orphan",
      description: "Section is a draft, so this falls to the default group",
      sectionId: draftSection,
      published: true,
    });
    await ctx.db.insert("skills", {
      slug: "hidden",
      title: "Hidden",
      description: "Unpublished skills never appear",
      published: false,
    });
  });

  const directory = await t.query(api.skills.listDirectory, {});
  expect(directory.sections.map((section) => section.slug)).toEqual([
    "mine",
    "recommended",
  ]);
  expect(directory.skills.map((skill) => skill.slug)).not.toContain("hidden");

  const groups = groupSkills(directory.sections, directory.skills);
  expect(groups.map((group) => group.section?.title ?? null)).toEqual([
    "My skills",
    "Skills I recommend",
    null,
  ]);
  expect(groups[0].skills.map((skill) => skill.slug)).toEqual([
    "pinned",
    "alpha",
    "zeta",
  ]);
  expect(groups[2].skills.map((skill) => skill.slug)).toEqual(["orphan"]);

  const markdown = await t.query(api.skills.getMarkdown, {});
  expect(markdown).toContain("## My skills");
  expect(markdown).toContain("## Skills I recommend");
  expect(markdown).toContain("## Skills");
  expect(markdown).not.toContain("Hidden");
  expect(markdown).toBe(buildSkillsMarkdown(directory.sections, directory.skills));
});

test("markdown renders commands, install blocks, author, and only filled links", () => {
  const markdown = buildSkillsMarkdown(
    [
      {
        _id: "s1",
        title: "My skills",
        description: "Skills I wrote",
        installCommand: "npx skills add waynesutton/skills",
      },
    ],
    [
      {
        title: "Blog post",
        command: "/blog-post",
        description: "Draft a post",
        sectionId: "s1",
        authorName: "Wayne",
        authorUrl: "https://waynesutton.ai",
        installCommands: [
          { label: "Skills CLI", command: "npx skills add waynesutton/skills --skill blog-post" },
          { label: "Git", command: "git clone https://github.com/waynesutton/skills" },
        ],
        repoUrl: "https://github.com/waynesutton/skills",
        xUrl: "https://x.com/waynesutton/status/1",
      },
    ],
  );
  expect(markdown).toContain("### [Blog post](https://github.com/waynesutton/skills)");
  expect(markdown).toContain("Command: `/blog-post`");
  expect(markdown).toContain("By [Wayne](https://waynesutton.ai)");
  expect(markdown).toContain("Install the collection:");
  expect(markdown).toContain("Skills CLI:\n\n```bash\nnpx skills add waynesutton/skills --skill blog-post\n```");
  expect(markdown).toContain("Git:\n\n```bash\ngit clone");
  expect(markdown).toContain("[Repo](https://github.com/waynesutton/skills) · [X](https://x.com/waynesutton/status/1)");
  expect(markdown).not.toContain("[Docs]");
  expect(markdown).not.toContain("[skills.sh]");
});

test("writes require a dashboard admin", async () => {
  const t = setup();
  await expect(
    t.mutation(api.skills.createSkill, {
      skill: { slug: "nope", title: "Nope", description: "Anonymous", published: true },
    }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.skills.createSection, {
      section: { slug: "nope", title: "Nope", published: true },
    }),
  ).rejects.toThrow();
  await expect(t.query(api.skills.listAllSkills, {})).rejects.toThrow();
});

test("slug conflicts are rejected for skills and sections", async () => {
  const t = setup();
  const admin = await seedAdmin(t);
  const firstId = await admin.mutation(api.skills.createSkill, {
    skill: { slug: "dup", title: "First", description: "One", published: true },
  });
  await expect(
    admin.mutation(api.skills.createSkill, {
      skill: { slug: "dup", title: "Second", description: "Two", published: true },
    }),
  ).rejects.toThrow(/already exists/);
  // Renaming a skill to its own slug is fine; renaming onto another is not.
  await admin.mutation(api.skills.updateSkill, { id: firstId, skill: { slug: "dup" } });
  const otherId = await admin.mutation(api.skills.createSkill, {
    skill: { slug: "other", title: "Other", description: "Three", published: true },
  });
  await expect(
    admin.mutation(api.skills.updateSkill, { id: otherId, skill: { slug: "dup" } }),
  ).rejects.toThrow(/already exists/);

  await admin.mutation(api.skills.createSection, {
    section: { slug: "mine", title: "Mine", published: true },
  });
  await expect(
    admin.mutation(api.skills.createSection, {
      section: { slug: "mine", title: "Again", published: true },
    }),
  ).rejects.toThrow(/already exists/);
});

test("install commands are capped at four and must be complete", async () => {
  const t = setup();
  const admin = await seedAdmin(t);
  await expect(
    admin.mutation(api.skills.createSkill, {
      skill: {
        slug: "many",
        title: "Many",
        description: "Too many",
        published: true,
        installCommands: Array.from({ length: 5 }, (_, i) => ({
          label: `L${i}`,
          command: `cmd ${i}`,
        })),
      },
    }),
  ).rejects.toThrow(/at most 4/);
  await expect(
    admin.mutation(api.skills.createSkill, {
      skill: {
        slug: "blank",
        title: "Blank",
        description: "Half filled",
        published: true,
        installCommands: [{ label: "Skills CLI", command: "   " }],
      },
    }),
  ).rejects.toThrow(/label and a command/);
});

test("deleting a section unassigns its skills instead of deleting them", async () => {
  const t = setup();
  const admin = await seedAdmin(t);
  const sectionId = await admin.mutation(api.skills.createSection, {
    section: { slug: "mine", title: "Mine", published: true },
  });
  const skillId = await admin.mutation(api.skills.createSkill, {
    skill: {
      slug: "kept",
      title: "Kept",
      description: "Survives the section",
      sectionId,
      published: true,
    },
  });
  await admin.mutation(api.skills.removeSection, { id: sectionId });
  const skill = await t.run((ctx) => ctx.db.get(skillId));
  expect(skill).not.toBeNull();
  expect(skill?.sectionId).toBeUndefined();
  const directory = await t.query(api.skills.listDirectory, {});
  expect(directory.sections).toHaveLength(0);
  expect(groupSkills(directory.sections, directory.skills)).toEqual([
    { section: null, skills: [expect.objectContaining({ slug: "kept" })] },
  ]);
});

test("clearFields removes optional values the form emptied", async () => {
  const t = setup();
  const admin = await seedAdmin(t);
  const skillId = await admin.mutation(api.skills.createSkill, {
    skill: {
      slug: "clear",
      title: "Clear",
      description: "Has extras",
      command: "/clear",
      repoUrl: "https://github.com/example/repo",
      order: 3,
      featured: true,
      installCommands: [{ label: "Git", command: "git clone x" }],
      published: true,
    },
  });
  await admin.mutation(api.skills.updateSkill, {
    id: skillId,
    skill: { title: "Cleared" },
    clearFields: ["command", "repoUrl", "order", "featured", "installCommands"],
  });
  const skill = await t.run((ctx) => ctx.db.get(skillId));
  expect(skill).toMatchObject({ title: "Cleared", description: "Has extras" });
  expect(skill?.command).toBeUndefined();
  expect(skill?.repoUrl).toBeUndefined();
  expect(skill?.order).toBeUndefined();
  expect(skill?.featured).toBeUndefined();
  expect(skill?.installCommands).toBeUndefined();
});
