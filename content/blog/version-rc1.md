---
title: "Markdown Sync RC1 Release"
slug: "version-rc1"
description: "RC1 brings semantic search, ConvexFS Media Library, OpenCode integration, RAG-based AI Q&A, and a new CLI to get started in seconds."
date: "2026-01-11"
published: false
tags: ["release", "rc1", "features", "convex", "ai"]
readTime: "3 min read"
order: 1
showInNav: false
layout: "sidebar"
featuredOrder: 1
featured: true
blogFeatured: true
rightSidebar: true
showImageAtTop: true
image: "https://wandering-gecko-105.convex.site/fs/blobs/f82af8b3-9477-40ed-8529-d1d1e1af132d"
authorName: "Markdown"
authorImage: "/images/authors/markdown.png"
showFooter: true
---

## Markdown Sync RC1

We are excited to announce the first release candidate of Markdown Sync. This release includes major features that make publishing markdown content faster, smarter, and more collaborative.

---

### Semantic Search with Vector Embeddings

Search now understands meaning, not just keywords. Every post is automatically embedded as vectors in Convex, enabling semantic search across your entire content library.

[Learn more about search](/docs-search)

---

### Dashboard Cloud CMS with ConvexFS Media Library

The dashboard now includes a full cloud CMS experience. Upload, organize, and manage media assets directly from the browser using the [ConvexFS Media Library](https://convexfs.dev/).

ConvexFS was built by Jamie Turner, Convex co-founder and CEO. It provides file storage that syncs in real-time with the rest of your Convex data.

[View the dashboard](/dashboard)

---

### OpenCode AI Development Tool Integration

Full support for [OpenCode](https://opencode.ai), the AI-first development tool. This framework includes agents, commands, skills, and plugins that work alongside Claude Code and Cursor.

[Read the OpenCode docs](/docs-opencode)

---

### Version Control with Enhanced Diff Rendering

Track changes to your content with built-in version control. The enhanced diff code block rendering highlights additions and deletions clearly, making it easy to review changes before publishing.

[Learn about version control](/docs-version-control)

---

### Ask AI with RAG-Based Q&A

Click the Ask AI button in the header to ask questions about your content. Answers are generated using retrieval-augmented generation (RAG), pulling relevant context from your posts to provide accurate responses.

[Try Ask AI](https://www.markdown.fast)

---

### npx create-markdown-sync CLI

Get started in seconds with the new CLI. Run a single command to scaffold a complete Markdown Sync project:

```bash
npx create-markdown-sync my-blog
cd my-blog
npm run dev
```

[View CLI documentation](/docs-cli)

---

### Get Started

Visit [markdown.fast](https://www.markdown.fast) to see RC1 in action, or run the CLI to start your own project.

```bash
npx create-markdown-sync my-site
```

We welcome feedback as we work toward the stable 1.0 release.
