import { v } from "convex/values";

/**
 * Catalog of model ids the dashboard can override, grouped by the vendor key
 * that unlocks them. Registration-free so "use node" actions can import it.
 *
 * `defaults` is display only: it names the hardcoded ids a slot replaces.
 * Actions pass their own fallback to resolveAiProvider, so adding a slot here
 * never changes behavior until an override row exists.
 */

export type AiModelKind = "chat" | "image" | "tts";

export const aiModelKindValidator = v.union(
  v.literal("chat"),
  v.literal("image"),
  v.literal("tts"),
);

export type AiModelSlot = {
  vendor: string;
  kind: AiModelKind;
  label: string;
  defaults: Array<string>;
  usedBy: string;
  docsUrl: string;
};

/** Provider model list docs, shown on a configured vendor key row. */
export const AI_VENDOR_DOCS: Record<string, string> = {
  OPENAI_API_KEY: "https://platform.openai.com/docs/models",
  ANTHROPIC_API_KEY:
    "https://platform.claude.com/docs/en/about-claude/models/overview",
  GOOGLE_AI_API_KEY: "https://ai.google.dev/gemini-api/docs/models",
  CONCENTRATE_API_KEY:
    "https://concentrate.ai/docs/api-reference/endpoint/supported-models",
  OPENROUTER_API_KEY: "https://openrouter.ai/models",
  RUNWARE_API_KEY: "https://my.runware.ai/models/all",
};

export const AI_MODEL_SLOTS: Array<AiModelSlot> = [
  {
    vendor: "ANTHROPIC_API_KEY",
    kind: "chat",
    label: "Chat model",
    defaults: ["claude-sonnet-4-20250514"],
    usedBy: "AI chat, Ask AI",
    docsUrl: AI_VENDOR_DOCS.ANTHROPIC_API_KEY,
  },
  {
    vendor: "OPENAI_API_KEY",
    kind: "chat",
    label: "Chat model",
    defaults: ["gpt-4.1-mini"],
    usedBy: "AI chat, Ask AI, voice agent rewrite",
    docsUrl: AI_VENDOR_DOCS.OPENAI_API_KEY,
  },
  {
    vendor: "OPENAI_API_KEY",
    kind: "tts",
    label: "Speech model",
    defaults: ["gpt-4o-mini-tts"],
    usedBy: "Listen to this post audio",
    docsUrl: "https://platform.openai.com/docs/guides/text-to-speech",
  },
  {
    vendor: "GOOGLE_AI_API_KEY",
    kind: "chat",
    label: "Chat model",
    defaults: ["gemini-2.0-flash"],
    usedBy: "AI chat",
    docsUrl: AI_VENDOR_DOCS.GOOGLE_AI_API_KEY,
  },
  {
    vendor: "GOOGLE_AI_API_KEY",
    kind: "image",
    label: "Image model",
    defaults: [
      "gemini-2.0-flash-exp-image-generation",
      "imagen-3.0-generate-002",
    ],
    usedBy: "AI image generation (replaces both Google picks)",
    docsUrl: "https://ai.google.dev/gemini-api/docs/image-generation",
  },
  {
    vendor: "CONCENTRATE_API_KEY",
    kind: "chat",
    label: "Chat model",
    defaults: ["auto"],
    usedBy: "AI chat",
    docsUrl: AI_VENDOR_DOCS.CONCENTRATE_API_KEY,
  },
  {
    vendor: "OPENROUTER_API_KEY",
    kind: "chat",
    label: "Chat model",
    defaults: ["openrouter/auto"],
    usedBy: "AI chat",
    docsUrl: AI_VENDOR_DOCS.OPENROUTER_API_KEY,
  },
  {
    vendor: "RUNWARE_API_KEY",
    kind: "image",
    label: "Image model",
    defaults: ["runware:101@1"],
    usedBy: "AI image generation",
    docsUrl: AI_VENDOR_DOCS.RUNWARE_API_KEY,
  },
];

export function findModelSlot(
  vendor: string,
  kind: AiModelKind,
): AiModelSlot | undefined {
  return AI_MODEL_SLOTS.find(
    (slot) => slot.vendor === vendor && slot.kind === kind,
  );
}

/** Model ids are single tokens: no whitespace, bounded length. */
export function isValidModelId(value: string): boolean {
  return value.length > 0 && value.length <= 200 && !/\s/.test(value);
}
