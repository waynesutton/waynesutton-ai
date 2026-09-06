import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up stale sessions every 5 minutes
crons.interval(
  "cleanup stale sessions",
  { minutes: 5 },
  internal.stats.cleanupStaleSessions,
  {}
);

// Admin-controlled publication emails and digests; disabled until configured.
crons.interval("newsletter automation", { minutes: 1 }, internal.newsletterAutomation.tick, {});

// Weekly stats summary: Send every Monday at 9:00 AM UTC
// Includes subscriber count, new subscribers, newsletters sent
crons.cron(
  "weekly stats summary",
  "0 9 * * 1", // 9:00 AM UTC on Mondays
  internal.newsletterActions.sendWeeklyStatsSummary,
  {
    siteName: process.env.SITE_NAME || "Newsletter",
  }
);

// Clean up old content versions daily at 3:00 AM UTC
// Deletes versions older than 3 days to maintain storage efficiency
crons.cron(
  "cleanup old content versions",
  "0 3 * * *", // 3:00 AM UTC daily
  internal.versions.cleanupOldVersions,
  {}
);

// Clean up anonymous demo content every 30 minutes
// Deletes all posts and pages with source="demo" created by anonymous dashboard visitors
crons.interval(
  "cleanup demo content",
  { minutes: 30 },
  internal.demo.cleanupDemoContent,
  {}
);

export default crons;

