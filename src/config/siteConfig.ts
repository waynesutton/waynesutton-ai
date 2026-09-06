import { ReactNode } from "react";

// IMPORTANT: Keep this file in sync with Dashboard Config (src/pages/Dashboard.tsx ConfigSection)
// When adding/modifying options here, update the Dashboard Config UI to match.
// See CLAUDE.md "Configuration alignment" section for details.

// Re-export types from LogoMarquee for convenience
export type { LogoItem, LogoGalleryConfig } from "../components/LogoMarquee";
import type { LogoGalleryConfig } from "../components/LogoMarquee";

// GitHub contributions graph configuration
// Displays your GitHub activity on the homepage
export interface GitHubContributionsConfig {
  enabled: boolean; // Enable/disable the contributions graph
  username: string; // GitHub username to fetch contributions for
  showYearNavigation: boolean; // Show prev/next year arrows
  linkToProfile: boolean; // Click graph to go to GitHub profile
  title?: string; // Optional title above the graph
}

// Visitor map configuration
// Displays real-time visitor locations on a world map on the stats page
export interface VisitorMapConfig {
  enabled: boolean; // Enable/disable the visitor map
  title?: string; // Optional title above the map
}

// Inner page logo configuration
// Shows the site logo in the header on blog page, individual posts, and pages
// Does not affect the homepage logo (which is controlled separately)
export interface InnerPageLogoConfig {
  enabled: boolean; // Enable/disable logo on inner pages
  size: number; // Logo size in pixels (applied as height)
}

// Blog page configuration
// Controls whether posts appear on homepage, dedicated blog page, or both
export interface BlogPageConfig {
  enabled: boolean; // Enable the /blog route
  showInNav: boolean; // Show "Blog" link in navigation
  title: string; // Page title for the blog page
  description?: string; // Optional description shown on blog page
  order?: number; // Nav order (lower = first, matches page frontmatter order)
  viewMode: "list" | "cards"; // Default view mode (list or cards)
  showViewToggle: boolean; // Show toggle button to switch between views
}

export interface HomepageHighlightsConfig {
  projectsEnabled: boolean;
  projectSlugs: string[];
  projectsPosition: "above-posts" | "below-posts";
  projectsTitle: string;
  projectsThumbnails: boolean;
  postEnabled: boolean;
  postSlug: string;
  postPosition: "above-posts" | "below-posts";
  postThumbnail: boolean;
}

// Projects page configuration
// Controls the /projects index of shipped work
export interface ProjectsPageConfig {
  enabled: boolean; // Enable the /projects route
  showInNav: boolean; // Show "Projects" link in navigation
  title: string; // Page title for the projects page
  description?: string; // Optional line shown under the title
  order?: number; // Nav order (lower = first, matches page frontmatter order)
  viewMode: "list" | "one-column" | "two-column"; // Default layout
  showViewToggle: boolean; // Show the segmented control to switch layouts
}

// Skills page configuration
// Controls the /skills directory of agent skills with install commands
export interface SkillsPageConfig {
  enabled: boolean; // Enable the /skills route
  showInNav: boolean; // Show "Skills" link in navigation
  title: string; // Page title for the skills page
  description?: string; // Optional line shown under the title
  order?: number; // Nav order (lower = first)
}

// Homepage posts read more link configuration
// Optional link shown below limited post list on homepage
export interface HomePostsReadMoreConfig {
  enabled: boolean; // Show "read more" link when posts are limited
  text: string; // Link text (e.g., "Read more blog posts")
  link: string; // URL to link to (e.g., "/blog")
}

// Posts display configuration
// Controls where the post list appears, and how the homepage list looks.
// Every homeShow* key is optional and defaults to the long-standing behavior,
// so a site that never sets them renders exactly as before.
export interface PostsDisplayConfig {
  showOnHome: boolean; // Show post list on homepage
  showOnBlogPage: boolean; // Show post list on /blog page (requires blogPage.enabled)
  homePostsLimit?: number; // Limit number of posts shown on homepage (undefined = show all)
  homePostsReadMore?: HomePostsReadMoreConfig; // Optional "read more" link configuration
  homeTitle?: string; // Optional heading above the homepage post list (empty = no heading)
  homeViewMode?: "list" | "cards"; // Homepage post list view (default: list)
  homeShowViewToggle?: boolean; // Show a list/cards toggle on the homepage list (default: false)
  homeShowReadTime?: boolean; // Show read time on homepage rows (default: true)
  homeShowDate?: boolean; // Show the date on homepage rows (default: true)
  homeShowYearHeadings?: boolean; // Group homepage rows under year headings (default: true)
  homeUnderlineTitles?: boolean; // Underline homepage post titles, like the featured list (default: false)
  blogShowReadTime?: boolean; // Show read time on /blog, tag, and author lists (default: true)
  blogShowDate?: boolean; // Show the date on /blog, tag, and author lists (default: true)
  blogShowYearHeadings?: boolean; // Group /blog, tag, and author lists by year (default: true)
}

// One homepage category section. Posts that carry `tag` are listed under
// `title`, so grouping is driven by frontmatter tags with no extra config per
// post. Modeled on the topic lists on leerob.com.
export interface HomeCategorySection {
  title: string; // Heading above the list
  tag: string; // Frontmatter tag to match (case insensitive)
  limit?: number; // Max posts to show (default: 8)
  columns?: 1 | 2; // Column count on desktop (default: 2)
  showDate?: boolean; // Show the post date on each row (default: false)
  showOnHome?: boolean; // List this section on the homepage (default: true)
  showInNav?: boolean; // Add this heading to site nav, linking to /tags/{tag}
}

// Homepage category sections configuration
export interface HomeCategoriesConfig {
  enabled: boolean; // Render the sections
  position: "above-posts" | "below-posts"; // Where they sit relative to the post list
  sections: Array<HomeCategorySection>;
}

export type HomeHeroLayout = "banner" | "aside";
export type HomeHeroSide = "left" | "right";

// Homepage image. Banner is the wide 16:9 strip. Aside is a portrait beside the intro.
export interface HomeHeroImageConfig {
  enabled: boolean;
  src: string; // Image URL or /images/... path. PNG, JPG, GIF, WebP, SVG
  alt?: string; // Empty alt is fine for a decorative banner
  href?: string; // Optional link wrapper
  layout?: HomeHeroLayout; // banner (default) or aside (vertical beside intro)
  side?: HomeHeroSide; // aside only. Default right
  position: "top" | "bottom" | "both"; // banner only. Above the header, below the content, or both
  width: number; // Banner: percent of the content column, 30 to 100. Aside: image column width
  rounded?: boolean; // Rounded corners (default: true)
}

// Hardcoded navigation item configuration
// For React route pages (like /stats, /write) that aren't markdown pages
export interface HardcodedNavItem {
  slug: string; // URL path (e.g., "stats", "write")
  title: string; // Display name in navigation
  order?: number; // Nav order (lower = first, matches page frontmatter order)
  showInNav?: boolean; // Show in navigation menu (default: true)
}

// GitHub repository configuration
// Used for "Open in AI" links that use GitHub raw URLs
export interface GitHubRepoConfig {
  owner: string; // GitHub username or organization
  repo: string; // Repository name
  branch: string; // Default branch (e.g., "main")
  contentPath: string; // Path to raw markdown files (e.g., "public/raw")
}

// Font family configuration
// Controls the default font family for the entire site
// default font family options: "serif" (New York), "sans" (system fonts), "monospace" (IBM Plex Mono)
export type FontFamily = "serif" | "sans" | "monospace";

// Theme configuration
// Controls the default color theme for the site
// Options: "dark", "light", "tan", "cloud"
export type Theme = "dark" | "light" | "tan" | "cloud";

// Right sidebar configuration
// Shows CopyPageDropdown in a right sidebar on posts/pages at 1135px+ viewport width
export interface RightSidebarConfig {
  enabled: boolean; // Enable/disable the right sidebar globally
  minWidth?: number; // Minimum viewport width to show sidebar (default: 1135)
}

// Closing note (not the site footer)
// Markdown sign-off above the icon bar. Copy lives in content/pages/footer.md
// or a per-page frontmatter `footer` field. The icon bar is socialFooter.
export interface FooterConfig {
  enabled: boolean; // Global toggle for the closing note
  showOnHomepage: boolean; // Show closing note on homepage
  showOnPosts: boolean; // Default: show closing note on blog posts
  showOnPages: boolean; // Default: show closing note on static pages
  showOnBlogPage: boolean; // Show closing note on /blog page
  defaultContent?: string; // Default markdown if no frontmatter footer field provided
}

// Homepage configuration
// Allows setting any page or blog post to serve as the homepage
export interface HomepageConfig {
  type: "default" | "page" | "post"; // Type of homepage: default (standard Home component), page (static page), or post (blog post)
  slug?: string; // Required if type is "page" or "post" - the slug of the page/post to use as homepage
  originalHomeRoute?: string; // Route to access the original homepage when custom homepage is set (default: "/home")
}

// AI Chat configuration
// Controls the AI writing assistant feature on Write page and content pages
export interface AIChatConfig {
  enabledOnWritePage: boolean; // Show AI chat toggle on /write page
  enabledOnContent: boolean; // Allow AI chat on posts/pages via frontmatter aiChat: true
}

// AI Model configuration for Dashboard multi-model support
export interface AIModelOption {
  id: string; // Model identifier (e.g., "claude-sonnet-4-20250514", "gpt-4.1-mini")
  name: string; // Display name (e.g., "Claude Sonnet 4", "GPT-4o")
  provider: "anthropic" | "openai" | "google" | "concentrate" | "openrouter" | "runware"; // Provider for the model
}

// AI Dashboard configuration
// Controls multi-model AI chat and image generation in the Dashboard
export interface AIDashboardConfig {
  enableImageGeneration: boolean; // Enable image generation tab
  defaultTextModel: string; // Default model ID for text chat
  textModels: AIModelOption[]; // Available text models
  imageModels: AIModelOption[]; // Available image generation models
}

// Newsletter signup placement configuration
// Controls where signup forms appear on the site
export interface NewsletterSignupPlacement {
  enabled: boolean; // Show signup form at this location
  position: "above-footer" | "below-intro" | "below-content" | "below-posts";
  title: string; // Form heading
  description: string; // Form description text
}

// Newsletter configuration (email-only signup)
// Integrates with AgentMail for email collection and sending
// Inbox configured via AGENTMAIL_INBOX environment variable in Convex dashboard
export interface NewsletterConfig {
  enabled: boolean; // Master switch for newsletter feature

  // Signup form placements
  signup: {
    home: NewsletterSignupPlacement; // Homepage signup
    blogPage: NewsletterSignupPlacement; // Blog page (/blog) signup
    posts: NewsletterSignupPlacement; // Individual blog posts (can override via frontmatter)
    pages: NewsletterSignupPlacement; // Static pages (can override via frontmatter)
  };
}

// Contact form configuration
// Enables contact forms on pages/posts via frontmatter contactForm: true
// Recipient email configured via AGENTMAIL_CONTACT_EMAIL env var (falls back to AGENTMAIL_INBOX)
export interface ContactFormConfig {
  enabled: boolean; // Global toggle for contact form feature
  title: string; // Default form title
  description: string; // Default form description
}

// Newsletter admin configuration
// Provides admin UI for managing subscribers and sending newsletters
// Access at /newsletter-admin route
export interface NewsletterAdminConfig {
  enabled: boolean; // Global toggle for admin UI
  showInNav: boolean; // Show link in navigation (hidden by default for security)
}

// Stats page configuration
// Controls access to the /stats route for viewing site analytics
export interface StatsPageConfig {
  enabled: boolean; // Global toggle for stats page
  showInNav: boolean; // Show link in navigation (controlled via hardcodedNavItems)
}

// Docs section configuration
// Creates a Starlight-style documentation layout with left sidebar and right TOC
// Pages/posts with docsSection: true in frontmatter appear in docs navigation
export interface DocsSectionConfig {
  enabled: boolean; // Global toggle for docs section
  slug: string; // Base URL path (e.g., "docs" for /docs)
  title: string; // Page title for docs landing
  showInNav: boolean; // Show "Docs" link in navigation
  order?: number; // Nav order (lower = first)
  defaultExpanded: boolean; // Expand all sidebar groups by default
}

// Newsletter notifications configuration
// Sends developer notifications for subscriber events
// Uses AGENTMAIL_CONTACT_EMAIL or AGENTMAIL_INBOX as recipient
export interface NewsletterNotificationsConfig {
  enabled: boolean; // Global toggle for notifications
  newSubscriberAlert: boolean; // Send email when new subscriber signs up
  weeklyStatsSummary: boolean; // Send weekly stats summary email
}

// Weekly digest configuration
// Automated weekly email with posts from the past 7 days
export interface WeeklyDigestConfig {
  enabled: boolean; // Global toggle for weekly digest
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  subject: string; // Email subject template
}

// MCP Server configuration
// HTTP-based Model Context Protocol server for AI tool integration
// Runs in convex/http.ts at /mcp
export interface MCPServerConfig {
  enabled: boolean; // Global toggle for MCP server
  endpoint: string; // Endpoint path (default: "/mcp")
  publicRateLimit: number; // Requests per minute for public access
  authenticatedRateLimit: number; // Requests per minute with API key
  requireAuth: boolean; // Require API key for all requests
}

// Dashboard configuration
// Controls access to the /dashboard admin page
// Works with auth.mode "convex-auth" (default) or "none" for local-only open access
export interface DashboardConfig {
  enabled: boolean; // Global toggle for dashboard page
  requireAuth: boolean; // Require authenticated + server-side admin access
  showInNav?: boolean; // Show dashboard entry in top navigation
}

// Auth mode configuration
// Controls which auth provider is active
export interface AuthModeConfig {
  mode: "convex-auth" | "none";
}

// Hosting mode configuration
// Controls primary deployment target
export interface HostingModeConfig {
  mode: "convex-self-hosted" | "netlify";
}

// Compatibility configuration
// Allows docs/UI to expose legacy guidance
export interface CompatibilityConfig {
  legacyDocs?: boolean;
}

// Listen-to-this-post audio. Site settings are the source of truth.
// Per-post frontmatter `audio` / `audioVoice` override these defaults.
export interface AudioConfig {
  enabledDefault: boolean; // Show a player on new posts unless the post opts out
  defaultVoice: "male" | "female";
}

// Media library configuration
// Controls image upload and CDN storage via ConvexFS and Bunny.net
export interface MediaConfig {
  enabled: boolean; // Global toggle for media library feature
  provider?: "convex" | "convexfs" | "r2"; // Active media backend (default: "convex")
  maxFileSize: number; // Max file size in MB (default: 10)
  allowedTypes: string[]; // Allowed MIME types
}

// Image lightbox configuration
// Enables click-to-magnify functionality for images in blog posts and pages
export interface ImageLightboxConfig {
  enabled: boolean; // Global toggle for image lightbox feature
}

// Semantic search configuration
// Enables AI-powered search using vector embeddings
// Requires OPENAI_API_KEY environment variable in Convex dashboard
export interface SemanticSearchConfig {
  enabled: boolean; // Global toggle for semantic search feature
}

// Twitter/X configuration for Twitter Cards
// Used for twitter:site and twitter:creator meta tags
export interface TwitterConfig {
  site?: string; // @username for the website (e.g., "@yoursite")
  creator?: string; // @username for default content creator
}

// Ask AI configuration (header chat for RAG-based Q&A)
// Enables a header button that opens a chat modal for asking questions about site content
// Uses RAG (Retrieval Augmented Generation) with streaming responses
export interface AskAIConfig {
  enabled: boolean; // Global toggle for Ask AI feature
  defaultModel: string; // Default model ID (e.g., "claude-sonnet-4-20250514")
  models: AIModelOption[]; // Available models for Ask AI
}

// WebMCP configuration (in-page tools for Chrome agents)
// Registers a small allowlist of tools on document.modelContext so a browser
// agent already in the tab can search, read the current page, open posts,
// switch themes, and fill the newsletter or contact form behind a confirm
// dialog. No-op in browsers without WebMCP. Remote agents keep using POST /mcp.
export interface WebMcpConfig {
  enabled: boolean; // Global toggle for in-page WebMCP tools
}

// Related posts configuration
// Controls the display of related posts at the bottom of blog posts
export interface RelatedPostsConfig {
  defaultViewMode: "list" | "thumbnails"; // Default view mode for related posts
  showViewToggle: boolean; // Show toggle button to switch between views
}

// Social link configuration for social footer
export interface SocialLink {
  platform:
    | "github"
    | "twitter"
    | "linkedin"
    | "instagram"
    | "youtube"
    | "tiktok"
    | "discord"
    | "website";
  url: string; // Full URL (e.g., "https://github.com/username")
}

// Footer (icon bar)
// Social icons, llms.txt / AGENTS.md, and copyright. This is the site footer.
// The markdown Connect with me line is FooterConfig (closing note), not this.
export interface SocialFooterConfig {
  enabled: boolean; // Global toggle for the footer
  showOnHomepage: boolean; // Show footer on homepage
  showOnPosts: boolean; // Default: show footer on blog posts
  showOnPages: boolean; // Default: show footer on static pages
  showOnBlogPage: boolean; // Show footer on /blog page
  showInHeader: boolean; // Show social icons in header (left of search icon)
  socialLinks: SocialLink[]; // Array of social links to display
  copyright: {
    siteName: string; // Site name or company name displayed in copyright
    showYear: boolean; // Show auto-updating year (default: true)
  };
}

// Site configuration interface
export interface SiteConfig {
  // Basic site info
  name: string;
  title: string;
  logo: string | null;
  intro: ReactNode;
  bio: string;

  // Font family configuration
  fontFamily: FontFamily;

  // Default theme configuration
  defaultTheme?: Theme;

  // Featured section configuration
  featuredViewMode: "cards" | "list";
  featuredTitle: string; // Featured section title (e.g., "Get started:", "Featured", "Popular")
  showViewToggle: boolean;
  // Hide the homepage featured section entirely. Featured data is untouched, so
  // `featured: true` still orders the blog page. Default: true (shown).
  featuredSectionEnabled?: boolean;

  // Homepage category sections, grouped by post tag
  homeCategories?: HomeCategoriesConfig;

  // Homepage 16:9 banner image with a width scaler
  homeHeroImage?: HomeHeroImageConfig;

  // Logo gallery configuration
  logoGallery: LogoGalleryConfig;

  // GitHub contributions graph configuration
  gitHubContributions: GitHubContributionsConfig;

  // Visitor map configuration (stats page)
  visitorMap: VisitorMapConfig;

  // Inner page logo configuration (blog page, posts, pages)
  innerPageLogo: InnerPageLogoConfig;

  // Blog page configuration
  blogPage: BlogPageConfig;

  // Projects page configuration
  projectsPage: ProjectsPageConfig;

  // Skills page configuration
  skillsPage?: SkillsPageConfig;
  homepageHighlights?: HomepageHighlightsConfig;

  // Hardcoded navigation items for React routes (like /stats, /write)
  hardcodedNavItems: HardcodedNavItem[];

  // Posts display configuration
  postsDisplay: PostsDisplayConfig;

  // Links for footer section
  links: {
    docs: string;
    convex: string;
    netlify: string;
  };

  // GitHub repository configuration for AI service links
  gitHubRepo: GitHubRepoConfig;

  // Right sidebar configuration
  rightSidebar: RightSidebarConfig;

  // Closing note (markdown above the Footer icon bar)
  footer: FooterConfig;

  // Homepage configuration
  homepage: HomepageConfig;

  // AI Chat configuration
  aiChat: AIChatConfig;

  // Newsletter configuration (optional)
  newsletter?: NewsletterConfig;

  // Contact form configuration (optional)
  contactForm?: ContactFormConfig;

  // Social footer configuration (optional)
  socialFooter?: SocialFooterConfig;

  // Newsletter admin configuration (optional)
  newsletterAdmin?: NewsletterAdminConfig;

  // Stats page configuration (optional)
  statsPage?: StatsPageConfig;

  // Docs section configuration (optional)
  docsSection?: DocsSectionConfig;

  // Newsletter notifications configuration (optional)
  newsletterNotifications?: NewsletterNotificationsConfig;

  // Weekly digest configuration (optional)
  weeklyDigest?: WeeklyDigestConfig;

  // MCP Server configuration (optional)
  mcpServer?: MCPServerConfig;

  // Dashboard configuration (optional)
  dashboard?: DashboardConfig;

  // Auth mode configuration (optional)
  auth?: AuthModeConfig;

  // Hosting mode configuration (optional)
  hosting?: HostingModeConfig;

  // Compatibility options (optional)
  compat?: CompatibilityConfig;

  // Media library configuration (optional)
  media?: MediaConfig;

  // Image lightbox configuration (optional)
  imageLightbox?: ImageLightboxConfig;

  // AI Dashboard configuration (optional)
  aiDashboard?: AIDashboardConfig;

  // Semantic search configuration (optional)
  semanticSearch?: SemanticSearchConfig;

  // Twitter/X configuration (optional)
  twitter?: TwitterConfig;

  // Ask AI configuration (optional)
  askAI?: AskAIConfig;

  // WebMCP in-page tools (optional, defaults to enabled)
  webmcp?: WebMcpConfig;

  // Related posts configuration (optional)
  relatedPosts?: RelatedPostsConfig;

  // Listen-to-this-post audio (optional)
  audio?: AudioConfig;
}

// Default site configuration
// Customize this for your site
export const siteConfig: SiteConfig = {
  // Basic site info
  name: "Wayne Sutton",
  title: "Developer Community Builder",
  // Optional logo/header image (place in public/images/, set to null to hide)
  logo: "/images/logo.svg",
  intro: null, // Set in Home.tsx to allow JSX with links
  bio: `Developer Community Lead at Convex, tech event organizer, startup ecosystem builder, and adventure motorcycle rider—helping developers and startups build faster with Convex and AI.`,

  // Font family configuration
  // Options: "serif" (New York), "sans" (system fonts), "monospace" (IBM Plex Mono)
  fontFamily: "serif",

  // Default theme configuration
  // Options: "dark", "light", "tan", "cloud"
  // light: white canvas with near-black ink and geometric sans headings
  // dark: black canvas with blue accent and editorial serif display headings
  defaultTheme: "light",

  // Featured section configuration
  // viewMode: 'list' shows bullet list, 'cards' shows card grid with excerpts
  featuredViewMode: "cards",
  // Featured section title (e.g., "Get started:", "Featured", "Popular")
  featuredTitle: "Writings",
  // Allow users to toggle between list and card views
  showViewToggle: true,
  // Set to false to hide the featured section. Useful when the homepage post
  // list below it is doing the same job.
  featuredSectionEnabled: true,

  // Homepage category sections. Add a section per tag you want grouped.
  homeCategories: {
    enabled: false,
    position: "above-posts",
    sections: [],
  },

  // Homepage image. layout banner is the 16:9 strip. aside sits beside the intro.
  homeHeroImage: {
    enabled: false,
    src: "",
    alt: "",
    href: "",
    layout: "banner",
    side: "right",
    position: "top",
    width: 100,
    rounded: true,
  },

  // Logo gallery configuration
  // Set enabled to false to hide, or remove/replace sample images with your own
  // scrolling: true = infinite scroll marquee, false = static centered grid
  // maxItems: only used when scrolling is false (default: 4)
  logoGallery: {
    enabled: false,
    images: [
      {
        src: "/images/logos/convex-wordmark-black.svg",
        href: "/about#the-real-time-twist",
      },
      {
        src: "/images/logos/netlify.svg",
        href: "https://www.netlify.com/utm_source=markdownfast",
      },
      {
        src: "/images/logos/firecrawl.svg",
        href: "/how-to-use-firecrawl",
      },
      {
        src: "/images/logos/markdown.svg",
        href: "/docs",
      },
      {
        src: "/images/logos/react.svg",
        href: "/setup-guide",
      },
      {
        src: "/images/logos/agentmail.svg",
        href: "/how-to-use-agentmail",
      },
      {
        src: "/images/logos/mcp.svg",
        href: "/how-to-use-mcp-server",
      },
      {
        src: "/images/logos/workos.svg",
        href: "/how-to-setup-workos",
      },
    ],
    position: "above-footer",
    speed: 20,
    title: "Built with",
    scrolling: false, // Set to false for static grid showing first maxItems logos
    maxItems: 4, // Number of logos to show when scrolling is false
  },

  // GitHub contributions graph configuration
  // Set enabled to false to hide, or change username to your GitHub username
  gitHubContributions: {
    enabled: true, // Set to false to hide the contributions graph
    username: "waynesutton", // Your GitHub username
    showYearNavigation: true, // Show arrows to navigate between years
    linkToProfile: true, // Click graph to open GitHub profile
    title: "GitHub Activity", // Optional title above the graph
  },

  // Visitor map configuration
  // Displays real-time visitor locations on the stats page
  visitorMap: {
    enabled: false, // Set to false to hide the visitor map
    title: "Live Visitors", // Optional title above the map
  },

  // Inner page logo configuration
  // Shows logo on blog page, individual posts, and static pages
  // Desktop: top left corner, Mobile: top right corner (small)
  innerPageLogo: {
    enabled: true, // Set to false to hide logo on inner pages
    size: 28, // Logo height in pixels (keeps aspect ratio)
  },

  // Blog page configuration
  // Set enabled to true to create a dedicated /blog page
  blogPage: {
    enabled: true, // Enable the /blog route
    showInNav: true, // Show "Blog" link in navigation
    title: "Blog", // Page title
    description: "Writings from Wayne and Agents.", // Optional description
    order: 2, // Nav order (lower = first, e.g., 0 = first, 5 = after pages with order 0-4)
    viewMode: "cards", // Default view mode: "list" or "cards"
    showViewToggle: true, // Show toggle button to switch between list and card views
  },

  // Projects page configuration
  // A flat index of shipped work, managed entirely from the dashboard
  projectsPage: {
    enabled: true, // Enable the /projects route
    showInNav: true, // Show "Projects" link in navigation
    title: "Projects", // Page title
    description: "Things I've built.", // Optional line under the title
    order: 3, // Nav order (lower = first)
    viewMode: "two-column", // Default layout: "list", "one-column", or "two-column"
    showViewToggle: true, // Show the segmented control to switch layouts
  },

  // Skills page configuration
  // A directory of agent skills grouped into sections, managed from the dashboard
  skillsPage: {
    enabled: false, // Enable the /skills route
    showInNav: true, // Show "Skills" link in navigation
    title: "Skills", // Page title
    description: "Agent skills I use and recommend.", // Optional line under the title
    order: 4, // Nav order (lower = first)
  },

  // Hardcoded navigation items for React routes
  // Add React route pages (like /stats, /write) that should appear in navigation
  // Set showInNav: false to hide from nav while keeping the route accessible
  hardcodedNavItems: [
    {
      slug: "stats",
      title: "Stats",
      order: 10,
      showInNav: false,
    },
    {
      slug: "write",
      title: "Write",
      order: 20,
      showInNav: false,
    },
  ],

  // Posts display configuration
  // Controls where the post list appears
  // Both can be true to show posts on homepage AND blog page
  // Set showOnHome to false to only show posts on /blog page
  postsDisplay: {
    showOnHome: true, // Show post list on homepage
    showOnBlogPage: true, // Show post list on /blog page
    homePostsLimit: 5, // Limit number of posts on homepage (undefined = show all)
    homePostsReadMore: {
      enabled: true, // Show "read more" link when posts are limited
      text: "Read more blog posts", // Customizable link text
      link: "/blog", // URL to link to (usually "/blog")
    },
    // How the homepage list looks. Match these to the featured section above if
    // you turn featuredSectionEnabled off and want the same reading experience.
    homeTitle: "", // Heading above the list (empty = no heading)
    homeViewMode: "list", // "list" or "cards"
    homeShowViewToggle: false, // Let readers switch between list and cards
    homeShowReadTime: true, // Show read time on each row
    homeShowDate: true, // Show the date on each row
    homeShowYearHeadings: true, // Group rows under year headings
    homeUnderlineTitles: false, // Underline titles like the featured list
    blogShowReadTime: true, // Show read time on /blog, tag, and author lists
    blogShowDate: true, // Show the date on /blog, tag, and author lists
    blogShowYearHeadings: true, // Group /blog, tag, and author lists by year
  },

  // Links for footer section
  links: {
    docs: "/setup-guide",
    convex: "https://convex.dev",
    netlify: "https://netlify.com",
  },

  // GitHub repository configuration
  // Used for "Open in AI" links (ChatGPT, Claude, Perplexity)
  // These links use GitHub raw URLs since AI services can reliably fetch from GitHub
  // Note: Content must be pushed to GitHub for AI links to work
  gitHubRepo: {
    owner: "waynesutton", // GitHub username or organization
    repo: "waynesutton-ai", // Repository name
    branch: "main", // Default branch
    contentPath: "public/raw", // Path to raw markdown files
  },

  // Right sidebar configuration
  // Shows CopyPageDropdown in a right sidebar on posts/pages at 1135px+ viewport width
  // When enabled, CopyPageDropdown moves from nav to right sidebar on wide screens
  rightSidebar: {
    enabled: true, // Set to false to disable right sidebar globally
    minWidth: 1135, // Minimum viewport width in pixels to show sidebar
  },

  // Closing note from content/pages/footer.md ("Connect with me on ...").
  // This is not the site footer. The Footer is socialFooter (icon bar).
  // Same master switch pattern as newsletter.enabled. Use showFooter: false
  // in frontmatter to hide the closing note on a single post or page.
  footer: {
    enabled: false, // Global toggle for the closing note
    showOnHomepage: true, // Show footer on homepage
    showOnPosts: true, // Default: show footer on blog posts (override with frontmatter)
    showOnPages: true, // Default: show footer on static pages (override with frontmatter)
    showOnBlogPage: true, // Show footer on /blog page
    // Default footer markdown (fallback if footer.md doesn't exist - edit content/pages/footer.md instead)
    defaultContent: undefined,
  },

  // Homepage configuration
  // Set any page or blog post to serve as the homepage
  // Custom homepage uses the page/post's full content and features (sidebar, copy dropdown, etc.)
  // Featured section is NOT shown on custom homepage (only on default Home component)
  homepage: {
    type: "default", // Options: "default" (standard Home component), "page" (use a static page), or "post" (use a blog post)
    slug: undefined, // Required if type is "page" or "post" - the slug of the page/post to use default is undefined
    originalHomeRoute: "/home", // Route to access the original homepage when custom homepage is set
  },

  // AI Chat configuration
  // Controls the AI writing assistant powered by Claude
  // Requires ANTHROPIC_API_KEY environment variable in Convex dashboard
  aiChat: {
    enabledOnWritePage: false, // Show AI chat toggle on /write page
    enabledOnContent: false, // Allow AI chat on posts/pages via frontmatter aiChat: true
  },

  // Newsletter configuration (email-only signup)
  // Set enabled: true and configure AgentMail to activate
  // Requires AGENTMAIL_API_KEY and AGENTMAIL_INBOX environment variables in Convex dashboard
  newsletter: {
    enabled: true, // Set to true to enable newsletter signup forms
    signup: {
      home: {
        enabled: true,
        position: "above-footer",
        title: "Stay Updated",
        description: "Get new posts delivered to your inbox.",
      },
      blogPage: {
        enabled: true,
        position: "above-footer",
        title: "Subscribe",
        description: "Get notified when new posts are published.",
      },
      posts: {
        enabled: true,
        position: "below-content",
        title: "Enjoyed this post?",
        description: "Subscribe for more updates.",
      },
      pages: {
        enabled: true,
        position: "below-content",
        title: "Stay Updated",
        description: "Get new posts delivered to your inbox.",
      },
    },
  },

  // Contact form configuration
  // Enable via frontmatter contactForm: true on any page or post
  // Requires AGENTMAIL_API_KEY and AGENTMAIL_INBOX in Convex dashboard
  // Optionally set AGENTMAIL_CONTACT_EMAIL to override recipient (defaults to AGENTMAIL_INBOX)
  contactForm: {
    enabled: true, // Global toggle for contact form feature
    title: "Get in Touch",
    description: "Send us a message and we'll get back to you.",
  },

  // Footer: icon bar with social links and copyright
  // Can work with or without the closing note
  // Use showSocialFooter: false in frontmatter to hide on specific posts/pages
  socialFooter: {
    enabled: true, // Global toggle for social footer
    showOnHomepage: true, // Show social footer on homepage
    showOnPosts: true, // Default: show social footer on blog posts
    showOnPages: true, // Default: show social footer on static pages
    showOnBlogPage: true, // Show social footer on /blog page
    showInHeader: true, // Show social icons in header (left of search icon)
    socialLinks: [
      {
        platform: "github",
        url: "https://github.com/waynesutton",
      },
      { platform: "twitter", url: "https://x.com/waynesutton" },
      { platform: "linkedin", url: "https://www.linkedin.com/in/waynesutton/" },
    ],
    copyright: {
      siteName: "waynesutton.ai", // Update with your site/company name
      showYear: true, // Auto-updates to current year
    },
  },

  // Newsletter admin configuration
  // Admin UI for managing subscribers and sending newsletters at /newsletter-admin
  // Hidden from nav by default (no auth - security through obscurity)
  newsletterAdmin: {
    enabled: false, // Global toggle for admin UI
    showInNav: false, // Hide from navigation for security
  },

  // Stats page configuration
  // Controls access to the /stats route for viewing site analytics
  // Set enabled: false to make stats page private (route still accessible but shows disabled message)
  statsPage: {
    enabled: true, // Global toggle for stats page
    showInNav: false, // Show link in navigation (also controlled via hardcodedNavItems)
  },

  // Docs section configuration
  // Creates a Starlight-style documentation layout with left sidebar navigation and right TOC
  // Add docsSection: true to page/post frontmatter to include in docs navigation
  // Set docsLanding: true on one page to make it the /docs landing page
  docsSection: {
    enabled: true, // Global toggle for docs section
    slug: "docs", // Base URL: /docs
    title: "Docs", // Page title
    showInNav: false, // Show "Docs" link in navigation
    order: 1, // Nav order (lower = first)
    defaultExpanded: true, // Expand all sidebar groups by default
  },

  // Newsletter notifications configuration
  // Sends developer notifications for subscriber events via AgentMail
  newsletterNotifications: {
    enabled: true, // Global toggle for notifications
    newSubscriberAlert: true, // Send email when new subscriber signs up
    weeklyStatsSummary: true, // Send weekly stats summary email
  },

  // Legacy export field. Delivery is controlled in Dashboard > Automatic newsletters.
  // Kept for config compatibility; the old unconditional cron has been removed.
  weeklyDigest: {
    enabled: false, // Configure automation in the dashboard instead
    dayOfWeek: 0, // Sunday
    subject: "Weekly Digest", // Email subject prefix
  },

  // MCP Server configuration
  // HTTP-based Model Context Protocol server for AI tool integration
  // Runs in convex/http.ts at /mcp
  // Set MCP_API_KEY in Convex env vars for authenticated access
  mcpServer: {
    enabled: true, // Global toggle for MCP server
    endpoint: "/mcp", // Endpoint path
    publicRateLimit: 50, // Requests per minute for public access (Netlify rate limiting)
    authenticatedRateLimit: 1000, // Requests per minute with API key
    requireAuth: false, // Set to true to require API key for all requests
  },

  // Dashboard configuration
  // Admin dashboard at /dashboard for managing content and settings
  // Set enabled: false to disable the dashboard entirely
  // WARNING: When requireAuth is false, anyone can access the dashboard
  dashboard: {
    enabled: true,
    requireAuth: true,
    showInNav: false,
  },

  // Auth mode configuration
  auth: {
    mode: "convex-auth",
  },

  // Hosting mode configuration
  hosting: {
    mode: "convex-self-hosted",
  },

  compat: {
    legacyDocs: true,
  },

  // Media library configuration
  // Upload and manage images via ConvexFS and Bunny.net CDN
  // Requires BUNNY_API_KEY, BUNNY_STORAGE_ZONE, BUNNY_CDN_HOSTNAME in Convex dashboard
  media: {
    enabled: true,
    provider: "convex",
    maxFileSize: 10, // Max file size in MB
    allowedTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },

  // Image lightbox configuration
  // Enables click-to-magnify functionality for images in blog posts and pages
  // Images open in a full-screen lightbox overlay when clicked
  imageLightbox: {
    enabled: true, // Set to false to disable image lightbox
  },

  // AI Dashboard configuration
  // Multi-model AI chat and image generation in the Dashboard
  // Requires API keys in Convex environment variables (or dashboard API keys settings):
  // - ANTHROPIC_API_KEY for Claude models
  // - OPENAI_API_KEY for OpenAI models
  // - GOOGLE_AI_API_KEY for Gemini models (chat and image generation)
  // - CONCENTRATE_API_KEY for the Concentrate gateway (auto routing across providers)
  // - OPENROUTER_API_KEY for the OpenRouter gateway (auto routing across providers)
  // - RUNWARE_API_KEY for Runware image models
  aiDashboard: {
    enableImageGeneration: true, // Enable image generation tab
    defaultTextModel: "claude-sonnet-4-20250514", // Default model for text chat
    textModels: [
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        provider: "anthropic",
      },
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 mini",
        provider: "openai",
      },
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        provider: "google",
      },
      {
        id: "concentrate/auto",
        name: "Concentrate Auto",
        provider: "concentrate",
      },
      {
        id: "openrouter/auto",
        name: "OpenRouter Auto",
        provider: "openrouter",
      },
    ],
    imageModels: [
      {
        id: "gemini-2.0-flash-exp-image-generation",
        name: "Nano Banana",
        provider: "google",
      },
      {
        id: "imagen-3.0-generate-002",
        name: "Nano Banana Pro",
        provider: "google",
      },
      {
        id: "runware:101@1",
        name: "Runware Flux",
        provider: "runware",
      },
    ],
  },

  // Twitter/X configuration for Twitter Cards
  // Set your Twitter handle for twitter:site meta tag
  // Leave empty if you don't want to include twitter:site
  twitter: {
    site: "@waynesutton", // Your Twitter handle (e.g., "@yoursite")
    creator: "@waynesutton", // Default creator handle
  },

  // Semantic search configuration
  // Set enabled: true to enable semantic search (requires OPENAI_API_KEY in Convex)
  // When disabled, only keyword search is available (no API key needed)
  semanticSearch: {
    enabled: true, // Set to true to enable semantic search (requires OPENAI_API_KEY)
  },

  // Ask AI configuration (header chat for RAG-based Q&A)
  // Requires semanticSearch.enabled: true for content retrieval
  // Requires OPENAI_API_KEY (for embeddings) and ANTHROPIC_API_KEY or OPENAI_API_KEY (for LLM)
  askAI: {
    enabled: false, // Set to true to enable Ask AI header button
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        provider: "anthropic",
      },
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 mini",
        provider: "openai",
      },
    ],
  },

  // WebMCP in-page tools for Chrome agents (document.modelContext)
  // Progressive enhancement: browsers without the API see no change.
  // Test locally with chrome://flags/#enable-webmcp-testing. Docs: Dashboard, Docs, WebMCP.
  webmcp: {
    enabled: true,
  },

  // Related posts configuration
  // Controls the display of related posts at the bottom of blog posts
  relatedPosts: {
    defaultViewMode: "thumbnails", // Default view: "list" or "thumbnails"
    showViewToggle: true, // Show toggle button to switch between views
  },

  // Listen-to-this-post audio. On for every new post unless frontmatter sets audio: false.
  audio: {
    enabledDefault: true,
    defaultVoice: "female",
  },
};

// Export the config as default for easy importing
export default siteConfig;
