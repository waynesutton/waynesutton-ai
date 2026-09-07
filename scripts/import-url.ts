import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {
  WEB_RESEARCH_PROVIDERS,
  WEB_RESEARCH_PROVIDER_META,
  describeScrapeFailure,
  orderProviders,
  scrapeUrlWithFallback,
  type WebResearchPreference,
  type WebResearchProvider,
} from "../convex/lib/webResearch";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Read every provider key from the env. Any one of them is enough to import.
function envKeys(): Record<WebResearchProvider, string | null> {
  const keys = {} as Record<WebResearchProvider, string | null>;
  for (const provider of WEB_RESEARCH_PROVIDERS) {
    const raw = process.env[WEB_RESEARCH_PROVIDER_META[provider].envVar];
    keys[provider] =
      raw && raw.trim().length > 0 && raw.trim() !== "unset"
        ? raw.trim()
        : null;
  }
  return keys;
}

// Optional: WEB_RESEARCH_PROVIDER=exa in .env.local moves that vendor first
function envPreference(): WebResearchPreference {
  const raw = process.env.WEB_RESEARCH_PROVIDER?.trim();
  return raw && (WEB_RESEARCH_PROVIDERS as ReadonlyArray<string>).includes(raw)
    ? (raw as WebResearchProvider)
    : "auto";
}

const chain = orderProviders(envPreference(), envKeys());

if (chain.length === 0) {
  console.error("Error: no web research provider key found in .env.local");
  console.log("\nAdd at least one of these keys:");
  for (const provider of WEB_RESEARCH_PROVIDERS) {
    const meta = WEB_RESEARCH_PROVIDER_META[provider];
    console.log(`  ${meta.envVar}=...   (${meta.label}, ${meta.docsUrl})`);
  }
  console.log(
    "\nThe first configured provider is used; the others are fallbacks.",
  );
  process.exit(1);
}

// Generate a URL-safe slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length
}

// Clean up markdown content
function cleanMarkdown(content: string): string {
  return content
    .replace(/^\s+|\s+$/g, "") // Trim whitespace
    .replace(/\n{3,}/g, "\n\n"); // Remove excessive newlines
}

async function importFromUrl(url: string) {
  console.log(`\nScraping: ${url}`);
  console.log(
    `Providers: ${chain
      .map((entry) => WEB_RESEARCH_PROVIDER_META[entry.provider].label)
      .join(" -> ")}`,
  );
  console.log("This may take a moment...\n");

  try {
    const outcome = await scrapeUrlWithFallback(chain, url);

    if (!outcome.ok) {
      console.error("Failed to scrape URL");
      console.error(describeScrapeFailure(outcome));
      process.exit(1);
    }

    const scraped = outcome.result;
    const title = scraped.title || "Imported Post";
    const description = scraped.description || "";
    const content = cleanMarkdown(scraped.content);

    if (!content) {
      console.error("No content found at URL");
      process.exit(1);
    }

    // Generate slug from title
    const baseSlug = generateSlug(title);
    const slug = baseSlug || `imported-${Date.now()}`;

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Create markdown file with frontmatter
    const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
date: "${today}"
slug: "${slug}"
published: false
tags: ["imported"]
---

${content}

---

*Originally published at [${new URL(url).hostname}](${url})*
`;

    // Ensure content/blog directory exists
    const blogDir = path.join(process.cwd(), "content", "blog");
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // Write the file
    const filePath = path.join(blogDir, `${slug}.md`);

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.warn(`Warning: File already exists at ${filePath}`);
      console.warn("Adding timestamp to filename to avoid overwrite.");
      const newSlug = `${slug}-${Date.now()}`;
      const newFilePath = path.join(blogDir, `${newSlug}.md`);
      fs.writeFileSync(
        newFilePath,
        markdown.replace(`slug: "${slug}"`, `slug: "${newSlug}"`),
      );
      console.log(`\nCreated: ${newFilePath}`);
      console.log(`Slug: ${newSlug}`);
    } else {
      fs.writeFileSync(filePath, markdown);
      console.log(`\nCreated: ${filePath}`);
      console.log(`Slug: ${slug}`);
    }

    console.log(`Title: ${title}`);
    console.log(`Scraped with: ${WEB_RESEARCH_PROVIDER_META[scraped.provider].label}`);
    console.log(`Status: Draft (published: false)`);
    console.log("\nNext steps:");
    console.log("1. Review and edit the imported content");
    console.log("2. Set published: true when ready");
    console.log("3. Run: npm run sync");
  } catch (error) {
    console.error("Error importing URL:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const url = process.argv[2];

if (!url) {
  console.log("URL Content Importer");
  console.log("====================\n");
  console.log("Usage: npm run import <url>\n");
  console.log("Example:");
  console.log("  npm run import https://example.com/article\n");
  console.log("This will:");
  console.log(
    "  1. Scrape the URL to markdown (Firecrawl, Exa, or Context.dev)",
  );
  console.log("  2. Create a draft post in content/blog/");
  console.log("  3. You can then review, edit, and sync\n");
  process.exit(0);
}

// Validate URL
try {
  new URL(url);
} catch {
  console.error("Error: Invalid URL provided");
  console.log("Please provide a valid URL starting with http:// or https://");
  process.exit(1);
}

importFromUrl(url);
