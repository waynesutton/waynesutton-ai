import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import r2 from "@convex-dev/r2/convex.config";
import fs from "convex-fs/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import agentReady from "@waynesutton/agent-ready/convex.config.js";
import crons from "@convex-dev/crons/convex.config.js";
import workpool from "@convex-dev/workpool/convex.config.js";
import agent from "@convex-dev/agent/convex.config.js";
import rag from "@convex-dev/rag/convex.config.js";

// Web research (Firecrawl, Exa, Context.dev) is deliberately not installed as
// components: each one declares its API key as a required component env var,
// which turns a missing key into a failed `convex deploy`. The site calls
// their REST APIs from convex/lib/webResearch.ts with BYOK keys instead.
const app = defineApp();

// Aggregate component for efficient page view counts (O(log n) instead of O(n))
app.use(aggregate, { name: "pageViewsByPath" });

// Aggregate component for total page views count
app.use(aggregate, { name: "totalPageViews" });

// Aggregate component for unique visitors count
app.use(aggregate, { name: "uniqueVisitors" });

// Aggregate component for unique paths (tracks distinct pages that have been viewed)
app.use(aggregate, { name: "uniquePaths" });

// Persistent text streaming for real-time AI responses in Ask AI feature
app.use(persistentTextStreaming);

// Convex static-hosting component serves the built frontend (default hosting
// mode). The instance keeps the 0.1.x name "selfHosting" so 0.2.x inherits
// the existing manifest and the site never drops to a setup page during the
// cutover. No httpPrefix: convex/http.ts owns the root router (auth callbacks,
// webhooks, RSS, API, VFS, MCP all live there) and serves files itself.
app.use(staticHosting, { name: "selfHosting" });

// Optional Cloudflare R2 component for media uploads
app.use(r2);

// ConvexFS for file storage with Bunny CDN
app.use(fs);

// Rate limiter component for application-level rate limiting
app.use(rateLimiter);

// Dynamic cron scheduling (peer dep for agent-ready)
app.use(crons);

// Workpool for durable background jobs (peer dep for agent-ready)
app.use(workpool);

// Agent-ready component for llms.txt, agents.md, and llms-full.txt
app.use(agentReady);

// AI Agent component powers the voice agent for the blog pipeline
app.use(agent);

// RAG component gives the voice agent retrieval over site content
app.use(rag);

export default app;

