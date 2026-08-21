import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Blog posts table
  posts: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    date: v.string(),
    published: v.boolean(),
    tags: v.array(v.string()),
    readTime: v.optional(v.string()),
    image: v.optional(v.string()), // Header/OG image URL
    ogImage: v.optional(v.string()), // OG/Twitter share image override (does not affect cards or header)
    noOgImage: v.optional(v.boolean()), // Disable OG image entirely (text-only share preview)
    showImageAtTop: v.optional(v.boolean()), // Display image at top of post (default: false)
    excerpt: v.optional(v.string()), // Short excerpt for card view
    featured: v.optional(v.boolean()), // Show in featured section
    featuredOrder: v.optional(v.number()), // Order in featured section (lower = first)
    authorName: v.optional(v.string()), // Author display name
    authorImage: v.optional(v.string()), // Author avatar image URL (round)
    layout: v.optional(v.string()), // Layout type: "sidebar" for docs-style layout
    rightSidebar: v.optional(v.boolean()), // Enable right sidebar with CopyPageDropdown
    showFooter: v.optional(v.boolean()), // Show footer on this post (overrides siteConfig default)
    footer: v.optional(v.string()), // Footer markdown content (overrides siteConfig defaultContent)
    showSocialFooter: v.optional(v.boolean()), // Show social footer on this post (overrides siteConfig default)
    aiChat: v.optional(v.boolean()), // Enable AI chat in right sidebar
    blogFeatured: v.optional(v.boolean()), // Show as hero featured post on /blog page
    newsletter: v.optional(v.boolean()), // Override newsletter signup display (true/false)
    contactForm: v.optional(v.boolean()), // Enable contact form on this post
    unlisted: v.optional(v.boolean()), // Hide from listings but allow direct access via slug
    aiWritten: v.optional(v.boolean()), // Show "written with AI and proofed by a human" note under the title
    audio: v.optional(v.boolean()), // Show listen-to-this-post player (overrides siteConfig.audio.enabledDefault)
    audioVoice: v.optional(v.union(v.literal("male"), v.literal("female"))), // Voice override (overrides siteConfig.audio.defaultVoice)
    audioStorageId: v.optional(v.id("_storage")), // Generated reading stored in Convex file storage
    audioDuration: v.optional(v.number()), // Duration in seconds
    audioContentHash: v.optional(v.string()), // Hash of title + stripped body + voice; skip regen when unchanged
    audioStatus: v.optional(
      v.union(v.literal("pending"), v.literal("ready"), v.literal("failed")),
    ),
    docsSection: v.optional(v.boolean()), // Include in docs navigation
    docsSectionGroup: v.optional(v.string()), // Sidebar group name in docs
    docsSectionOrder: v.optional(v.number()), // Order within group (lower = first)
    docsSectionGroupOrder: v.optional(v.number()), // Order of group itself (lower = first)
    docsSectionGroupIcon: v.optional(v.string()), // Phosphor icon name for sidebar group
    docsLanding: v.optional(v.boolean()), // Use as /docs landing page
    slides: v.optional(v.boolean()), // Enable slide presentation mode (--- separates slides)
    lastSyncedAt: v.number(),
    source: v.optional(v.union(v.literal("dashboard"), v.literal("sync"), v.literal("demo"))), // Content source: "dashboard" (created in UI), "sync" (from markdown files), or "demo" (anonymous demo mode, cleaned up every 30 minutes)
    demo: v.optional(v.boolean()), // Marks content as demo sample (recognized by app and database)
    embedding: v.optional(v.array(v.float64())), // Vector embedding for semantic search (1536 dimensions, OpenAI text-embedding-ada-002)
  })
    .index("by_slug", ["slug"])
    .index("by_date", ["date"])
    .index("by_published", ["published"])
    .index("by_featured", ["featured"])
    .index("by_blogfeatured", ["blogFeatured"])
    .index("by_authorname", ["authorName"])
    .index("by_docssection", ["docsSection"])
    .index("by_source", ["source"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["published"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["published"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["published"],
    }),

  // Portfolio items. kind is "project" or "craft" in one table.
  projects: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    content: v.string(),
    date: v.string(),
    published: v.boolean(),
    tags: v.array(v.string()),
    url: v.optional(v.string()),
    image: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    featuredOrder: v.optional(v.number()),
    kind: v.union(v.literal("project"), v.literal("craft")),
    lastSyncedAt: v.number(),
    source: v.optional(
      v.union(v.literal("dashboard"), v.literal("sync"), v.literal("demo")),
    ),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"])
    .index("by_kind", ["kind"])
    .index("by_published_and_kind", ["published", "kind"])
    .index("by_featured", ["featured"]),

  // Static pages (about, projects, contact, etc.)
  pages: defineTable({
    slug: v.string(),
    title: v.string(),
    content: v.string(),
    published: v.boolean(),
    order: v.optional(v.number()), // Display order in nav
    showInNav: v.optional(v.boolean()), // Show in navigation menu (default: true)
    excerpt: v.optional(v.string()), // Short excerpt for card view
    image: v.optional(v.string()), // Thumbnail/OG image URL for featured cards
    ogImage: v.optional(v.string()), // OG/Twitter share image override (does not affect cards or header)
    noOgImage: v.optional(v.boolean()), // Disable OG image entirely (text-only share preview)
    showImageAtTop: v.optional(v.boolean()), // Display image at top of page (default: false)
    featured: v.optional(v.boolean()), // Show in featured section
    featuredOrder: v.optional(v.number()), // Order in featured section (lower = first)
    authorName: v.optional(v.string()), // Author display name
    authorImage: v.optional(v.string()), // Author avatar image URL (round)
    layout: v.optional(v.string()), // Layout type: "sidebar" for docs-style layout
    rightSidebar: v.optional(v.boolean()), // Enable right sidebar with CopyPageDropdown
    showFooter: v.optional(v.boolean()), // Show footer on this page (overrides siteConfig default)
    footer: v.optional(v.string()), // Footer markdown content (overrides siteConfig defaultContent)
    showSocialFooter: v.optional(v.boolean()), // Show social footer on this page (overrides siteConfig default)
    aiChat: v.optional(v.boolean()), // Enable AI chat in right sidebar
    contactForm: v.optional(v.boolean()), // Enable contact form on this page
    newsletter: v.optional(v.boolean()), // Override newsletter signup display (true/false)
    unlisted: v.optional(v.boolean()), // Hide from listings but allow direct access via slug
    textAlign: v.optional(v.string()), // Text alignment: "left", "center", "right" (default: "left")
    docsSection: v.optional(v.boolean()), // Include in docs navigation
    docsSectionGroup: v.optional(v.string()), // Sidebar group name in docs
    docsSectionOrder: v.optional(v.number()), // Order within group (lower = first)
    docsSectionGroupOrder: v.optional(v.number()), // Order of group itself (lower = first)
    docsSectionGroupIcon: v.optional(v.string()), // Phosphor icon name for sidebar group
    docsLanding: v.optional(v.boolean()), // Use as /docs landing page
    slides: v.optional(v.boolean()), // Enable slide presentation mode (--- separates slides)
    lastSyncedAt: v.number(),
    source: v.optional(v.union(v.literal("dashboard"), v.literal("sync"), v.literal("demo"))), // Content source: "dashboard" (created in UI), "sync" (from markdown files), or "demo" (anonymous demo mode, cleaned up every 30 minutes)
    demo: v.optional(v.boolean()), // Marks content as demo sample (recognized by app and database)
    embedding: v.optional(v.array(v.float64())), // Vector embedding for semantic search (1536 dimensions, OpenAI text-embedding-ada-002)
  })
  .index("by_slug", ["slug"])
  .index("by_published", ["published"])
  .index("by_featured", ["featured"])
  .index("by_docssection", ["docsSection"])
  .index("by_source", ["source"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["published"],
    })
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["published"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["published"],
    }),

  // View counts for analytics
  viewCounts: defineTable({
    slug: v.string(),
    count: v.number(),
  }).index("by_slug", ["slug"]),

  // Site configuration (about content, links, etc.)
  siteConfig: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // Page view events for analytics (event records pattern)
  pageViews: defineTable({
    path: v.string(),
    pageType: v.string(), // "blog" | "page" | "home" | "stats"
    sessionId: v.string(),
    timestamp: v.number(),
  })
    .index("by_path", ["path"])
    .index("by_timestamp", ["timestamp"])
    .index("by_sessionid_and_path", ["sessionId", "path"]),

  // Active sessions for real-time visitor tracking
  activeSessions: defineTable({
    sessionId: v.string(),
    currentPath: v.string(),
    lastSeen: v.number(),
    // Location data (optional, from Netlify geo headers)
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  })
    .index("by_sessionid", ["sessionId"])
    .index("by_lastseen", ["lastSeen"]),

  // AI chat conversations for writing assistant
  aiChats: defineTable({
    ownerSubject: v.optional(v.string()), // Authenticated user who owns this chat
    sessionId: v.string(), // Anonymous session ID from localStorage
    contextId: v.string(), // Slug or "write-page" identifier
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
        attachments: v.optional(
          v.array(
            v.object({
              type: v.union(v.literal("image"), v.literal("link")),
              storageId: v.optional(v.id("_storage")),
              url: v.optional(v.string()),
              scrapedContent: v.optional(v.string()),
              title: v.optional(v.string()),
            }),
          ),
        ),
      }),
    ),
    pageContext: v.optional(v.string()), // Loaded page markdown content
    lastMessageAt: v.optional(v.number()),
    generating: v.optional(v.boolean()),
    lastError: v.optional(v.string()),
  })
    .index("by_sessionid_and_contextid", ["sessionId", "contextId"]),

  // AI generated images from Gemini image generation
  aiGeneratedImages: defineTable({
    ownerSubject: v.optional(v.string()), // Authenticated user who created the image
    sessionId: v.string(), // Anonymous session ID from localStorage
    prompt: v.string(), // User's image prompt
    model: v.string(), // Model used: "gemini-2.5-flash-image" or "gemini-3-pro-image-preview"
    storageId: v.id("_storage"), // Convex storage ID for the generated image
    mimeType: v.string(), // Image MIME type: "image/png" or "image/jpeg"
    createdAt: v.number(), // Timestamp when image was generated
  })
    .index("by_sessionid", ["sessionId"])
    .index("by_createdat", ["createdAt"])
    .index("by_storageid", ["storageId"]),

  // Persisted image generation jobs for reactive dashboard status updates
  aiImageGenerationJobs: defineTable({
    ownerSubject: v.optional(v.string()),
    sessionId: v.string(),
    prompt: v.string(),
    model: v.string(),
    aspectRatio: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    storageId: v.optional(v.id("_storage")),
    mimeType: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_sessionid", ["sessionId"])
    .index("by_createdat", ["createdAt"])
    .index("by_storageid", ["storageId"]),

  // Persisted URL import jobs for reactive dashboard status updates
  importUrlJobs: defineTable({
    ownerSubject: v.optional(v.string()),
    url: v.string(),
    published: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_createdat", ["createdAt"]),

  // Persisted semantic search jobs for reactive search modal status updates
  semanticSearchJobs: defineTable({
    ownerSubject: v.optional(v.string()),
    query: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    results: v.optional(
      v.array(
        v.object({
          _id: v.string(),
          type: v.union(v.literal("post"), v.literal("page")),
          slug: v.string(),
          title: v.string(),
          description: v.optional(v.string()),
          snippet: v.string(),
          score: v.number(),
        }),
      ),
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_createdat", ["createdAt"]),

  // Newsletter subscribers table
  // Stores email subscriptions with unsubscribe tokens
  newsletterSubscribers: defineTable({
    email: v.string(), // Subscriber email address (lowercase, trimmed)
    subscribed: v.boolean(), // Current subscription status
    subscribedAt: v.number(), // Timestamp when subscribed
    unsubscribedAt: v.optional(v.number()), // Timestamp when unsubscribed (if applicable)
    source: v.string(), // Where they signed up: "home", "blog-page", "post", or "post:slug-name"
    unsubscribeToken: v.string(), // Secure token for unsubscribe links
  })
    .index("by_email", ["email"])
    .index("by_subscribed", ["subscribed"]),

  // Newsletter sent tracking (posts and custom emails)
  // Tracks what has been sent to prevent duplicate newsletters
  newsletterSentPosts: defineTable({
    postSlug: v.string(), // Slug of the post or custom email identifier
    sentAt: v.number(), // Timestamp when the newsletter was sent
    sentCount: v.number(), // Number of subscribers it was sent to
    type: v.optional(v.string()), // "post" or "custom" (default "post" for backwards compat)
    subject: v.optional(v.string()), // Subject line for custom emails
  })
    .index("by_postslug", ["postSlug"])
    .index("by_sentat", ["sentAt"]),

  // Contact form messages
  // Stores messages submitted via contact forms on posts/pages
  contactMessages: defineTable({
    name: v.string(), // Sender's name
    email: v.string(), // Sender's email address
    message: v.string(), // Message content
    source: v.string(), // Where submitted from: "page:slug" or "post:slug"
    createdAt: v.number(), // Timestamp when submitted
    emailSentAt: v.optional(v.number()), // Timestamp when email was sent (if applicable)
  }).index("by_createdat", ["createdAt"]),

  // Ask AI sessions for header AI chat feature
  // Stores questions and stream IDs for RAG-based Q&A
  askAISessions: defineTable({
    ownerSubject: v.optional(v.string()), // Authenticated user who created the stream
    question: v.string(), // User's question
    streamId: v.string(), // Persistent text streaming ID
    model: v.optional(v.string()), // Selected AI model
    createdAt: v.number(), // Timestamp when session was created
    sources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          slug: v.string(),
          type: v.string(),
        })
      )
    ), // Optional sources cited in the response
  }).index("by_streamid", ["streamId"]),

  // Content version history for posts and pages
  // Stores snapshots before each update for 3-day retention
  contentVersions: defineTable({
    contentType: v.union(v.literal("post"), v.literal("page")), // Type of content
    contentId: v.string(), // ID of the post or page (stored as string for flexibility)
    slug: v.string(), // Slug for display and querying
    title: v.string(), // Title at time of snapshot
    content: v.string(), // Full markdown content at time of snapshot
    description: v.optional(v.string()), // Description (posts only)
    createdAt: v.number(), // Timestamp when version was created
    source: v.union(
      v.literal("sync"),
      v.literal("dashboard"),
      v.literal("restore")
    ), // What triggered the version capture
  })
    .index("by_contenttype_and_slug", ["contentType", "slug"])
    .index("by_createdat", ["createdAt"])
    .index("by_contenttype_and_contentid_and_createdat", ["contentType", "contentId", "createdAt"]),

  // Version control settings
  // Stores toggle state for version control feature
  versionControlSettings: defineTable({
    key: v.string(), // Setting key: "enabled"
    value: v.boolean(), // Setting value
  }).index("by_key", ["key"]),

  // Dashboard admin access control
  // Access can be granted by auth subject and/or email for compatibility
  dashboardAdmins: defineTable({
    subject: v.optional(v.string()), // Auth identity subject
    email: v.optional(v.string()), // Auth identity email (lowercase)
    createdAt: v.number(),
    createdBySubject: v.optional(v.string()),
  })
    .index("by_subject", ["subject"])
    .index("by_email", ["email"]),

  // Agent blog pipeline: incoming drafts from agents, email, and paste box
  drafts: defineTable({
    title: v.optional(v.string()),
    rawInput: v.string(), // What arrived (notes, article text, or link context)
    postBody: v.optional(v.string()), // What the voice agent wrote (or cleaned as-is body)
    type: v.union(
      v.literal("session-summary"),
      v.literal("link-commentary"),
      v.literal("article"),
    ),
    mode: v.union(v.literal("rewrite"), v.literal("as-is")),
    source: v.string(), // claude-code, cursor, codex, chatgpt, grok, claude, email, paste, mcp
    links: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("inbox"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("rejected"),
    ),
    agentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("done"),
        v.literal("failed"),
      ),
    ),
    agentError: v.optional(v.string()),
    publishedSlug: v.optional(v.string()), // Slug of the post created from this draft
    // How the post was created: listed (live), unlisted (live, hidden from
    // listings and search), or draft (post exists but is not published)
    postVisibility: v.optional(
      v.union(v.literal("listed"), v.literal("unlisted"), v.literal("draft")),
    ),
    prNumber: v.optional(v.number()), // GitHub PR review surface
    prUrl: v.optional(v.string()),
    // AgentMail message_id so email ingest is idempotent
    sourceMessageId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_pr_number", ["prNumber"])
    .index("by_source_message_id", ["sourceMessageId"]),

  // Agent blog pipeline: hashed API keys for POST /api/v1/drafts
  apiKeys: defineTable({
    keyHash: v.string(), // SHA-256 hex of the plaintext key (plaintext never stored)
    label: v.string(), // One key per tool so drafts show their source
    autoPublish: v.boolean(),
    lastUsed: v.optional(v.number()),
    createdAt: v.number(),
    createdBySubject: v.optional(v.string()),
  }).index("by_hash", ["keyHash"]),

  // Vendor API key overrides set from the dashboard. Each row overrides the
  // matching Convex environment variable for this deployment (dev and prod
  // deployments each keep their own rows). Values are only readable by
  // internal functions; admin queries report presence, never values.
  vendorKeys: defineTable({
    name: v.string(), // Env var name, e.g. "OPENAI_API_KEY"
    value: v.string(),
    updatedAt: v.number(),
    updatedBySubject: v.optional(v.string()),
  }).index("by_name", ["name"]),

  // Agent-ready widget settings controlled from the dashboard. Singleton row
  // keyed by "widget"; the public site reads it so changes apply live
  // without a redeploy. Falls back to App.tsx defaults when absent.
  agentReadySettings: defineTable({
    key: v.string(), // "widget"
    enabled: v.boolean(),
    position: v.string(), // e.g. "floating-bottom-right"
    widgetTheme: v.string(), // "dark" | "light" | "auto"
    defaultMobileCollapsed: v.boolean(),
    showHumanTab: v.boolean(),
    showMachineTab: v.boolean(),
    showScoreTab: v.boolean(),
    showChatLinks: v.boolean(),
    autoSyncOnPublish: v.optional(v.boolean()), // When true, publishing a public post refreshes llms.txt/agents.md automatically
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Agent blog pipeline: voice rules used by the rewrite agent (single row)
  voiceProfile: defineTable({
    rules: v.string(),
    updatedAt: v.number(),
  }),

  // Agent blog pipeline: inbox settings singleton keyed by "inbox"
  draftSettings: defineTable({
    key: v.string(), // "inbox"
    aiWrittenDefault: v.boolean(), // Stamp aiWritten on new posts from the inbox
    // Mirror of siteConfig.audio. Written in the same mutation as runtime overrides.
    audioEnabledDefault: v.optional(v.boolean()),
    audioDefaultVoice: v.optional(v.union(v.literal("male"), v.literal("female"))),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Queued listen-to-this-post TTS jobs
  audioJobs: defineTable({
    postId: v.id("posts"),
    voice: v.union(v.literal("male"), v.literal("female")),
    contentHash: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    storageId: v.optional(v.id("_storage")),
    duration: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_post_and_hash", ["postId", "contentHash"]),

  // Agent blog pipeline: record of published drafts
  publishLog: defineTable({
    draftId: v.id("drafts"),
    publishedAt: v.number(),
    slug: v.string(),
  }).index("by_draftid", ["draftId"]),

  // X (Twitter) integration: connected account tokens. Singleton row keyed
  // by "primary". Tokens are only readable by internal functions; the admin
  // status query reports the username and expiry, never token values.
  xAccounts: defineTable({
    key: v.string(), // "primary"
    username: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.optional(v.string()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // X OAuth 2.0 PKCE handshake state. Rows are consumed by the /x/callback
  // route and expire after 10 minutes.
  xOauthStates: defineTable({
    state: v.string(),
    codeVerifier: v.string(),
    redirectUri: v.string(),
    returnTo: v.string(), // Dashboard origin to bounce back to after connect
    createdAt: v.number(),
  }).index("by_state", ["state"]),

  // Log of posts shared to X from the dashboard or the publish flow
  xShares: defineTable({
    text: v.string(),
    tweetId: v.string(),
    tweetUrl: v.string(),
    postSlug: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdat", ["createdAt"]),
});
