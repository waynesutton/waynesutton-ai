# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.19.1] - 2026-02-15

### Changed

- Consolidated site configuration by merging `fork-config.json` values into `siteConfig.ts`
  - `siteConfig.ts` is now the single source of truth for all site configuration
  - Updated bio, fontFamily, gitHubContributions, postsDisplay, newsletter, and socialFooter settings
  - Removed `fork-config.json` (optional template remains as `fork-config.json.example`)
  - `sync-discovery-files.ts` now reads from `siteConfig.ts` when `fork-config.json` is not present

### Fixed

- TypeScript errors across multiple files
  - Fixed Layout.tsx useQuery "skip" pattern for docs section detection
  - Fixed AskAIModal.tsx by removing unused config check that referenced unavailable API
  - Fixed Post.tsx authorTwitter property reference
  - Fixed unused variable warnings in Blog.tsx, DocsPage.tsx, Home.tsx, BlogPost.tsx
  - Fixed useSearchHighlighting.ts TypeScript narrowing issue in setTimeout callback
  - Fixed configure-fork.ts duplicate __dirname declaration
  - Fixed sync-posts.ts missing unlisted field in PostFrontmatter interface
  - Fixed sync-discovery-files.ts unused parameter warnings

## [2.19.0] - 2026-01-10

### Added

- `npx create-markdown-sync` CLI for scaffolding new projects
  - Interactive wizard with 13 sections covering all configuration options
  - Clones template from GitHub via giget
  - Configures site settings automatically
  - Installs dependencies
  - Sets up Convex project (optional WorkOS auth disabled by default)
  - Starts dev server and opens browser
  - Clear next steps with docs, deployment, and WorkOS setup links

### Technical

- New `packages/create-markdown-sync/` monorepo package
- CLI files: index.ts, wizard.ts, clone.ts, configure.ts, install.ts, convex-setup.ts, utils.ts
- Template fixes for siteConfig.ts embedded quotes
- Empty auth.config.ts when auth not required (prevents WorkOS blocking)
- Added workspaces to root package.json
- Updated .gitignore for packages/*/dist/ and packages/*/node_modules/

## [2.18.2] - 2026-01-10

### Added

- Related posts thumbnail view with toggle
  - New thumbnail view shows post image, title, description, author, and date
  - Toggle button to switch between thumbnail and list views (same icons as homepage featured)
  - View preference saved to localStorage
  - Default view mode and toggle visibility configurable via siteConfig.relatedPosts
  - Dashboard Config section for related posts settings

### Changed

- Updated getRelatedPosts query to return image, excerpt, authorName, authorImage fields
- Related posts section now has header with title and optional toggle button

### Technical

- Added `RelatedPostsConfig` interface to siteConfig.ts
- Added `relatedPosts` configuration to SiteConfig interface
- Updated convex/posts.ts getRelatedPosts query with additional return fields
- Added related posts thumbnail CSS styles (~100 lines)
- Added relatedPostsDefaultViewMode and relatedPostsShowViewToggle to Dashboard ConfigSection

## [2.18.1] - 2026-01-10

### Changed

- README.md streamlined from 609 lines to 155 lines
  - Removed detailed feature documentation (now links to live docs)
  - Kept sync commands, setup, and Netlify deployment sections
  - Added Documentation section with links to markdown.fast/docs
  - Added Guides subsection with links to specific doc pages
  - Simplified Features section with link to About page
  - Simplified Fork Configuration to quick commands with doc link

## [2.18.0] - 2026-01-10

### Added

- OpenCode AI development tool integration
  - Full `.opencode/` directory structure for OpenCode CLI compatibility
  - 3 specialized agents: orchestrator, content-writer, sync-manager
  - 6 commands: /sync, /sync-prod, /create-post, /create-page, /import, /deploy
  - 4 skills: frontmatter, sync, convex, content
  - sync-helper plugin for content change reminders
  - Works alongside Claude Code and Cursor without conflicts

- OpenCode documentation page at /docs-opencode
  - How OpenCode integration works
  - Directory structure reference
  - Command and agent descriptions
  - Getting started guide

### Technical

- `opencode.json` - Root OpenCode project configuration
- `.opencode/config.json` - OpenCode app configuration
- `.opencode/agent/orchestrator.md` - Main routing agent
- `.opencode/agent/content-writer.md` - Content creation specialist
- `.opencode/agent/sync-manager.md` - Sync and deployment specialist
- `.opencode/command/sync.md` - /sync command definition
- `.opencode/command/sync-prod.md` - /sync-prod command
- `.opencode/command/create-post.md` - /create-post command
- `.opencode/command/create-page.md` - /create-page command
- `.opencode/command/import.md` - /import command
- `.opencode/command/deploy.md` - /deploy command
- `.opencode/skill/frontmatter.md` - Frontmatter reference (adapted from .claude/skills/)
- `.opencode/skill/sync.md` - Sync system reference
- `.opencode/skill/convex.md` - Convex patterns reference
- `.opencode/skill/content.md` - Content management guide
- `.opencode/plugin/sync-helper.ts` - Minimal reminder plugin
- `content/pages/docs-opencode.md` - Documentation page
- `files.md` - Added OpenCode Configuration section

## [2.17.0] - 2026-01-10

### Added

- ConvexFS Media Library with Bunny CDN integration
  - Upload images via drag-and-drop or click to upload
  - Copy as Markdown, HTML, or direct URL
  - Bulk select and delete multiple images
  - File size display and pagination
  - Configuration warning when Bunny CDN not configured

- Enhanced Image Insert Modal in Write Post/Page
  - Two tabs: "Upload New" and "Media Library" for selecting existing images
  - Image dimensions display (original size with aspect ratio)
  - Size presets: Original, Large (1200px), Medium (800px), Small (400px), Thumbnail (200px), Custom
  - Custom dimensions input with automatic aspect ratio preservation
  - Alt text field for accessibility
  - Calculated dimensions shown before insert

- File expiration support via ConvexFS
  - `setFileExpiration` action to set time-based auto-deletion
  - Pass `expiresInMs` for automatic cleanup after specified time
  - Pass `null` to remove expiration and make file permanent

### Technical

- `convex/convex.config.ts` - Added ConvexFS component registration
- `convex/fs.ts` - ConvexFS instance with Bunny CDN configuration, conditional instantiation
- `convex/files.ts` - File mutations/queries: commitFile, listFiles, deleteFile, deleteFiles, setFileExpiration, isConfigured
- `convex/http.ts` - ConvexFS routes for /fs/upload and /fs/blobs/{blobId}
- `src/components/MediaLibrary.tsx` - Media library gallery with bulk select/delete
- `src/components/ImageUploadModal.tsx` - Enhanced modal with library selection and size presets
- `src/styles/global.css` - Added ~400 lines for media library and image modal styles
- `content/pages/docs-media-setup.md` - Setup documentation with ConvexFS links

## [2.16.4] - 2026-01-10

### Added

- AI image generation download and copy options
  - Download button to save generated image to computer
  - MD button to copy Markdown code (`![prompt](url)`) to clipboard
  - HTML button to copy HTML code (`<img src="url" alt="prompt" />`) to clipboard
  - Code preview section showing both Markdown and HTML snippets
  - Filename generated from prompt (sanitized and truncated)

### Technical

- `src/pages/Dashboard.tsx` - Added copiedFormat state, getMarkdownCode/getHtmlCode helpers, handleCopyCode, handleDownloadImage functions, updated generated image display JSX
- `src/styles/global.css` - Added CSS for .ai-image-actions, .ai-image-action-btn, .ai-image-code-preview, .ai-image-code-block

## [2.16.3] - 2026-01-10

### Added

- Social icons in hamburger menu (MobileMenu)
  - Social icons now appear below navigation links in mobile menu
  - Only shows when `socialFooter.enabled` and `socialFooter.showInHeader` are true
  - Imported `platformIcons` from SocialFooter for consistent icon rendering

- Dashboard Config options for social and AI features
  - Added `socialFooter.showInHeader` toggle to Social Footer config card
  - Added new Ask AI config card with `askAI.enabled` toggle
  - Generated siteConfig.ts includes both new options

- Configuration alignment documentation for AI/LLMs
  - Added "Configuration alignment" section to CLAUDE.md
  - Added sync comment to top of `src/config/siteConfig.ts`
  - Added JSDoc comment to ConfigSection in Dashboard.tsx
  - Explains relationship between siteConfig.ts and Dashboard Config

### Changed

- Removed social icons from mobile header
  - Social icons no longer display in `mobile-nav-controls` (header on mobile)
  - Social icons now exclusively in hamburger menu for cleaner mobile header
  - Added comment in Layout.tsx noting social icons are in MobileMenu

### Technical

- `src/components/MobileMenu.tsx` - Added social icons section with platformIcons import
- `src/components/Layout.tsx` - Removed social icons from mobile-nav-controls
- `src/pages/Dashboard.tsx` - Added socialFooterShowInHeader and askAIEnabled to ConfigSection
- `src/styles/global.css` - Added mobile-menu-social CSS styles
- `src/config/siteConfig.ts` - Added alignment comment header
- `CLAUDE.md` - Added Configuration alignment section and Dashboard.tsx to key files

## [2.16.2] - 2026-01-10

### Added

- Ask AI configuration documentation alignment
  - Added `askAI` config to `fork-config.json.example` with enabled, defaultModel, and models fields
  - Added Ask AI Configuration section to `FORK_CONFIG.md` with fork-config.json and manual configuration examples
  - Added Ask AI (header chat) section to `docs-dashboard.md` with configuration and requirements
  - Added Ask AI (header chat) section to `how-to-use-the-markdown-sync-dashboard.md` with step-by-step setup

### Technical

- `fork-config.json.example` now includes askAI config matching siteConfig.ts structure
- All dashboard documentation now includes Ask AI feature alongside AI Agent and AI Dashboard sections

## [2.16.1] - 2026-01-10

### Fixed

- Docs layout scrollbar hiding for cleaner UI
  - Hidden scrollbars on left sidebar, right sidebar, and main docs content
  - Scrolling still works via trackpad, mouse wheel, and touch
  - Added `body:has(.docs-layout)` to prevent page-level scrolling on docs pages
  - Cross-browser support: `-ms-overflow-style: none` (IE/Edge), `scrollbar-width: none` (Firefox), `::-webkit-scrollbar { width: 0 }` (Chrome/Safari)

### Technical

- Updated `src/styles/global.css`:
  - Added `body:has(.docs-layout) { overflow: hidden; }` rule
  - Added scrollbar hiding rules for `.docs-sidebar-left`, `.docs-sidebar-right`, `.docs-content`
  - Existing scrollbar thumb/track styles remain but are invisible with width: 0

## [2.16.0] - 2026-01-09

### Added

- Sync version control system
  - 3-day version history for posts, pages, home content, and footer
  - Dashboard toggle to enable/disable version control
  - Version history modal with unified diff visualization using DiffCodeBlock component
  - Preview mode to view previous version content
  - One-click restore with automatic backup of current state
  - Automatic cleanup of versions older than 3 days (daily cron at 3 AM UTC)
  - Version stats display in Config section (total, posts, pages)

### Technical

- New `convex/versions.ts` with 7 functions:
  - `isEnabled` / `setEnabled` - Toggle version control
  - `createVersion` - Capture content snapshot (internal mutation)
  - `getVersionHistory` / `getVersion` - Query version data
  - `restoreVersion` - Restore with backup creation
  - `cleanupOldVersions` - Batch delete old versions
  - `getStats` - Version count statistics
- New `contentVersions` table in schema with indexes:
  - `by_content` - Query by content type and ID
  - `by_slug` - Query by content type and slug
  - `by_createdAt` - For cleanup queries
  - `by_content_createdAt` - Compound index for history
- New `versionControlSettings` table for toggle state
- New `src/components/VersionHistoryModal.tsx` component
- Updated `convex/cms.ts` to capture versions before dashboard edits
- Updated `convex/posts.ts` to capture versions before sync updates
- Updated `convex/pages.ts` to capture versions before sync updates
- Updated `convex/crons.ts` with daily cleanup job
- Added ~370 lines of CSS for version modal UI

## [2.15.3] - 2026-01-09

### Fixed

- Footer not displaying on `/docs` landing page when `showFooter: true` in frontmatter
  - `DocsPage.tsx` was missing the Footer component entirely
  - Added Footer import, footerPage query, and footer rendering logic to DocsPage.tsx
  - Footer now respects `showFooter` frontmatter field on docs landing pages
  - AI chat support added to DocsLayout via `aiChatEnabled` and `pageContent` props

### Changed

- Updated `getDocsLandingPage` query in `convex/pages.ts` to return `showFooter`, `footer`, `excerpt`, and `aiChat` fields
- Updated `getDocsLandingPost` query in `convex/posts.ts` to return `showFooter`, `footer`, and `aiChat` fields

## [2.15.2] - 2026-01-08

### Fixed

- Docs section layout CSS conflict with main-content container
  - Fixed `.main-content` max-width: 800px constraint preventing docs layout from being full width
  - Added `.main-content:has(.docs-layout)` rule to expand to 100% width when docs layout is used
  - Updated Layout.tsx to use `main-content-wide` class for docs pages
  - Fixed left sidebar not flush left and right sidebar not flush right
  - Fixed responsive margins for docs layout (280px desktop, 240px tablet, 0 mobile)

### Technical

- Updated `src/styles/global.css`:
  - Added `.main-content:has(.docs-layout) { max-width: 100%; padding: 0; }`
  - Fixed `.docs-content` margins: 280px left/right for fixed sidebars
  - Added responsive margin adjustments at 1200px, 900px, 768px breakpoints
- Updated `src/components/Layout.tsx`:
  - Added `isDocsPage` check to className logic for main element
  - Docs pages now use `main-content-wide` class for full width layout

## [2.15.1] - 2026-01-08

### Fixed

- Additional Core Web Vitals improvements for CLS and INP
  - Added `aspect-ratio: 16/10` to `.blog-image` to reserve space before images load
  - Added `aspect-ratio: 16/9` to `.post-header-image-img` to prevent layout shift
  - Added `contain: layout style` to `.main-content` and `.main-content-wide` to isolate layout recalculations
  - Added `fetchPriority="high"` to logo image for faster LCP
  - Added `fetchPriority="high"` to header images (`showImageAtTop`) for faster LCP
  - Added `will-change: transform` to continuous spin animations (`.spinner-icon`, `.animate-spin`, `.ai-chat-spinner`, `.ai-image-spinner`, `.spinning`, `.dashboard-import-btn .spin`)
  - Added `will-change: transform` to `.logo-marquee-track` for smoother marquee animation
  - Added `will-change: opacity` to `.visitor-map-badge-dot` for smoother pulse animation

### Technical

- Updated `src/styles/global.css` with CLS prevention and animation optimization
- Updated `src/components/Layout.tsx` with fetchPriority on logo
- Updated `src/pages/Post.tsx` with fetchPriority on header images

## [2.15.0] - 2026-01-07

### Added

- Export as PDF option in CopyPageDropdown
  - Browser-based print dialog for saving pages as PDF
  - Clean formatted output (no markdown syntax visible)
  - Title displayed as proper heading
  - Metadata shown as clean line (date, read time, tags)
  - Content with markdown stripped for readable document
  - Uses Phosphor FilePdf icon
  - Positioned at end of dropdown menu

### Technical

- Added `formatForPrint` function to strip markdown syntax from content
- Added `handleExportPDF` handler with styled print window
- Imports `FilePdf` from `@phosphor-icons/react` (already installed)

## [2.14.1] - 2026-01-07

### Fixed

- Additional Core Web Vitals animation fixes
  - Fixed `docs-skeleton-pulse` animation (converted from `background-position` to `transform: translateX()` via pseudo-element)
  - Added `will-change` hints to 6 more animated elements for GPU compositing

### Technical

- Updated `src/styles/global.css`:
  - Converted docs-loading-skeleton from background animation to pseudo-element with translateX
  - Added `will-change` to `.image-lightbox-backdrop`, `.search-modal`, `.ai-chat-message`, `.dashboard-toast`, `.ask-ai-modal`, `.docs-article`

## [2.14.0] - 2026-01-07

### Fixed

- Core Web Vitals performance optimizations
  - Fixed non-composited animations in visitor map (SVG `r` attribute changed to `transform: scale()`)
  - Removed 5 duplicate `@keyframes spin` definitions from global.css
  - Added `will-change` hints to animated elements for GPU compositing

### Added

- Critical CSS inlined in index.html for faster first paint
  - Theme variables (dark/light/tan/cloud)
  - Reset and base body styles
  - Layout skeleton and navigation styles
- Additional resource hints in index.html
  - Preconnect to convex.site for faster API calls

### Technical

- Updated `src/styles/global.css`:
  - Converted visitor-pulse animations from SVG `r` to `transform: scale()` (GPU-composited)
  - Added `transform-origin`, `transform-box`, and `will-change` to pulse ring elements
  - Added `will-change` to `.theme-toggle`, `.copy-page-menu`, `.search-modal-backdrop`, `.scroll-to-top`
  - Removed duplicate `@keyframes spin` at lines 9194, 10091, 10243, 10651, 13726
- Updated `src/components/VisitorMap.tsx`:
  - Changed pulse ring `r` values from 12/8 to base value 5 (scaling handled by CSS)
- Updated `index.html`:
  - Added inline critical CSS (~2KB) for instant first contentful paint
  - Added preconnect/dns-prefetch for convex.site

## [2.13.0] - 2026-01-07

### Added

- Enhanced diff code block rendering with @pierre/diffs library
  - Diff and patch code blocks now render with Shiki-based syntax highlighting
  - Unified and split (side-by-side) view modes with toggle button
  - Theme-aware colors (dark/light/tan/cloud support)
  - Copy button for diff content
  - Automatic routing: `diff and `patch blocks use enhanced renderer
- New blog post: "How to Use Code Blocks" with syntax highlighting and diff examples
- DiffCodeBlock component (`src/components/DiffCodeBlock.tsx`)

### Technical

- Added `@pierre/diffs` package for enhanced diff visualization
- Updated `BlogPost.tsx` to route diff/patch language blocks to DiffCodeBlock
- Added diff block CSS styles to `global.css`
- Added `vendor-diffs` chunk to Vite config for code splitting
- Updated `files.md` with DiffCodeBlock documentation

## [2.12.0] - 2026-01-07

### Fixed

- Canonical URL mismatch between raw and rendered HTML (GitHub Issue #6)
  - Raw HTML was showing homepage canonical URL instead of page-specific canonical
  - Added search engine bot detection to serve pre-rendered HTML with correct canonical URLs
  - Search engines (Google, Bing, DuckDuckGo, etc.) now receive correct canonical tags in initial HTML

### Added

- SEO Bot Configuration section in FORK_CONFIG.md for developers who fork the app
- SEO and Bot Detection section in setup-guide.md with configuration examples
- `SEARCH_ENGINE_BOTS` array in `netlify/edge-functions/botMeta.ts` for customizable bot detection
- `isSearchEngineBot()` helper function for search engine crawler detection
- Documentation header in botMeta.ts explaining bot detection configuration

### Technical

- Updated `netlify/edge-functions/botMeta.ts`:
  - Added configuration documentation header explaining three bot categories
  - Added SEARCH_ENGINE_BOTS array (googlebot, bingbot, yandexbot, duckduckbot, baiduspider, sogou, yahoo! slurp, applebot)
  - Added isSearchEngineBot() function
  - Updated condition to serve pre-rendered HTML to both social preview and search engine bots

## [2.11.0] - 2026-01-06

### Added

- Ask AI header button with RAG-based Q&A about site content
  - Header button with sparkle icon (before search button, after social icons)
  - Keyboard shortcuts: Cmd+J or Cmd+/ (Mac), Ctrl+J or Ctrl+/ (Windows/Linux)
  - Real-time streaming responses via Convex Persistent Text Streaming
  - Model selector: Claude Sonnet 4 (default) or GPT-4o
  - Markdown rendering with syntax highlighting in responses
  - Internal links use React Router for seamless navigation
  - Source citations with links to referenced posts/pages
  - Copy response button (hover to reveal) for copying AI answers
  - Clear chat button to reset conversation
- AskAIConfig in siteConfig.ts for configuration
  - `enabled`: Toggle Ask AI feature
  - `defaultModel`: Default model ID
  - `models`: Array of available models with id, name, and provider

### How It Works

1. User question stored in database with session ID
2. Query converted to embedding using OpenAI text-embedding-ada-002
3. Vector search finds top 5 relevant posts/pages
4. Content sent to selected AI model with RAG system prompt
5. Response streams in real-time with source citations appended

### Technical

- New component: `src/components/AskAIModal.tsx` with StreamingMessage subcomponent
- New file: `convex/askAI.ts` - Session mutations and queries (regular runtime)
- New file: `convex/askAI.node.ts` - HTTP streaming action (Node.js runtime)
- New table: `askAISessions` with question, streamId, model, createdAt, sources fields
- New HTTP endpoint: `/ask-ai-stream` for streaming responses
- Updated `convex/convex.config.ts` with persistentTextStreaming component
- Updated `convex/http.ts` with /ask-ai-stream route and OPTIONS handler
- Updated `src/components/Layout.tsx` with Ask AI button and modal
- Updated `src/styles/global.css` with Ask AI modal styles

### Requirements

- `semanticSearch.enabled: true` in siteConfig (for embeddings)
- `OPENAI_API_KEY` in Convex (for embedding generation)
- `ANTHROPIC_API_KEY` in Convex (for Claude models)
- Run `npm run sync` to generate embeddings for content

## [2.10.2] - 2026-01-06

### Added

- SEO fixes for GitHub Issue #4 (7 issues resolved)
  - Canonical URL: Client-side dynamic canonical link tags for posts and pages
  - Single H1 per page: Markdown H1s demoted to H2 (`.blog-h1-demoted` class with H1 visual styling)
  - DOM order fix: Article loads before sidebar in DOM for SEO (CSS `order` property maintains visual layout)
  - X-Robots-Tag: HTTP header added via netlify.toml (`index, follow` for public, `noindex` for dashboard/api)
  - Hreflang tags: Self-referencing hreflang (en, x-default) for all pages
  - og:url consistency: Uses same canonicalUrl variable as canonical link
  - twitter:site meta tag: New TwitterConfig in siteConfig.ts for Twitter Cards

### Technical

- New `TwitterConfig` interface in `src/config/siteConfig.ts` with site and creator fields
- Updated `src/pages/Post.tsx` with SEO meta tags for both posts and pages (canonical, hreflang, og:url, twitter)
- Updated `src/pages/Post.tsx` DOM order: article before sidebar with CSS order for visual positioning
- Updated `src/components/BlogPost.tsx` h1 renderer outputs h2 with `.blog-h1-demoted` class
- Updated `src/styles/global.css` with `.blog-h1-demoted` styling and CSS order properties for sidebar
- Updated `convex/http.ts` generateMetaHtml() with hreflang and twitter:site tags
- Updated `netlify.toml` with X-Robots-Tag headers for public, dashboard, and API routes
- Updated `index.html` with canonical, hreflang, and twitter:site placeholder tags
- Updated `fork-config.json.example` with twitter configuration fields

## [2.10.1] - 2026-01-05

### Added

- Optional semantic search configuration via `siteConfig.semanticSearch`
  - New `enabled` toggle (default: `false` to avoid blocking forks without API key)
  - When disabled, search modal shows only keyword search (no mode toggle)
  - Embedding generation skipped during sync when disabled (saves API costs)
  - Existing embeddings preserved in database when disabled (no data loss)
  - Tab key shortcut hints hidden when semantic search is disabled
  - Dashboard config generator includes semantic search toggle

### Technical

- New `SemanticSearchConfig` interface in `src/config/siteConfig.ts`
- Updated `src/components/SearchModal.tsx` to conditionally render mode toggle
- Updated `scripts/sync-posts.ts` to check config before embedding generation
- Updated `src/pages/Dashboard.tsx` with semantic search config option
- Updated `FORK_CONFIG.md` with semantic search configuration section
- Updated `fork-config.json.example` with semanticSearch option
- Updated documentation: `docs-semantic-search.md`, `docs.md`

## [2.10.0] - 2026-01-05

### Added

- Semantic search using vector embeddings to complement existing keyword search
  - Toggle between "Keyword" and "Semantic" modes in search modal (Cmd+K)
  - Keyword search: exact word matching via Convex full-text search indexes (instant, free)
  - Semantic search: finds content by meaning using OpenAI text-embedding-ada-002 embeddings (~300ms, ~$0.0001/query)
  - Similarity scores displayed as percentages (90%+ = very similar, 70-90% = related)
  - Graceful fallback: semantic search returns empty results if OPENAI_API_KEY not configured
- Embedding generation during content sync
  - Embeddings generated automatically for posts and pages during `npm run sync`
  - Title and content combined for embedding generation
  - Content truncated to 8000 characters to stay within token limits
- New documentation pages
  - `docs-search.md`: Keyword search implementation with ASCII flowchart
  - `docs-semantic-search.md`: Semantic search guide with comparison table

### Technical

- New file: `convex/embeddings.ts` - Actions for embedding generation (Node.js runtime)
- New file: `convex/embeddingsQueries.ts` - Queries and mutations for embedding storage
- New file: `convex/semanticSearch.ts` - Vector search action with similarity scoring
- New file: `convex/semanticSearchQueries.ts` - Internal queries for hydrating search results
- Added `embedding` field (optional float64 array) to posts and pages tables in schema
- Added `by_embedding` vector index (1536 dimensions, filterFields: ["published"]) to posts and pages
- Updated `src/components/SearchModal.tsx` with mode toggle (TextAa/Brain icons) and semantic search integration
- Updated `scripts/sync-posts.ts` to call `generateMissingEmbeddings` after content sync
- Added search mode toggle CSS styles (.search-mode-toggle, .search-mode-btn)

### Environment Variables

- `OPENAI_API_KEY`: Required for semantic search (set via `npx convex env set OPENAI_API_KEY sk-xxx`)

## [2.9.0] - 2026-01-04

### Added

- Dashboard Cloud CMS features for WordPress-style content management
  - Dual source architecture: dashboard-created content (`source: "dashboard"`) and synced content (`source: "sync"`) coexist independently
  - Source badges in Posts and Pages list views (blue "Dashboard", gray "Synced")
  - Direct database operations: "Save to DB" button in Write sections, "Save Changes" in editor
  - Delete button for dashboard-created content with confirmation modal
  - Server-side URL import via Firecrawl (direct to database, no file sync needed)
  - Export to markdown functionality for backup or converting to file-based workflow
  - Bulk export script: `npm run export:db` and `npm run export:db:prod`
- Rich Text Editor in Write Post/Page sections
  - Three editing modes: Markdown (default), Rich Text (Quill WYSIWYG), Preview
  - Quill toolbar: headers, bold, italic, strikethrough, blockquote, code, lists, links
  - Automatic HTML-to-Markdown conversion when switching modes
  - Theme-aware styling
- Delete confirmation modal for posts and pages
  - Warning icon and danger-styled delete button
  - Shows item name and type being deleted
  - Backdrop click and Escape key to cancel

### Changed

- Posts and Pages list view grid layout adjusted for source badges
  - Column widths: title (1fr), date (110px), status (170px), actions (110px)
  - Added flex-wrap and gap for status column content
- Sync mutations now preserve dashboard-created content
  - Only affects content with `source: "sync"` or no source field

### Technical

- New file: `convex/cms.ts` with CRUD mutations for dashboard content
- New file: `convex/importAction.ts` with Firecrawl server-side action
- New file: `scripts/export-db-posts.ts` for bulk markdown export
- Added `source` field (optional union: "dashboard" | "sync") to posts and pages tables
- Added `by_source` index to posts and pages tables in schema
- Added ConfirmDeleteModal component with Warning icon from Phosphor
- Added source-badge CSS styles (.source-badge, .source-badge.dashboard, .source-badge.sync)
- Added delete modal styles (.dashboard-modal-delete, .dashboard-modal-icon-warning, .dashboard-modal-btn.danger)

## [2.8.7] - 2026-01-04

### Fixed

- Write page frontmatter sidebar toggle now works outside focus mode
  - Grid layout adjusts properly when frontmatter sidebar is collapsed
  - Previously only worked in focus mode due to missing CSS rules

### Technical

- Added `.write-layout.frontmatter-collapsed` CSS rule (grid-template-columns: 220px 1fr 56px)
- Added `.write-layout.sidebar-collapsed.frontmatter-collapsed` CSS rule for both sidebars collapsed
- Added responsive tablet styles for frontmatter collapsed state

## [2.8.6] - 2026-01-04

### Changed

- Fork configuration script now updates 14 files (was 11)
  - Added `src/pages/DocsPage.tsx` (SITE_URL constant)
  - Added `netlify/edge-functions/mcp.ts` (SITE_URL, SITE_NAME, MCP_SERVER_NAME)
  - Added `scripts/send-newsletter.ts` (default SITE_URL)
  - Improved `public/openapi.yaml` handling for all example URLs
- Logo gallery hrefs now use relative URLs instead of hardcoded markdown.fast URLs
  - Links like `/how-to-use-firecrawl`, `/docs`, `/setup-guide` work on any forked site
- Updated `fork-config.json.example` with missing options (statsPage, mcpServer, imageLightbox)

### Technical

- Updated `scripts/configure-fork.ts` with new update functions: `updateDocsPageTsx()`, `updateMcpEdgeFunction()`, `updateSendNewsletter()`
- Updated `FORK_CONFIG.md` with complete file list and updated AI agent prompt
- Updated `content/blog/fork-configuration-guide.md` with accurate file count and output example

## [2.8.5] - 2026-01-03

### Added

- Search result highlighting and scroll-to-match feature
  - Clicking a search result navigates to the exact match location (not just the heading)
  - All matching text is highlighted with theme-appropriate colors
  - Highlights pulse on arrival, then fade to subtle background after 4 seconds
  - Press Escape to clear highlights
  - Works across all four themes (dark, light, tan, cloud)

### Technical

- Created `src/hooks/useSearchHighlighting.ts` hook with polling mechanism to wait for content load
- Updated `src/components/SearchModal.tsx` to pass search query via `?q=` URL parameter
- Updated `src/components/BlogPost.tsx` with article ref for highlighting
- Updated `src/pages/Post.tsx` to defer scroll handling to highlighting hook when `?q=` present
- Added `.search-highlight` and `.search-highlight-active` CSS styles with theme-specific colors

## [2.8.4] - 2026-01-03

### Changed

- AI service links (ChatGPT, Claude, Perplexity) now use local `/raw/{slug}.md` URLs instead of GitHub raw URLs
- Simplified AI prompt from multi-line instructions to "Read this URL and summarize it:"

### Technical

- Updated `src/components/CopyPageDropdown.tsx` to construct URLs using `window.location.origin`
- Removed unused `siteConfig` import and `getGitHubRawUrl` function

## [2.8.3] - 2026-01-03

### Changed

- `raw/index.md` now includes home.md and footer.md content
  - Home intro content from `content/pages/home.md` (slug: home-intro) displays at top
  - Footer content from `content/pages/footer.md` (slug: footer) displays at bottom
  - Mirrors the actual homepage structure for AI agents reading raw markdown
  - Falls back to generic message if home-intro page not found

### Technical

- Updated `generateHomepageIndex` function in `scripts/sync-posts.ts`
- Finds home-intro and footer pages from published pages array
- Adds horizontal rule separators between sections

## [2.8.2] - 2026-01-03

### Fixed

- Footer not displaying on docs section posts/pages even with `showFooter: true` in frontmatter
  - Post.tsx now fetches footer.md content from Convex (matching Home.tsx and Blog.tsx pattern)
  - Footer falls back to footer.md content when no per-post `footer:` frontmatter is specified
  - Priority order: per-post frontmatter `footer:` field > synced footer.md content > siteConfig.footer.defaultContent

### Technical

- Added `useQuery(api.pages.getPageBySlug, { slug: "footer" })` to Post.tsx
- Updated all 4 Footer component calls to use `post.footer || footerPage?.content` pattern

## [2.8.1] - 2026-01-03

### Changed

- Centralized `defaultTheme` configuration in `siteConfig.ts`
  - Theme is now configured via `defaultTheme` field in siteConfig instead of ThemeContext.tsx
  - ThemeContext.tsx now imports and uses `siteConfig.defaultTheme` with fallback to "tan"
  - Fork configuration script (`configure-fork.ts`) now updates siteConfig.ts for theme changes
  - Backward compatible: existing sites work without changes

### Technical

- Added `Theme` type export to `src/config/siteConfig.ts`
- Added `defaultTheme?: Theme` field to SiteConfig interface
- Updated `src/context/ThemeContext.tsx` to import from siteConfig
- Renamed `updateThemeContext` to `updateThemeConfig` in `scripts/configure-fork.ts`
- Updated documentation: `docs.md`, `setup-guide.md`, `FORK_CONFIG.md`, `fork-configuration-guide.md`

## [2.8.0] - 2026-01-03

### Added

- `docsSectionGroupIcon` frontmatter field for docs sidebar group icons
  - Display Phosphor icons next to docs sidebar group titles
  - Icon appears left of the expand/collapse chevron
  - 55 supported icon names (Rocket, Book, PuzzlePiece, Gear, Code, etc.)
  - Icon weight: regular, size: 16px
  - Only one item per group needs to specify the icon
  - Graceful fallback if icon name not recognized

### Technical

- Updated `convex/schema.ts` to include `docsSectionGroupIcon` field in posts and pages tables
- Updated `convex/posts.ts` and `convex/pages.ts` queries and mutations to handle `docsSectionGroupIcon`
- Updated `scripts/sync-posts.ts` to parse `docsSectionGroupIcon` from frontmatter
- Updated `src/components/DocsSidebar.tsx` with Phosphor icon imports and rendering
- Added CSS styles for `.docs-sidebar-group-icon` in `src/styles/global.css`
- Updated `.claude/skills/frontmatter.md` with icon documentation and supported icon list

## [2.7.0] - 2026-01-02

### Added

- `docsSectionGroupOrder` frontmatter field for controlling docs sidebar group order
  - Groups are sorted by the minimum `docsSectionGroupOrder` value among items in each group
  - Lower numbers appear first, groups without this field sort alphabetically
  - Works alongside `docsSection`, `docsSectionGroup`, and `docsSectionOrder` fields

### Technical

- Updated `convex/schema.ts` to include `docsSectionGroupOrder` field in posts and pages tables
- Updated `convex/posts.ts` and `convex/pages.ts` queries and mutations to handle `docsSectionGroupOrder`
- Updated `scripts/sync-posts.ts` to parse `docsSectionGroupOrder` from frontmatter
- Updated `src/components/DocsSidebar.tsx` to sort groups by `docsSectionGroupOrder`

## [2.6.0] - 2026-01-01

### Added

- Multi-model AI chat support in Dashboard
  - Model dropdown selector to choose between Anthropic (Claude Sonnet 4), OpenAI (GPT-4o), and Google (Gemini 2.0 Flash)
  - Lazy API key validation: errors only shown when user tries to use a specific model
  - Each provider has friendly setup instructions with links to get API keys
- AI Image Generation tab in Dashboard
  - Generate images using Gemini models (Nano Banana and Nano Banana Pro)
  - Aspect ratio selector (1:1, 16:9, 9:16, 4:3, 3:4)
  - Generated images stored in Convex storage with session tracking
  - Markdown-rendered error messages with setup instructions
- New `aiDashboard` configuration in siteConfig
  - `enableImageGeneration`: Toggle image generation tab
  - `defaultTextModel`: Set default AI model for chat
  - `textModels`: Configure available text chat models
  - `imageModels`: Configure available image generation models

### Technical

- Updated `convex/aiChatActions.ts` to support multiple AI providers
  - Added `callAnthropicApi`, `callOpenAIApi`, `callGeminiApi` helper functions
  - Added `getProviderFromModel` to determine provider from model ID
  - Added `getApiKeyForProvider` for lazy API key retrieval
  - Added `getNotConfiguredMessage` for provider-specific setup instructions
- Updated `src/components/AIChatView.tsx` with `selectedModel` prop
- Updated `src/pages/Dashboard.tsx` with new `AIAgentSection`
  - Tab-based UI for Chat and Image Generation
  - Model dropdowns with provider labels
  - Aspect ratio selector for image generation
- Added CSS styles for AI Agent section in `src/styles/global.css`
  - `.ai-agent-tabs`, `.ai-agent-tab` for tab navigation
  - `.ai-model-selector`, `.ai-model-dropdown` for model selection
  - `.ai-aspect-ratio-selector` for aspect ratio options
  - `.ai-generated-image`, `.ai-image-error`, `.ai-image-loading` for image display

### Environment Variables

- `ANTHROPIC_API_KEY`: Required for Claude models
- `OPENAI_API_KEY`: Required for GPT-4o
- `GOOGLE_AI_API_KEY`: Required for Gemini text chat and image generation

## [2.5.0] - 2026-01-01

### Added

- Social footer icons in header navigation
  - New `showInHeader` option in `siteConfig.socialFooter` to display social icons in the header
  - Social icons appear left of the search icon on desktop viewports
  - Uses same icons and links as the social footer component
  - Configurable via siteConfig, FORK_CONFIG.md, and fork-config.json
  - Disabled by default (set `showInHeader: true` to enable)

### Technical

- Exported `platformIcons` from `SocialFooter.tsx` for reuse in Layout component
- Added social icon rendering in `Layout.tsx` header controls
- Added `.header-social-links` and `.header-social-link` CSS styles in `global.css`
- Updated `SocialFooterConfig` interface with `showInHeader: boolean`
- Added socialFooter support to `configure-fork.ts` script
- Updated documentation: FORK_CONFIG.md, fork-config.json.example, docs.md, setup-guide.md

## [2.4.0] - 2026-01-01

### Added

- YouTube and Twitter/X embed support with domain whitelisting
  - Embed YouTube videos and Twitter/X posts directly in markdown
  - Domain whitelisting for security (only trusted domains allowed)
  - Whitelisted domains: `youtube.com`, `www.youtube.com`, `youtube-nocookie.com`, `www.youtube-nocookie.com`, `platform.twitter.com`, `platform.x.com`
  - Auto-adds `sandbox="allow-scripts allow-same-origin allow-popups"` for security
  - Auto-adds `loading="lazy"` for performance
  - Non-whitelisted iframes silently blocked
  - Works on both blog posts and pages
- Embeds section in markdown-with-code-examples.md with YouTube and Twitter/X examples

### Technical

- Added `ALLOWED_IFRAME_DOMAINS` constant in `src/components/BlogPost.tsx`
- Added `iframe` to sanitize schema tagNames with allowed attributes (`src`, `width`, `height`, `allow`, `allowfullscreen`, `frameborder`, `title`, `style`)
- Added custom `iframe` component handler with URL validation against whitelisted domains
- Added `.embed-container` CSS styles to `src/styles/global.css` for responsive embeds

## [2.3.0] - 2025-12-31

### Added

- Author pages at `/author/:authorSlug` with post list
  - Click on any author name in a post to view all their posts
  - View mode toggle (list/cards) with localStorage persistence
  - Mobile responsive layout matching tag pages design
  - Sitemap updated to include all author pages dynamically
- New Convex queries for author data
  - `getAllAuthors`: Returns all unique authors with post counts
  - `getPostsByAuthor`: Returns posts by a specific author slug
- Author name links in post headers
  - Author names now clickable with hover underline effect
  - Works on both blog posts and pages with authorName field

### Technical

- Added `by_authorName` index to posts table in `convex/schema.ts`
- New queries in `convex/posts.ts`: `getAllAuthors`, `getPostsByAuthor`
- New component: `src/pages/AuthorPage.tsx` (based on TagPage.tsx pattern)
- Added route `/author/:authorSlug` in `src/App.tsx`
- Updated `src/pages/Post.tsx` to make authorName a clickable Link
- Added author link and page styles to `src/styles/global.css`
- Added author pages to sitemap in `convex/http.ts`

## [2.2.2] - 2025-12-31

### Fixed

- Homepage intro loading flash
  - Removed "Loading..." text from Suspense fallback in main.tsx to prevent flash on app load
  - Updated Home.tsx to render nothing while homeIntro query loads (prevents bio text flash)
  - Home intro content now appears without any visible loading state or fallback text
  - Matches the same loading pattern used by Post.tsx for docs pages

### Technical

- Updated: `src/main.tsx` - Changed LoadingFallback to render empty div instead of "Loading..." text
- Updated: `src/pages/Home.tsx` - Changed conditional from `homeIntro ?` to `homeIntro === undefined ? null : homeIntro ?`

## [2.2.1] - 2025-12-31

### Fixed

- ES module compatibility for configure-fork.ts
  - Fixed `__dirname is not defined` error when running `npm run configure`
  - Added `fileURLToPath` import from `url` module
  - Created ES module equivalent of `__dirname` using `import.meta.url`
  - Script now works correctly with `"type": "module"` in package.json

### Technical

- Updated: `scripts/configure-fork.ts` - Added ES module compatible \_\_dirname using fileURLToPath

## [2.2.0] - 2025-12-30

### Added

- Initial waynesutton.ai site launch
  - Personal portfolio for Wayne Sutton, community builder and developer advocate
  - Built on markdown sync framework for real-time content updates
  - Four theme options: dark, light, tan, cloud
  - GitHub contributions graph displaying @waynesutton activity
  - Social footer with GitHub, Twitter/X, and LinkedIn links
  - Blog with markdown posts and syntax highlighting
  - Static pages support (About, Contact, Docs)
  - Real-time search with Command+K
  - Stats page with visitor analytics
  - RSS feeds at /rss.xml and /rss-full.xml
  - Dynamic sitemap at /sitemap.xml

### Technical

- React 18 with TypeScript and Vite
- Convex real-time database
- Netlify deployment with edge functions
- Configured `src/config/siteConfig.ts` for waynesutton.ai
- About page with professional bio and collapsible sections
