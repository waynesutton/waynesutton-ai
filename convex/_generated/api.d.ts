/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentReady_analytics from "../agentReady/analytics.js";
import type * as agentReady_autoSync from "../agentReady/autoSync.js";
import type * as agentReady_content from "../agentReady/content.js";
import type * as agentReady_settings from "../agentReady/settings.js";
import type * as aiChatActions from "../aiChatActions.js";
import type * as aiChats from "../aiChats.js";
import type * as aiImageGeneration from "../aiImageGeneration.js";
import type * as aiImageJobs from "../aiImageJobs.js";
import type * as aiModels from "../aiModels.js";
import type * as askAI from "../askAI.js";
import type * as audio from "../audio.js";
import type * as audioDefaults from "../audioDefaults.js";
import type * as audioGeneration from "../audioGeneration.js";
import type * as auth from "../auth.js";
import type * as authAdmin from "../authAdmin.js";
import type * as cms from "../cms.js";
import type * as contact from "../contact.js";
import type * as contactActions from "../contactActions.js";
import type * as crons from "../crons.js";
import type * as dashboardAuth from "../dashboardAuth.js";
import type * as demo from "../demo.js";
import type * as draftEmails from "../draftEmails.js";
import type * as drafts from "../drafts.js";
import type * as embeddings from "../embeddings.js";
import type * as embeddingsAdmin from "../embeddingsAdmin.js";
import type * as embeddingsQueries from "../embeddingsQueries.js";
import type * as files from "../files.js";
import type * as fs from "../fs.js";
import type * as githubReview from "../githubReview.js";
import type * as http from "../http.js";
import type * as importAction from "../importAction.js";
import type * as importJobs from "../importJobs.js";
import type * as lib_agentMailMessage from "../lib/agentMailMessage.js";
import type * as lib_aiModelSlots from "../lib/aiModelSlots.js";
import type * as lib_aiProviderResolver from "../lib/aiProviderResolver.js";
import type * as lib_audioText from "../lib/audioText.js";
import type * as lib_newsletterAutomation from "../lib/newsletterAutomation.js";
import type * as lib_readTime from "../lib/readTime.js";
import type * as lib_secretCompare from "../lib/secretCompare.js";
import type * as lib_skillsDirectory from "../lib/skillsDirectory.js";
import type * as lib_syncAuth from "../lib/syncAuth.js";
import type * as lib_vendorKeyResolver from "../lib/vendorKeyResolver.js";
import type * as lib_webResearch from "../lib/webResearch.js";
import type * as mcp from "../mcp.js";
import type * as media from "../media.js";
import type * as newsletter from "../newsletter.js";
import type * as newsletterActions from "../newsletterActions.js";
import type * as newsletterAutomation from "../newsletterAutomation.js";
import type * as newsletterAutomationActions from "../newsletterAutomationActions.js";
import type * as pages from "../pages.js";
import type * as pipelineKeys from "../pipelineKeys.js";
import type * as posts from "../posts.js";
import type * as projects from "../projects.js";
import type * as r2 from "../r2.js";
import type * as rateLimits from "../rateLimits.js";
import type * as rss from "../rss.js";
import type * as search from "../search.js";
import type * as semanticSearch from "../semanticSearch.js";
import type * as semanticSearchJobs from "../semanticSearchJobs.js";
import type * as semanticSearchQueries from "../semanticSearchQueries.js";
import type * as seo from "../seo.js";
import type * as siteConfigData from "../siteConfigData.js";
import type * as skills from "../skills.js";
import type * as staticHosting from "../staticHosting.js";
import type * as stats from "../stats.js";
import type * as versions from "../versions.js";
import type * as virtualFs from "../virtualFs.js";
import type * as voiceAgent from "../voiceAgent.js";
import type * as webResearch from "../webResearch.js";
import type * as xIntegration from "../xIntegration.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agentReady/analytics": typeof agentReady_analytics;
  "agentReady/autoSync": typeof agentReady_autoSync;
  "agentReady/content": typeof agentReady_content;
  "agentReady/settings": typeof agentReady_settings;
  aiChatActions: typeof aiChatActions;
  aiChats: typeof aiChats;
  aiImageGeneration: typeof aiImageGeneration;
  aiImageJobs: typeof aiImageJobs;
  aiModels: typeof aiModels;
  askAI: typeof askAI;
  audio: typeof audio;
  audioDefaults: typeof audioDefaults;
  audioGeneration: typeof audioGeneration;
  auth: typeof auth;
  authAdmin: typeof authAdmin;
  cms: typeof cms;
  contact: typeof contact;
  contactActions: typeof contactActions;
  crons: typeof crons;
  dashboardAuth: typeof dashboardAuth;
  demo: typeof demo;
  draftEmails: typeof draftEmails;
  drafts: typeof drafts;
  embeddings: typeof embeddings;
  embeddingsAdmin: typeof embeddingsAdmin;
  embeddingsQueries: typeof embeddingsQueries;
  files: typeof files;
  fs: typeof fs;
  githubReview: typeof githubReview;
  http: typeof http;
  importAction: typeof importAction;
  importJobs: typeof importJobs;
  "lib/agentMailMessage": typeof lib_agentMailMessage;
  "lib/aiModelSlots": typeof lib_aiModelSlots;
  "lib/aiProviderResolver": typeof lib_aiProviderResolver;
  "lib/audioText": typeof lib_audioText;
  "lib/newsletterAutomation": typeof lib_newsletterAutomation;
  "lib/readTime": typeof lib_readTime;
  "lib/secretCompare": typeof lib_secretCompare;
  "lib/skillsDirectory": typeof lib_skillsDirectory;
  "lib/syncAuth": typeof lib_syncAuth;
  "lib/vendorKeyResolver": typeof lib_vendorKeyResolver;
  "lib/webResearch": typeof lib_webResearch;
  mcp: typeof mcp;
  media: typeof media;
  newsletter: typeof newsletter;
  newsletterActions: typeof newsletterActions;
  newsletterAutomation: typeof newsletterAutomation;
  newsletterAutomationActions: typeof newsletterAutomationActions;
  pages: typeof pages;
  pipelineKeys: typeof pipelineKeys;
  posts: typeof posts;
  projects: typeof projects;
  r2: typeof r2;
  rateLimits: typeof rateLimits;
  rss: typeof rss;
  search: typeof search;
  semanticSearch: typeof semanticSearch;
  semanticSearchJobs: typeof semanticSearchJobs;
  semanticSearchQueries: typeof semanticSearchQueries;
  seo: typeof seo;
  siteConfigData: typeof siteConfigData;
  skills: typeof skills;
  staticHosting: typeof staticHosting;
  stats: typeof stats;
  versions: typeof versions;
  virtualFs: typeof virtualFs;
  voiceAgent: typeof voiceAgent;
  webResearch: typeof webResearch;
  xIntegration: typeof xIntegration;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  pageViewsByPath: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"pageViewsByPath">;
  totalPageViews: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"totalPageViews">;
  uniqueVisitors: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"uniqueVisitors">;
  uniquePaths: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"uniquePaths">;
  persistentTextStreaming: import("@convex-dev/persistent-text-streaming/_generated/component.js").ComponentApi<"persistentTextStreaming">;
  selfHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"selfHosting">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  fs: import("convex-fs/_generated/component.js").ComponentApi<"fs">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  crons: import("@convex-dev/crons/_generated/component.js").ComponentApi<"crons">;
  workpool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"workpool">;
  agentReady: import("@waynesutton/agent-ready/_generated/component.js").ComponentApi<"agentReady">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
};
