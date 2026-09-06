/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");

test("homepage, projects and read-more saves preserve independently owned config", async () => {
  const t = convexTest(schema, modules);
  await t.run((ctx) =>
    ctx.db.insert("dashboardAdmins", { subject: "test-admin", createdAt: 1 }),
  );
  const admin = t.withIdentity({ subject: "test-admin" });
  const highlights = {
    projectsEnabled: true,
    projectSlugs: ["one", "two"],
    projectsPosition: "below-posts",
    postEnabled: true,
    postSlug: "hello",
    postPosition: "above-posts",
    postThumbnail: false,
  };
  await admin.mutation(api.siteConfigData.savePartialOverrides, {
    overrides: { homepageHighlights: highlights },
  });
  const projectsPage = {
    enabled: true,
    showInNav: false,
    title: 'Projects "and" work',
    description: "First\nSecond",
    viewMode: "two-column",
    showViewToggle: false,
    order: 4,
  };
  const postsDisplay = {
    homePostsReadMore: { enabled: false, text: "More articles", link: "/blog" },
  };
  await admin.mutation(api.siteConfigData.savePartialOverrides, {
    overrides: { projectsPage, postsDisplay },
  });
  expect(await t.query(api.siteConfigData.getOverrides, {})).toEqual({
    homepageHighlights: highlights,
    projectsPage,
    postsDisplay,
  });
  await expect(
    t.mutation(api.siteConfigData.savePartialOverrides, {
      overrides: { projectsPage: { enabled: false } },
    }),
  ).rejects.toThrow();
});
