import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";
import selfHosting from "@convex-dev/self-hosting/convex.config";
import r2 from "@convex-dev/r2/convex.config";
import fs from "convex-fs/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import agentReady from "@waynesutton/agent-ready/convex.config.js";
import crons from "@convex-dev/crons/convex.config.js";
import workpool from "@convex-dev/workpool/convex.config.js";
import agent from "@convex-dev/agent/convex.config.js";
import rag from "@convex-dev/rag/convex.config.js";

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

// Convex static self-hosting component (default hosting mode)
app.use(selfHosting);

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

