import { internal } from "../_generated/api";

type VendorKeyCtx = {
  runQuery: (
    ref: typeof internal.pipelineKeys.getVendorKeyValue,
    args: { name: string },
  ) => Promise<string | null>;
};

/**
 * Resolve a vendor key for use inside actions: dashboard override first,
 * then the deployment environment variable. Lives in a registration-free
 * module so "use node" actions can import it safely.
 */
export async function resolveVendorKey(
  ctx: VendorKeyCtx,
  name: string,
): Promise<string | null> {
  const override = await ctx.runQuery(internal.pipelineKeys.getVendorKeyValue, {
    name,
  });
  if (override) {
    return override;
  }
  const envValue = process.env[name];
  if (envValue && envValue.trim().length > 0 && envValue.trim() !== "unset") {
    return envValue;
  }
  return null;
}
