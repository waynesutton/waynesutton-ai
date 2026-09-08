import { describe, expect, it } from "vitest";
import { resolveSharePost } from "./sharePost";

describe("resolveSharePost", () => {
  it("keeps every channel on by default", () => {
    const resolved = resolveSharePost(undefined);
    expect(resolved.enabled).toBe(true);
    expect(resolved.title).toBe("Share this post");
    expect(resolved.copyLink).toBe(true);
    expect(resolved.x).toBe(true);
    expect(resolved.linkedin).toBe(true);
    expect(resolved.rss).toBe(true);
  });

  it("turns channels off and restores a blank heading", () => {
    const resolved = resolveSharePost({
      enabled: true,
      title: "  ",
      copyLink: false,
      x: true,
      linkedin: false,
      rss: false,
    });
    expect(resolved.title).toBe("Share this post");
    expect(resolved.copyLink).toBe(false);
    expect(resolved.x).toBe(true);
    expect(resolved.linkedin).toBe(false);
    expect(resolved.rss).toBe(false);
  });
});
