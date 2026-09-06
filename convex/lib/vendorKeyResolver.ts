import { internal } from "../_generated/api";

type VendorKeyCtx = {
  runQuery: (
    ref: typeof internal.pipelineKeys.getVendorKeyValue,
    args: { name: string },
  ) => Promise<string | null>;
};

type VendorKeysCtx = {
  runQuery: (
    ref: typeof internal.pipelineKeys.getVendorKeyValues,
    args: { names: Array<string> },
  ) => Promise<Record<string, string>>;
};

/** Env var value, treating empty and the "unset" sentinel as missing. */
export function envVendorKey(name: string): string | null {
  const envValue = process.env[name];
  if (envValue && envValue.trim().length > 0 && envValue.trim() !== "unset") {
    return envValue.trim();
  }
  return null;
}

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
  return envVendorKey(name);
}

/**
 * Resolve several vendor keys in one query. Each entry is the dashboard
 * override when set, otherwise the environment variable, otherwise null.
 */
export async function resolveVendorKeys<const N extends string>(
  ctx: VendorKeysCtx,
  names: ReadonlyArray<N>,
): Promise<Record<N, string | null>> {
  const overrides = await ctx.runQuery(
    internal.pipelineKeys.getVendorKeyValues,
    {
      names: [...names],
    },
  );
  const resolved = {} as Record<N, string | null>;
  for (const name of names) {
    resolved[name] = overrides[name] ?? envVendorKey(name);
  }
  return resolved;
}
