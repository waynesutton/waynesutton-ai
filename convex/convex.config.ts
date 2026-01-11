import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config.js";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config";
import fs from "convex-fs/convex.config.js";

const app = defineApp();

// Aggregate component for efficient page view counts (O(log n) instead of O(n))
app.use(aggregate, { name: "pageViewsByPath" });

// Aggregate component for total page views count
app.use(aggregate, { name: "totalPageViews" });

// Aggregate component for unique visitors count
app.use(aggregate, { name: "uniqueVisitors" });

// Persistent text streaming for real-time AI responses in Ask AI feature
app.use(persistentTextStreaming);

// ConvexFS for file storage with Bunny CDN
app.use(fs);

export default app;

