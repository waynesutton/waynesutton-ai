# Docs Navigation Performance - Pinned for Later

## Problem
Slight delay when switching docs groups on the live site (https://www.markdown.fast/docs) - blank middle screen appears while loading docs-content before showing the actual content.

## Root Cause
When navigating between docs pages, `useQuery` in Post.tsx returns `undefined` for the new slug while loading, causing a loading skeleton flash.

---

## Option A: React Stale-While-Revalidate (Already Implemented)

**Status:** Implemented but can be reverted if Option B preferred

**Files Modified:**
- `src/pages/Post.tsx` - Added client-side cache to show previous content during navigation
- `src/styles/global.css` - Added 150ms fade-in animation to `.docs-article`

**How it works:**
- Cache last successfully loaded docs content in a React ref
- When navigating, show cached (previous) content while new content loads
- Once new data arrives, swap it in seamlessly

**Pros:**
- Minimal change, doesn't touch Convex backend
- Fast initial page load (metadata-only sidebar)
- Low memory usage

**Cons:**
- Brief moment showing "stale" content from previous page
- Not a Convex-native pattern (React UI workaround)

---

## Option B: Prefetch All Docs Content (Future Consideration)

**Status:** Not implemented - requires more planning

**Files to Modify:**
- `convex/posts.ts` - Modify `getDocsPosts` to return full content
- `convex/pages.ts` - Modify `getDocsPages` to return full content
- `src/components/DocsSidebar.tsx` or parent - Store all content
- `src/pages/Post.tsx` - Use prefetched content instead of individual queries

**How it would work:**
- Sidebar (or parent component) fetches ALL docs with FULL content upfront
- Store in React context or state
- When navigating, content is already in memory - instant render

**Pros:**
- Truly instant navigation (no network request)
- More "Convex-native" - single query, real-time updates for all docs

**Cons:**
- Slower initial page load (loading all content upfront)
- Higher memory usage
- Higher bandwidth cost
- May not scale well for large docs sites (50+ pages)

---

## Decision Criteria

Choose Option B if:
- Small docs site (10-20 pages)
- Users typically browse multiple docs per session
- Content is relatively short

Stick with Option A if:
- Larger docs site (50+ pages)
- Users often visit just 1-2 pages
- Long-form content

---

## Current State
- Option A is implemented and working
- Revisit Option B when docs site grows or if instant navigation becomes a priority
