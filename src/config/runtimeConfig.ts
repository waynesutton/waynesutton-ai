import type { SiteConfig } from "./siteConfig";

// Deep partial limited to plain object nesting. Arrays are replaced whole, not merged.
// NonNullable unwraps optional fields so nested objects still become deep partials.
type DeepPartial<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends Array<infer U>
    ? Array<U>
    : NonNullable<T[K]> extends object
      ? DeepPartial<NonNullable<T[K]>>
      : T[K];
};

// Dashboard-saved overrides. `intro` is ReactNode so it can never be serialized to Convex.
export type SiteConfigOverrides = DeepPartial<Omit<SiteConfig, "intro">>;

// Keys that could be abused for prototype pollution when merging untrusted-shaped data
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (BLOCKED_KEYS.has(key) || value === undefined) {
      continue;
    }
    const current = target[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      deepMerge(current, value);
    } else {
      target[key] = value;
    }
  }
}

/**
 * Merges dashboard-saved overrides into the static siteConfig object in place.
 * Called once at app bootstrap (src/main.tsx) before the first render, so every
 * existing static `import siteConfig` sees the merged values at render time.
 */
export function applyRuntimeConfigOverrides(target: SiteConfig, overrides: unknown): void {
  if (!isPlainObject(overrides)) {
    return;
  }
  deepMerge(target as unknown as Record<string, unknown>, overrides);
}
