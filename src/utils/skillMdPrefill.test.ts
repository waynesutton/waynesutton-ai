import { describe, expect, test } from "vitest";
import {
  buildSkillPrefill,
  parseSkillFrontmatter,
  resolveSkillMdSource,
  slugifySkillName,
} from "./skillMdPrefill";

describe("resolveSkillMdSource", () => {
  test("converts a GitHub blob URL to raw and links the skill folder", () => {
    const source = resolveSkillMdSource(
      "https://github.com/waynesutton/skills/blob/main/blog-post/SKILL.md",
    );
    expect(source).toEqual({
      rawUrl:
        "https://raw.githubusercontent.com/waynesutton/skills/main/blog-post/SKILL.md",
      repoUrl: "https://github.com/waynesutton/skills/tree/main/blog-post",
      repoSlug: "waynesutton/skills",
      folderName: "blog-post",
    });
  });

  test("accepts a tree URL to the skill folder and appends SKILL.md", () => {
    const source = resolveSkillMdSource(
      "https://github.com/waynesutton/skills/tree/main/blog-post/",
    );
    expect(source?.rawUrl).toBe(
      "https://raw.githubusercontent.com/waynesutton/skills/main/blog-post/SKILL.md",
    );
    expect(source?.folderName).toBe("blog-post");
  });

  test("bare repo URL points at the root SKILL.md on HEAD", () => {
    const source = resolveSkillMdSource("https://github.com/owner/single-skill");
    expect(source).toEqual({
      rawUrl: "https://raw.githubusercontent.com/owner/single-skill/HEAD/SKILL.md",
      repoUrl: "https://github.com/owner/single-skill",
      repoSlug: "owner/single-skill",
      folderName: null,
    });
  });

  test("passes raw URLs through and rebuilds the repo link", () => {
    const source = resolveSkillMdSource(
      "https://raw.githubusercontent.com/owner/repo/refs/heads/main/skills/x/SKILL.md",
    );
    expect(source?.rawUrl).toBe(
      "https://raw.githubusercontent.com/owner/repo/main/skills/x/SKILL.md",
    );
    expect(source?.repoUrl).toBe("https://github.com/owner/repo/tree/main/skills/x");
    expect(source?.folderName).toBe("x");
  });

  test("rejects non GitHub hosts and junk", () => {
    expect(resolveSkillMdSource("https://example.com/SKILL.md")).toBeNull();
    expect(resolveSkillMdSource("not a url")).toBeNull();
    expect(resolveSkillMdSource("https://github.com/owner")).toBeNull();
  });
});

describe("parseSkillFrontmatter", () => {
  test("reads plain and quoted values", () => {
    const fm = parseSkillFrontmatter(
      `---\nname: blog-post\ndescription: "Draft a post: in my voice"\n---\n# Body\n`,
    );
    expect(fm).toEqual({ name: "blog-post", description: "Draft a post: in my voice" });
  });

  test("folds multi line quoted and block scalar descriptions", () => {
    const quoted = parseSkillFrontmatter(
      `---\nname: x\ndescription: "First line\n  second line"\n---\n`,
    );
    expect(quoted.description).toBe("First line second line");

    const folded = parseSkillFrontmatter(
      `---\nname: y\ndescription: >\n  Use when the user asks\n  for a blog post.\nlicense: MIT\n---\n`,
    );
    expect(folded.description).toBe("Use when the user asks for a blog post.");
    expect(folded.license).toBe("MIT");
  });

  test("skips nested mappings and tolerates CRLF and BOM", () => {
    const fm = parseSkillFrontmatter(
      `\uFEFF---\r\nname: z\r\nmetadata:\r\n  author: someone\r\n  version: 1\r\ndescription: Works\r\n---\r\n`,
    );
    expect(fm.name).toBe("z");
    expect(fm.description).toBe("Works");
    expect(fm.metadata).toBe("");
    expect(fm.author).toBeUndefined();
  });

  test("returns an empty object without frontmatter", () => {
    expect(parseSkillFrontmatter("# Just a heading\n")).toEqual({});
  });
});

describe("buildSkillPrefill", () => {
  const source = {
    rawUrl: "https://raw.githubusercontent.com/waynesutton/skills/main/blog-post/SKILL.md",
    repoUrl: "https://github.com/waynesutton/skills/tree/main/blog-post",
    repoSlug: "waynesutton/skills",
    folderName: "blog-post",
  };

  test("fills title, slug, command, description, repo, and an install command", () => {
    const prefill = buildSkillPrefill(
      source,
      `---\nname: blog-post\ndescription: Draft a post in my voice\n---\n# Blog post skill\n`,
    );
    expect(prefill).toEqual({
      title: "Blog post",
      slug: "blog-post",
      command: "/blog-post",
      description: "Draft a post in my voice",
      repoUrl: "https://github.com/waynesutton/skills/tree/main/blog-post",
      installCommands: [
        {
          label: "Skills CLI",
          command: "npx skills add waynesutton/skills --skill blog-post",
        },
      ],
    });
  });

  test("falls back to the folder name and first heading when frontmatter is missing", () => {
    const prefill = buildSkillPrefill(source, "# Write like Wayne\n\nSome body.\n");
    expect(prefill.slug).toBe("blog-post");
    expect(prefill.command).toBe("/blog-post");
    expect(prefill.title).toBe("Write like Wayne");
    expect(prefill.description).toBe("");
  });
});

test("slugifySkillName normalizes titles", () => {
  expect(slugifySkillName("  Blog Post!  ")).toBe("blog-post");
  expect(slugifySkillName("convex--doctor")).toBe("convex-doctor");
});
