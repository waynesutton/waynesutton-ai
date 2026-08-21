/**
 * Short vibration for primary chrome actions.
 * No-op on desktop and anywhere vibrate is missing or blocked.
 */
export function haptic(durationMs = 12): void {
  if (typeof navigator === "undefined") {
    return;
  }
  if (typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Unsupported or blocked. Stay silent.
  }
}
