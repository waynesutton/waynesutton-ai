import siteConfig from "../config/siteConfig";

export const DEFAULT_AI_WRITTEN_NOTE =
  "This post was written with AI and proofed by a human.";

export function resolveAiWrittenNote(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  const fromFile = siteConfig.aiWrittenNote?.trim();
  return fromFile || DEFAULT_AI_WRITTEN_NOTE;
}
