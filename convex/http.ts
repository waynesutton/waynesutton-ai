import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/self-hosting";
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
  type?: "post" | "page";
}): string {
  const siteUrl = process.env.SITE_URL || "https://waynesutton.ai";
  const siteName = "Wayne Sutton";
  const defaultImage = `${siteUrl}/images/og-default.svg`;
  const canonicalUrl = `${siteUrl}/${content.slug}`;

  // Resolve image URL: use post image if available, otherwise default
  let ogImage = defaultImage;
  if (content.image) {
    // Handle both absolute URLs and relative paths
    ogImage = content.image.startsWith("http")
      ? content.image
      : `${siteUrl}${content.image}`;
  }

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
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${ogImage}">
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
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${ogImage}">
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

// Strip quoted replies and signatures from an email body
function cleanEmailBody(text: string): string {
  const lines = text.split("\n");
  const kept: Array<string> = [];
  for (const line of lines) {
    // Stop at quoted reply markers
    if (/^On .+ wrote:\s*$/.test(line.trim())) break;
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(line.trim())) break;
    if (line.trim() === "--") break; // signature delimiter
    if (line.trimStart().startsWith(">")) continue; // quoted lines
    kept.push(line);
  }
  return kept.join("\n").trim();
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

    // Only inbound mail creates drafts. Without this guard, subscribing the
    // webhook to all events would echo our own message.sent previews back
    // through the email door.
    if (
      typeof body.event_type === "string" &&
      body.event_type !== "message.received"
    ) {
      return new Response(
        JSON.stringify({ ok: true, skipped: body.event_type }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // AgentMail wraps the message differently per event version; be defensive
    const message = (body.message ??
      (body.data as Record<string, unknown> | undefined)?.message ??
      body) as Record<string, unknown>;
    const subject = typeof message.subject === "string" ? message.subject : "";
    const text =
      typeof message.text === "string"
        ? message.text
        : typeof message.body === "string"
          ? message.body
          : "";
    if (!text.trim()) {
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

// Static file serving for self-hosted deployments. Registered last so every
// explicit route above takes precedence; this is the catch-all that serves
// the built frontend (dist/) with SPA fallback to index.html.
registerStaticRoutes(http, components.selfHosting);

export default http;
