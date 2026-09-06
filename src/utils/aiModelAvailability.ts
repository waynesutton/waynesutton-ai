import type { AIModelOption } from "../config/siteConfig";

/**
 * Maps each AI provider to the vendor key that unlocks it. Mirrors
 * VENDOR_ENV_VARS in convex/pipelineKeys.ts so the dashboard can hide models
 * whose key is missing instead of letting the request fail server side.
 */
export const PROVIDER_ENV_VARS: Record<AIModelOption["provider"], string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_AI_API_KEY",
  concentrate: "CONCENTRATE_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  runware: "RUNWARE_API_KEY",
};

export function providerEnvVar(provider: AIModelOption["provider"]): string {
  return PROVIDER_ENV_VARS[provider];
}

export interface VendorKeyStatusEntry {
  name: string;
  configured: boolean;
  source: "override" | "env" | "none";
}

export interface ModelAvailability {
  /** Models whose provider has a configured key, in config order */
  available: Array<AIModelOption>;
  /** Models hidden because their provider key is missing */
  unavailable: Array<AIModelOption>;
  /** Providers with at least one configured key, in first-seen order */
  activeProviders: Array<AIModelOption["provider"]>;
  /** Vendor key names that would unlock at least one hidden model */
  missingKeys: Array<string>;
}

/**
 * Splits a model list by whether its provider key is configured. While the
 * status query is still loading (undefined) everything is treated as
 * available so the UI never flashes an empty selector.
 */
export function filterAvailableModels(
  models: ReadonlyArray<AIModelOption>,
  status: ReadonlyArray<VendorKeyStatusEntry> | undefined,
): ModelAvailability {
  if (status === undefined) {
    return {
      available: [...models],
      unavailable: [],
      activeProviders: uniqueProviders(models),
      missingKeys: [],
    };
  }

  const configured = new Set(status.filter((s) => s.configured).map((s) => s.name));
  const available: Array<AIModelOption> = [];
  const unavailable: Array<AIModelOption> = [];
  for (const model of models) {
    if (configured.has(providerEnvVar(model.provider))) {
      available.push(model);
    } else {
      unavailable.push(model);
    }
  }

  const missingKeys = Array.from(new Set(unavailable.map((m) => providerEnvVar(m.provider))));
  return {
    available,
    unavailable,
    activeProviders: uniqueProviders(available),
    missingKeys,
  };
}

/**
 * Keeps the current selection when it is still usable, otherwise falls back to
 * the preferred default, then the first available model. Returns null only
 * when nothing is usable.
 */
export function pickModel(
  available: ReadonlyArray<AIModelOption>,
  current: string,
  preferred?: string,
): string | null {
  if (available.some((m) => m.id === current)) return current;
  if (preferred && available.some((m) => m.id === preferred)) return preferred;
  return available[0]?.id ?? null;
}

function uniqueProviders(models: ReadonlyArray<AIModelOption>): Array<AIModelOption["provider"]> {
  const seen: Array<AIModelOption["provider"]> = [];
  for (const model of models) {
    if (!seen.includes(model.provider)) seen.push(model.provider);
  }
  return seen;
}
