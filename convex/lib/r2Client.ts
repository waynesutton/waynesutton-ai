// The R2 component client and URL helpers, kept in a registration-free module
// so "use node" actions (the photo email door) can store objects without
// importing convex/r2.ts, which registers queries and cannot be bundled into
// the Node runtime.
import { R2 } from "@convex-dev/r2";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

export const r2 = new R2(components.r2);

function encodeObjectKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

// Permanent public URL for a key: the custom domain when R2_PUBLIC_URL is set,
// otherwise the /r2/<key> redirect served by http.ts.
export function permanentR2Url(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  const encodedKey = encodeObjectKey(key);
  if (publicUrl) return `${publicUrl}/${encodedKey}`;

  const siteUrl = process.env.CONVEX_SITE_URL?.replace(/\/+$/, "");
  if (!siteUrl) {
    throw new ConvexError(
      "CONVEX_SITE_URL is unavailable for the R2 redirect fallback",
    );
  }
  return `${siteUrl}/r2/${encodedKey}`;
}

export async function deleteR2Object(ctx: MutationCtx, key: string): Promise<void> {
  await r2.deleteObject(ctx, key);
}
