import { describe, expect, it } from "vitest";
import { DEFAULT_AI_WRITTEN_NOTE, resolveAiWrittenNote } from "./aiWrittenNote";

describe("resolveAiWrittenNote", () => {
  it("uses the dashboard string when it has text", () => {
    expect(resolveAiWrittenNote("  Drafted with a model.  ")).toBe(
      "Drafted with a model.",
    );
  });

  it("falls back when the dashboard field is blank", () => {
    expect(resolveAiWrittenNote("   ")).toBe(DEFAULT_AI_WRITTEN_NOTE);
  });
});
