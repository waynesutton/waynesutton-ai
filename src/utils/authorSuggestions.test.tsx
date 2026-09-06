import { describe, expect, it } from "vitest";
import { collectAuthorSuggestions, filterAuthorSuggestions } from "./authorSuggestions";

describe("author history", () => {
  it("merges case variants and blank credits without losing an available avatar", () => {
    expect(collectAuthorSuggestions([
      { authorName: " Wayne " },
      { authorName: "wayne", authorImage: " /wayne.png " },
      { authorName: "" },
      { authorName: "Ana", authorImage: "/ana.png" },
    ])).toEqual([{ name: "Ana", image: "/ana.png" }, { name: "Wayne", image: "/wayne.png" }]);
  });
  it("supports optional @, partial matching, empty history, and bounded results", () => {
    const authors = [{ name: "Wayne Sutton" }, { name: "Ana Smith" }];
    expect(filterAuthorSuggestions(authors, "@sUtT")).toEqual([authors[0]]);
    expect(filterAuthorSuggestions(authors, "@")).toEqual(authors);
    expect(filterAuthorSuggestions([], "New Author")).toEqual([]);
    expect(filterAuthorSuggestions(Array.from({ length: 20 }, (_, i) => ({ name: `Author ${i}` })), "")).toHaveLength(8);
  });
});
