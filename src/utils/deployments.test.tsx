import { describe, expect, it } from "vitest";
import {
  applyDocsPlaceholders,
  buildDeploymentDocsContext,
  docsPlaceholderValues,
  parseConvexCloudUrl,
} from "./deployments";

describe("parseConvexCloudUrl", () => {
  it("reads the deployment slug from a cloud URL", () => {
    const info = parseConvexCloudUrl(
      "https://notable-loris-927.convex.cloud",
    );
    expect(info?.name).toBe("notable-loris-927");
    expect(info?.siteUrl).toBe("https://notable-loris-927.convex.site");
  });

  it("returns null for garbage", () => {
    expect(parseConvexCloudUrl("not-a-url")).toBeNull();
    expect(parseConvexCloudUrl("")).toBeNull();
  });
});

describe("buildDeploymentDocsContext", () => {
  it("fills fork URLs from env instead of Wayne's names", () => {
    const ctx = buildDeploymentDocsContext({
      devConvexUrl: "https://happy-cat-1.convex.cloud",
      prodConvexUrl: "https://brave-dog-2.convex.cloud",
      prodSiteUrl: "https://example.com",
      currentConvexUrl: "https://happy-cat-1.convex.cloud",
      hasProductionEnvFile: true,
      githubOwner: "alice",
      githubRepo: "alice-site",
      siteName: "Alice",
    });
    const values = docsPlaceholderValues(ctx);
    expect(values.DEV_NAME).toBe("happy-cat-1");
    expect(values.PROD_NAME).toBe("brave-dog-2");
    expect(values.PUBLIC_URL).toBe("https://example.com");
    expect(values.PUBLIC_HOST).toBe("example.com");
    expect(values.GITHUB_REPO).toBe("alice/alice-site");
    expect(values.REPO_DEPLOY_NOTE).toBe("");
    expect(values.X_CALLBACK_PROD).toBe(
      "https://brave-dog-2.convex.site/x/callback",
    );
  });

  it("does not copy the dev URL into prod when the production env file is missing", () => {
    const ctx = buildDeploymentDocsContext({
      devConvexUrl: "https://happy-cat-1.convex.cloud",
      prodConvexUrl: "https://happy-cat-1.convex.cloud",
      currentConvexUrl: "https://happy-cat-1.convex.cloud",
      hasProductionEnvFile: false,
      githubOwner: "alice",
      githubRepo: "alice-site",
      siteName: "Alice",
    });
    expect(docsPlaceholderValues(ctx).PROD_NAME).toBe("not set");
  });

  it("keeps the leftover-deployment warning only for this site's prod slug", () => {
    const ctx = buildDeploymentDocsContext({
      devConvexUrl: "https://notable-loris-927.convex.cloud",
      prodConvexUrl: "https://helpful-ptarmigan-118.convex.cloud",
      prodSiteUrl: "https://waynesutton.ai",
      hasProductionEnvFile: true,
      githubOwner: "waynesutton",
      githubRepo: "waynesutton-ai",
      siteName: "Wayne Sutton",
    });
    expect(docsPlaceholderValues(ctx).REPO_DEPLOY_NOTE).toContain(
      "giant-grouse-674",
    );
  });
});

describe("applyDocsPlaceholders", () => {
  it("replaces tokens and leaves unknown ones alone", () => {
    const out = applyDocsPlaceholders("Hello {{PUBLIC_HOST}} {{NOPE}}", {
      PUBLIC_HOST: "example.com",
    });
    expect(out).toBe("Hello example.com {{NOPE}}");
  });
});
