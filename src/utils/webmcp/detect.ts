/// <reference types="webmcp-types" />

/**
 * Feature detection for WebMCP.
 *
 * Chrome exposes the shipping API at document.modelContext (origin trial or
 * a future default). The local developer flag chrome://flags/#enable-webmcp-testing
 * exposes the same interface at navigator.modelContextTesting so the Model
 * Context Tool Inspector can drive it without a trial token. Both are read
 * lazily at call time because the flag surface can appear after first paint.
 *
 * Anything else returns null and the caller does nothing. The site must work
 * exactly the same way in browsers without WebMCP.
 */

export type ModelContextLike = Pick<WebMCP.ModelContext, "registerTool">;

interface NavigatorWithTesting extends Navigator {
  modelContextTesting?: unknown;
}

function looksLikeModelContext(value: unknown): value is ModelContextLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { registerTool?: unknown }).registerTool === "function"
  );
}

/** The live model context, or null when the browser has none */
export function detectModelContext(): ModelContextLike | null {
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    return null;
  }
  const shipping: unknown = document.modelContext;
  if (looksLikeModelContext(shipping)) {
    return shipping;
  }
  const testing: unknown = (navigator as NavigatorWithTesting).modelContextTesting;
  if (looksLikeModelContext(testing)) {
    return testing;
  }
  return null;
}

/** Which surface is active, for docs and debugging. */
export function describeModelContextSource(): "document" | "testing-flag" | null {
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    return null;
  }
  if (looksLikeModelContext(document.modelContext)) {
    return "document";
  }
  if (looksLikeModelContext((navigator as NavigatorWithTesting).modelContextTesting)) {
    return "testing-flag";
  }
  return null;
}
