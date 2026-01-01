# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2025-12-30

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
