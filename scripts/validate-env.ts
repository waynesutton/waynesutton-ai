#!/usr/bin/env npx tsx
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

type Check = {
  key: string;
  required: boolean;
  description: string;
};

const isProd = process.argv.includes("--prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
const envPath = path.join(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

const localChecks: Array<Check> = [
  {
    key: "CONVEX_DEPLOYMENT",
    required: true,
    description: "Convex deployment identifier used by CLI commands.",
  },
  {
    key: "VITE_CONVEX_URL",
    required: true,
    description: "Convex cloud URL used by the frontend and tooling.",
  },
];

const recommendedConvexEnvChecks: Array<Check> = [
  {
    key: "SITE_URL",
    required: false,
    description: "Canonical public site URL for sitemap, RSS, and metadata.",
  },
  {
    key: "AUTH_GITHUB_ID",
    required: false,
    description: "GitHub OAuth app client id for convex-auth sign in.",
  },
  {
    key: "AUTH_GITHUB_SECRET",
    required: false,
    description: "GitHub OAuth app client secret for convex-auth sign in.",
  },
  {
    key: "DASHBOARD_ADMIN_BOOTSTRAP_KEY",
    required: false,
    description: "Secret used one time to bootstrap the first dashboard admin.",
  },
];

function printResult(check: Check, value: string | undefined): boolean {
  const present = Boolean(value && value.trim().length > 0);
  const status = present ? "OK" : check.required ? "MISSING" : "OPTIONAL_MISSING";
  const line = `${status.padEnd(16)} ${check.key.padEnd(32)} ${check.description}`;
  console.log(line);
  return present;
}

console.log(`Validating environment for ${isProd ? "production" : "development"} using ${envFile}`);
console.log("");
console.log("Local environment checks");

let hasBlockingIssues = false;
for (const check of localChecks) {
  const present = printResult(check, process.env[check.key]);
  if (check.required && !present) {
    hasBlockingIssues = true;
  }
}

const convexSiteUrl =
  process.env.VITE_CONVEX_URL?.replace(".cloud", ".site") ?? process.env.VITE_CONVEX_SITE_URL;
if (convexSiteUrl) {
  console.log("");
  console.log(`Derived convex.site URL: ${convexSiteUrl}`);
}

console.log("");
console.log("Recommended Convex dashboard env checks");
for (const check of recommendedConvexEnvChecks) {
  printResult(check, process.env[check.key]);
}

console.log("");
if (hasBlockingIssues) {
  console.error("Blocking issues found. Run `npx convex dev --once` to create local env values.");
  process.exit(1);
}

console.log("Environment validation passed for required local values.");
console.log("For auth setup later, configure missing optional values with `npx convex env set ...`.");
