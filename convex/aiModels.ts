import {
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import {
  AI_MODEL_SLOTS,
  type AiModelKind,
  aiModelKindValidator,
  findModelSlot,
  isValidModelId,
} from "./lib/aiModelSlots";

/**
 * Dashboard model overrides. Each slot pairs a vendor key with a model kind
 * (chat, image, tts). Admins can replace the hardcoded model id per slot and
 * every AI feature routed to that vendor picks it up on the next call.
 */

/** Indexed point read for a slot's override row, shared by every handler. */
async function findOverrideRow(
  ctx: QueryCtx,
  vendor: string,
  kind: AiModelKind,
): Promise<Doc<"aiModelOverrides"> | null> {
  return await ctx.db
    .query("aiModelOverrides")
    .withIndex("by_vendor_and_kind", (q) =>
      q.eq("vendor", vendor).eq("kind", kind),
    )
    .unique();
}

/** Every slot with its current override, for the Vendor keys grid. */
export const modelSlotStatus = query({
  args: {},
  returns: v.array(
    v.object({
      vendor: v.string(),
      kind: aiModelKindValidator,
      label: v.string(),
      defaults: v.array(v.string()),
      usedBy: v.string(),
      docsUrl: v.string(),
      override: v.union(v.string(), v.null()),
      updatedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    // Bounded by the slot catalog, so one row per slot at most.
    const rows = await ctx.db
      .query("aiModelOverrides")
      .take(AI_MODEL_SLOTS.length * 2);
    return AI_MODEL_SLOTS.map((slot) => {
      const row = rows.find(
        (r) => r.vendor === slot.vendor && r.kind === slot.kind,
      );
      return {
        ...slot,
        override: row?.model ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });
  },
});

/** Set or replace the model id for a slot. Idempotent when unchanged. */
export const setModelOverride = mutation({
  args: {
    vendor: v.string(),
    kind: aiModelKindValidator,
    model: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireDashboardAdmin(ctx);
    if (!findModelSlot(args.vendor, args.kind)) {
      throw new ConvexError("Unknown model slot");
    }
    const model = args.model.trim();
    if (!model) {
      throw new ConvexError(
        "Model id is required. Use reset to restore the default.",
      );
    }
    if (!isValidModelId(model)) {
      throw new ConvexError(
        "Model id must be a single token under 200 characters",
      );
    }
    const existing = await findOverrideRow(ctx, args.vendor, args.kind);
    if (existing) {
      if (existing.model === model) {
        return null;
      }
      await ctx.db.patch(existing._id, {
        model,
        updatedAt: Date.now(),
        updatedBySubject: identity.subject,
      });
      return null;
    }
    await ctx.db.insert("aiModelOverrides", {
      vendor: args.vendor,
      kind: args.kind,
      model,
      updatedAt: Date.now(),
      updatedBySubject: identity.subject,
    });
    return null;
  },
});

/** Remove an override so the hardcoded default applies again. Idempotent. */
export const removeModelOverride = mutation({
  args: { vendor: v.string(), kind: aiModelKindValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const existing = await findOverrideRow(ctx, args.vendor, args.kind);
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

/**
 * One round trip for actions: the vendor's API key override plus the model
 * override for a slot. The resolver layers env vars and fallbacks on top.
 */
export const providerConfig = internalQuery({
  args: { vendor: v.string(), kind: aiModelKindValidator },
  returns: v.object({
    keyOverride: v.union(v.string(), v.null()),
    modelOverride: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const [keyRow, modelRow] = await Promise.all([
      ctx.db
        .query("vendorKeys")
        .withIndex("by_name", (q) => q.eq("name", args.vendor))
        .unique(),
      findOverrideRow(ctx, args.vendor, args.kind),
    ]);
    const key = keyRow?.value.trim();
    const model = modelRow?.model.trim();
    return {
      keyOverride: key && key.length > 0 ? key : null,
      modelOverride: model && model.length > 0 ? model : null,
    };
  },
});
