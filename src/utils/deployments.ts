import siteConfig from "../config/siteConfig";

export const DOCS_NOT_SET = "not set";

export type ConvexDeploymentInfo = {
  name: string;
  cloudUrl: string;
  siteUrl: string;
};

export type DocsPlaceholderMap = Record<string, string>;

export type DeploymentDocsContext = {
  publicUrl: string;
  publicHost: string;
  devDashboard: string;
  githubRepo: string;
  githubUrl: string;
  siteName: string;
  dev: ConvexDeploymentInfo | null;
  prod: ConvexDeploymentInfo | null;
  repoNote: string;
};

const WAYNE_PROD_SLUG = "helpful-ptarmigan-118";

export function parseConvexCloudUrl(
  url: string | undefined | null,
): ConvexDeploymentInfo | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const name = parsed.hostname.split(".")[0];
    if (!name) return null;
    const cloudUrl = parsed.origin;
    const siteUrl = cloudUrl.replace(".convex.cloud", ".convex.site");
    return { name, cloudUrl, siteUrl };
  } catch {
    return null;
  }
}

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

export function buildDeploymentDocsContext(args: {
  devConvexUrl?: string;
  prodConvexUrl?: string;
  prodSiteUrl?: string;
  currentConvexUrl?: string;
  hasProductionEnvFile: boolean;
  githubOwner: string;
  githubRepo: string;
  siteName: string;
}): DeploymentDocsContext {
  const current = parseConvexCloudUrl(args.currentConvexUrl);
  const devFromEnv = parseConvexCloudUrl(args.devConvexUrl);
  const prodFromEnv = args.hasProductionEnvFile
    ? parseConvexCloudUrl(args.prodConvexUrl)
    : null;

  const dev = devFromEnv ?? (current && prodFromEnv?.cloudUrl !== current.cloudUrl ? current : null);
  const prod = prodFromEnv ?? (current && dev?.cloudUrl !== current.cloudUrl ? current : null);

  const publicUrl = stripTrailingSlash(
    args.prodSiteUrl ||
      prod?.siteUrl ||
      current?.siteUrl ||
      "",
  );

  const githubRepo = `${args.githubOwner}/${args.githubRepo}`;
  const repoNote =
    prod?.name === WAYNE_PROD_SLUG
      ? "Never deploy to giant-grouse-674 or agreeable-trout-200. Those are leftover deployments from the fork history, not this site."
      : "";

  return {
    publicUrl: publicUrl || DOCS_NOT_SET,
    publicHost: publicUrl ? hostFromUrl(publicUrl) : DOCS_NOT_SET,
    devDashboard: "http://localhost:5173/dashboard",
    githubRepo,
    githubUrl: `https://github.com/${githubRepo}`,
    siteName: args.siteName,
    dev,
    prod,
    repoNote,
  };
}

export function docsPlaceholderValues(
  ctx: DeploymentDocsContext,
): DocsPlaceholderMap {
  const cell = (info: ConvexDeploymentInfo | null, key: keyof ConvexDeploymentInfo) =>
    info ? info[key] : DOCS_NOT_SET;

  return {
    PUBLIC_URL: ctx.publicUrl,
    PUBLIC_HOST: ctx.publicHost,
    SITE_NAME: ctx.siteName,
    DEV_DASHBOARD: ctx.devDashboard,
    DEV_NAME: cell(ctx.dev, "name"),
    DEV_CLOUD: cell(ctx.dev, "cloudUrl"),
    DEV_SITE: cell(ctx.dev, "siteUrl"),
    PROD_NAME: cell(ctx.prod, "name"),
    PROD_CLOUD: cell(ctx.prod, "cloudUrl"),
    PROD_SITE: cell(ctx.prod, "siteUrl"),
    PROD_PUBLIC:
      ctx.publicUrl === DOCS_NOT_SET
        ? DOCS_NOT_SET
        : `${ctx.publicUrl}/dashboard`,
    PROD_HTTP:
      ctx.publicUrl !== DOCS_NOT_SET ? ctx.publicUrl : cell(ctx.prod, "siteUrl"),
    X_CALLBACK_DEV: ctx.dev ? `${ctx.dev.siteUrl}/x/callback` : DOCS_NOT_SET,
    X_CALLBACK_PROD: ctx.prod ? `${ctx.prod.siteUrl}/x/callback` : DOCS_NOT_SET,
    GITHUB_REPO: ctx.githubRepo,
    GITHUB_URL: ctx.githubUrl,
    REPO_DEPLOY_NOTE: ctx.repoNote,
  };
}

export function applyDocsPlaceholders(
  markdown: string,
  values: DocsPlaceholderMap,
): string {
  return markdown.replace(/\{\{([A-Z0-9_]+)\}\}/g, (full, key: string) => {
    return Object.prototype.hasOwnProperty.call(values, key)
      ? values[key] ?? full
      : full;
  });
}

export function readDeploymentDocsContext(): DeploymentDocsContext {
  const env = import.meta.env;
  const hasProductionEnvFile = Boolean(env.VITE_HAS_PRODUCTION_ENV);
  return buildDeploymentDocsContext({
    devConvexUrl: env.VITE_DEV_CONVEX_URL || env.VITE_CONVEX_URL,
    prodConvexUrl: env.VITE_PROD_CONVEX_URL,
    prodSiteUrl: env.VITE_PROD_SITE_URL || env.VITE_SITE_URL || env.VITE_CONVEX_SITE_URL,
    currentConvexUrl: env.VITE_CONVEX_URL,
    hasProductionEnvFile:
      hasProductionEnvFile || Boolean(env.VITE_PROD_CONVEX_URL),
    githubOwner: siteConfig.gitHubRepo.owner,
    githubRepo: siteConfig.gitHubRepo.repo,
    siteName: siteConfig.name,
  });
}

export function interpolateDocsContent(markdown: string): string {
  return applyDocsPlaceholders(
    markdown,
    docsPlaceholderValues(readDeploymentDocsContext()),
  );
}
