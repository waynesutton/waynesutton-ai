// Constant-time string comparison for secrets (API keys, bootstrap keys,
// unsubscribe tokens). Works in both the V8 and Node runtimes, so mutations,
// queries, and httpActions can share it. Length mismatch returns early, which
// leaks only the length, never the contents.
export function secretEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
