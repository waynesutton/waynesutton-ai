/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import componentSchema from "../node_modules/@waynesutton/agent-ready/src/component/schema";
import { api, internal } from "./_generated/api";
import {
  buildPhotosMarkdown,
  collectTagCounts,
  normalizeTags,
  parseTagLine,
  slugFromTitleOrFilename,
  sortPhotos,
  uniqueSlug,
} from "./lib/photosDirectory";

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

const basePhoto = {
  provider: "r2" as const,
  key: "photos/abc",
  url: "https://media.example.com/photos/abc",
  size: 1024,
  contentType: "image/jpeg",
};

test("tags normalize to lowercase slugs, dedupe, and drop empties", () => {
  expect(normalizeTags([" Canmore ", "NATURE", "canmore", "", "Rocky Mountains"])).toEqual([
    "canmore",
    "nature",
    "rocky-mountains",
  ]);
});

test("parseTagLine pulls the tags line out of an email body", () => {
  const { tags, rest } = parseTagLine(
    "Morning ride up the pass.\nTags: canmore, Nature\nSent from my phone",
  );
  expect(tags).toEqual(["canmore", "nature"]);
  expect(rest).toBe("Morning ride up the pass.\nSent from my phone");
});

test("slug comes from the title, falls back to the filename, and collisions get a suffix", async () => {
  expect(slugFromTitleOrFilename("Morning Ride!", "IMG_4021.HEIC")).toBe("morning-ride");
  expect(slugFromTitleOrFilename(undefined, "IMG_4021.jpeg")).toBe("img-4021");
  expect(slugFromTitleOrFilename("", "...")).toBe("photo");
  const taken = new Set(["ride", "ride-2"]);
  expect(await uniqueSlug("ride", (c) => taken.has(c))).toBe("ride-3");
  expect(await uniqueSlug("fresh", (c) => taken.has(c))).toBe("fresh");
});

test("sortPhotos prefers the manual capture date and stays newest first", () => {
  const sorted = sortPhotos([
    { slug: "uploaded-today", createdAt: 300 },
    { slug: "shot-last-year", createdAt: 400, capturedAt: 100 },
    { slug: "shot-yesterday", createdAt: 200, capturedAt: 250 },
  ]);
  expect(sorted.map((p) => p.slug)).toEqual([
    "uploaded-today",
    "shot-yesterday",
    "shot-last-year",
  ]);
});

test("markdown lists count, tag totals, and one heading per photo with absolute links", () => {
  const photos = [
    {
      slug: "pass",
      title: "The pass",
      description: "Above the clouds.",
      tags: ["nature", "canmore"],
      url: "https://media.example.com/pass.jpg",
      width: 4000,
      height: 3000,
      createdAt: Date.UTC(2026, 8, 1),
    },
    {
      slug: "img_1",
      tags: ["nature"],
      url: "https://media.example.com/img_1.jpg",
      createdAt: Date.UTC(2026, 7, 1),
    },
  ];
  const md = buildPhotosMarkdown(photos, { siteUrl: "https://waynesutton.ai/" });
  expect(md).toContain("# Photos");
  expect(md).toContain("2 photos.");
  expect(md).toContain("Tags: nature (2), canmore (1)");
  expect(md).toContain("### [The pass](https://waynesutton.ai/photos/pass)");
  expect(md).toContain("![The pass](https://media.example.com/pass.jpg)");
  expect(md).toContain("Date: 2026-09-01 · Tags: nature, canmore · Size: 4000x3000");
  expect(md).toContain("### [img_1](https://waynesutton.ai/photos/img_1)");
  expect(md.indexOf("The pass")).toBeLessThan(md.indexOf("img_1"));
  expect(collectTagCounts(photos)).toEqual([
    { tag: "nature", count: 2 },
    { tag: "canmore", count: 1 },
  ]);
});

test("admin gate: create, update, and remove refuse anonymous callers", async () => {
  const t = setup();
  await expect(
    t.mutation(api.photos.create, { ...basePhoto, filename: "a.jpg" }),
  ).rejects.toThrow();
  const admin = await seedAdmin(t);
  const created = await admin.mutation(api.photos.create, {
    ...basePhoto,
    filename: "IMG_1.jpg",
    title: "Ride",
    tags: ["Canmore"],
    published: true,
  });
  expect(created.slug).toBe("ride");
  const again = await admin.mutation(api.photos.create, {
    ...basePhoto,
    filename: "IMG_2.jpg",
    title: "Ride",
  });
  expect(again.slug).toBe("ride-2");
  await expect(
    t.mutation(api.photos.update, { id: created.id, photo: { title: "Nope" } }),
  ).rejects.toThrow();
  await expect(t.mutation(api.photos.remove, { id: created.id })).rejects.toThrow();
});

test("public queries only expose published photos and filter markdown the same way", async () => {
  const t = setup();
  const admin = await seedAdmin(t);
  await admin.mutation(api.photos.create, {
    ...basePhoto,
    filename: "a.jpg",
    title: "Public",
    tags: ["nature"],
    published: true,
  });
  await admin.mutation(api.photos.create, {
    ...basePhoto,
    filename: "b.jpg",
    title: "Hidden",
    tags: ["nature"],
  });
  const published = await t.query(api.photos.listPublished, {});
  expect(published.map((p) => p.slug)).toEqual(["public"]);
  expect(await t.query(api.photos.getBySlug, { slug: "hidden" })).toBeNull();
  expect((await t.query(api.photos.getBySlug, { slug: "public" }))?.title).toBe("Public");
  const md = await t.query(api.photos.getMarkdown, { siteUrl: "https://example.com" });
  expect(md).toContain("1 photo.");
  expect(md).not.toContain("Hidden");
  const all = await admin.query(api.photos.listAll, {});
  expect(all).toHaveLength(2);
});

test("bulk publish flips many rows and the discovery entry follows", async () => {
  const t = setup();
  const admin = await seedAdmin(t);
  const a = await admin.mutation(api.photos.create, { ...basePhoto, filename: "a.jpg" });
  const b = await admin.mutation(api.photos.create, { ...basePhoto, filename: "b.jpg" });
  expect(await t.query(api.photos.listPublished, {})).toHaveLength(0);
  await admin.mutation(api.photos.setPublishedMany, { ids: [a.id, b.id], published: true });
  expect(await t.query(api.photos.listPublished, {})).toHaveLength(2);
  await admin.mutation(api.photos.removeMany, { ids: [a.id] });
  expect(await t.query(api.photos.listPublished, {})).toHaveLength(1);
});

test("email inserts are idempotent per attachment and honor the auto publish switch", async () => {
  const t = setup();
  const emailArgs = {
    ...basePhoto,
    filename: "IMG_9.jpeg",
    title: "From the road",
    description: "Sent from the trail.",
    tags: ["Canmore", "nature"],
    sourceMessageId: "msg_1#0",
  };
  const first = await t.mutation(internal.photos.insertFromEmail, emailArgs);
  expect(first.duplicate).toBe(false);
  expect(first.published).toBe(true);
  expect(first.slug).toBe("from-the-road");
  const retry = await t.mutation(internal.photos.insertFromEmail, emailArgs);
  expect(retry.duplicate).toBe(true);
  expect(retry.id).toBe(first.id);
  expect(await t.query(api.photos.listPublished, {})).toHaveLength(1);
  const probe = await t.query(internal.photos.findBySourceMessageId, {
    sourceMessageId: "msg_1#0",
  });
  expect(probe?.slug).toBe("from-the-road");

  const admin = await seedAdmin(t);
  await admin.mutation(api.photos.setEmailAutoPublish, { autoPublishEmail: false });
  const held = await t.mutation(internal.photos.insertFromEmail, {
    ...emailArgs,
    sourceMessageId: "msg_1#1",
    title: undefined,
  });
  expect(held.published).toBe(false);
  expect(held.slug).toBe("img-9");
  const settings = await admin.query(api.photos.getEmailSettings, {});
  expect(settings.autoPublishEmail).toBe(false);
  const all = await admin.query(api.photos.listAll, {});
  expect(all.filter((p) => p.source === "email")).toHaveLength(2);
});
