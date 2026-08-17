#!/usr/bin/env npx tsx
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const isProd = process.argv.includes("--prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
const envPath = path.join(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

const explicitUrlArg = process.argv.find(
  (arg) => arg.startsWith("http://") || arg.startsWith("https://"),
);
const fallbackUrl =
  process.env.VITE_CONVEX_SITE_URL ??
  process.env.VITE_SITE_URL ??
  process.env.VITE_CONVEX_URL?.replace(".cloud", ".site");
const baseUrl = explicitUrlArg ?? fallbackUrl;

if (!baseUrl) {
  console.error("No deploy URL found.");
  console.error(
    "Pass a URL explicitly, or set VITE_CONVEX_SITE_URL / VITE_SITE_URL / VITE_CONVEX_URL.",
  );
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.endsWith("/")
  ? baseUrl.slice(0, -1)
  : baseUrl;

const endpoints: Array<{ path: string; expectedContentType?: string }> = [
  { path: "/" },
  { path: "/rss.xml", expectedContentType: "application/xml" },
  { path: "/sitemap.xml", expectedContentType: "application/xml" },
  { path: "/api/posts", expectedContentType: "application/json" },
  { path: "/api/export", expectedContentType: "application/json" },
];

console.log(`Verifying deployment at ${normalizedBaseUrl}`);
console.log("");

let hasFailure = false;

for (const endpoint of endpoints) {
  const url = `${normalizedBaseUrl}${endpoint.path}`;
  try {
    const response = await fetch(url, { method: "GET" });
    const contentType = response.headers.get("content-type") ?? "";
    const status = response.status;
    const ok = response.ok;
    const contentTypeMatches = endpoint.expectedContentType
      ? contentType.includes(endpoint.expectedContentType)
      : true;

    const state = ok && contentTypeMatches ? "OK" : "FAILED";
    console.log(
      `${state.padEnd(8)} ${String(status).padEnd(4)} ${endpoint.path.padEnd(14)} ${contentType}`,
    );

    if (!ok || !contentTypeMatches) {
      hasFailure = true;
    }
  } catch (error) {
    hasFailure = true;
    const message = error instanceof Error ? error.message : "Unknown request error";
    console.log(`FAILED   ERR  ${endpoint.path.padEnd(14)} ${message}`);
  }
}

console.log("");
if (hasFailure) {
  console.error("Deployment verification failed.");
  process.exit(1);
}

console.log("Deployment verification passed.");
