import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { handleRssFeed, handleRssFullFeed } from "./rss";
import { handleStreamResponse, handleStreamResponseOptions } from "./askAI.node";
import { registerRoutes } from "convex-fs";
import { registerRoutes as registerAgentReadyRoutes } from "@waynesutton/agent-ready";
import { fs } from "./fs";
import { auth } from "./auth";
import { handleMcpRequest, mcpPreflightResponse } from "./mcp";
import { processXCallback } from "./xIntegration";
import type { Id } from "./_generated/dataModel";
import {
  extractBody,
  extractInboxId,
  extractMessageId,
  extractSender,
  extractSubject,
  isAllowedSender,
  isInboundEventType,
  normalizeEmailAddress,
  cleanEmailBody,
} from "./lib/agentMailMessage";
import type { EmailDoorConfig } from "./lib/agentMailMessage";

function rateLimitedResponse(retryAfter?: number): Response {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(retryAfter ? { "Retry-After": String(Math.ceil(retryAfter / 1000)) } : {}),
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

const http = httpRouter();

// Register Convex Auth routes for GitHub OAuth.
auth.addHttpRoutes(http);

// Agent-ready routes for llms.txt, agents.md, llms-full.txt, and status endpoints.
// This app owns its dynamic sitemap, so skip agent-ready's sitemap route.
registerAgentReadyRoutes(http, components.agentReady, {
  skipRoutes: ["/sitemap.xml"],
  routes: {
    // Browsers download text/markdown, so serve agents.md inline as text/plain
    // when the request comes from a browser (Accept: text/html). AI agents and
    // curl keep the default text/markdown response from the component.
    "agents.md": async (ctx, req) => {
      const accept = req.headers.get("accept") ?? "";
      if (!accept.includes("text/html")) return null;
      const cached = await (
        ctx as { runQuery: (ref: unknown, args: unknown) => Promise<unknown> }
      ).runQuery(components.agentReady.content.getCachedFile, {
        fileType: "agents.md",
      });
      const file = cached as { content: string } | null;
      if (!file) return null;
      return new Response(file.content, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    },
  },
});

// Serve raw markdown files with text/plain so browsers and AI services
// (Claude, ChatGPT, Perplexity) can read them. Takes precedence over the
// static catch-all because /raw/ is a more specific path prefix.
http.route({
  pathPrefix: "/raw/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "rawMarkdown",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    const url = new URL(request.url);
    const slug = url.pathname.replace(/^\/raw\//, "").replace(/\.md$/, "");

    if (!slug) {
      return new Response("Not found", { status: 404 });
    }

    const post = await ctx.runQuery(internal.posts.getPostBySlugWithContent, { slug });
    if (post) {
      const frontmatter = [
        "---",
        `Type: post`,
        `Date: ${post.date}`,
        post.readTime ? `Read time: ${post.readTime}` : null,
        post.tags?.length ? `Tags: ${post.tags.join(", ")}` : null,
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      const markdown = `${frontmatter}\n\n# ${post.title}\n\n${post.description ? `> ${post.description}\n\n` : ""}${post.content}`;

      return new Response(markdown, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
          // Unlisted posts stay accessible but must not be indexed
          ...(post.unlisted ? { "X-Robots-Tag": "noindex" } : {}),
        },
      });
    }

    const page = await ctx.runQuery(internal.pages.getPageBySlugInternal, { slug });
    if (page) {
      const today = new Date().toISOString().split("T")[0];
      const frontmatter = `---\nType: page\nDate: ${today}\n---`;
      const markdown = `${frontmatter}\n\n# ${page.title}\n\n${page.content}`;

      return new Response(markdown, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
          // Unlisted pages stay accessible but must not be indexed
          ...(page.unlisted ? { "X-Robots-Tag": "noindex" } : {}),
        },
      });
    }

    return new Response("Not found", { status: 404 });
  }),
});

http.route({
  pathPrefix: "/raw/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Site configuration - update these for your site (or run npm run configure)
const SITE_URL = process.env.SITE_URL || "https://waynesutton.ai";
const SITE_NAME = "Wayne Sutton";

// RSS feed endpoint (descriptions only)
http.route({
  path: "/rss.xml",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "rssFeed",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);
    return handleRssFeed(ctx);
  }),
});

http.route({
  path: "/rss.xml",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Full RSS feed endpoint (with complete content for LLMs)
http.route({
  path: "/rss-full.xml",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "rssFullFeed",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);
    return handleRssFullFeed(ctx);
  }),
});

http.route({
  path: "/rss-full.xml",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Sitemap.xml endpoint for search engines (includes posts, pages, and tag pages)
http.route({
  path: "/sitemap.xml",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "sitemap",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    const posts = await ctx.runQuery(internal.posts.getAllPostsInternal);
    const pages = await ctx.runQuery(internal.pages.getAllPagesInternal);
    const tags = await ctx.runQuery(internal.posts.getAllTagsInternal);
    const authors = await ctx.runQuery(internal.posts.getAllAuthorsInternal);

    const urls = [
      // Homepage
      `  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
      // All posts
      ...posts.map(
        (post: { slug: string; date: string }) => `  <url>
    <loc>${SITE_URL}/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
      ),
      // All pages
      ...pages.map(
        (page: { slug: string }) => `  <url>
    <loc>${SITE_URL}/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
      ),
      // All tag pages
      ...tags.map(
        (tagInfo: { tag: string }) => `  <url>
    <loc>${SITE_URL}/tags/${encodeURIComponent(tagInfo.tag.toLowerCase())}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
      ),
      // All author pages
      ...authors.map(
        (author: { slug: string }) => `  <url>
    <loc>${SITE_URL}/author/${encodeURIComponent(author.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  }),
});

http.route({
  path: "/sitemap.xml",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// API endpoint: List all posts (JSON for LLMs/agents)
http.route({
  path: "/api/posts",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "apiPosts",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    const posts = await ctx.runQuery(internal.posts.getAllPostsInternal);

    const response = {
      site: SITE_NAME,
      url: SITE_URL,
      description:
        "An open-source publishing framework built for AI agents and developers to ship websites, docs, or blogs. Write markdown, sync from the terminal. Your content is instantly available to browsers, LLMs, and AI agents. Built on Convex.",
      posts: posts.map((post: { title: string; slug: string; description: string; date: string; readTime?: string; tags: string[] }) => ({
        title: post.title,
        slug: post.slug,
        description: post.description,
        date: post.date,
        readTime: post.readTime,
        tags: post.tags,
        url: `${SITE_URL}/${post.slug}`,
        markdownUrl: `${SITE_URL}/api/post?slug=${post.slug}`,
      })),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

http.route({
  path: "/api/posts",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// API endpoint: Get single post as markdown (for LLMs/agents)
http.route({
  path: "/api/post",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "apiPost",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    const format = url.searchParams.get("format") || "json";

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const post = await ctx.runQuery(internal.posts.getPostBySlugWithContent, { slug });

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return raw markdown if requested
    if (format === "markdown" || format === "md") {
      const markdown = `# ${post.title}

> ${post.description}

**Published:** ${post.date}${post.readTime ? ` | **Read time:** ${post.readTime}` : ""}
**Tags:** ${post.tags.join(", ")}
**URL:** ${SITE_URL}/${post.slug}

---

${post.content}`;

      return new Response(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=600",
          "Access-Control-Allow-Origin": "*",
          // Unlisted posts stay accessible but must not be indexed
          ...(post.unlisted ? { "X-Robots-Tag": "noindex" } : {}),
        },
      });
    }

    // Default: JSON response
    const response = {
      title: post.title,
      slug: post.slug,
      description: post.description,
      date: post.date,
      readTime: post.readTime,
      tags: post.tags,
      url: `${SITE_URL}/${post.slug}`,
      content: post.content,
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Access-Control-Allow-Origin": "*",
        // Unlisted posts stay accessible but must not be indexed
        ...(post.unlisted ? { "X-Robots-Tag": "noindex" } : {}),
      },
    });
  }),
});

http.route({
  path: "/api/post",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// API endpoint: Export all posts with full content (batch for LLMs)
http.route({
  path: "/api/export",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "apiExport",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    const posts = await ctx.runQuery(internal.posts.getAllPostsWithContentInternal);

    const response = {
      site: SITE_NAME,
      url: SITE_URL,
      description:
        "An open-source publishing framework built for AI agents and developers to ship websites, docs, or blogs. Write markdown, sync from the terminal. Your content is instantly available to browsers, LLMs, and AI agents. Built on Convex.",
      exportedAt: new Date().toISOString(),
      totalPosts: posts.length,
      posts: posts.map((post) => ({
        title: post.title,
        slug: post.slug,
        description: post.description,
        date: post.date,
        readTime: post.readTime,
        tags: post.tags,
        url: `${SITE_URL}/${post.slug}`,
        content: post.content,
      })),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

http.route({
  path: "/api/export",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Escape HTML characters to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Generate Open Graph HTML for a post or page
function generateMetaHtml(content: {
  title: string;
  description: string;
  slug: string;
  date?: string;
  readTime?: string;
  image?: string;
  ogImage?: string;
  noOgImage?: boolean;
  type?: "post" | "page";
}): string {
  const siteUrl = process.env.SITE_URL || "https://waynesutton.ai";
  const siteName = "Wayne Sutton";
  const defaultImage = `${siteUrl}/images/og-default.svg`;
  const canonicalUrl = `${siteUrl}/${content.slug}`;

  // Resolve image URL: ogImage override wins, then content image, then default.
  // noOgImage disables the share image entirely (text-only preview).
  const resolveImageUrl = (value: string): string =>
    value.startsWith("http") ? value : `${siteUrl}${value}`;
  let ogImage = defaultImage;
  if (content.ogImage) {
    ogImage = resolveImageUrl(content.ogImage);
  } else if (content.image) {
    ogImage = resolveImageUrl(content.image);
  }
  const hideImage = content.noOgImage === true;

  const safeTitle = escapeHtml(content.title);
  const safeDescription = escapeHtml(content.description);
  const contentType = content.type || "post";
  const ogType = contentType === "post" ? "article" : "website";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Basic SEO -->
  <title>${safeTitle} | ${siteName}</title>
  <meta name="description" content="${safeDescription}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">${
    hideImage
      ? ""
      : `
  <meta property="og:image" content="${ogImage}">`
  }
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${siteName}">${
    content.date
      ? `
  <meta property="article:published_time" content="${content.date}">`
      : ""
  }
  
  <!-- Hreflang for language/region targeting -->
  <link rel="alternate" hreflang="en" href="${canonicalUrl}">
  <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${hideImage ? "summary" : "summary_large_image"}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">${
    hideImage
      ? ""
      : `
  <meta name="twitter:image" content="${ogImage}">`
  }
  <meta name="twitter:site" content="">
  <meta name="twitter:creator" content="">

  <!-- Redirect to actual page after a brief delay for crawlers -->
  <script>
    setTimeout(() => {
      window.location.href = "${canonicalUrl}";
    }, 100);
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 50px auto; padding: 20px; color: #111;">
  <h1 style="font-size: 32px; margin-bottom: 16px;">${safeTitle}</h1>
  <p style="color: #666; margin-bottom: 24px;">${safeDescription}</p>${
    content.date
      ? `
  <p style="font-size: 14px; color: #999;">${content.date}${content.readTime ? ` · ${content.readTime}` : ""}</p>`
      : ""
  }
  <p style="margin-top: 24px;"><small>Redirecting to full ${contentType}...</small></p>
</body>
</html>`;
}

// HTTP endpoint for Open Graph metadata (supports both posts and pages)
http.route({
  path: "/meta/post",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug parameter", { status: 400 });
    }

    try {
      // First try to find a post
      const post = await ctx.runQuery(internal.posts.getPostBySlugWithContent, { slug });

      if (post) {
        const html = generateMetaHtml({
          title: post.title,
          description: post.description,
          slug: post.slug,
          date: post.date,
          readTime: post.readTime,
          image: post.image,
          ogImage: post.ogImage,
          noOgImage: post.noOgImage,
          type: "post",
        });

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control":
              "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }

      // If no post found, try to find a page
      const page = await ctx.runQuery(internal.pages.getPageBySlugInternal, { slug });

      if (page) {
        const html = generateMetaHtml({
          title: page.title,
          description: page.excerpt || `${page.title} - ${SITE_NAME}`,
          slug: page.slug,
          image: page.image,
          ogImage: page.ogImage,
          noOgImage: page.noOgImage,
          type: "page",
        });

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control":
              "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }

      // Neither post nor page found
      return new Response("Content not found", { status: 404 });
    } catch {
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

http.route({
  path: "/meta/post",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Ask AI streaming endpoint for RAG-based Q&A
http.route({
  path: "/ask-ai-stream",
  method: "POST",
  handler: httpAction(handleStreamResponse),
});

// CORS preflight for Ask AI endpoint
http.route({
  path: "/ask-ai-stream",
  method: "OPTIONS",
  handler: httpAction(handleStreamResponseOptions),
});

// Virtual filesystem: directory tree
http.route({
  path: "/vfs/tree",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "vfsTree",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    await ctx.auth.getUserIdentity();
    const tree = await ctx.runQuery(internal.virtualFs.buildPathTree, {});
    return new Response(JSON.stringify(tree, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// Virtual filesystem: execute shell commands
http.route({
  path: "/vfs/exec",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "vfsExec",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    await ctx.auth.getUserIdentity();
    let body: { command?: string; cwd?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ stdout: "", stderr: "invalid JSON body", exitCode: 1 }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }

    if (!body.command || typeof body.command !== "string") {
      return new Response(
        JSON.stringify({ stdout: "", stderr: "missing command field", exitCode: 1 }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const result = await ctx.runQuery(internal.virtualFs.executeCommand, {
      command: body.command,
      cwd: body.cwd || "/",
    });

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// CORS preflight for virtual filesystem endpoints
http.route({
  path: "/vfs/tree",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

http.route({
  path: "/vfs/exec",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// ---------------------------------------------------------------------------
// Agent blog pipeline routes
// ---------------------------------------------------------------------------

// SHA-256 hex digest for API key verification
async function sha256HexHttp(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function pipelineEnvConfigured(name: string): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0 || value.trim() === "unset") {
    return null;
  }
  return value.trim();
}

// Constant-time string comparison so secret checks do not leak timing info
function timingSafeEqual(a: string, b: string): boolean {
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

// Bound draft submissions well under the 1MB Convex document limit
const MAX_DRAFT_INPUT_CHARS = 400_000;

// Verify an AgentMail (Svix) webhook signature: HMAC-SHA256 over
// "{id}.{timestamp}.{body}" keyed with the base64-decoded whsec_ secret.
// Accepts both svix-* and webhook-* header aliases and enforces the
// standard five minute replay window.
async function verifySvixSignature(
  secret: string,
  request: Request,
  rawBody: string,
): Promise<boolean> {
  const id =
    request.headers.get("svix-id") ?? request.headers.get("webhook-id");
  const timestamp =
    request.headers.get("svix-timestamp") ??
    request.headers.get("webhook-timestamp");
  const signatureHeader =
    request.headers.get("svix-signature") ??
    request.headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) {
    return false;
  }

  // Replay protection: reject timestamps more than 5 minutes off
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return false;
  }

  // The signing key is the base64-decoded part after the whsec_ prefix
  const encodedKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    const decoded = atob(encodedKey);
    keyBytes = new Uint8Array(new ArrayBuffer(decoded.length));
    for (let i = 0; i < decoded.length; i++) {
      keyBytes[i] = decoded.charCodeAt(i);
    }
  } catch {
    return false;
  }

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(`${id}.${timestamp}.${rawBody}`),
  );
  const expected = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes)),
  );

  // Header holds space-delimited "v1,<sig>" entries; any match is valid
  for (const entry of signatureHeader.split(" ")) {
    const [version, sig] = entry.split(",", 2);
    if (version === "v1" && sig && timingSafeEqual(sig, expected)) {
      return true;
    }
  }
  return false;
}

// POST /api/v1/drafts: agents submit drafts with an x-api-key header.
// Payload: { title?, rawInput, type, mode, source, links?, tags? }
http.route({
  path: "/api/v1/drafts",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify the key before consuming the rate limit so unauthenticated
    // floods cannot starve legitimate submissions
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const keyHash = await sha256HexHttp(apiKey);
    const verified = await ctx.runQuery(internal.pipelineKeys.verifyApiKey, {
      keyHash,
    });
    if (!verified) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "draftsApi",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    let payload: {
      title?: string;
      rawInput?: string;
      type?: string;
      mode?: string;
      source?: string;
      links?: Array<string>;
      tags?: Array<string>;
    };
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validTypes = ["session-summary", "link-commentary", "article"];
    const validModes = ["rewrite", "as-is"];
    if (!payload.rawInput || typeof payload.rawInput !== "string") {
      return new Response(JSON.stringify({ error: "rawInput is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (payload.rawInput.length > MAX_DRAFT_INPUT_CHARS) {
      return new Response(
        JSON.stringify({ error: `rawInput exceeds ${MAX_DRAFT_INPUT_CHARS} characters` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const type = validTypes.includes(payload.type ?? "")
      ? (payload.type as "session-summary" | "link-commentary" | "article")
      : "article";
    const mode = validModes.includes(payload.mode ?? "")
      ? (payload.mode as "rewrite" | "as-is")
      : "rewrite";

    const draftId = await ctx.runMutation(internal.drafts.insertDraftFromApi, {
      keyId: verified.keyId,
      autoPublish: verified.autoPublish,
      title: typeof payload.title === "string" ? payload.title : undefined,
      rawInput: payload.rawInput,
      type,
      mode,
      source:
        typeof payload.source === "string" && payload.source.trim().length > 0
          ? payload.source.trim().slice(0, 40)
          : verified.label,
      links: Array.isArray(payload.links)
        ? payload.links.filter((l) => typeof l === "string").slice(0, 10)
        : undefined,
      tags: Array.isArray(payload.tags)
        ? payload.tags.filter((t) => typeof t === "string").slice(0, 10)
        : undefined,
    });

    return new Response(JSON.stringify({ draftId, status: "inbox" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/hooks/agentmail: email door + approval loop.
// Secured by Svix signature verification with AGENTMAIL_WEBHOOK_SECRET
// (the whsec_ signing secret from the AgentMail console).
http.route({
  path: "/api/hooks/agentmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = pipelineEnvConfigured("AGENTMAIL_WEBHOOK_SECRET");
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "Email door not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    // Verify the signature against the raw body before anything else so
    // unsigned floods cannot drain the rate limit bucket
    const rawBody = await request.text();
    const validSignature = await verifySvixSignature(secret, request, rawBody);
    if (!validSignature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "webhookInbound",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Gmail and other personal mail is labeled unauthenticated and is no
    // longer delivered as message.received. Accept that event. Skip sent,
    // delivered, spam, and blocked.
    const eventType =
      typeof body.event_type === "string" ? body.event_type : "";
    if (!isInboundEventType(eventType)) {
      return new Response(
        JSON.stringify({ ok: true, skipped: eventType }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // AgentMail wraps the message differently per event version; be defensive
    const message = (body.message ??
      (body.data as Record<string, unknown> | undefined)?.message ??
      body) as Record<string, unknown>;

    // Never treat our own outbound mail as a submission. Subscriber alerts,
    // stats summaries, and draft previews are all sent from this inbox, so if
    // AgentMail ever delivers one back they would file themselves as drafts.
    const emailDoor: EmailDoorConfig = await ctx.runQuery(
      internal.pipelineKeys.emailDoorConfig,
      {},
    );
    const ownInbox = emailDoor.inbox;
    const sender = extractSender(message);
    if (
      ownInbox &&
      normalizeEmailAddress(sender) === normalizeEmailAddress(ownInbox)
    ) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "self-sent" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // A valid signature proves AgentMail sent this webhook, not that the mail
    // came from someone allowed to publish. Authorize the sender before any
    // side effect: below this line a message can create a draft, spend OpenAI
    // tokens, or run publish/reject/edit against an existing draft.
    const allowedSenders = emailDoor.allowedSenders;
    if (allowedSenders.length === 0) {
      console.warn(
        "Email door refused inbound mail: set AGENTMAIL_ALLOWED_SENDERS (or AGENTMAIL_CONTACT_EMAIL) to the addresses allowed to submit drafts and reply with publish, reject, or edit.",
      );
      return new Response(
        JSON.stringify({ ok: true, skipped: "allowlist-not-configured" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!isAllowedSender(sender, allowedSenders)) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "unauthorized-sender" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const subject = extractSubject(message);
    const sourceMessageId = extractMessageId(message);
    const text = extractBody(message);

    // Webhook payloads omit text/html when they exceed 1 MB. Fetch the full
    // message from the AgentMail API instead of dropping the mail.
    if (!text.trim()) {
      const inboxId = extractInboxId(message) || ownInbox;
      if (inboxId && sourceMessageId) {
        await ctx.scheduler.runAfter(
          0,
          internal.draftEmails.ingestAgentMailMessage,
          {
            inboxId,
            messageId: sourceMessageId,
          },
        );
        return new Response(
          JSON.stringify({ ok: true, scheduled: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ ok: true, skipped: "empty body" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleaned = cleanEmailBody(text);

    // Approval loop: reply to a "[draft <id>]" preview email
    const draftMatch = subject.match(/\[draft ([a-z0-9]+)\]/i);
    if (draftMatch) {
      const firstLine = cleaned.split("\n")[0]?.trim().toLowerCase() ?? "";
      let command = "";
      let notes: string | undefined;
      if (firstLine === "publish") command = "publish";
      else if (firstLine === "reject") command = "reject";
      else if (firstLine.startsWith("edit")) {
        command = "edit";
        notes = cleaned.replace(/^edit:?\s*/i, "").trim() || undefined;
      }
      if (command) {
        // A garbled subject can carry an invalid id; skip instead of erroring
        let result: string;
        try {
          result = await ctx.runMutation(internal.drafts.handleEmailCommand, {
            draftId: draftMatch[1] as Id<"drafts">,
            command,
            notes,
          });
        } catch {
          result = "invalid-draft-id";
        }
        return new Response(JSON.stringify({ ok: true, result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ ok: true, skipped: "no command in reply" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Email door: new draft. "as-is:" subject prefix skips the voice agent.
    const asIs = /^as-is:/i.test(subject.trim());
    const title = subject.replace(/^as-is:\s*/i, "").trim() || undefined;
    const draftId = await ctx.runMutation(internal.drafts.insertDraftFromEmail, {
      title,
      rawInput: cleaned.slice(0, MAX_DRAFT_INPUT_CHARS),
      mode: asIs ? "as-is" : "rewrite",
      sourceMessageId: sourceMessageId || undefined,
    });

    return new Response(JSON.stringify({ ok: true, draftId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/hooks/github: merged review PRs publish, closed PRs reject.
// Verifies X-Hub-Signature-256 HMAC with GITHUB_WEBHOOK_SECRET.
http.route({
  path: "/api/hooks/github",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = pipelineEnvConfigured("GITHUB_WEBHOOK_SECRET");
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "GitHub webhook not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256") ?? "";
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(rawBody),
    );
    const expected =
      "sha256=" +
      Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    if (!timingSafeEqual(signatureHeader, expected)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limit only after the signature checks out, so bad traffic
    // cannot starve legitimate GitHub deliveries
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "webhookInbound",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

    const event = request.headers.get("x-github-event");
    if (event !== "pull_request") {
      return new Response(JSON.stringify({ ok: true, skipped: event }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let payload: {
      action?: string;
      pull_request?: {
        number?: number;
        merged?: boolean;
        head?: { ref?: string };
      };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (
      payload.action === "closed" &&
      payload.pull_request?.number !== undefined &&
      payload.pull_request.head?.ref
    ) {
      await ctx.scheduler.runAfter(0, internal.githubReview.handlePrClosed, {
        prNumber: payload.pull_request.number,
        merged: payload.pull_request.merged ?? false,
        branchRef: payload.pull_request.head.ref,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// GET /x/callback: completes the X OAuth 2.0 PKCE handshake started from the
// dashboard. Public route, but only completes with a valid admin-created
// state row; redirects back to the dashboard that began the connect.
http.route({
  path: "/x/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
      name: "xCallback",
    });
    if (!rl.ok) return rateLimitedResponse(rl.retryAfter);
    return await processXCallback(ctx, new URL(request.url));
  }),
});

// MCP server: JSON-RPC 2.0 over HTTP, replaces the old Netlify edge function.
// Optional gate via MCP_API_KEY (Bearer token); rate limited at 50/min.
http.route({
  path: "/mcp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    return await handleMcpRequest(ctx, request);
  }),
});

http.route({
  path: "/mcp",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return mcpPreflightResponse();
  }),
});

// ConvexFS routes for file uploads/downloads
// Only register routes when Bunny CDN is configured
// - POST /fs/upload - Upload files to Bunny.net storage
// - GET /fs/blobs/{blobId} - Returns 302 redirect to signed CDN URL
if (fs) {
  registerRoutes(http, components.fs, fs, {
    pathPrefix: "/fs",
    uploadAuth: async (ctx) => {
      return await ctx.runQuery(internal.authAdmin.isCurrentUserDashboardAdminInternal, {});
    },
    downloadAuth: async () => {
      // Public downloads - images should be accessible to all
      return true;
    },
  });
}

// ---------------------------------------------------------------------------
// Static file serving with per-content meta injection.
// Replaces @convex-dev/self-hosting registerStaticRoutes so that /{slug}
// routes matching a published post or page get their own title, description,
// robots, canonical, Open Graph, and Twitter tags server-rendered into
// index.html. Crawlers never execute JavaScript, so the client-side meta
// effects in Post.tsx are invisible to them; this catch-all is what makes
// share previews work on Convex static hosting (Netlify edge functions did
// this job in the legacy hosting mode).

type ContentMeta = {
  type: "post" | "page";
  slug: string;
  title: string;
  description: string;
  date?: string;
  image?: string;
  ogImage?: string;
  noOgImage?: boolean;
  unlisted?: boolean;
  authorName?: string;
};

function hasFileExtension(path: string): boolean {
  const lastSegment = path.split("/").pop() || "";
  return lastSegment.includes(".") && !lastSegment.startsWith(".");
}

// Vite hashed assets (index-lj_vq_aF.js) can be cached forever.
function isHashedAsset(path: string): boolean {
  return /[-.][\dA-Za-z_]{6,12}\.[a-z]+$/.test(path);
}

// Build the head tags for a post or page. ogImage frontmatter wins over the
// featured image, which wins over the site default; noOgImage removes the
// share image entirely and drops the Twitter card to text-only summary.
function buildContentMetaTags(meta: ContentMeta): string {
  const siteUrl = (process.env.SITE_URL || "https://waynesutton.ai").replace(
    /\/+$/,
    "",
  );
  const canonicalUrl = `${siteUrl}/${meta.slug}`;
  const defaultImage = `${siteUrl}/images/og-default.png`;

  const resolveImageUrl = (value: string): string =>
    value.startsWith("http")
      ? value
      : `${siteUrl}${value.startsWith("/") ? "" : "/"}${value}`;
  let ogImage = defaultImage;
  if (meta.ogImage) {
    ogImage = resolveImageUrl(meta.ogImage);
  } else if (meta.image) {
    ogImage = resolveImageUrl(meta.image);
  }
  const hideImage = meta.noOgImage === true;

  const safeTitle = escapeHtml(meta.title);
  const safeDescription = escapeHtml(meta.description);
  const ogType = meta.type === "post" ? "article" : "website";
  const robots = meta.unlisted ? "noindex, nofollow" : "index, follow";

  const lines: Array<string> = [
    `<title>${safeTitle} | ${SITE_NAME}</title>`,
    `<meta name="description" content="${safeDescription}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    `<link rel="alternate" hreflang="en" href="${canonicalUrl}">`,
    `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}">`,
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDescription}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
  ];
  if (!hideImage) {
    lines.push(`<meta property="og:image" content="${ogImage}">`);
  }
  if (meta.date) {
    lines.push(`<meta property="article:published_time" content="${meta.date}">`);
  }
  lines.push(
    `<meta name="twitter:card" content="${hideImage ? "summary" : "summary_large_image"}">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDescription}">`,
  );
  if (!hideImage) {
    lines.push(`<meta name="twitter:image" content="${ogImage}">`);
  }

  // Article structured data for posts helps search engines show rich results.
  if (meta.type === "post") {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: meta.title,
      description: meta.description,
      url: canonicalUrl,
      ...(meta.date ? { datePublished: meta.date } : {}),
      ...(hideImage ? {} : { image: ogImage }),
      author: { "@type": "Person", name: meta.authorName || SITE_NAME },
    };
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    );
  }

  return lines.join("\n    ");
}

// Strip the generic site-wide tags from the built index.html head and insert
// the content-specific block. Regexes tolerate multi-line tags and any
// attribute order from the Vite build ([^>]* cannot cross a closing bracket,
// so each match stays within a single tag).
function injectContentMeta(html: string, meta: ContentMeta): string {
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(
      /<meta[^>]*(?:name|property)=["'](?:description|robots|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi,
      "",
    )
    .replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<link[^>]*hreflang=["'][^"']*["'][^>]*>/gi, "");
  return stripped.replace(
    /<\/head>/i,
    `${buildContentMetaTags(meta)}\n  </head>`,
  );
}

const serveStaticWithMeta = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path === "" || path === "/") {
    path = "/index.html";
  }

  type StaticAsset = {
    path: string;
    storageId?: string;
    blobId?: string;
    contentType: string;
  } | null;

  let asset: StaticAsset = await ctx.runQuery(
    components.selfHosting.lib.getByPath,
    { path },
  );

  // SPA fallback: unknown extension-less paths serve index.html. Single
  // segment routes additionally get per-content meta when a published post
  // or page matches the slug (unknown slugs serve index.html untouched).
  let contentMeta: ContentMeta | null = null;
  if (!asset && !hasFileExtension(path)) {
    const slugMatch = /^\/([A-Za-z0-9-]+)\/?$/.exec(path);
    if (slugMatch) {
      contentMeta = await ctx.runQuery(internal.seo.getContentMetaBySlug, {
        slug: slugMatch[1],
      });
    }
    asset = await ctx.runQuery(components.selfHosting.lib.getByPath, {
      path: "/index.html",
    });
  }

  if (!asset) {
    if (path === "/index.html") {
      return new Response(
        "Static assets not deployed yet. Run: npm run deploy",
        { status: 200, headers: { "Content-Type": "text/plain" } },
      );
    }
    // no-store: without it Cloudflare stamps a 4h browser TTL onto 404s,
    // and a transiently missing chunk stays cached as a failure client-side.
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  if (!asset.storageId) {
    return new Response("Asset not available", {
      status: 500,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const etag = `"${asset.storageId}"`;
  const isInjected =
    contentMeta !== null && asset.contentType.startsWith("text/html");

  // 304 handling only for untouched assets; injected HTML changes whenever
  // the post or page is edited, independent of the deployed file.
  if (!isInjected) {
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": isHashedAsset(path)
            ? "public, max-age=31536000, immutable"
            : "public, max-age=0, must-revalidate",
        },
      });
    }
  }

  const blob = await ctx.storage.get(asset.storageId as Id<"_storage">);
  if (!blob) {
    return new Response("Storage error", {
      status: 500,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  if (isInjected && contentMeta) {
    const htmlSource = await blob.text();
    return new Response(injectContentMeta(htmlSource, contentMeta), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const cacheControl = isHashedAsset(path)
    ? "public, max-age=31536000, immutable"
    : "public, max-age=0, must-revalidate";

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": cacheControl,
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
});

// Registered last so every explicit route above takes precedence; this is
// the catch-all that serves the built frontend (dist/) with SPA fallback.
http.route({
  pathPrefix: "/",
  method: "GET",
  handler: serveStaticWithMeta,
});

export default http;
