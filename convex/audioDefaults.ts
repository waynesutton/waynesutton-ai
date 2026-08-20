import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import { isAudioVoice, type AudioVoice } from "./lib/audioText";

const OVERRIDES_KEY = "runtimeOverrides";
const INBOX_SETTINGS_KEY = "inbox";

export const audioVoiceValidator = v.union(v.literal("male"), v.literal("female"));

export const DEFAULT_AUDIO_ENABLED = true;
export const DEFAULT_AUDIO_VOICE: AudioVoice = "female";

type AudioDefaults = {
  enabledDefault: boolean;
  defaultVoice: AudioVoice;
};

type SiteConfigRow = {
  audio?: {
    enabledDefault?: boolean;
    defaultVoice?: AudioVoice;
  };
};

function defaultsFromUnknown(value: unknown): Partial<AudioDefaults> {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const audio = record.audio;
  if (typeof audio !== "object" || audio === null) {
    return {};
  }
  const audioRecord = audio as Record<string, unknown>;
  const next: Partial<AudioDefaults> = {};
  if (typeof audioRecord.enabledDefault === "boolean") {
    next.enabledDefault = audioRecord.enabledDefault;
  }
  if (isAudioVoice(audioRecord.defaultVoice)) {
    next.defaultVoice = audioRecord.defaultVoice;
  }
  return next;
}

export async function readAudioDefaults(
  ctx: QueryCtx | MutationCtx,
): Promise<AudioDefaults> {
  const overrideRow = await ctx.db
    .query("siteConfig")
    .withIndex("by_key", (q) => q.eq("key", OVERRIDES_KEY))
    .unique();
  const fromSite = defaultsFromUnknown(overrideRow?.value);

  const inbox = await ctx.db
    .query("draftSettings")
    .withIndex("by_key", (q) => q.eq("key", INBOX_SETTINGS_KEY))
    .unique();

  return {
    enabledDefault:
      fromSite.enabledDefault ??
      inbox?.audioEnabledDefault ??
      DEFAULT_AUDIO_ENABLED,
    defaultVoice:
      fromSite.defaultVoice ?? inbox?.audioDefaultVoice ?? DEFAULT_AUDIO_VOICE,
  };
}

export async function writeAudioDefaults(
  ctx: MutationCtx,
  next: AudioDefaults,
): Promise<void> {
  const now = Date.now();

  const existingOverrides = await ctx.db
    .query("siteConfig")
    .withIndex("by_key", (q) => q.eq("key", OVERRIDES_KEY))
    .unique();

  if (existingOverrides) {
    const current = (existingOverrides.value ?? {}) as SiteConfigRow &
      Record<string, unknown>;
    const currentAudio =
      typeof current.audio === "object" && current.audio !== null
        ? current.audio
        : {};
    const alreadyMatches =
      currentAudio.enabledDefault === next.enabledDefault &&
      currentAudio.defaultVoice === next.defaultVoice;
    if (!alreadyMatches) {
      await ctx.db.patch(existingOverrides._id, {
        value: {
          ...current,
          audio: {
            ...currentAudio,
            enabledDefault: next.enabledDefault,
            defaultVoice: next.defaultVoice,
          },
        },
      });
    }
  } else {
    await ctx.db.insert("siteConfig", {
      key: OVERRIDES_KEY,
      value: {
        audio: {
          enabledDefault: next.enabledDefault,
          defaultVoice: next.defaultVoice,
        },
      },
    });
  }

  const existingInbox = await ctx.db
    .query("draftSettings")
    .withIndex("by_key", (q) => q.eq("key", INBOX_SETTINGS_KEY))
    .unique();

  if (existingInbox) {
    if (
      existingInbox.audioEnabledDefault === next.enabledDefault &&
      existingInbox.audioDefaultVoice === next.defaultVoice
    ) {
      return;
    }
    await ctx.db.patch(existingInbox._id, {
      audioEnabledDefault: next.enabledDefault,
      audioDefaultVoice: next.defaultVoice,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("draftSettings", {
    key: INBOX_SETTINGS_KEY,
    aiWrittenDefault: false,
    audioEnabledDefault: next.enabledDefault,
    audioDefaultVoice: next.defaultVoice,
    updatedAt: now,
  });
}

/** Inbox and Config both read this. Site settings win over the inbox mirror. */
export const getAudioDefaults = query({
  args: {},
  returns: v.object({
    enabledDefault: v.boolean(),
    defaultVoice: audioVoiceValidator,
  }),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return await readAudioDefaults(ctx);
  },
});

/**
 * Inbox writes. Updates siteConfig.audio and the draftSettings mirror
 * in one transaction so the inbox is never a second source of truth.
 */
export const setAudioDefaults = mutation({
  args: {
    enabledDefault: v.optional(v.boolean()),
    defaultVoice: v.optional(audioVoiceValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const current = await readAudioDefaults(ctx);
    const next: AudioDefaults = {
      enabledDefault: args.enabledDefault ?? current.enabledDefault,
      defaultVoice: args.defaultVoice ?? current.defaultVoice,
    };
    if (
      next.enabledDefault === current.enabledDefault &&
      next.defaultVoice === current.defaultVoice
    ) {
      return null;
    }
    await writeAudioDefaults(ctx, next);
    return null;
  },
});
