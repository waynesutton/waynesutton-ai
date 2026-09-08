import { describe, expect, it } from "vitest";
import { resolveClosingNoteContent } from "./closingNote";

describe("resolveClosingNoteContent", () => {
  it("prefers frontmatter, then dashboard, then footer.md", () => {
    expect(
      resolveClosingNoteContent({
        frontmatter: "From the post",
        dashboard: "From Site Config",
        synced: "From footer.md",
      }),
    ).toBe("From the post");
    expect(
      resolveClosingNoteContent({
        frontmatter: "  ",
        dashboard: "From Site Config",
        synced: "From footer.md",
      }),
    ).toBe("From Site Config");
    expect(
      resolveClosingNoteContent({
        dashboard: "",
        synced: "From footer.md",
      }),
    ).toBe("From footer.md");
  });

  it("returns undefined when every source is empty", () => {
    expect(resolveClosingNoteContent({})).toBeUndefined();
  });
});
