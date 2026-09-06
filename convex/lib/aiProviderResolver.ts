import { internal } from "../_generated/api";
import type { AiModelKind } from "./aiModelSlots";
import { envVendorKey } from "./vendorKeyResolver";

type ProviderCtx = {
  runQuery: (
    ref: typeof internal.aiModels.providerConfig,
    args: { vendor: string; kind: AiModelKind },
  ) => Promise<{ keyOverride: string | null; modelOverride: string | null }>;
};

export type ResolvedProvider = {
  apiKey: string | null;
  model: string;
  /** True when the dashboard replaced the hardcoded model id. */
  overridden: boolean;
};

/**
 * Resolve the API key and model id an AI action should use, in one query.
 *
 * Key: dashboard vendor key override, then the environment variable.
 * Model: dashboard model override for this vendor and kind, then `fallback`
 * (the id the caller would otherwise hardcode).
 *
 * Registration-free so "use node" actions can import it safely.
 */
export async function resolveAiProvider(
  ctx: ProviderCtx,
  vendor: string,
  kind: AiModelKind,
  fallback: string,
): Promise<ResolvedProvider> {
  const config = await ctx.runQuery(internal.aiModels.providerConfig, {
    vendor,
    kind,
  });
  return {
    apiKey: config.keyOverride ?? envVendorKey(vendor),
    model: config.modelOverride ?? fallback,
    overridden: config.modelOverride !== null,
  };
}
