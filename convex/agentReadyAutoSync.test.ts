/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import componentSchema from "../node_modules/@waynesutton/agent-ready/src/component/schema";
import { api, components, internal } from "./_generated/api";
import { discoveryBody } from "./agentReady/autoSync";

const modules = import.meta.glob("./**/*.ts");
const componentModules = import.meta.glob(
  "../node_modules/@waynesutton/agent-ready/src/component/**/*.ts",
);

function setup() {
  const t = convexTest(schema, modules);
  t.registerComponent("agentReady", componentSchema, componentModules);
  return t;
}

test("discovery includes current full post and page bodies and archives hidden content", async () => {
  const t = setup();
  const postId = await t.run((ctx) =>
    ctx.db.insert("posts", {
      slug: "article",
      title: "Current title",
      description: "Current description",
      content: "The full article body.",
      date: "2026-09-05",
      published: true,
      tags: [],
      lastSyncedAt: 1,
    }),
  );
  await t.run((ctx) =>
    ctx.db.insert("pages", {
      slug: "about",
      title: "About",
      content: "The full about page.",
      published: true,
      lastSyncedAt: 1,
    }),
  );
  await t.mutation(internal.agentReady.autoSync.reconcilePaths, {
    paths: ["/article", "/about"],
  });
  const read = () =>
    t.run((ctx) =>
      ctx.runQuery(components.agentReady.content.listPages, {
        includeAllStatuses: true,
      }),
    );
  expect(await read()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "/article",
        fullContent: "The full article body.",
        status: "published",
      }),
      expect.objectContaining({
        path: "/about",
        fullContent: "The full about page.",
        status: "published",
      }),
    ]),
  );
  await t.run((ctx) => ctx.db.patch(postId, { unlisted: true }));
  // Legacy scheduled jobs retain their original argument shape, while their
  // stale metadata is ignored in favor of the current content visibility.
  await t.action(internal.agentReady.autoSync.syncDiscovery, {
    publish: [
      {
        path: "/article",
        title: "Old title",
        description: "Old description",
        section: "Posts",
      },
    ],
  });
  expect(await read()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: "/article", status: "archived" }),
    ]),
  );
  await t.run((ctx) => ctx.db.delete(postId));
  await t.mutation(internal.agentReady.autoSync.reconcilePaths, {
    paths: ["/article"],
  });
  expect((await read()).find((page) => page.path === "/article")?.status).toBe(
    "archived",
  );
});

test("long discovery bodies stay within component limits with a full-source link", () => {
  expect(discoveryBody("short", "article")).toBe("short");
  const body = discoveryBody("x".repeat(60_000), "article");
  expect(body).toHaveLength(50_000);
  expect(body).toContain("(/raw/article.md)");
});

test("page precedence and reused slugs match the public route during stale removals", async () => {
  const t = setup();
  const postId = await t.run((ctx) =>
    ctx.db.insert("posts", {
      slug: "shared",
      title: "Post",
      description: "Post description",
      content: "Post body",
      date: "2026-09-05",
      published: true,
      tags: [],
      lastSyncedAt: 1,
    }),
  );
  const pageId = await t.run((ctx) =>
    ctx.db.insert("pages", {
      slug: "shared",
      title: "Page",
      content: "Page body",
      published: true,
      lastSyncedAt: 1,
    }),
  );
  const read = () =>
    t.run((ctx) =>
      ctx.runQuery(components.agentReady.content.listPages, {
        includeAllStatuses: true,
      }),
    );
  await t.mutation(internal.agentReady.autoSync.reconcilePaths, {
    paths: ["/shared"],
  });
  expect(
    (await read()).find((entry) => entry.path === "/shared"),
  ).toMatchObject({ title: "Page", fullContent: "Page body" });
  await t.run((ctx) => ctx.db.patch(pageId, { unlisted: true }));
  await t.mutation(internal.agentReady.autoSync.reconcilePaths, {
    paths: ["/shared"],
  });
  expect((await read()).find((entry) => entry.path === "/shared")?.status).toBe(
    "archived",
  );
  await t.run((ctx) => ctx.db.delete(pageId));
  await t.run((ctx) => ctx.db.patch(postId, { slug: "renamed" }));
  await t.run((ctx) =>
    ctx.db.insert("pages", {
      slug: "shared",
      title: "Replacement",
      content: "Replacement body",
      published: true,
      lastSyncedAt: 1,
    }),
  );
  // A delayed rename removal must preserve the new page that now owns the URL.
  await t.mutation(internal.agentReady.autoSync.reconcilePaths, {
    paths: ["/shared", "/renamed"],
  });
  expect(await read()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "/shared",
        title: "Replacement",
        status: "published",
      }),
      expect.objectContaining({
        path: "/renamed",
        title: "Post",
        status: "published",
      }),
    ]),
  );
});

test("manual refresh backfills all current content with auto sync off and preserves custom entries", async () => {
  const t = setup();
  await t.run(async (ctx) => {
    await ctx.db.insert("dashboardAdmins", {
      subject: "test-admin",
      createdAt: 1,
    });
    // More than one batch verifies pagination rather than a silent first-page cap.
    for (let index = 0; index < 27; index++) {
      await ctx.db.insert("posts", {
        slug: `post-${index}`,
        title: `Post ${index}`,
        description: "Description",
        content: "Body",
        date: "2026-09-05",
        published: true,
        tags: [],
        lastSyncedAt: 1,
      });
    }
    await ctx.db.insert("projects", {
      slug: "project",
      title: "Project",
      description: "Shipped work",
      published: true,
    });
    const sectionId = await ctx.db.insert("skillSections", {
      slug: "my-skills",
      title: "My skills",
      published: true,
    });
    await ctx.db.insert("skills", {
      slug: "blog-post",
      title: "Blog post",
      command: "/blog-post",
      description: "Draft a post in my voice",
      sectionId,
      installCommands: [
        { label: "Skills CLI", command: "npx skills add waynesutton/skills --skill blog-post" },
      ],
      published: true,
    });
    await ctx.runMutation(components.agentReady.content.upsertPage, {
      path: "/deleted",
      title: "Deleted",
      description: "Stale",
      section: "Posts",
      status: "published",
    });
    await ctx.runMutation(components.agentReady.content.upsertPage, {
      path: "/custom",
      title: "Custom",
      description: "Keep me",
      section: "Resources",
      status: "published",
    });
  });
  await expect(
    t.action(api.agentReady.content.regenerateAll, {}),
  ).rejects.toThrow();
  await t
    .withIdentity({ subject: "test-admin" })
    .action(api.agentReady.content.regenerateAll, {});
  const pages = await t.run((ctx) =>
    ctx.runQuery(components.agentReady.content.listPages, {
      includeAllStatuses: true,
    }),
  );
  expect(
    pages.filter(
      (page) => page.path.startsWith("/post-") && page.status === "published",
    ),
  ).toHaveLength(27);
  expect(pages).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: "/deleted", status: "archived" }),
      expect.objectContaining({ path: "/custom", status: "published" }),
      expect.objectContaining({
        path: "/projects",
        status: "published",
        fullContent: expect.stringContaining("Shipped work"),
      }),
      expect.objectContaining({
        path: "/skills",
        section: "Skills",
        status: "published",
        fullContent: expect.stringContaining(
          "npx skills add waynesutton/skills --skill blog-post",
        ),
      }),
    ]),
  );
  const skillsEntry = pages.find((page) => page.path === "/skills");
  expect(skillsEntry?.fullContent).toContain("## My skills");
  expect(skillsEntry?.fullContent).toContain("Command: `/blog-post`");
});

test("skills discovery entry archives when the last published skill is gone", async () => {
  const t = setup();
  const skillId = await t.run((ctx) =>
    ctx.db.insert("skills", {
      slug: "only",
      title: "Only skill",
      description: "Soon to be unpublished",
      published: true,
    }),
  );
  const read = () =>
    t.run((ctx) =>
      ctx.runQuery(components.agentReady.content.listPages, {
        includeAllStatuses: true,
      }),
    );
  await t.mutation(internal.agentReady.autoSync.reconcileSkills, {});
  expect((await read()).find((page) => page.path === "/skills")?.status).toBe(
    "published",
  );
  await t.run((ctx) => ctx.db.patch(skillId, { published: false }));
  await t.mutation(internal.agentReady.autoSync.reconcileSkills, {});
  expect((await read()).find((page) => page.path === "/skills")?.status).toBe(
    "archived",
  );
});

test("photos discovery entry publishes with the gallery markdown and archives when empty", async () => {
  const t = setup();
  const photoId = await t.run((ctx) =>
    ctx.db.insert("photos", {
      slug: "pass",
      title: "The pass",
      description: "Above the clouds",
      tags: ["canmore"],
      provider: "r2",
      key: "photos/pass",
      url: "https://media.example.com/pass.jpg",
      size: 10,
      contentType: "image/jpeg",
      published: true,
      source: "dashboard",
      createdAt: 1,
      updatedAt: 1,
    }),
  );
  const read = () =>
    t.run((ctx) =>
      ctx.runQuery(components.agentReady.content.listPages, {
        includeAllStatuses: true,
      }),
    );
  await t.mutation(internal.agentReady.autoSync.reconcilePhotos, {});
  const entry = (await read()).find((page) => page.path === "/photos");
  expect(entry?.status).toBe("published");
  expect(entry?.section).toBe("Photos");
  expect(entry?.fullContent).toContain("### [The pass]");
  expect(entry?.fullContent).toContain("https://media.example.com/pass.jpg");
  expect(entry?.fullContent).toContain("Tags: canmore");
  await t.run((ctx) => ctx.db.patch(photoId, { published: false }));
  await t.mutation(internal.agentReady.autoSync.reconcilePhotos, {});
  expect((await read()).find((page) => page.path === "/photos")?.status).toBe(
    "archived",
  );
});

test("legacy discovery repair updates only known removed-feature phrases", async () => {
  const t = setup();
  await t.run(async (ctx) => {
    await ctx.runMutation(components.agentReady.content.upsertSettings, {
      patch: {
        agentInstructions:
          "My custom guidance. Read blog, pages, docs, and the 15-page compiled wiki. Preserve my knowledge base notes.",
      },
    });
    await ctx.runMutation(components.agentReady.content.upsertEndpoint, {
      method: "POST",
      path: "/vfs/exec",
      description: 'Custom prefix. {"command": "ls /wiki"}',
      group: "Tools",
      status: "draft",
    });
    await ctx.runMutation(components.agentReady.content.upsertEndpoint, {
      method: "GET",
      path: "/custom",
      description: "My wiki",
      status: "published",
    });
  });
  await t.mutation(internal.agentReady.content.repairLegacyDescriptions, {});
  await t.mutation(internal.agentReady.content.repairLegacyDescriptions, {});
  const settings = await t.run((ctx) =>
    ctx.runQuery(components.agentReady.content.getSettings, {}),
  );
  expect(settings?.agentInstructions).toBe(
    "My custom guidance. Read blog, pages, docs, and /projects.md for shipped work. Preserve my knowledge base notes.",
  );
  const endpoints = await t.run((ctx) =>
    ctx.runQuery(components.agentReady.content.listApiEndpoints, {
      includeAllStatuses: true,
    }),
  );
  expect(endpoints).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "/vfs/exec",
        description: 'Custom prefix. {"command": "ls /blog"}',
        group: "Tools",
        status: "draft",
      }),
      expect.objectContaining({
        path: "/custom",
        description: "My wiki",
        status: "published",
      }),
    ]),
  );
});
